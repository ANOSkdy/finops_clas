# AGENTS.md — CLAS FinOps AIエージェント開発ルール

| 項目 | 内容 |
|---|---|
| Repository | `ANOSkdy/finops_clas` |
| Default branch | `main` |
| Baseline commit | `8d4300d844e30a0b37ec98843e9259ef24e758e7` |
| Primary package manager | `pnpm` |
| Primary locale | `ja-JP` |
| Business time zone | `Asia/Tokyo` |
| Related documents | `finops_clas_system_spec_main_8d4300d.md`、`DESIGN.md`、`FUNCTION_SCREEN_LIST.md`、`PR_DESIGN.md` |
| Rule level | Repository-wide mandatory instructions |

---

## 0. 最重要ルール

このリポジトリで作業するAIエージェントは、見た目の改善より先に、認証、テナント境界、業務ロジック、データ整合性、監査履歴を保護する。

次の条件を満たさない変更は完成扱いにしない。

1. 他社データへアクセスできない。
2. 既存業務フローを意図せず変更しない。
3. Task生成、Upload用途、Mail監査、Checklist一意性を壊さない。
4. UI変更でServer認可を代替しない。
5. Date、年度、期限を`Asia/Tokyo`基準へ統一する方向を妨げない。
6. Dark／Light、Keyboard、Screen reader、Responsiveを同時に考慮する。
7. 変更内容と検証結果をPRに再現可能な形で残す。

> **禁止:** 「Linear風に見えるから」「一般的なSaaSではこうだから」という理由だけで、未承認機能、Role、Status、Workflow、DB Column、外部連携を追加してはならない。

---

## 1. 適用範囲

このファイルはリポジトリ全体に適用する。

下位Directoryに追加の`AGENTS.md`が存在する場合は、下位Ruleを追加適用する。ただし、下位Ruleは本書のSecurity、Tenant、Data integrity、Audit、Accessibility要件を弱めてはならない。

---

## 2. Source of Truthと優先順位

作業時の判断根拠は次の順で扱う。

1. **明示されたIssue、PR設計、ユーザー要求。**
2. **Security・Tenant・Data integrityの不変条件。**
3. **`finops_clas_system_spec_main_8d4300d.md`の現行仕様とリスク。**
4. **`DESIGN.md`のUI・Accessibility・Interaction規範。**
5. **`FUNCTION_SCREEN_LIST.md`の画面契約。**
6. **既存TestとAPI Contract。**
7. **現行Code。**

### 2.1 競合時の処理

- 文書とCodeが異なる場合、どちらかを黙って正としない。
- 現行挙動をCharacterization testで固定し、差異をPRへ記載する。
- Security、Tax、Retention、Role、Destructive actionの不明点を推測で決めない。
- PRの明示要件が不変条件を壊す場合、実装を進めずConflictとして報告する。
- UI文言だけで業務仕様を変更しない。

---

## 3. 作業開始前の必須手順

エージェントは編集前に次を実行する。

### 3.1 Repository状態

- `main`の最新Commitを確認する。
- 作業Branchが最新`main`を基点にしていることを確認する。
- Working treeがCleanか、既存変更のOwnerが明確であることを確認する。
- 対象PR ID、Screen ID、Risk IDを特定する。

### 3.2 読むべきFile

最低限、対象に応じて次を読む。

| Change type | Mandatory context |
|---|---|
| 全変更 | 本書、対象PR設計、対象Screen仕様 |
| UI | `DESIGN.md`、`src/app/globals.css`、対象`src/components/ui/*` |
| Route | 対象Page、関連Route Handler、Validator、Data model |
| Auth/Tenant | `src/middleware.ts`、`src/lib/auth/session.ts`、`tenant.ts`、`rbac.ts` |
| Task | `src/lib/tasks/*`、`src/lib/date/*`、Schedule API、Tax test |
| Upload | uploads token/complete、path、DB helper、Blob client code |
| Rating | scoring、AI provider、Rating API、Upload model |
| Mail/Cron | mail provider、mail/send、reminder policy、cron route |
| DB | `prisma/schema.prisma`、全Migration、Build migration policy |

### 3.3 変更計画

編集前に、少なくとも次を短く明文化する。

- 変更目的。
- 変更対象File。
- 変更しない範囲。
- 守るInvariant。
- Test plan。
- Rollback方法。

計画にない大規模Refactorを途中で混在させない。

---

## 4. Branch・Worktree・並行作業

### 4.1 Branch naming

推奨:

```text
codex/pr-<番号>-<短い-kebab-case>
```

例:

```text
codex/pr-012-app-shell-command-palette
```

### 4.2 並行Agent

- Agentごとに独立BranchまたはGit worktreeを使用する。
- 同一Working treeを複数Agentで共有しない。
- 同一Fileを触るPRを並行させない。
- 特に次はMerge順を直列化する。
  - `src/app/globals.css`
  - Theme/Tokens
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Field.tsx`
  - `src/components/layout/AppHeader.tsx`または新App Shell
  - Auth/Tenant helper
  - Prisma schema
- 並行PRは共通基盤PR Merge後にRebaseする。
- Conflict解消時に相手PRの機能を消さない。

### 4.3 Handoff

Agent間のHandoffには次を含める。

- Base SHAとHead SHA。
- Changed files。
- Added/changed contracts。
- Test result。
- Known limitations。
- 次Agentが避けるべきFile。

---

## 5. 変更サイズと責務

- 1 PRは1つの主要責務に限定する。
- UI刷新とBusiness logic修正を同一PRへ混在させない。
- Schema migrationと大規模UI変更を同一PRへ混在させない。
- Dependency追加は専用または明確な基盤PRで行う。
- Unrelated formatting、rename、import並べ替えを大量に含めない。
- Generated files、Lockfileの変更理由を説明する。
- 大規模Fileを丸ごと書き換えず、Review可能な差分にする。

目安:

| Change | 推奨規模 |
|---|---|
| Bug fix | 1〜5 files |
| UI component | Component + fixture/test +必要Token |
| Screen refresh | 対象Route + shared component最小限 + test |
| API contract | Route + validator + typed client + contract test |
| Schema | Schema + migration + compatibility test + docs |

---

## 6. 保護対象の業務Invariant

次は明示的な仕様変更PRでない限り変更禁止。

### 6.1 Tenant

- `Session.activeCompanyId`を現在会社として扱う。
- Active Companyを利用するAPIはMembershipを確認する。
- IDだけを根拠に他CompanyのRecordを取得・更新しない。
- `Task`、`Upload`、`Rating`、`Email`、Checklist、Recurring due dateはCompany scopeを必ず含める。

### 6.2 Task

- 生成範囲は既定36か月。
- `Task.taskKey`で生成Taskを冪等化する。
- 同一会社内の生成Task重複を防止する。
- 標準Taskと任意Taskが同一のCategory＋Title＋Due dateなら標準を優先する。
- 再生成で削除できるのは不要になった未完了生成Task。
- `done` Taskは再生成で削除しない。
- `overdue`表示は保存StatusだけでなくDue dateから算定する現行契約を理解する。

### 6.3 Accounting checklist

- Checkの一意性は`companyId + itemId + fiscalYear + month`。
- ItemがActive Companyに属することをServerで確認する。
- 4月〜翌3月の年度表現を維持する。
- Edit/Delete/Reorder APIなしにUIだけを追加しない。

### 6.4 Upload / Rating / Mail

- Upload purposeは`rating | trial_balance`の2値。
- Ratingには`rating`用途のみ使用する。
- Mail添付には`trial_balance`用途のみ使用する。
- 添付Uploadは送信者のActive Companyに属する必要がある。
- Email監査行は送信結果にかかわらず残す現行意図を維持する。
- Ratingは現行ではUpload metadataを使った簡易Scoreであり、ファイル本文解析ではない。

### 6.5 Authentication

- PasswordはbcryptでHashする。
- Session token平文をDBへ保存しない。
- CookieはHttpOnly、本番Secure、SameSite=Lax、Path=/。
- Session TTLは明示変更なしに変えない。

---

## 7. Security・Privacy・Tenantルール

### 7.1 認証

- Pageの表示制御だけでなく、Server/APIで有効Sessionを検証する。
- Cookieの存在だけを認証済みとみなさない。
- Server ComponentからDBを直接読む場合もSessionを検証する。
- `next`、`returnTo`、Redirect URLは同一Originの内部相対Pathへ限定する。
- Debug routeはProductionでPublicにしない。

### 7.2 Authorization

- `requireAuth`、`requireActiveCompany`等の共通Helperを優先する。
- Global権限はAPIで`user.role === "global"`を検証する。
- Company editはServer側RBACを正とする。
- UIでButtonを隠すだけの認可は不可。
- 403と404の使い分けでTenant存在を不必要に漏らさない。

### 7.3 Secret

- `.env`、API key、Cookie token、Database URL、Blob tokenをCommitしない。
- SecretをConsole、Toast、Error detail、Screenshot、Fixtureへ出さない。
- Sanitization前のProvider errorを一般利用者へ出さない。
- Environment variable名を一般UIへ表示しない。

### 7.4 File / URL

- User入力URLをそのままUpload metadataやMail attachmentへ登録しない。
- 許可されたBlob host、Path prefix、Company、Purpose、Content type、SizeをServerで再検証する。
- Path traversal、先頭Slash、`..`を拒否する。
- Public Blobを新規拡大しない。
- Private化まではURLを通常UIへ表示しない。

### 7.5 Logging

- Password、Session token、Mail body、File URL全文、個人情報を標準Logへ出さない。
- Tenant ID、Request ID、Operation、Resultを構造化して記録する。
- ErrorはUser向けMessageと診断情報を分離する。

---

## 8. Next.js / React実装ルール

### 8.1 Rendering

- Server Componentで実現できるRead-only処理はServerを検討する。
- Browser API、local interaction、upload、optimistic updateが必要な範囲だけ`use client`にする。
- Client Component化をPage全体へ不必要に拡大しない。
- Server ComponentのDB readにはAuth/Tenant checkを伴わせる。

### 8.2 Data fetching

- UIからDBへ直接アクセスしない。
- Client fetchはCredentials、Error、Abort、Stale stateを扱う。
- 同一画面で独自のError shape parserを増やさない。
- Typed API client導入後は必ず共有Clientを使用する。
- Race conditionを防ぐため、Company切替・Route離脱時の古いResponseを反映しない。

### 8.3 State

- `loading | ready | refreshing | saving | error`を区別する。
- Busy中に画面全体を不必要にDisableしない。
- Optimistic updateにはRollbackを実装する。
- Double submitを防ぐ。
- Dialog closeとMutation完了の順序を明示する。

### 8.4 TypeScript

- `strict: true`を維持する。
- `any`、`as any`、無根拠な型Assertionを追加しない。
- `@ts-ignore`、`@ts-nocheck`を追加しない。
- API response型をPage内で重複定義せず、共有Contractへ集約する方向を優先する。
- Exhaustive handlingが必要なStatus/RoleはUnion型で表現する。

### 8.5 Error handling

- 空の`catch {}`を新規追加しない。
- Best-effort処理は理由をCommentし、必要に応じてSafe logを残す。
- Errorを握りつぶしてSuccess表示しない。
- Userが再試行できるか、入力を保持できるかを明示する。

---

## 9. API・Validation・Contractルール

### 9.1 Error shape

標準Errorは次を使用する。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力に誤りがあります",
    "details": [
      { "field": "fieldName", "reason": "too_small" }
    ]
  }
}
```

- UIは`json.details`直下を参照しない。
- 新APIは既存`jsonError`または承認済み共通Response helperを使用する。
- Cron等の例外Contractを増やさない。
- Error codeを文字列Messageの部分一致で判定しない。

### 9.2 Validation

- API入力はZodで検証する。
- Client validationはUX目的であり、Server validationを省略しない。
- UUID、Enum、Date、Money、File metadataを明示検証する。
- Validation errorにはField pathを付ける。
- 予期しないJSON、空Bodyを安全に処理する。

### 9.3 Status code

- 200/201: 成功Bodyあり。
- 204: Bodyなし。
- 400: 入力不正。
- 401: Sessionなし／無効。
- 403: 認証済みだが権限なし。
- 404: 対象なし、または安全上存在を隠す。
- 409: 重複、関連Data、状態Conflict。
- 500/503: Internal／外部Provider unavailable。

既存Contractを変更する場合は、全Call siteとContract testを同一PRで更新する。

---

## 10. Date・Fiscal year・Money・Taxルール

### 10.1 Time zone

- 業務上の「今日」「年度」「期限」は`Asia/Tokyo`を正とする。
- Browser localeだけに依存しない。
- Date-onlyを不要にLocal `Date`へ変換して1日ずらさない。
- APIの日付は原則`YYYY-MM-DD`。
- 共通Date service導入後は全画面で使用する。

### 10.2 Fiscal year

- Accounting checklistは4月開始、翌3月終了。
- ClientとServerで年度計算を重複させない。
- 年度Selector値は2000〜2100。

### 10.3 Money

- 金額は浮動小数点で扱わない。
- Prisma BigIntはAPIで10進文字列にSerializeする。
- UI入力は整数円としてValidationする。
- 桁区切り表示と送信値を分離する。

### 10.4 Tax

次の変更は、Domain approvalとGolden testなしに実施禁止。

- 申告期限。
- 対象期間。
- 中間申告回数・閾値。
- 休日繰延。
- 法人／個人事業主の分岐。
- 施行日によるRule変更。

Tax fix PRは次を必須とする。

- 変更前後の具体例。
- 根拠資料または承認者。
- 過去生成Taskへの影響。
- `done` Taskの扱い。
- Golden test。
- Rule versionまたは将来Versioning方針。

---

## 11. Upload・AI・Mail・Cronルール

### 11.1 Upload

- 許可MIMEはPDF、CSV、XLS、XLSX。
- 最大250MBという現行上限を無断で変更しない。
- SHA-256は現行で20MB以下のみ。全File計算へ変更する場合はMemory/UXを評価する。
- Upload token発行時にCompany、User、Purpose、Path scopeを固定する。
- Complete APIで同じ条件を再検証する。
- Delete/Retentionを追加する場合はDBとBlobを一貫して処理しAuditを残す。

### 11.2 Rating / AI

- AIコメントは確定的な金融評価として表示しない。
- File本文を送信していない現行仕様を明記する。
- Provider failure時のFallbackを`一般的な改善例`として表示する。
- Model、Prompt、Score algorithmを変える場合はVersion情報を保存する設計を行う。
- AI呼び出しにSecretや不要な個人情報を含めない。
- Timeout、Invalid JSON、Rate limitを別状態として観測可能にする。

### 11.3 Mail

- Mail送信前に宛先、件名、添付名を確認する。
- `Email` rowの監査状態を維持する。
- 送信失敗と監査保存失敗を区別する。
- Provider message IDは一般UIの主要情報にしない。
- Retry、Queue、Idempotencyを追加する場合は重複送信防止を設計する。

### 11.4 Cron

- `CRON_SECRET`を必須とする。
- Query string secretはLog・履歴露出のRiskを考慮し、Bearerへ統一する方向を優先する。
- 200件固定取得を拡大利用しない。
- Pagination、Batch、Timeout budget、Retry、重複防止をTestする。
- Cron resultはscanned、eligible、queued、sent、skipped、failedを保持する。

---

## 12. UI・Design Systemルール

UI変更時は`DESIGN.md`が規範である。

### 12.1 Design direction

- Linear-inspired。
- Ultra-minimal、calm、precise。
- Dark-native、Light同等品質。
- Structureは余白、整列、背景階層、Hairlineで示す。
- 装飾より機能、速度、信頼を優先する。

### 12.2 Tokens

- Color、Spacing、Radius、Shadow、MotionをCSS Variablesへ集約する。
- Hex、RGB、Spacing値のPage内直書きを避ける。
- 既存Tokenがある場合は再利用する。
- 旧`glass`、`ink`、`panel`、`line`、未定義Variableを新規使用しない。
- Primary accentは`#5e6ad2`系。ただし主要ActionとActive stateへ限定する。
- Semantic colorを装飾目的に使わない。

### 12.3 Layout

- DesktopはSidebar＋Main content。
- List/Table中心。
- すべてをCardで囲わない。
- MobileでDesktop Tableを単純縮小しない。
- Long Japanese textでLayoutが壊れない。
- Internal route名、Purpose値、UUIDを一般UIへ出さない。

### 12.4 Components

新しいPage独自Button/Input/Dialogを増やさない。

優先する共通Component:

- Button / IconButton。
- TextField / Select / Textarea。
- Checkbox / Switch。
- DataList / DataTable。
- StatusBadge。
- Dialog / DestructiveConfirmDialog。
- Drawer / Sheet。
- Toast。
- Skeleton / Progress。
- EmptyState / ErrorState。
- FileDropzone / UploadItem。
- PageHeader / FormSection / StickySaveBar。
- PermissionGate。

### 12.5 Content

- UI文言は日本語。
- 実装用語や環境変数名を一般利用者へ出さない。
- Action labelは具体的な動詞を使う。
- Dateは年を省略しない場面を優先する。
- Destructive dialogは対象と影響を明示する。
- AIの限界を常時説明する。

### 12.6 Motion

- 150〜250ms程度。
- Fade、Color、短いSlideを中心とする。
- Bounce、Glow、連続Pulseを避ける。
- `prefers-reduced-motion`でAnimationを無効化する。

---

## 13. Accessibilityルール

最低基準はWCAG 2.2 AA。

### 13.1 Keyboard

- 主要FlowをKeyboardのみで完了可能にする。
- Tab順をDOM順と一致させる。
- Dialog、Drawer、Command paletteでFocus trapとFocus returnを実装する。
- `⌘K` / `Ctrl+K`をCommand paletteに使用可能。
- ShortcutはInput入力中に誤発火させない。

### 13.2 Semantics

- Linkは`<a>`/`Link`、Actionは`<button>`。
- Anchor内Buttonを禁止する。
- Tableは`th scope`、Caption、Row/Column headerを使用する。
- Checkboxに対象名と月を含むAccessible nameを付ける。
- Icon-only Buttonに`aria-label`を付ける。
- StatusをColorだけで表現しない。

### 13.3 Focus / Contrast

- Focus ringを消さない。
- Dark/Light両方でText、Border、StatusのContrastを確認する。
- 200% Zoom、320pxで利用可能にする。
- Forced colorsで操作要素を識別可能にする。

### 13.4 Announcement

- Errorは`role=alert`。
- 非緊急Toastは`aria-live=polite`。
- Upload progress、保存完了、失敗を適切に通知する。
- ToastだけにError情報を依存しない。

---

## 14. DB・Prisma・Migrationルール

### 14.1 Schema変更

Schema変更PRには次を必須とする。

- `prisma/schema.prisma`。
- Forward migration SQL。
- 既存DataとのCompatibility説明。
- Deploy順序。
- RollbackまたはForward-fix方針。
- Index、Unique、Cascade/Restrictの影響。
- Application codeの旧Schema互換期間。

### 14.2 Migration safety

- Destructive migrationを自動実行しない。
- Column renameはExpand → Backfill → Switch → Contractを優先する。
- Big tableのLock、Index creation、Default backfillを評価する。
- `PRISMA_MIGRATE_ON_BUILD`既定falseを理解し、Deploy手順をPRに記載する。
- Production Dataを前提に、Seed scriptをMigration代わりに使わない。

### 14.3 Seed

- Weak default PasswordをProductionで使用しない。
- Seedは明示FlagとEnvironment guardを必要とする。
- Production userを上書きしない。

---

## 15. Dependencyルール

- 新Dependencyは原則追加しない。
- 既存機能、Web Platform、Next.js、React、Radix、Tailwindで実現可能か先に確認する。
- 追加時は以下をPRへ記載する。
  - 目的。
  - 代替案。
  - Bundle影響。
  - License。
  - Maintenance状況。
  - Security。
- UI icon library等を追加する場合は全体方針を決め、Page単位で異なるLibraryを混在させない。
- Lockfile変更を含める。

---

## 16. Test・検証ルール

### 16.1 既存必須Command

変更内容にかかわらず、原則次を実行する。

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:tax-schedule
pnpm build
```

既にDependencyがInstall済みでLockfile未変更の場合、Install省略は可能。ただしPRに記載する。

### 16.2 Change type別Gate

| Change type | Minimum verification |
|---|---|
| Docs only | Link、Path、Markdown rendering確認 |
| Token/CSS | Lint、Typecheck、Dark/Light visual、Reduced motion |
| UI primitive | 全State fixture、Keyboard、a11y、Visual |
| Screen | Loading/Empty/Error/Forbidden、Responsive、E2E path |
| API | Validator、Error contract、401/403/404/409、Contract test |
| Tenant/Auth | Negative cross-tenant test、expired/forged session test |
| Task/Date | Unit、Golden、Boundary date、Idempotency |
| Upload | MIME/size/path/tenant/purpose negative test、Provider mock |
| Mail | Audit row、success/failure、duplicate prevention、attachment scope |
| DB | Migration validate、compatibility、index/constraint test |
| Cron | Pagination、duplicate、timeout/retry、result count |

### 16.3 Visual viewport

最低限:

- Desktop 1440px。
- Tablet 1024px。
- Mobile 390px。
- 200% Zoom。
- Dark / Light。

### 16.4 Critical E2E

対象変更に関連する次のFlowを実行する。

1. Login → Company select → Home。
2. Company switch → Context更新。
3. Schedule refresh → Duplicateなし → Complete。
4. Checklist optimistic success／rollback。
5. Rating upload → finalize → cache。
6. Trial balance upload → confirm → mail success/failure。
7. Company settings → recalculate guidance。
8. Global user create/delete conflict。
9. Membership create/duplicate/delete。
10. Manual access control。

### 16.5 Test failure

- 既存Testを削除・Skipして通さない。
- Snapshotを内容確認なしに一括更新しない。
- Flaky testはRetryで隠さず原因を記載する。
- Test不能な外部ServiceはMock/Fake境界を作る。

---

## 17. Review可能なCodeの書き方

- Function名は業務目的が分かる名前にする。
- Magic numberはDomain constantへ置く。
- Complex conditionalはPolicy/Helperへ抽出する。
- Commentは「何をしているか」より「なぜ必要か」を書く。
- Existing behaviorを維持するCompatibility codeには期限またはFollow-upを記載する。
- UI ComponentはPresentationとData mutationを分離する。
- Server action/Route handlerはAuth → Parse → Authorize → Execute → Respondの順を基本とする。
- DB transactionが必要な複数操作を分割しない。

---

## 18. PR・Commitルール

### 18.1 Commit

- Atomic commit。
- Build不能な中間Commitを極力避ける。
- Messageは変更目的を明確にする。
- Secret、debug dump、Screenshotの個人情報を含めない。

推奨Prefix:

```text
feat:
fix:
refactor:
test:
docs:
chore:
```

既存RepositoryのCommit規則が別途定義された場合はそちらを優先する。

### 18.2 PR本文

最低限次を含める。

- PR ID、Screen ID、Risk ID。
- Problem。
- Scope / Non-scope。
- Before / After。
- Protected invariants。
- API/DB contract change。
- Test result。
- Accessibility result。
- Security/Tenant result。
- ScreenshotまたはVideo。機密Dataなし。
- Rollback。
- Known limitations / Follow-up。

### 18.3 Merge前

- Base branchの最新へRebaseまたはUpdate。
- Conflict解消後に全必須Testを再実行。
- TODO、debug log、temporary flag、dead codeを確認。
- DocsとImplementationの不整合を確認。

---

## 19. Documentationルール

次の場合は文書更新を同一PRへ含める。

| Change | Update target |
|---|---|
| Screen追加・削除・Route変更 | `FUNCTION_SCREEN_LIST.md`、`DESIGN.md` |
| API contract変更 | System spec、Screen catalog、Contract type |
| Role/Permission変更 | System spec、Screen catalog、`AGENTS.md` |
| Token/Component規則変更 | `DESIGN.md` |
| PR順序・依存変更 | `PR_DESIGN.md` |
| Risk解消 | System specのRisk statusまたはDecision record |
| Environment/Deploy変更 | README/Runbook/PR notes |

Documentだけを更新してCode変更を隠さない。Codeだけを更新して仕様差異を放置しない。

---

## 20. 明示的な禁止事項

エージェントは次を行ってはならない。

- `main`へ直接Commit/Pushする。
- User確認なしにProduction deployする。
- Secretや実DataをCommitする。
- Auth/Tenant checkを削除・緩和する。
- UI非表示をServer認可の代用にする。
- Tax ruleを推測で修正する。
- `done` Taskを再生成で削除する。
- RatingとTrial balanceのUpload用途を混在させる。
- 他社RecordをIDだけで更新する。
- Public Blob URLを新規に一般UIへ露出する。
- Open redirectを許可する。
- Error detailへStack、Database URL、Provider response全文を出す。
- `any`、`ts-ignore`、Test skipで問題を隠す。
- Link内Buttonを実装する。
- Colorだけで状態を表現する。
- Desktop TableをMobileで単純縮小する。
- 未実装機能を操作可能に見せる。
- 大規模Formattingを機能PRへ混在させる。
- Test failureを無視して完成と報告する。

---

## 21. 作業完了時のAgent報告形式

最終報告は次の形式を使用する。

```markdown
## Summary
- 何を変更したか
- どのScreen / API / Riskを対象にしたか

## Changed files
- `path`: 変更理由

## Invariants checked
- Tenant isolation
- Task/history preservation
- Upload purpose separation
- Audit behavior

## Verification
- `pnpm lint`: PASS/FAIL
- `pnpm typecheck`: PASS/FAIL
- `pnpm test:tax-schedule`: PASS/FAIL/NOT APPLICABLE
- `pnpm build`: PASS/FAIL
- Additional tests: ...

## UI / Accessibility
- Viewports
- Dark/Light
- Keyboard
- Screen reader / axe

## Risks and limitations
- 残るRisk
- 未検証事項

## Follow-up
- 別PRで必要な項目
```

失敗したTestや未検証事項を省略してはならない。

---

## Appendix A. Directory responsibility map

| Path | Responsibility | 特記事項 |
|---|---|---|
| `src/app/(app)/*` | 業務画面 | Screen catalogと対応 |
| `src/app/api/*` | REST Route Handler | Auth、Zod、Error contract |
| `src/components/ui/*` | UI primitives | Design token、全State、a11y |
| `src/components/layout/*` | App Shell | Company context、navigation |
| `src/components/features/*` | Domain UI | Page固有ではなく再利用可能な単位 |
| `src/lib/auth/*` | Session、Tenant、RBAC | Security critical、並行変更注意 |
| `src/lib/tasks/*` | Tax/Labor/Reminder | Domain review、Golden test必須 |
| `src/lib/date/*` | Date-only、business day | JST統一の中心 |
| `src/lib/uploads/*` | Blob path、metadata | SSRF、Tenant、Purpose critical |
| `src/lib/mail/*` | Provider abstraction | Secret sanitization、Audit |
| `src/lib/ai/*` | AI provider | Disclosure、Version、Fallback |
| `src/lib/validators/*` | Zod contract | Clientと共有可能な型を検討 |
| `prisma/*` | Schema/Migration | Deploy order、Data compatibility |
| `scripts/*` | Build/Test/Seed | Production guard |

---

## Appendix B. Pre-merge checklist

### Scope

- [ ] PR設計に含まれる変更だけである。
- [ ] Screen ID / Risk IDを記載した。
- [ ] Unrelated refactorを除外した。

### Security / Tenant

- [ ] 有効SessionをServerで確認する。
- [ ] Active CompanyとMembershipを確認する。
- [ ] Cross-tenant negative testがある。
- [ ] Secret、PII、File URLを露出しない。

### Business

- [ ] Task historyを維持する。
- [ ] Upload purposeを維持する。
- [ ] Mail auditを維持する。
- [ ] Date/Money contractを維持する。
- [ ] Tax changeは承認とGolden testがある。

### UI

- [ ] `DESIGN.md`のTokenとComponentを使用する。
- [ ] Loading/Empty/Error/Forbiddenを扱う。
- [ ] Dark/Light、Responsiveを確認した。
- [ ] Long Japanese textを確認した。

### Accessibility

- [ ] Keyboard onlyで操作可能。
- [ ] Focus visible。
- [ ] Semantic elementを使用。
- [ ] Dialog focus return。
- [ ] StatusはText/Iconを伴う。

### Engineering

- [ ] Lint。
- [ ] Typecheck。
- [ ] Relevant unit/contract/E2E。
- [ ] Build。
- [ ] Docs更新。
- [ ] Rollback記載。

---

## Appendix C. 既知の高優先Risk

作業中に以下へ触れる場合は、通常UI PRではなくSecurity/Domain PRとして扱う。

| Risk ID | 内容 |
|---|---|
| `R-01` | 財務資料のPublic Blob URL |
| `R-02` | ManualのSession境界 |
| `R-03` | Tax対象期間の年/月ずれ |
| `R-04` | UTC/JSTの今日判定 |
| `R-07` | Public Debug API |
| `R-08` | Upload completeの任意URL |
| `R-09` | Login open redirect |
| `R-10` | Cron 200件上限 |
| `R-11` | 最後の管理者/Owner、自己削除保護 |
| `R-12` | API Error contract不一致 |
| `R-14` | 回帰Test不足 |

---

## Change Log

| Version | Date | 内容 |
|---|---|---|
| 1.0.0 | 2026-07-17 | AIエージェント開発向け初版 |
