import type { ExtendedSession } from '@/types/auth';

interface UserInfoProps {
    session: ExtendedSession;
}

export default function UserInfo({ session }: UserInfoProps) {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">用户信息</h2>
            <p><strong>姓名:</strong> {session.user?.name || "未提供"}</p>
            <p><strong>邮箱:</strong> {session.user?.email || "未提供"}</p>
            <p><strong>图像:</strong> {session.user?.image ? "已设置" : "未设置"}</p>
        </div>
    );
}
