/**
 * Keycloak 配置常量
 */

// 获取基础 Keycloak URL（不包含协议路径）
const getKeycloakBaseUrl = () => {
  const baseUrl = process.env.KEYCLOAK_BASE_URL;
  if (!baseUrl) {
    throw new Error('KEYCLOAK_BASE_URL environment variable is required');
  }
  
  // 移除可能存在的 /protocol/openid-connect 后缀，确保统一的基础URL
  return baseUrl.replace(/\/protocol\/openid-connect\/?$/, '');
};

// 统一的 Keycloak 配置
export const KEYCLOAK_CONFIG = {
  // 基础 URL（用于 NextAuth Provider）
  get BASE_URL() {
    return getKeycloakBaseUrl();
  },
  
  // OpenID Connect 协议 URL（用于直接API调用）
  get OPENID_CONNECT_URL() {
    return `${getKeycloakBaseUrl()}/protocol/openid-connect`;
  },
  
  // Token 端点URL
  get TOKEN_URL() {
    return `${this.OPENID_CONNECT_URL}/token`;
  },
  
  // 客户端配置
  get CLIENT_ID() {
    return process.env.KEYCLOAK_CLIENT_ID || 'your-client-id';
  },
  
  get CLIENT_SECRET() {
    return process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret';
  },
} as const;

// NextAuth 相关配置
export const NEXTAUTH_CONFIG = {
  get SECRET() {
    return process.env.SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
  },
  
  get URL() {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  },
} as const;

// 会话配置
export const SESSION_CONFIG = {
  MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  JWT_MAX_AGE: 60 * 60 * 24 * 30, // 30 days in seconds
} as const;

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
} as const;
