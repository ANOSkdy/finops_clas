import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-line bg-white/90 p-10 text-center shadow-soft sm:p-14">
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-base shadow-softSm">
              C
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-10 tracking-tight">
                CLAS FinOps
              </h1>
              <p className="text-base leading-7 text-inkMuted">
                会社選択とアップロードを最短で進められる、モダンで軽やかな画面に刷新しました。
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-base shadow-softSm hover:bg-primary/90"
                href="/login"
              >
                ログインへ進む
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-full border border-primary/30 px-6 text-sm font-medium text-primary hover:bg-primary/10"
                href="/manual"
              >
                マニュアルを見る
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 text-xs text-inkMuted">
          <Image src="/next.svg" alt="Next.js logo" width={64} height={16} priority />
          <span>Powered by Next.js</span>
        </div>
      </main>
    </div>
  );
}
