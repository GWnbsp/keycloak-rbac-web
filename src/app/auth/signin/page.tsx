"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getProviders, getSession, getCsrfToken } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Provider {
    id: string;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
}

interface Providers {
    [key: string]: Provider;
}

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [providers, setProviders] = useState<Providers | null>(null);
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [loginMethod, setLoginMethod] = useState<'credentials' | 'oauth'>('credentials');

    // 表单状态
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // 获取 URL 参数
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const errorParam = searchParams.get("error");

    useEffect(() => {
        // 检查用户是否已登录
        getSession().then((session) => {
            if (session) {
                router.push(callbackUrl);
            }
        });

        // 获取认证提供者和 CSRF token
        const fetchData = async () => {
            try {
                const [providersRes, csrfRes] = await Promise.all([
                    getProviders(),
                    getCsrfToken(),
                ]);
                setProviders(providersRes);
                setCsrfToken(csrfRes || "");
            } catch (error) {
                console.error("获取认证信息失败:", error);
                setError("初始化失败，请刷新页面重试");
            }
        };

        fetchData();

        // 处理 URL 中的错误参数
        if (errorParam) {
            switch (errorParam) {
                case "CredentialsSignin":
                    setError("用户名或密码错误");
                    break;
                case "OAuthSignin":
                case "OAuthCallback":
                case "OAuthCreateAccount":
                    setError("OAuth 认证失败，请重试");
                    break;
                case "EmailCreateAccount":
                    setError("邮箱创建账户失败");
                    break;
                case "Callback":
                    setError("认证回调失败");
                    break;
                case "OAuthAccountNotLinked":
                    setError("该邮箱已与其他账户关联");
                    break;
                case "EmailSignin":
                    setError("邮箱登录失败");
                    break;
                case "SessionRequired":
                    setError("需要登录才能访问此页面");
                    break;
                default:
                    setError("认证失败，请重试");
            }
        }
    }, [callbackUrl, errorParam, router]);

    // 处理 Keycloak OAuth 登录
    const handleKeycloakSignIn = async () => {
        try {
            setIsLoading(true);
            setError("");

            const result = await signIn("keycloak", {
                callbackUrl,
                redirect: false,
            });

            if (result?.error) {
                setError("登录失败，请检查您的凭据");
            } else if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error("登录过程中发生错误:", error);
            setError("登录过程中发生错误，请重试");
        } finally {
            setIsLoading(false);
        }
    };

    // 处理直接重定向到 Keycloak
    const handleDirectKeycloakAuth = () => {
        setIsLoading(true);
        signIn("keycloak", { callbackUrl });
    };

    // 处理用户名密码登录
    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username.trim() || !formData.password) {
            setError('请输入用户名和密码');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('keycloak-credentials', {
                username: formData.username.trim(),
                password: formData.password,
                callbackUrl,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else if (result?.url) {
                router.push(result.url);
            } else {
                router.push(callbackUrl);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('登录过程中发生错误，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 处理表单输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 清除错误信息
        if (error) {
            setError('');
        }
    };

    if (!providers) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">正在加载...</p>
                </div>
            </div>
        );
    }

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

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        欢迎登录
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        使用您的账户登录 RBAC 系统
                    </p>
                </div>

                {/* 错误信息显示 */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 登录方式选择 */}
                <div className="mb-6">
                    <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                        <button
                            onClick={() => setLoginMethod('credentials')}
                            className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${loginMethod === 'credentials'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            账号密码登录
                        </button>
                        <button
                            onClick={() => setLoginMethod('oauth')}
                            className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${loginMethod === 'oauth'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            单点登录
                        </button>
                    </div>
                </div>

                {loginMethod === 'credentials' ? (
                    /* 用户名密码登录表单 */
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    账号密码登录
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    使用您的用户名和密码登录
                                </p>
                            </div>

                            <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                {/* 用户名输入 */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        用户名
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isLoading}
                                        placeholder="请输入用户名"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* 密码输入 */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        密码
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isLoading}
                                        placeholder="请输入密码"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* 登录按钮 */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !formData.username.trim() || !formData.password}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            正在登录...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            登录
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Keycloak OAuth 登录卡片 */
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    企业单点登录
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    使用您的企业账户安全登录
                                </p>
                            </div>

                            {/* Keycloak 登录按钮 */}
                            <button
                                onClick={handleDirectKeycloakAuth}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        正在登录...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                        使用 Keycloak 登录
                                    </>
                                )}
                            </button>

                            {/* 高级选项 */}
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                    高级选项
                                </summary>
                                <div className="mt-3 space-y-2">
                                    <button
                                        onClick={handleKeycloakSignIn}
                                        disabled={isLoading}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        🔧 调试模式登录
                                    </button>
                                    <button
                                        onClick={() => router.push("/")}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    >
                                        🏠 返回首页
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                )}

                {/* 帮助信息 */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        登录即表示您同意我们的
                        <a href="#" className="text-blue-600 hover:text-blue-500 ml-1">服务条款</a>
                        和
                        <a href="#" className="text-blue-600 hover:text-blue-500 ml-1">隐私政策</a>
                    </p>
                </div>

                {/* 调试信息 (仅开发环境) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs">
                        <h4 className="font-semibold mb-2">调试信息：</h4>
                        <p>回调 URL: {callbackUrl}</p>
                        <p>CSRF Token: {csrfToken ? "已获取" : "未获取"}</p>
                        <p>可用提供者: {Object.keys(providers).join(", ")}</p>
                        <p>当前登录方式: {loginMethod}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">正在加载...</p>
                </div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}