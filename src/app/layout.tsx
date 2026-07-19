import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = { title: { default: "CLAS FinOps", template: "%s | CLAS FinOps" }, description: "会社ごとの税務・労務・会計業務を管理します" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja" suppressHydrationWarning><head><Script id="theme-init" strategy="beforeInteractive">{`try{const t=localStorage.getItem('clas-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark')}catch{document.documentElement.dataset.theme='dark'}`}</Script></head><body>{children}</body></html>;
}
