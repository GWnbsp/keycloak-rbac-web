// NextAuth imported only where needed to avoid build-time issues
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { decodeJwt } from 'jose';
import { KEYCLOAK_CONFIG, NEXTAUTH_CONFIG, SESSION_CONFIG } from '@/lib/constants/keycloak';
import type { CredentialsUser } from '@/types/auth';

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshTokenExpired || Date.now() > token.refreshTokenExpired) {
      throw new Error('Refresh token expired');
    }

    const details = {
      client_id: KEYCLOAK_CONFIG.CLIENT_ID,
      client_secret: KEYCLOAK_CONFIG.CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    };

    const formBody: string[] = [];
    Object.entries(details).forEach(([key, value]) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value as string);
      formBody.push(encodedKey + '=' + encodedValue);
    });

    const formData = formBody.join('&');
    const url = KEYCLOAK_CONFIG.TOKEN_URL;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formData,
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpired: Date.now() + (refreshedTokens.expires_in - 15) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      refreshTokenExpired: Date.now() + (refreshedTokens.refresh_expires_in - 15) * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Keycloak OAuth Provider (原有的跳转登录方式)
    KeycloakProvider({
      clientId: KEYCLOAK_CONFIG.CLIENT_ID,
      clientSecret: KEYCLOAK_CONFIG.CLIENT_SECRET,
      issuer: KEYCLOAK_CONFIG.BASE_URL,
      authorization: {
        params: {
          scope: 'openid',
        },
      },
    }),
    
    // Credentials Provider (新的用户名密码登录方式)
    CredentialsProvider({
      id: "keycloak-credentials",
      name: "Keycloak Credentials",
      credentials: {
        username: {
          label: "用户名",
          type: "text",
          placeholder: "请输入用户名"
        },
        password: {
          label: "密码",
          type: "password",
          placeholder: "请输入密码"
        }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('缺少用户名或密码');
        }

        try {
          // 调用我们的代理认证 API
          const baseUrl = NEXTAUTH_CONFIG.URL;
          const response = await fetch(`${baseUrl}/api/auth/keycloak-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            console.error('Keycloak authentication failed:', data);
            throw new Error(data.message || '认证失败');
          }

          if (data.success && data.tokens) {
            // 解析访问令牌获取用户信息
            const userInfo = decodeJwt(data.tokens.access_token);
            
            return {
              id: userInfo.sub as string,
              name: userInfo.name as string || userInfo.preferred_username as string,
              email: userInfo.email as string,
              image: userInfo.picture as string,
              // 保存令牌信息用于会话管理
              accessToken: data.tokens.access_token,
              refreshToken: data.tokens.refresh_token,
              expiresAt: data.tokens.expires_at,
            };
          }

          throw new Error('认证响应格式无效');
        } catch (error) {
          console.error('Authorization error:', error);
          throw new Error(error instanceof Error ? error.message : '认证服务不可用');
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_CONFIG.MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_CONFIG.JWT_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account && user) {
        console.log('JWT Callback - Account data received:', {
          type: account.type,
          provider: account.provider,
          expires_in: account.expires_in,
          refresh_expires_in: account.refresh_expires_in,
          expires_at: account.expires_at,
          access_token: account.access_token ? 'present' : 'missing',
          refresh_token: account.refresh_token ? 'present' : 'missing'
        });
        console.log('JWT Callback - User data received:', user);

        // 处理不同类型的认证提供者
        let accessToken: string | undefined;
        let refreshToken: string | undefined;
        let accessTokenExpired: number = 0;
        let refreshTokenExpired: number;

        // 对于 Credentials Provider，令牌在 user 对象中
        if (account.type === 'credentials' && user && 'accessToken' in user) {
          console.log('Processing Credentials Provider tokens');
          const credentialsUser = user as CredentialsUser;
          accessToken = credentialsUser.accessToken;
          refreshToken = credentialsUser.refreshToken;
          
          // 如果有 expiresAt 直接使用
          if (credentialsUser.expiresAt) {
            accessTokenExpired = credentialsUser.expiresAt * 1000 - 15000;
          }
        } 
        // 对于 OAuth Provider，令牌在 account 对象中
        else {
          console.log('Processing OAuth Provider tokens');
          accessToken = account.access_token;
          refreshToken = account.refresh_token;
        }

        // 尝试从 JWT token 本身解析过期时间（最准确的方法）
        if (accessToken) {
          try {
            // 使用官方推荐的 jose 库解析 JWT
            const tokenPayload = decodeJwt(accessToken);
            if (tokenPayload.exp) {
              // JWT 中的 exp 是秒级时间戳，转换为毫秒并减去缓冲时间
              accessTokenExpired = tokenPayload.exp * 1000 - 15000;
              console.log('使用 JWT 中的过期时间 (jose):', new Date(accessTokenExpired).toISOString());
            }
          } catch (error) {
            console.log('解析 JWT token 失败，使用备用方法:', error);
          }
        }
        
        // 如果 JWT 解析失败，使用备用方法
        if (!accessTokenExpired) {
          if (account.expires_at) {
            // 如果有 expires_at，直接使用（已经是秒级时间戳）
            accessTokenExpired = (account.expires_at as number) * 1000 - 15000;
          } else if (account.expires_in) {
            // 如果有 expires_in，计算过期时间
            accessTokenExpired = Date.now() + ((account.expires_in as number) - 15) * 1000;
          } else {
            // 默认30天（根据你的配置）
            accessTokenExpired = Date.now() + (30 * 24 * 3600 - 15) * 1000;
          }
        }

        // 计算 refresh token 过期时间
        if (account.refresh_expires_in) {
          refreshTokenExpired = Date.now() + ((account.refresh_expires_in as number) - 15) * 1000;
        } else {
          // 默认30天
          refreshTokenExpired = Date.now() + (30 * 24 * 3600 - 15) * 1000;
        }

        return {
          ...token,
          accessToken,
          refreshToken,
          accessTokenExpired,
          refreshTokenExpired,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpired && Date.now() < token.accessTokenExpired) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        accessTokenExpired: token.accessTokenExpired,
        refreshTokenExpired: token.refreshTokenExpired,
        error: token.error,
      };
    },
  },
  pages: {
    signIn: '/auth/signin', // 自定义登录页面
    error: '/auth/error',   // 自定义错误页面（可选）
  },
  debug: process.env.NODE_ENV === 'development',
  secret: NEXTAUTH_CONFIG.SECRET,
};

// Export NextAuth for use in API routes only
// Do not call NextAuth() directly at module level to avoid build-time issues