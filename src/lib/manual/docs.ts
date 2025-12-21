export type ManualDoc = { slug: string; title: string; contentMd: string };

export const MANUAL_DOCS: ManualDoc[] = [
  {
    slug: "getting-started",
    title: "ログインと会社選択",
    contentMd: `
# ログインと会社選択
- 画面右上「ログイン」から **admin / password** でログイン
- 「会社を選択」でアクティブ会社を設定
- 以後、Home/Schedule/Upload 等はアクティブ会社のスコープで動作します
`,
  },
  {
    slug: "upload",
    title: "アップロード（Direct Upload）",
    contentMd: `
# アップロード（Direct Upload）
- ブラウザから直接Blobへアップロードします
- 完了後に \`fileId\` が表示されます（監査・後続処理で使用）
- 失敗した場合は Blob token とログイン状態を確認してください
`,
  },
  {
    slug: "rating",
    title: "格付け（Rating）",
    contentMd: `
# 格付け（Rating）
- 決算書（PDF/CSV）をアップロード
- \`/api/rating/finalize\` がスコア・グレード・AIコメントを返します
- AI出力はプレーンテキストとして扱います（HTMLレンダリングしません）
`,
  },
  {
    slug: "trial-balance-mail",
    title: "試算表送付（Mail）",
    contentMd: `
# 試算表送付（Mail）
- 試算表（CSV/Excel）をアップロードし \`fileId\` を得ます
- メールUIから送信（\`/api/mail/send\`）
- 送信結果は emails テーブルに保存されます（監査ログ）
`,
  },
];