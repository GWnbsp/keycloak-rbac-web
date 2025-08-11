// NextAuth imported only where needed to avoid build-time issues
import KeycloakProvider from 'next-auth/providers/keycloak';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { decodeJwt } from 'jose';

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
      client_id: process.env.KEYCLOAK_CLIENT_ID || 'your-client-id',
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
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
    const url = `${process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080/realms/your-realm/protocol/openid-connect'}/token`;
    
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
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'your-client-id',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
      issuer: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080/realms/your-realm',
      authorization: {
        params: {
          scope: 'openid',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account && user) {
        console.log('Account data received:', {
          expires_in: account.expires_in,
          refresh_expires_in: account.refresh_expires_in,
          expires_at: account.expires_at
        });

        // 计算 access token 过期时间
        let accessTokenExpired: number = 0;
        
        // 尝试从 JWT token 本身解析过期时间（最准确的方法）
        if (account.access_token) {
          try {
            // 使用官方推荐的 jose 库解析 JWT
            const tokenPayload = decodeJwt(account.access_token);
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
        let refreshTokenExpired: number;
        if (account.refresh_expires_in) {
          refreshTokenExpired = Date.now() + ((account.refresh_expires_in as number) - 15) * 1000;
        } else {
          // 默认30天
          refreshTokenExpired = Date.now() + (30 * 24 * 3600 - 15) * 1000;
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
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
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
};

// Export NextAuth for use in API routes only
// Do not call NextAuth() directly at module level to avoid build-time issues