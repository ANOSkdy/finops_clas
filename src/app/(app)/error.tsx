"use client";

import { ErrorState } from "@/components/ui/State";
export default function AppErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="page"><ErrorState message="画面を表示できませんでした。再試行してください。" onRetry={reset} /></div>; }
