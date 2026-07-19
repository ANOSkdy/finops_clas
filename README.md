# CLAS FinOps

CLAS FinOpsは、会社単位で税務・労務スケジュール、会計チェック、財務書類、メール監査を管理するNext.jsアプリケーションです。すべての業務データは、サーバーで検証したログインセッションと選択中の会社にスコープされます。

## ローカル起動

Node.js 24以降とpnpm 11を使用します。

1. `.env.example`を`.env`へコピーし、`AUTH_SESSION_SECRET`を32文字以上のランダム値へ変更します。
2. `docker compose up -d postgres`でローカルPostgreSQLを起動します。
3. `pnpm install --frozen-lockfile`を実行します。
4. `pnpm db:migrate`と`pnpm db:seed`を実行します。開発seedには`.env.example`に記載した明示的な許可設定が必要です。
5. `pnpm dev`を実行し、`http://localhost:3000`を開きます。

Blob、メール、AIの認証情報がない場合、アプリは成功を模擬せず、非公開ローカル保管、一般的な改善例、送信不可と監査保存の各状態を明示します。本番では`PRIVATE_STORAGE_DIRECTORY`未設定時にアップロードを拒否します。

## 検証

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm test:tax-schedule
pnpm build
```

ローカルDBを含む主要フローは`pnpm smoke:local`で確認できます。このスクリプトは実行ごとに一時的な認証値を生成し、無効ログイン、会社選択、テナント分離、スケジュール再計算、完了状態の保持、会計チェック、非公開アップロード、AI fallback、メール失敗監査、リマインダーdry-run、ログアウトを検証します。

## デプロイ

ビルド時にMigrationは実行しません。リリース工程で`pnpm db:migrate`を先に実行し、互換性を確認してからデプロイしてください。例外的にビルドでMigrationを行う場合だけ`PRISMA_MIGRATE_ON_BUILD=true`を明示します。
