interface LoadingScreenProps {
    message?: string;
}

export default function LoadingScreen({ message = "加载中..." }: LoadingScreenProps) {
    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg">{message}</div>
                </div>
            </main>
        </div>
    );
}
