# 数据库会话策略实施指南

## 方案一：Prisma + PostgreSQL（推荐）

### 1. 安装依赖
```bash
npm install prisma @prisma/client @next-auth/prisma-adapter
npm install postgresql # 如果使用PostgreSQL
```

### 2. 配置Prisma
```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 3. 更新NextAuth配置
```typescript
// src/lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database', // 改为数据库策略
    maxAge: 24 * 60 * 60, // 24小时（可以更短）
    updateAge: 60 * 60, // 1小时更新一次
  },
  
  // 其他配置保持不变
  providers: [
    KeycloakProvider({...}),
    CredentialsProvider({...}),
  ],
  
  callbacks: {
    // 简化callback，因为敏感数据不再存储在JWT中
    async session({ session, user }) {
      return {
        ...session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      };
    },
  },
}
```

### 4. 创建服务器端Token管理
```typescript
// src/lib/token-manager.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class TokenManager {
  // 存储用户的Keycloak tokens
  static async storeTokens(userId: string, tokens: {
    accessToken: string,
    refreshToken: string,
    expiresAt: number
  }) {
    await prisma.account.updateMany({
      where: { userId, provider: 'keycloak' },
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: Math.floor(tokens.expiresAt / 1000),
      }
    });
  }

  // 获取用户的tokens（服务器端）
  static async getTokens(userId: string) {
    const account = await prisma.account.findFirst({
      where: { userId, provider: 'keycloak' },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
      }
    });
    
    return account;
  }

  // 检查token是否过期并刷新
  static async getValidToken(userId: string) {
    const tokens = await this.getTokens(userId);
    if (!tokens) return null;

    const now = Math.floor(Date.now() / 1000);
    if (tokens.expires_at && tokens.expires_at > now) {
      return tokens.access_token;
    }

    // Token过期，尝试刷新
    if (tokens.refresh_token) {
      const newTokens = await this.refreshToken(tokens.refresh_token);
      if (newTokens) {
        await this.storeTokens(userId, newTokens);
        return newTokens.accessToken;
      }
    }

    return null;
  }
}
```

## 方案二：Redis会话存储（高性能）

### 1. 安装依赖
```bash
npm install @next-auth/redis-adapter redis
```

### 2. 配置Redis适配器
```typescript
// src/lib/auth.ts
import { RedisAdapter } from "@next-auth/redis-adapter"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL)

export const authOptions: NextAuthOptions = {
  adapter: RedisAdapter(redis),
  session: {
    strategy: 'database',
    maxAge: 60 * 60, // 1小时（Redis适合短期会话）
  },
  // ...其他配置
}
```

## 安全对比

### JWT策略（当前）
```
浏览器Cookie: 6461 字节
内容: 完整JWT + 用户信息 + 角色权限
风险: 高（敏感数据暴露）
```

### Database策略（推荐）
```
浏览器Cookie: ~150 字节  
内容: 只有会话ID
风险: 低（敏感数据在服务器端）
```

## 环境变量配置
```env
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/keycloak_rbac"
# 或
REDIS_URL="redis://localhost:6379"
```

## 迁移步骤
1. 选择数据库（PostgreSQL/MySQL/Redis）
2. 设置Prisma schema
3. 运行 `npx prisma migrate dev`
4. 更新auth.ts配置
5. 测试登录流程
6. 验证cookie大小（应该<200字节）
