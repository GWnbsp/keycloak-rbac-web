import type { JWTPayload } from '@/types/auth';

/**
 * JWT 解析工具函数（不依赖第三方库的安全解析方法）
 * @param token JWT token 字符串
 * @returns 解析后的JWT载荷
 * @throws 如果JWT格式无效则抛出错误
 */
export function parseJWT(token: string): JWTPayload {
  try {
    // 验证 JWT 格式
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    // 处理 base64url 编码
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const decoded = atob(padded);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('JWT 解析失败:', error);
    throw new Error('Failed to parse JWT token');
  }
}

/**
 * 检查JWT token是否过期
 * @param token JWT token 字符串
 * @returns 如果过期返回true，否则返回false
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true; // 解析失败视为过期
  }
}

/**
 * 获取JWT token的过期时间戳（毫秒）
 * @param token JWT token 字符串
 * @returns 过期时间戳（毫秒），如果解析失败返回0
 */
export function getTokenExpirationTime(token: string): number {
  try {
    const payload = parseJWT(token);
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}
