import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        className="dark:invert"
                        src="/next.svg"
                        alt="应用 Logo"
                        width={120}
                        height={30}
                        priority
                    />
                </div>

                {/* 404 图标 */}
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4">
                        <svg className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.831-6.207-2.209M5.108 5.108A8.97 8.97 0 0112 3c2.34 0 4.5.831 6.207 2.209" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    页面未找到
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    抱歉，您访问的页面不存在或已被移动。
                </p>

                {/* 操作按钮 */}
                <div className="space-y-3">
                    <Link
                        href="/"
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        返回首页
                    </Link>

                    <Link
                        href="/auth/signin"
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        登录
                    </Link>
                </div>
            </div>
        </div>
    );
}
