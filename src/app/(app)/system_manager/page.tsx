"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

type Role = "admin" | "user" | "global";

export default function SystemManagerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<Role | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?next=/system_manager");
          return;
        }
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { role: Role };
        if (data.role !== "global") {
          toast({ variant: "error", description: "権限がありません" });
          router.replace("/home");
          return;
        }
        if (!cancelled) {
          setRole(data.role);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          toast({ variant: "error", description: "権限確認に失敗しました" });
          router.replace("/home");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  const isAuthorized = role === "global" && !checking;

  if (checking) {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold tracking-tight">システム管理</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">グローバル権限で利用できる管理メニュー</div>
        </div>
        <Card className="">
          <CardHeader>
            <div className="text-base font-semibold">読み込み中</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">システム管理</div>
        <div className="mt-1 text-sm text-[var(--color-text-secondary)]">グローバル権限で利用できる管理メニュー</div>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader className="px-0 pt-0">
          <div className="text-base font-semibold">アカウント管理</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">ユーザー作成・削除や権限の管理を行います</div>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:shrink-0">
          <a href="/account">
            <Button className="w-full sm:w-56">アカウント管理を開く</Button>
          </a>
        </CardContent>
      </Card>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader className="px-0 pt-0">
          <div className="text-base font-semibold">新しい会社</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">会社レコードを追加します</div>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:shrink-0">
          <a href="/newcompany">
            <Button className="w-full sm:w-56">新しい会社を登録</Button>
          </a>
        </CardContent>
      </Card>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader className="px-0 pt-0">
          <div className="text-base font-semibold">会社メンバー紐付け</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">既存の法人・個人事業主にユーザーを追加します</div>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:shrink-0">
          <a href="/company_member">
            <Button className="w-full sm:w-56">紐付けページを開く</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
