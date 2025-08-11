# Keycloak RBAC Web 应用

一个基于 Next.js 15 + NextAuth.js 4 + Keycloak 的角色访问控制 (RBAC) Web 应用程序，支持自动令牌刷新和完整的用户认证流程。

## 🚀 技术栈

- **框架**: Next.js 15.4.6 (App Router)
- **认证**: NextAuth.js 4.24.11
- **身份提供者**: Keycloak
- **UI**: React 19 + TailwindCSS 4
- **类型检查**: TypeScript 5
- **开发工具**: Turbopack

## ✨ 功能特性

- ✅ **Keycloak 集成**: 完整的 OIDC 认证流程
- ✅ **自动令牌刷新**: 基于 JWT 过期时间自动刷新访问令牌
- ✅ **角色权限管理**: 支持 Realm 角色和资源角色显示
- ✅ **TypeScript 支持**: 完整的类型定义和类型安全
- ✅ **响应式设计**: 支持桌面和移动端
- ✅ **调试模式**: 开发环境下详细的认证日志

## 📁 项目结构

```
src/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts              # NextAuth API 路由
│   ├── layout.tsx               # 根布局（包含 SessionProvider）
│   └── page.tsx                 # 主页面（登录/用户信息界面）
├── components/
│   └── SessionProvider.tsx     # NextAuth 会话提供者
├── lib/
│   └── auth.ts                  # NextAuth 配置和令牌刷新逻辑
└── types/
    └── next-auth.d.ts          # NextAuth 类型扩展
```

## 🔧 环境配置

创建 `.env.local` 文件并配置以下环境变量：

```bash
# Keycloak 配置
KEYCLOAK_BASE_URL=http://192.168.2.225:8080/realms/rbac-system/protocol/openid-connect
KEYCLOAK_CLIENT_ID=nextjs-frontend
KEYCLOAK_CLIENT_SECRET=your-actual-client-secret

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
SECRET=your-nextauth-secret-key

# 可选配置
JWT_SECRET=your-jwt-secret
JWT_SIGNING_PRIVATE_KEY=your-jwt-signing-private-key
```

## 🔐 Keycloak 配置

在 Keycloak 管理控制台中完成以下配置：

### 1. 客户端设置
- **客户端 ID**: `nextjs-frontend`
- **客户端协议**: `openid-connect`
- **访问类型**: `confidential`
- **根 URL**: `http://localhost:3000`

### 2. 重定向 URI
- **有效重定向 URI**: 
  - `http://localhost:3000/api/auth/callback/keycloak`
  - `http://localhost:3000/*`
- **有效退出重定向 URI**: `http://localhost:3000`

### 3. 流程设置
- ✅ **标准流程启用** (Authorization Code Flow)
- ✅ **直接访问授权启用**
- ❌ **隐式流程启用**

### 4. 作用域配置
当前配置的作用域：`openid`

### 5. 角色配置示例
- **Realm 角色**: `default-roles-rbac-system`, `offline_access`, `uma_authorization`
- **资源角色** (`rbac-resource`): `admin`
- **账户角色**: `manage-account`, `manage-account-links`, `view-profile`

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制并配置环境变量文件：

```bash
cp .env.example .env.local
# 编辑 .env.local 填入实际的 Keycloak 配置
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🔄 认证流程

### 登录流程
1. 用户点击"使用 Keycloak 登录"
2. 重定向到 Keycloak 认证页面
3. 用户完成认证后回调到应用
4. NextAuth 处理 OAuth 回调并建立会话
5. 从 JWT 令牌解析过期时间和用户信息

### 令牌刷新机制
- **自动检测**: 每次 API 调用前检查令牌过期时间
- **刷新策略**: 提前 15 秒刷新令牌避免过期
- **降级处理**: 刷新失败时返回错误状态要求重新登录

## 📊 用户界面

### 登录前
- Keycloak 登录按钮
- 简洁的欢迎界面

### 登录后
- **用户信息**: 姓名、邮箱、头像状态
- **会话信息**: 
  - 访问令牌状态和过期时间
  - 刷新令牌状态和过期时间
  - 错误状态（如有）
- **角色信息**:
  - Realm 角色列表
  - 资源角色详情
  - 令牌签发和过期时间
- **操作按钮**: 安全退出

## 🛠 开发命令

```bash
# 开发模式 (启用 Turbopack)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 🔧 自定义配置

### 令牌生命周期
当前配置支持 30 天的长期访问令牌，你可以在 `src/lib/auth.ts` 中调整：

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
jwt: {
  maxAge: 60 * 60 * 24 * 30, // 30 days
},
```

### 作用域配置
如需要更多用户信息，可以修改作用域：

```typescript
authorization: {
  params: {
    scope: 'openid email profile', // 添加 email 和 profile
  },
},
```

## 🐛 调试信息

开发模式下，控制台会显示详细的认证信息：

- NextAuth 调试日志
- 令牌解析结果
- 账户数据结构
- 过期时间计算

## 📝 实际运行示例

基于真实的 Keycloak 配置，应用支持：

- **Keycloak 服务器**: `http://192.168.2.225:8080`
- **Realm**: `rbac-system`  
- **客户端**: `nextjs-frontend`
- **用户角色**: `admin` (在 `rbac-resource` 中)
- **令牌生命周期**: 30 天访问令牌 + 60 秒刷新令牌

## ⚠️ 注意事项

1. **环境变量**: 确保所有必需的环境变量都已正确配置
2. **网络访问**: 确保应用能访问 Keycloak 服务器
3. **HTTPS**: 生产环境建议使用 HTTPS
4. **令牌安全**: 访问令牌仅在客户端使用，不会暴露敏感信息

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [Keycloak 文档](https://www.keycloak.org/documentation)
- [实现参考 Gist](https://gist.github.com/degitgitagitya/db5c4385fc549f317eac64d8e5702f74)

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

## 📄 许可证

MIT License