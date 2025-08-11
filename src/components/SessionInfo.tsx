import type { ExtendedSession } from '@/types/auth';

interface SessionInfoProps {
    session: ExtendedSession;
}

export default function SessionInfo({ session }: SessionInfoProps) {
    return (
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
    );
}
