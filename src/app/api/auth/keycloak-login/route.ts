import { NextRequest, NextResponse } from 'next/server';
import { KEYCLOAK_CONFIG, RATE_LIMIT_CONFIG } from '@/lib/constants/keycloak';

interface LoginRequest {
  username: string;
  password: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

interface KeycloakErrorResponse {
  error: string;
  error_description: string;
}

// 速率限制映射 (简单内存实现，生产环境建议使用 Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, maxAttempts = RATE_LIMIT_CONFIG.MAX_ATTEMPTS, windowMs = RATE_LIMIT_CONFIG.WINDOW_MS): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitMap.get(ip);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= maxAttempts) {
    return false;
  }
  
  current.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP)) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts', 
          message: '登录尝试次数过多，请15分钟后重试' 
        },
        { status: 429 }
      );
    }

    // 解析请求体
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', message: '请求格式错误' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // 输入验证
    if (!username || !password) {
      return NextResponse.json(
        { 
          error: 'Missing credentials',
          message: '请提供用户名和密码' 
        },
        { status: 400 }
      );
    }

    if (username.length > 100 || password.length > 200) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          message: '用户名或密码格式不正确' 
        },
        { status: 400 }
      );
    }

    // 准备 Keycloak 认证请求
    const keycloakTokenUrl = KEYCLOAK_CONFIG.TOKEN_URL;
    const clientId = KEYCLOAK_CONFIG.CLIENT_ID;
    const clientSecret = KEYCLOAK_CONFIG.CLIENT_SECRET;

    // 构建认证请求
    // 使用统一的 TOKEN_URL 配置
    const tokenUrl = keycloakTokenUrl;
    
    console.log('Token URL:', tokenUrl); // 调试日志
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      username: username.trim(),
      password: password,
      scope: 'openid profile email',
    });

    // 如果是机密客户端，添加客户端密钥
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    // 调用 Keycloak 认证 API
    const startTime = Date.now();
    let keycloakResponse: Response;
    
    try {
      keycloakResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NextJS-App/1.0',
        },
        body: params.toString(),
        // 设置超时时间
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
    } catch (error) {
      console.error('Keycloak request failed:', error);
      return NextResponse.json(
        { 
          error: 'Authentication service unavailable',
          message: '认证服务暂时不可用，请稍后重试' 
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`Keycloak response time: ${responseTime}ms`);

    // 处理 Keycloak 响应
    if (!keycloakResponse.ok) {
      let errorData: KeycloakErrorResponse;
      
      try {
        errorData = await keycloakResponse.json();
      } catch {
        errorData = { 
          error: 'unknown_error', 
          error_description: 'Unknown authentication error' 
        };
      }

      // 记录失败尝试（用于审计）
      console.warn(`Authentication failed for user: ${username}, IP: ${clientIP}, Error: ${errorData.error}`);

      // 根据错误类型返回友好的错误消息
      let userMessage = '登录失败，请检查您的用户名和密码';
      
      switch (errorData.error) {
        case 'invalid_grant':
        case 'invalid_client':
          userMessage = '用户名或密码错误';
          break;
        case 'account_disabled':
          userMessage = '账户已被禁用，请联系管理员';
          break;
        case 'account_temporarily_disabled':
          userMessage = '账户暂时被锁定，请稍后重试';
          break;
        case 'invalid_user_credentials':
          userMessage = '用户凭据无效';
          break;
        default:
          if (errorData.error_description) {
            // 只在开发环境显示详细错误
            if (process.env.NODE_ENV === 'development') {
              userMessage = errorData.error_description;
            }
          }
      }

      return NextResponse.json(
        { 
          error: errorData.error,
          message: userMessage,
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        },
        { status: 401 }
      );
    }

    // 认证成功，获取令牌数据
    let tokenData: KeycloakTokenResponse;
    
    try {
      tokenData = await keycloakResponse.json();
    } catch (error) {
      console.error('Failed to parse Keycloak response:', error);
      return NextResponse.json(
        { 
          error: 'Invalid response from authentication service',
          message: '认证服务响应格式错误' 
        },
        { status: 502 }
      );
    }

    // 记录成功登录（用于审计）
    console.log(`Successful authentication for user: ${username}, IP: ${clientIP}`);

    // 清除该 IP 的速率限制记录（成功登录后重置）
    rateLimitMap.delete(clientIP);

    // 计算过期时间
    const now = Date.now();
    const expiresAt = now + (tokenData.expires_in * 1000);
    const refreshExpiresAt = now + (tokenData.refresh_expires_in * 1000);

    // 返回成功响应，包含令牌信息（用于 NextAuth）
    return NextResponse.json({
      success: true,
      message: '登录成功',
      tokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        id_token: tokenData.id_token,
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        session_state: tokenData.session_state,
        scope: tokenData.scope,
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: '服务器内部错误，请稍后重试' 
      },
      { status: 500 }
    );
  }
}

// 健康检查端点
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'keycloak-login',
    timestamp: new Date().toISOString()
  });
}
