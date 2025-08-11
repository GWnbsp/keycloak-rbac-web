// JWT Payload 类型定义
export interface JWTPayload {
  sub: string;
  preferred_username: string;
  locale?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  iat: number;
  exp: number;
  name: string;
  email: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

// Session 扩展类型
export interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpired?: number;
  refreshTokenExpired?: number;
  error?: string;
}

// 用户角色信息类型
export interface UserRoles {
  realmRoles: string[];
  resourceRoles: {
    [resource: string]: string[];
  };
}

// NextAuth Provider 类型
export interface AuthProvider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export interface AuthProviders {
  [key: string]: AuthProvider;
}

// Credentials Provider 返回的用户类型
export interface CredentialsUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
