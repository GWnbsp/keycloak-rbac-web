"use client";

import { useEffect, useState } from "react";
import { parseJWT } from '@/lib/utils/jwt';
import type { JWTPayload } from '@/types/auth';

interface UserRoleInfoProps {
    accessToken: string;
}

export default function UserRoleInfo({ accessToken }: UserRoleInfoProps) {
    const [roleInfo, setRoleInfo] = useState<JWTPayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const payload = parseJWT(accessToken);
            setRoleInfo(payload);
            setError(null);
        } catch (err) {
            console.error('解析令牌失败:', err);
            setError('无法解析令牌信息');
            setRoleInfo(null);
        }
    }, [accessToken]);

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">用户角色信息</h2>
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!roleInfo) {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-2">用户角色信息</h2>
                <div className="text-center">
                    <div className="animate-pulse">解析令牌中...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">用户角色信息</h2>
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
        </div>
    );
}
