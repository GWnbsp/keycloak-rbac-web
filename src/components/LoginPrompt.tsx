import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginPrompt() {
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
                    onClick={() => signIn()}
                    className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                >
                    立即登录
                </button>
            </main>
        </div>
    );
}
