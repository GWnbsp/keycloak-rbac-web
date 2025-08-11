"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import type { ExtendedSession } from '@/types/auth';
import LoadingScreen from '@/components/LoadingScreen';
import LoginPrompt from '@/components/LoginPrompt';
import UserInfo from '@/components/UserInfo';
import SessionInfo from '@/components/SessionInfo';
import UserRoleInfo from '@/components/UserRoleInfo';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingScreen message="初始化中..." />;
  }

  if (status === "loading") {
    return <LoadingScreen message="加载中..." />;
  }

  if (!session) {
    return <LoginPrompt />;
  }

  const extendedSession = session as ExtendedSession;

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
          欢迎，{extendedSession.user?.name || extendedSession.user?.email}！
        </h1>

        <UserInfo session={extendedSession} />

        <SessionInfo session={extendedSession} />

        {/* 解析并显示用户角色信息 */}
        {extendedSession.accessToken && (
          <UserRoleInfo accessToken={extendedSession.accessToken} />
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
