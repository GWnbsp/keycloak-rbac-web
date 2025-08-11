# 安全修复建议

## 高优先级修复

### 1. 会话安全加固
```typescript
// 使用数据库存储会话，避免大型Cookie
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database', // 改为数据库策略
    maxAge: 24 * 60 * 60, // 减少到24小时
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
```

### 2. 环境变量验证
```typescript
// src/lib/constants/keycloak.ts
const getKeycloakBaseUrl = () => {
  const baseUrl = process.env.KEYCLOAK_BASE_URL;
  if (!baseUrl) {
    throw new Error('KEYCLOAK_BASE_URL environment variable is required');
  }
  return baseUrl;
};

export const KEYCLOAK_CONFIG = {
  get CLIENT_SECRET() {
    const secret = process.env.KEYCLOAK_CLIENT_SECRET;
    if (!secret) {
      throw new Error('KEYCLOAK_CLIENT_SECRET is required in production');
    }
    return secret;
  },
}
```

### 3. JWT验证加强
```typescript
// src/lib/utils/jwt.ts
import { jwtVerify, importJWK } from 'jose';

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    // 获取Keycloak公钥进行签名验证
    const jwksResponse = await fetch(`${KEYCLOAK_CONFIG.BASE_URL}/protocol/openid-connect/certs`);
    const jwks = await jwksResponse.json();
    
    // 验证JWT签名和claims
    const { payload } = await jwtVerify(token, async (protectedHeader) => {
      const key = jwks.keys.find((k: any) => k.kid === protectedHeader.kid);
      if (!key) throw new Error('Key not found');
      return await importJWK(key);
    }, {
      issuer: KEYCLOAK_CONFIG.BASE_URL,
      audience: KEYCLOAK_CONFIG.CLIENT_ID,
    });
    
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('JWT verification failed');
  }
}
```

## 中优先级修复

### 4. 速率限制增强
```typescript
// 使用Redis存储速率限制
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function enhancedRateLimit(
  ip: string, 
  userAgent: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): Promise<boolean> {
  const key = `rate_limit:${ip}:${userAgent.slice(0, 50)}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.floor(windowMs / 1000));
  }
  
  return current <= maxAttempts;
}
```

### 5. 安全响应头
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

## 生产环境清单

### 6. 环境配置
```env
# .env.production
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-key-min-32-chars
KEYCLOAK_BASE_URL=https://your-keycloak-domain/realms/rbac-system
KEYCLOAK_CLIENT_SECRET=your-actual-secret
```

### 7. 日志安全
```typescript
// 生产环境移除敏感日志
export const authOptions: NextAuthOptions = {
  debug: false, // 生产环境禁用调试
  logger: {
    error: (code, metadata) => {
      // 只记录错误码，不记录敏感信息
      console.error('Auth error:', code);
    },
    warn: () => {}, // 禁用警告日志
    debug: () => {}, // 禁用调试日志
  },
}
```

### 8. 监控和告警
- 实施登录失败告警
- 监控异常token使用
- 设置会话异常检测
- 记录安全事件审计日志
