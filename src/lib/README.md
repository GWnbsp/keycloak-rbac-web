# 环境变量配置说明

## Keycloak 配置

为了解决单点登录和自定义密码登录的URL不一致问题，现在统一使用以下配置：

### 环境变量设置

在 `.env.local` 文件中配置：

```env
# Keycloak 基础配置（不包含 /protocol/openid-connect 路径）
KEYCLOAK_BASE_URL=http://192.168.2.225:8080/realms/rbac-system

# 客户端配置
KEYCLOAK_CLIENT_ID=nextjs-frontend
KEYCLOAK_CLIENT_SECRET=your-client-secret

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
SECRET=your-secret-key
```

### 重要说明

1. **KEYCLOAK_BASE_URL**: 
   - ✅ 正确格式: `http://host:port/realms/{realm-name}`
   - ❌ 错误格式: `http://host:port/realms/{realm-name}/protocol/openid-connect`

2. **自动URL生成**:
   - NextAuth Provider 使用: `KEYCLOAK_BASE_URL` (基础URL)
   - Token API 调用使用: `KEYCLOAK_BASE_URL/protocol/openid-connect/token`

3. **统一配置**:
   - 所有Keycloak相关配置都通过 `src/lib/constants/keycloak.ts` 统一管理
   - 确保单点登录和密码登录使用相同的基础配置

### 验证配置

配置正确后，以下两种登录方式应该都能正常工作：

1. **OAuth 单点登录**: 重定向到 Keycloak 登录页面
2. **账号密码登录**: 直接在应用页面输入用户名密码

两种方式都使用相同的 Keycloak realm 和客户端配置。
