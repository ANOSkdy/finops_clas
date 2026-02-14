This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 運用メモ（キャッシュ再検証）

- マニュアル一覧は `src/lib/manual/getManualDocs.ts` で `revalidate: 60` とタグ `manual` を設定しています。
- 最新性優先のため `src/app/(app)/manual/page.tsx` に `export const revalidate = 60` を付与しています。
- マニュアル更新後は、保存 API / 管理画面のサーバー処理側で `revalidateTag("manual")` を呼び出して再検証してください。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## タスク期限リマインドメール

- `GET/POST /api/schedule/reminders/run` は、期限 `7日前 / 3日前 / 1日前` の `pending` タスクを抽出してメール送信します。
- 送信先は `REMINDER_TO_EMAIL`（指定時）を優先し、未指定時は会社の `contact_email` を使います。
- 二重送信防止のため `task_reminder_logs` に送信履歴を保存します。
- Vercel Cron は `vercel.json` で毎日 `00:00 UTC` 実行に設定しています。

### 追加環境変数

```bash
REMINDER_CRON_SECRET=your-strong-secret
REMINDER_TO_EMAIL=notify@example.com
```

- `REMINDER_CRON_SECRET` は `Authorization: Bearer <secret>` として API で照合します。
- `MAIL_PROVIDER`, `MAIL_API_KEY`, `MAIL_FROM` もあわせて設定してください。
