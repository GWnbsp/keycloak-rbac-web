"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

// JWT Payload 类型定义
interface JWTPayload {
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

// JWT 解析工具函数（不依赖第三方库的安全解析方法）
function parseJWT(token: string): JWTPayload {
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
    throw error;
  }
}

// 用户角色信息组件
function UserRoleInfo({ accessToken }: { accessToken: string }) {
  const [roleInfo, setRoleInfo] = useState<JWTPayload | null>(null);

  useEffect(() => {
    try {
      // 使用改进的 JWT 解析方法
      const payload = parseJWT(accessToken);
      setRoleInfo(payload);
    } catch (error) {
      console.error('解析令牌失败:', error);
    }
  }, [accessToken]);

  if (!roleInfo) {
    return <div>解析令牌中...</div>;
  }

  return (
    <div className="space-y-2">
      <div>
        <p><strong>用户名:</strong> {roleInfo.preferred_username || "未知"}</p>
        <p><strong>用户ID:</strong> {roleInfo.sub}</p>
        <p><strong>语言设置:</strong> {roleInfo.locale || "未设置"}</p>
      </div>

      {roleInfo.realm_access?.roles && (
        <div>
          <p><strong>Realm 角色:</strong></p>
          <ul className="text-sm ml-4 list-disc">
            {roleInfo.realm_access.roles.map((role: string, index: number) => (
              <li key={index} className="text-gray-600 dark:text-gray-300">{role}</li>
            ))}
          </ul>
        </div>
      )}

      {roleInfo.resource_access && (
        <div>
          <p><strong>资源角色:</strong></p>
          {Object.entries(roleInfo.resource_access).map(([resource, access]) => (
            <div key={resource} className="ml-4">
              <p className="text-sm font-medium">{resource}:</p>
              <ul className="text-sm ml-4 list-disc">
                {access.roles?.map((role: string, index: number) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">{role}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>令牌签发时间: {new Date(roleInfo.iat * 1000).toLocaleString('zh-CN')}</p>
        <p>令牌过期时间: {new Date(roleInfo.exp * 1000).toLocaleString('zh-CN')}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center">
          <div className="text-lg">初始化中...</div>
        </main>
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center">
          <div className="text-lg">加载中...</div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-2xl font-bold text-center">
            Keycloak RBAC Web 应用
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300">
            请先登录以访问应用程序
          </p>
          <button
            onClick={() => signIn("keycloak")}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            使用 Keycloak 登录
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-2xl font-bold text-center">
          欢迎，{session.user?.name || session.user?.email}！
        </h1>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-2">用户信息</h2>
          <p><strong>姓名:</strong> {session.user?.name || "未提供"}</p>
          <p><strong>邮箱:</strong> {session.user?.email || "未提供"}</p>
          <p><strong>图像:</strong> {session.user?.image ? "已设置" : "未设置"}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-2">会话信息</h2>
          <p><strong>访问令牌:</strong> {session.accessToken ? "已获取" : "未获取"}</p>
          <p><strong>刷新令牌:</strong> {session.refreshToken ? "已获取" : "未获取"}</p>
          {session.accessTokenExpired && (
            <div>
              <p><strong>访问令牌过期时间:</strong></p>
              <p className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                {new Date(session.accessTokenExpired).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
          {session.refreshTokenExpired && (
            <div>
              <p><strong>刷新令牌过期时间:</strong></p>
              <p className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                {new Date(session.refreshTokenExpired).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
          {session.error && (
            <p className="text-red-600"><strong>错误:</strong> {session.error}</p>
          )}
        </div>

        {/* 解析并显示用户角色信息 */}
        {session.accessToken && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">用户角色信息</h2>
            <UserRoleInfo accessToken={session.accessToken} />
          </div>
        )}

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={() => signOut()}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            退出登录
          </button>
        </div>
      </main>
    </div>
  );
}
