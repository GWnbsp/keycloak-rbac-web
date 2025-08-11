"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";

const errorMessages: { [key: string]: { title: string; description: string; action: string } } = {
    Configuration: {
        title: "配置错误",
        description: "服务器配置存在问题，请联系系统管理员。",
        action: "联系管理员"
    },
    AccessDenied: {
        title: "访问被拒绝",
        description: "您没有权限访问此应用程序。请联系管理员获取访问权限。",
        action: "联系管理员"
    },
    Verification: {
        title: "验证失败",
        description: "验证链接无效或已过期。请重新请求验证邮件。",
        action: "重新发送邮件"
    },
    CredentialsSignin: {
        title: "登录失败",
        description: "用户名或密码不正确。请检查您的凭据后重试。",
        action: "重新登录"
    },
    OAuthSignin: {
        title: "OAuth 登录失败",
        description: "OAuth 提供者登录过程中出现错误。",
        action: "重新登录"
    },
    OAuthCallback: {
        title: "OAuth 回调错误",
        description: "OAuth 认证回调过程中出现错误。",
        action: "重新登录"
    },
    OAuthCreateAccount: {
        title: "创建账户失败",
        description: "无法创建您的账户。请重试或联系管理员。",
        action: "重新尝试"
    },
    EmailCreateAccount: {
        title: "邮箱创建账户失败",
        description: "无法使用该邮箱创建账户。",
        action: "联系管理员"
    },
    Callback: {
        title: "回调错误",
        description: "认证回调过程中出现错误。",
        action: "重新登录"
    },
    OAuthAccountNotLinked: {
        title: "账户未关联",
        description: "该邮箱已与其他登录方式关联。请使用原来的登录方式。",
        action: "使用原登录方式"
    },
    SessionRequired: {
        title: "需要登录",
        description: "访问此页面需要先登录。",
        action: "立即登录"
    },
    Default: {
        title: "认证错误",
        description: "认证过程中出现未知错误。请重试或联系管理员。",
        action: "重新尝试"
    }
};

function AuthErrorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "Default";

    const errorInfo = errorMessages[error] || errorMessages.Default;

    const handleRetry = () => {
        // 根据错误类型执行不同的操作
        switch (error) {
            case "SessionRequired":
            case "CredentialsSignin":
            case "OAuthSignin":
            case "OAuthCallback":
            case "Callback":
                router.push("/auth/signin");
                break;
            case "AccessDenied":
            case "Configuration":
            case "EmailCreateAccount":
                router.push("/");
                break;
            default:
                router.push("/auth/signin");
        }
    };

    const handleGoHome = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
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

                    {/* 错误图标 */}
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {errorInfo.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {errorInfo.description}
                    </p>
                </div>

                {/* 错误详情卡片 */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                        {/* 错误代码 */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">错误代码: </span>
                                <span className="text-red-600 dark:text-red-400 font-mono">{error}</span>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="space-y-3">
                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {errorInfo.action}
                            </button>

                            <button
                                onClick={handleGoHome}
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                返回首页
                            </button>
                        </div>
                    </div>
                </div>

                {/* 帮助信息 */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        如果问题持续存在，请联系技术支持
                    </p>
                    <div className="space-x-4 text-xs">
                        <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">
                            📧 技术支持
                        </a>
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                            📖 帮助文档
                        </a>
                    </div>
                </div>

                {/* 调试信息 (仅开发环境) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs">
                        <h4 className="font-semibold mb-2">调试信息：</h4>
                        <p>错误类型: {error}</p>
                        <p>URL 参数: {searchParams.toString()}</p>
                        <p>时间戳: {new Date().toISOString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuthError() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">正在加载...</p>
                </div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
}
