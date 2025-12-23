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

## 管理者向けアカウント管理  手動確認メモ

1. 管理者ユーザーでログインする。
2. `/admin/accounts` を開き、一覧が表示されることを確認する（403 になる場合はロールを確認）。
3. 「新規ユーザー発行」で login_id・name・password（8文字以上）を入力し、作成成功を確認する。
4. 作成されたユーザーの「削除」を押し、依存サマリーが表示されることを確認する。uploads/emails がある場合は削除ボタンが無効になることを確認。
5. 依存が 0 のユーザーで削除を実行し、一覧から消えることを確認する。
