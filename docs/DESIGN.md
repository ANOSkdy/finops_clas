# CLAS FinOps Design System / UI Specification

> **File:** `DESIGN.md`  
> **Product:** CLAS FinOps  
> **Repository:** `ANOSkdy/finops_clas`  
> **Reference branch:** `main`  
> **Reference commit:** `8d4300d844e30a0b37ec98843e9259ef24e758e7`  
> **Document status:** Proposed / implementation baseline  
> **Design direction:** Linear-inspired, dark-native, calm and precise  
> **Primary locale:** Japanese (`ja-JP`)  
> **Application time zone:** `Asia/Tokyo`

---

## 0. この文書の位置づけ

本書は、CLAS FinOpsの業務機能、API契約、認証・認可、テナント境界、税務・労務タスク生成、アップロード、メール送信、監査データを維持したまま、UIをLinear風の静かで精密なインターフェースへ刷新するための規範文書である。

本書は単なる見た目のガイドではない。次を一体として定義する。

- デザイン原則
- 情報設計とナビゲーション
- ダーク／ライトテーマのDesign Tokens
- コンポーネントの状態と使用規則
- 各画面の目標レイアウトと振る舞い
- キーボード操作とアクセシビリティ
- 業務ロジックを壊さないための実装境界
- 段階移行、テスト、受入条件

### 0.1 規範語

| 表記 | 意味 |
|---|---|
| **MUST** | 実装上必須。逸脱には設計レビューと記録が必要 |
| **SHOULD** | 原則として採用。採用しない場合は理由を記録 |
| **MAY** | 任意。機能・利用状況に応じて採用可能 |

### 0.2 参照すべき既存実装

特に次の既存実装を非破壊対象とする。

- `src/app/(app)/*` — 業務画面
- `src/components/ui/*` — 現行UIプリミティブ
- `src/components/layout/AppHeader.tsx` — 現行ナビゲーション
- `src/app/globals.css` — 現行トークンとモーション
- `src/lib/auth/*` — Session、Tenant、RBAC
- `src/lib/tasks/*` — 税務・労務タスク生成と状態計算
- `src/app/api/*` — API契約、認証、外部連携
- `prisma/schema.prisma` — データ構造と関連

---

## 1. Design Mission

### 1.1 プロダクトのデザイン命題

CLAS FinOpsは、装飾的な「金融ダッシュボード」ではなく、会社ごとの税務・労務・会計業務を正確に処理する**静かな業務コマンドセンター**として設計する。

利用者が感じるべきものは、華やかさではなく以下である。

1. **何をすべきかが即座に分かる。**
2. **どの会社を操作しているかを見失わない。**
3. **期限、状態、権限、保存結果に曖昧さがない。**
4. **反復操作が速く、キーボードでも完結できる。**
5. **危険な操作は静かだが明確に止められる。**
6. **AIの結果とシステム計算を過信させない。**

### 1.2 コア原則

#### 1. Ultra-minimal & precise

- UI要素は、業務判断または操作に寄与するものだけを表示する。
- 余白、整列、タイポグラフィ、行高によって構造を作る。
- 装飾的なカード、グラデーション、過剰な角丸、重い影を避ける。
- 1画面内で強い視覚アクセントを同時に複数競合させない。

#### 2. Calm interface

- 通常状態は低彩度・低コントラストの面で構成する。
- 赤、黄、緑は状態表現に限定する。
- アニメーションは短く、予測可能で、注意を奪わない。
- AI処理中も派手なグローや流体アニメーションを使用しない。

#### 3. Structure should be felt, not seen

- 太い境界線で区切るのではなく、背景階層、4pxグリッド、行間、見出し、薄いHairlineで関係性を示す。
- すべてをCardで囲わない。
- リスト、表、設定セクションは可能な限り同一Surface上で構成する。

#### 4. Speed & focus

- 主要操作は1〜2アクションで到達可能にする。
- 検索、絞り込み、会社切替、画面移動をキーボードから実行可能にする。
- Loading、保存中、同期中、失敗、完了を即時に示す。
- 二重送信と多重クリックを防ぐ。

#### 5. Trust before delight

- 日付、金額、会社、権限、送信先を曖昧にしない。
- 内部IDより、人間が理解できる名称を優先する。
- AIコメントは「文書内容を全文解析した結果」ではないことを常時表示する。
- 削除、メール送信、スケジュール再計算は、影響対象を明示する。

#### 6. Dark-native, theme-aware

- コンポーネントはDark themeを基準に設計・検証する。
- Light themeを同等品質で提供する。
- OS設定を初期値とし、アプリ内で明示的に切り替え可能にする。
- 印刷時は常にLight print themeを使用する。

#### 7. Accessible by default

- WCAG 2.2 AAを最低基準とする。
- 状態を色だけで表現しない。
- Keyboard、Screen reader、200% Zoom、Reduced motionを初期設計に含める。

---

## 2. Scope / Non-goals

### 2.1 本書の対象

- Login、会社選択、Home、Schedule、会計資料チェック
- Upload入口、財務格付け、試算表送付
- Company settings、Account settings、Password
- Global管理画面
- Manual
- 共通App shell、Navigation、Command palette、Theme
- すべてのLoading／Empty／Error／Permission state

### 2.2 現時点の非対象

以下は将来機能であり、本DESIGN.mdだけを根拠に追加実装してはならない。

- RFID／IoT
- 日報、工程管理
- 現場写真、図面、黒板、注釈
- Offline／PWA同期
- 会計ソフトや銀行APIの自動同期
- Board/Kanbanによるタスク状態変更
- TaskのDrag & Drop並び替え
- AIによる自動承認または自動送信

Board、Drag & Drop、Offline等を追加する場合は、別途業務仕様、権限、監査、競合解決を定義する。

---

## 3. Non-destructive Design Invariants

UI刷新では次を**MUST**で維持する。

1. UIからDBへ直接アクセスしない。
2. 認証・Membership・Active Companyの検証はServer/APIを正とする。
3. 画面上で操作を隠しても、認可の代替にはしない。
4. `Task.taskKey`、生成タスクの重複排除、完了済みタスク保持を壊さない。
5. `rating`用Uploadと`trial_balance`用Uploadを混在させない。
6. 他社のFile ID、Task ID、Checklist itemへアクセスできない。
7. 会計チェックの一意性 `companyId + itemId + fiscalYear + month` を維持する。
8. 試算表メールは送信前確認を行い、成功・失敗を問わず監査行を残す。
9. Ratingの既存結果再利用を変更する場合は、結果VersionとMigrationを設計する。
10. UIで扱う暦日と年度は `Asia/Tokyo` を正とする。
11. 金額は浮動小数点で扱わず、APIのBigInt文字列契約を維持する。
12. API契約変更には型更新、Contract test、Migration noteを伴わせる。
13. 内部IDを通常UIへ常時露出しない。ただし診断用途では権限付き詳細表示を提供できる。

### 3.1 UI刷新のリリースゲート

新UIが完成していても、次の条件を満たさない状態で全面公開してはならない。これらは視覚品質ではなく、利用者の信頼とデータ保護に直結する。

| Gate | 必須条件 | UI側の扱い |
|---|---|---|
| Storage | 財務資料のPublic Blobリスクを解消、または承認済み例外として期限付き記録 | Public URLを表示・共有するUIを作らない |
| Route auth | Manualを含む全App routeで有効SessionをServer検証 | 偽Cookie前提の見せかけ認証に依存しない |
| Redirect safety | Loginの`next`を内部Pathへ限定 | 外部URLへ遷移可能なUIを作らない |
| Date correctness | JSTの「今日」「年度」「期限」をServer基準で統一 | Client独自判定を削除 |
| Tax review | 税務期間計算のGolden testとDomain reviewが完了 | 見た目で正しさを演出しない |
| Upload trust | 認可済みBlobだけをUpload metadataとして登録 | 任意URL入力欄を提供しない |
| Debug exposure | ProductionでDebug APIを無効化 | 診断情報は権限付きSupport UIへ限定 |
| Cron scale | Reminderの200件上限とPaging漏れを解消 | 通知済みと誤表示しない |
| Destructive invariants | 最後の管理者／Owner、自己削除等のServer保護を定義 | Confirm dialogだけで安全を保証したとみなさない |
| Error contract | `error.code/message/details`を統一 | Status codeごとのPage独自分岐を減らす |

---

## 4. Users and Operating Context

| Persona | 主な目的 | デザイン上の要求 |
|---|---|---|
| 一般ユーザー | 期限確認、タスク完了、資料チェック、ファイル処理 | 操作の速さ、迷わない状態表現、誤操作防止 |
| 会計担当 | 月次資料管理、試算表送付、税務期限確認 | 高密度表、検索、Keyboard、保存状態、監査性 |
| 会社管理者 | 会社・税務設定、納期限設定 | 長大フォームの分割、未保存警告、再計算導線 |
| システム管理者 | User、Company、Membership管理 | 検索、Role説明、破壊確認、一覧性 |
| 閲覧のみ利用者 | 情報確認 | 編集不可理由の明示、DisabledだらけにしないRead-only表示 |

### 4.1 利用環境の前提

- デスクトップでの反復業務を最優先する。
- タブレット、スマートフォンでも主要操作を完了できる。
- モバイルでは高密度表をそのまま縮小しない。
- 通信断を前提としたOffline編集は現行対象外。
- 日本語の長い税務名称が折り返されても階層が崩れないこと。

---

## 5. Information Architecture

### 5.1 画面名称

内部Route名や実装名をそのままUI文言にしない。

| Route | UI表示名 | Group | 備考 |
|---|---|---|---|
| `/home` | ホーム | Overview | 期限と要対応事項 |
| `/schedule` | スケジュール | Work | 税務・労務タスク |
| `/accounting_checklist` | 会計資料チェック | Work | 年度×月の資料管理 |
| `/upload` | 書類 | Documents | 各書類フローの入口 |
| `/rating` | 財務格付け | Documents | `rating`をUIへ露出しない |
| `/trial_balance` | 試算表送付 | Documents | `trial_balance`をUIへ露出しない |
| `/manual` | マニュアル | Knowledge | 検索・目次・印刷 |
| `/company_edit` | 会社設定 | Settings | 基本、税務、納期限 |
| `/settings` | 個人設定 | Settings | Theme、Password、Logout |
| `/password` | パスワード変更 | Settings | Account security |
| `/system_manager` | システム管理 | Admin | Globalのみ |
| `/account` | アカウント管理 | Admin | Globalのみ |
| `/company_member` | 会社メンバー | Admin | Globalのみ |
| `/newcompany` | 会社登録 | Admin / Company | 現行権限を維持 |

### 5.2 Desktop navigation

```text
┌──────────────────────── Sidebar 248px ────────────────────────┐
│ CLAS FinOps                                      [collapse]   │
│ [会社名 / 法人種別 ▼]                                        │
│                                                               │
│ OVERVIEW                                                      │
│  ホーム                                                       │
│                                                               │
│ WORK                                                          │
│  スケジュール                                                 │
│  会計資料チェック                                             │
│                                                               │
│ DOCUMENTS                                                     │
│  書類                                                         │
│  ├ 財務格付け                                                 │
│  └ 試算表送付                                                 │
│                                                               │
│ KNOWLEDGE                                                     │
│  マニュアル                                                   │
│                                                               │
│ SETTINGS                                                      │
│  会社設定                                                     │
│  個人設定                                                     │
│                                                               │
│ ADMIN — globalのみ                                            │
│  システム管理                                                 │
│                                                               │
│ [avatar] 氏名                                 [⌘K]           │
└───────────────────────────────────────────────────────────────┘
```

#### Rules

- SidebarはDesktopで固定し、幅は`248px`を基準とする。
- Collapse時は`56px`のIcon railとする。
- Company SwitcherはSidebar上部に固定し、現在の会社名を常時表示する。
- Global管理は通常業務Navigationと明確に分離する。
- Active itemは強い塗りではなく、Accent-subtle背景、Accent text、必要に応じて2px indicatorで示す。
- Section labelは11px Uppercase相当の低コントラスト表示とする。ただし日本語ラベルを無理に英大文字化しない。

### 5.3 Top bar

DesktopのMain content上部に高さ`52px`のTop barを置く。

- 左: Breadcrumbまたは現在ページ名
- 中央: 必要な場合のみSearch／Filter summary
- 右: Command palette trigger、Theme、Help、User menu
- Company切替はTop barに重複配置しない。ただしSidebar非表示時はTop barへ移動する。

### 5.4 Mobile navigation

`< 768px`では以下を採用する。

- 上部: Company Switcher、ページTitle、Overflow menu
- 下部: Home / Schedule / Accounting / Documents / More の5項目
- MoreからManual、Company settings、Personal settings、Adminへ遷移
- Bottom navigationはsafe-areaを含めて`56px + env(safe-area-inset-bottom)`
- 入力中はOS Keyboardと競合しないようBottom navigationを一時的に隠してよい

### 5.5 Breadcrumb

- 深さ2以上の画面で使用する。
- 例: `書類 / 試算表送付`
- 例: `会社設定 / 税務スケジュール`
- 会社名をBreadcrumbへ入れない。会社は独立したGlobal contextである。

---

## 6. Layout System

### 6.1 Breakpoints

| Token | Width | 用途 |
|---|---:|---|
| `xs` | 360px | 小型Mobile確認 |
| `sm` | 640px | 大型Mobile |
| `md` | 768px | Tablet／Mobile nav切替 |
| `lg` | 1024px | Sidebar常設開始 |
| `xl` | 1280px | Data table最適幅 |
| `2xl` | 1536px | Wide desktop |

### 6.2 Main dimensions

| Element | Desktop | Tablet | Mobile |
|---|---:|---:|---:|
| Sidebar | 248px / collapsed 56px | Drawer 280px | More sheet |
| Top bar | 52px | 52px | 48px |
| Page padding | 24px | 20px | 16px |
| Section gap | 24px | 20px | 16px |
| Form max width | 720px | 100% | 100% |
| Readable text max width | 760px | 100% | 100% |
| Dense table row | 40px | 44px | 別レイアウトまたは48px |

### 6.3 Page Header

標準Page Headerは次の構造とする。

```text
[Title]                              [Secondary] [Primary Action]
Description / state summary
[optional tabs or filter bar]
```

- Titleは20〜24px、weight 600以下。
- Descriptionは13〜14px、Secondary text。
- 主要Actionは1つを原則とする。
- Actionが存在しない画面で空のButton領域を作らない。
- MobileではActionを本文末尾のSticky actionへ移動できる。

### 6.4 Grid and rhythm

- 4pxを基準単位とする。
- 主要間隔は8 / 12 / 16 / 24 / 32px。
- 同一関係は8〜12px、別Sectionは24〜32pxで分ける。
- 左端、数値桁、Status列、Action列を揃える。
- 税務名称など長文はTitle列を伸縮可能にし、StatusやDue dateは固定幅とする。

---

## 7. Design Tokens

### 7.1 Source of Truth

- Design Tokensの正本は`src/styles/tokens.css`とする。
- Themeは`src/styles/themes/dark.css`、`src/styles/themes/light.css`へ分けてもよい。
- Figma VariablesとCSS VariablesのToken名を可能な限り一致させる。
- 旧`tailwind.config.js`の`ink`、`panel`、`line`、`glass`等は新規実装で使用しない。
- 移行期間のみ旧変数を新TokenへAliasし、画面移行完了後に削除する。

### 7.2 Canonical CSS variables

```css
:root,
[data-theme="dark"] {
  color-scheme: dark;

  /* Base and surfaces */
  --ds-color-canvas: #08090a;
  --ds-color-sidebar: #0b0c0e;
  --ds-color-surface-1: #0f1012;
  --ds-color-surface-2: #141519;
  --ds-color-surface-3: #191b20;
  --ds-color-surface-hover: #1d1f25;
  --ds-color-surface-active: #25283a;
  --ds-color-overlay: rgba(0, 0, 0, 0.56);

  /* Text */
  --ds-color-text-primary: #f7f8f8;
  --ds-color-text-secondary: #c5cad3;
  --ds-color-text-tertiary: #8a8f98;
  --ds-color-text-disabled: #62666d;
  --ds-color-text-inverse: #ffffff;

  /* Hairlines */
  --ds-color-border-subtle: rgba(255, 255, 255, 0.06);
  --ds-color-border-default: rgba(255, 255, 255, 0.10);
  --ds-color-border-strong: rgba(255, 255, 255, 0.16);

  /* Accent */
  --ds-color-accent-solid: #5e6ad2;
  --ds-color-accent-solid-hover: #5360c6;
  --ds-color-accent-solid-active: #4b57b8;
  --ds-color-accent-text: #8b94f1;
  --ds-color-accent-subtle: rgba(94, 106, 210, 0.16);
  --ds-color-accent-border: rgba(139, 148, 241, 0.42);

  /* Semantic */
  --ds-color-success-text: #6dd58c;
  --ds-color-success-bg: rgba(39, 166, 68, 0.13);
  --ds-color-success-border: rgba(109, 213, 140, 0.32);

  --ds-color-warning-text: #f6c177;
  --ds-color-warning-bg: rgba(185, 121, 0, 0.14);
  --ds-color-warning-border: rgba(246, 193, 119, 0.34);

  --ds-color-danger-text: #ff7b72;
  --ds-color-danger-bg: rgba(248, 81, 73, 0.13);
  --ds-color-danger-border: rgba(255, 123, 114, 0.36);

  --ds-color-info-text: #74c0fc;
  --ds-color-info-bg: rgba(38, 139, 210, 0.13);
  --ds-color-info-border: rgba(116, 192, 252, 0.34);

  /* Focus */
  --ds-color-focus: #8b94f1;

  /* Shadows: use only for floating layers */
  --ds-shadow-popover: 0 8px 24px rgba(0, 0, 0, 0.34);
  --ds-shadow-dialog: 0 20px 60px rgba(0, 0, 0, 0.44);
}

[data-theme="light"] {
  color-scheme: light;

  --ds-color-canvas: #f7f8fa;
  --ds-color-sidebar: #f1f2f4;
  --ds-color-surface-1: #ffffff;
  --ds-color-surface-2: #f1f2f4;
  --ds-color-surface-3: #e8eaf0;
  --ds-color-surface-hover: #eceef2;
  --ds-color-surface-active: #e4e7ed;
  --ds-color-overlay: rgba(15, 16, 18, 0.40);

  --ds-color-text-primary: #17181a;
  --ds-color-text-secondary: #4f535a;
  --ds-color-text-tertiary: #62666d;
  --ds-color-text-disabled: #8f949d;
  --ds-color-text-inverse: #ffffff;

  --ds-color-border-subtle: rgba(23, 24, 26, 0.07);
  --ds-color-border-default: rgba(23, 24, 26, 0.12);
  --ds-color-border-strong: rgba(23, 24, 26, 0.20);

  --ds-color-accent-solid: #5e6ad2;
  --ds-color-accent-solid-hover: #5360c6;
  --ds-color-accent-solid-active: #4b57b8;
  --ds-color-accent-text: #4f5cc2;
  --ds-color-accent-subtle: rgba(94, 106, 210, 0.11);
  --ds-color-accent-border: rgba(79, 92, 194, 0.34);

  --ds-color-success-text: #1f7a3d;
  --ds-color-success-bg: rgba(31, 122, 61, 0.09);
  --ds-color-success-border: rgba(31, 122, 61, 0.26);

  --ds-color-warning-text: #8a5a00;
  --ds-color-warning-bg: rgba(138, 90, 0, 0.09);
  --ds-color-warning-border: rgba(138, 90, 0, 0.27);

  --ds-color-danger-text: #b42318;
  --ds-color-danger-bg: rgba(180, 35, 24, 0.08);
  --ds-color-danger-border: rgba(180, 35, 24, 0.27);

  --ds-color-info-text: #175cd3;
  --ds-color-info-bg: rgba(23, 92, 211, 0.08);
  --ds-color-info-border: rgba(23, 92, 211, 0.25);

  --ds-color-focus: #5965c9;
  --ds-shadow-popover: 0 8px 24px rgba(15, 16, 18, 0.14);
  --ds-shadow-dialog: 0 20px 60px rgba(15, 16, 18, 0.20);
}
```

### 7.3 Compatibility aliases

移行中は既存コンポーネントを壊さないよう、次のようなAliasを置く。新規コードはAlias名を使用しない。

```css
:root {
  --color-bg-primary: var(--ds-color-canvas);
  --color-bg-secondary: var(--ds-color-surface-2);
  --color-surface-normal: var(--ds-color-surface-1);
  --color-surface-primary: var(--ds-color-accent-solid);
  --color-surface-primary-hover: var(--ds-color-accent-solid-hover);
  --color-surface-quaternary: var(--ds-color-surface-2);
  --color-text-primary: var(--ds-color-text-primary);
  --color-text-secondary: var(--ds-color-text-secondary);
  --color-text-disabled: var(--ds-color-text-disabled);
  --color-text-invert: var(--ds-color-text-inverse);
  --color-border-default: var(--ds-color-border-default);
  --color-border-strong: var(--ds-color-border-strong);
  --color-border-focus: var(--ds-color-focus);
}
```

### 7.4 Color usage rules

| Token | 使用先 | 使用禁止 |
|---|---|---|
| Accent solid | Primary button、選択状態、Progress | 装飾的な大面積背景 |
| Accent text | Link、Active nav、Focus補助 | 長文本文全体 |
| Danger | 削除、送信失敗、期限切れ | 通常のPrimary action |
| Warning | 期限接近、未保存、要確認 | 成功状態 |
| Success | 保存完了、送信完了、Task完了 | 常時表示のブランド色 |
| Info | 補足、同期説明、AI注記 | Errorの代替 |

- Accent button上の文字は白とし、Normal stateでWCAG AAを満たす組み合わせを維持する。
- Hoverを単純に明るくしてコントラストを下げない。Solid buttonはHover時に少し暗くする。
- Disabled textは操作不能状態にのみ使い、重要情報をDisabled色で表示しない。

### 7.5 Typography

```css
:root {
  --ds-font-ui: Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif;
  --ds-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;

  --ds-text-11: 0.6875rem;
  --ds-text-12: 0.75rem;
  --ds-text-13: 0.8125rem;
  --ds-text-14: 0.875rem;
  --ds-text-16: 1rem;
  --ds-text-20: 1.25rem;
  --ds-text-24: 1.5rem;
  --ds-text-32: 2rem;

  --ds-leading-16: 1rem;
  --ds-leading-18: 1.125rem;
  --ds-leading-20: 1.25rem;
  --ds-leading-24: 1.5rem;
  --ds-leading-28: 1.75rem;
  --ds-leading-40: 2.5rem;
}
```

| Style | Size / line-height | Weight | 用途 |
|---|---|---:|---|
| Display | 32 / 40 | 600 | Login等の限定的なHero。通常画面では使用しない |
| Page title | 20–24 / 28–32 | 600 | ページタイトル |
| Section title | 14–16 / 20–24 | 600 | 設定Section、Table title |
| Body | 14 / 20 | 400 | 標準本文・List row |
| Body small | 13 / 18 | 400–500 | 補足、Table metadata |
| Caption | 12 / 16 | 400–500 | Label、Badge、日時 |
| Micro | 11 / 16 | 500 | Section label、Shortcut hint |
| Button | 13–14 / 20 | 500 | Button label |

#### Typography rules

- Weightは400、500、600のみを原則とする。
- 700以上を多用しない。
- Page titleは`letter-spacing: -0.01em`程度まで。日本語へ過度なnegative trackingを適用しない。
- 数値列、金額、日付、件数は`font-variant-numeric: tabular-nums`を使用する。
- 英数字の内部IDはMonoを使用できるが、通常画面では表示しない。

### 7.6 Spacing

```css
:root {
  --ds-space-0: 0;
  --ds-space-1: 2px;
  --ds-space-2: 4px;
  --ds-space-3: 6px;
  --ds-space-4: 8px;
  --ds-space-5: 12px;
  --ds-space-6: 16px;
  --ds-space-7: 20px;
  --ds-space-8: 24px;
  --ds-space-9: 32px;
  --ds-space-10: 40px;
  --ds-space-11: 48px;
  --ds-space-12: 64px;
}
```

### 7.7 Radius

```css
:root {
  --ds-radius-xs: 4px;
  --ds-radius-sm: 6px;
  --ds-radius-md: 8px;
  --ds-radius-lg: 10px;
  --ds-radius-xl: 12px;
  --ds-radius-pill: 9999px;
}
```

- Button、Input、Nav itemは6〜8px。
- Dialog、Popoverは10〜12px。
- 一般Cardへ16〜24pxの大きな角丸を使用しない。
- Status badgeのみPillを許可する。

### 7.8 Borders and elevation

- 通常の区切りは1px Borderまたはinset hairlineを使用する。
- 0.5px指定へ依存しない。高DPIでの見え方は色のAlphaで調整する。
- Page内Cardには原則Shadowを付けない。
- ShadowはDialog、Popover、Command palette、Dropdownに限定する。
- `glass`、Backdrop gradient、Glow、Neumorphismは禁止する。

### 7.9 Motion

```css
:root {
  --ds-duration-instant: 80ms;
  --ds-duration-fast: 120ms;
  --ds-duration-base: 180ms;
  --ds-duration-slow: 240ms;
  --ds-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ds-ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

- Hover: 80〜120ms
- Popover／Menu: 120〜180ms
- Dialog／Drawer: 180〜240ms
- Page transition: 原則なし。必要ならOpacity 120msまで。
- Bounce、Spring overshoot、連続Pulseを通常UIに使用しない。
- `prefers-reduced-motion: reduce`ではTransform animationを停止する。

### 7.10 Z-index

| Layer | Token value | Examples |
|---|---:|---|
| Base | 0 | Page content |
| Sticky content | 10 | Table header、Save bar |
| App header | 20 | Top bar |
| Dropdown / Tooltip | 40 | Menu、Tooltip |
| Popover / Command | 50 | Filter、Command palette |
| Overlay | 60 | Dialog overlay |
| Dialog / Drawer | 70 | Modal、Mobile sheet |
| Toast | 90 | Global feedback |

---

## 8. Content Design and Localization

### 8.1 日本語の基本方針

- 短く、具体的で、動詞から行動が分かる文言にする。
- 実装名や英語enumをUIへ露出しない。
- 「成功しました」だけでなく、何が成功したかを明示する。
- Errorは「何が起きたか」と「次にできること」を含める。

| Avoid | Use |
|---|---|
| `rating` | 財務格付け |
| `trial_balance` | 試算表送付 |
| `fileId` | アップロード済み書類／詳細情報 |
| `providerMessageId` | 送信詳細（管理者向け） |
| `Error 409` | 既に登録されています |
| `Forbidden` | この操作を行う権限がありません |

### 8.2 Action labels

- Primary actionは「保存」「送信」「作成」だけでなく対象を含める。
- 例: `税務設定を保存`、`スケジュールを再計算`、`試算表を送信`
- Dialog内の確定Actionは元画面と同じ動詞を使う。
- Cancelは`キャンセル`、Closeのみなら`閉じる`。

### 8.3 Date and time

- API: `YYYY-MM-DD`を維持。
- UI標準: `2026年7月17日（金）`
- Dense list: 当年なら`7月17日（金）`、年跨ぎなら`2027年1月20日（水）`
- 月Group: 必ず年を含めて`2026年7月`
- Date calculationはClient locale任せにせず、`Asia/Tokyo`固定Formatterを使用する。
- Relative dateは補助表示に限定する。例: `あと3日`の横に絶対日付を残す。

### 8.4 Money

- 入力・通信は整数円の文字列。
- 表示は`1,234,567円`を標準とする。
- 桁区切りは入力中にカーソルを壊さない方法で実装する。
- 不明値を`0円`に変換せず、`未設定`と表示する。

### 8.5 AI disclosure

財務格付け画面には次を常時表示する。

> この結果は、ファイル名・形式・サイズ等の限定的な情報を基にした簡易評価です。提出書類の内容を全文解析した財務判断ではありません。

- `AI` Badgeを表示する。
- AIコメントとシステム算定Scoreを視覚的に分ける。
- AI失敗時のFallbackを「AI生成済み」と誤認させない。
- Model名、Prompt、内部Metadataは通常利用者へ露出しない。管理者向け診断に限定する。

### 8.6 Internal identifiers

- File ID、Task UUID、Provider message IDは通常UIへ常時表示しない。
- Support用途では`詳細情報`Disclosure内に表示する。
- Copy actionには`コピーしました`Toastを返す。
- IDだけをError messageへ出さず、人間が識別できる名称も併記する。

---

## 9. Iconography

- 線画Iconを使用する。
- 推奨: Lucide相当の統一された16px／20px icon set。
- Stroke widthは1.5〜1.75px。
- Default sizeは16px、Navigationは18px、Empty stateは24pxまで。
- Unicode記号（`☰`、`✕`等）を新規コンポーネントで使用しない。
- Icon-only buttonには必ず`aria-label`とTooltipを付ける。
- Status iconはTextと併用する。

---

## 10. Core Components

すべてのInteractive componentは、少なくとも次の状態を定義する。

`default / hover / active / focus-visible / disabled / loading / error（該当時）`

### 10.1 Button

#### Variants

| Variant | 用途 | Visual |
|---|---|---|
| Primary | 画面・Dialogの主要Action | Accent solid、白文字 |
| Secondary | 補助Action | Surface-2、BorderなしまたはHairline |
| Outline | Contextual action | Transparent、Border default |
| Ghost | Toolbar、行Action | Transparent、HoverのみSurface |
| Danger | 破壊的確定 | Danger solidまたはDanger subtle |
| Link | 文中・Navigation | Accent text、下線はHover／Focus |

#### Rules

- 同一Action groupのPrimaryは原則1つ。
- Loading中は幅を変えない。Labelを残し、Spinnerを追加する。
- Disabledだけで理由を伝えない。必要ならTooltipまたは補足文を出す。
- LinkをButton内へ、ButtonをLink内へ入れ子にしない。
- Route遷移はAnchor/Link componentをButton styleで描画する。

#### Sizes

| Size | Height | Horizontal padding | Use |
|---|---:|---:|---|
| `sm` | 32px | 10px | Dense toolbar |
| `md` | 36px | 12px | Desktop default |
| `lg` | 40px | 16px | Primary forms |
| `touch` | 48px | 16px | Mobile |

### 10.2 IconButton

- 32 / 36 / 44px。
- Visible labelがない場合は`aria-label`必須。
- Danger actionは常時赤くせず、Hoverまたは確認DialogでDangerを強調する。
- Close、More、Filter、Copy、Theme等に使用する。

### 10.3 TextField / Select / Textarea

現行Floating labelは段階的に廃止し、**静的Label + Control + Hint/Error**を標準とする。

```text
Label                 必須
[ Control                         ]
Hint or error
```

#### Rules

- LabelはControl上部、12〜13px、weight 500。
- Requiredは`必須`の短いText badge、またはLabel横の明示文字とする。
- PlaceholderをLabel代わりにしない。
- Error時はBorder + Icon + Messageを併用する。
- ValidationはBlurおよびSubmit時。入力中に過度なError点滅をさせない。
- Server errorをFieldへ関連付け、Error summaryからFocus移動可能にする。
- Number inputでも金融金額へ`type=number`を安易に使わない。文字列として検証する。

### 10.4 Checkbox / Radio / Switch

- Checkboxは会計資料チェックや複数選択に使用する。
- Switchは即時反映されるBoolean設定だけに使う。
- `有効／無効`のように結果が分かりにくい場合はLabelを併記する。
- Table checkboxのHit areaは最低32px、Touchでは44px以上。
- Optimistic update中は対象セルだけをBusyにし、Table全体をロックしない。

### 10.5 SidebarNavItem

- Height: 32px desktop、44px touch。
- Icon 16〜18px、Label 13px。
- Active: Accent-subtle背景 + Accent text。
- Hover: Surface-hover。
- Focus-visible: 2px ring。
- Count badgeを付ける場合は最大3桁表示、超過は`999+`。

### 10.6 CompanySwitcher

CompanyはCLAS FinOpsの最重要Contextである。

#### Display

- 会社名
- 法人／個人事業主
- Dropdown chevron
- 任意でAvatar代替の2文字Monogram

#### Interaction

- Clickまたは`⌘⇧K` / `Ctrl+Shift+K`で開く。
- Searchable list。
- Arrow keyで移動、Enterで選択、Escapeで閉じる。
- 選択完了後、現在画面が新会社Contextで安全に再取得される。
- 切替中はMain dataを旧会社のまま操作できないようMutationを一時停止する。
- 会社名を省略表示する場合もTooltipまたはAccessible nameへ完全名を保持する。

### 10.7 PageHeader

Props concept:

```ts
type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  meta?: React.ReactNode;
};
```

- Action群は右揃え。
- Mobileでは縦積み。
- TitleとActionの間でLayout shiftを起こさない。

### 10.8 DataList / DataTable

#### List row

- Desktop標準40px、Touch 48px。
- HoverでSurface-hover。
- SelectedでAccent-subtle。
- 行全体をClickableにする場合も、内部ButtonのEvent境界を明確にする。
- Status、Date、Action列の位置を全行で揃える。
- 行HoverだけにActionを隠しすぎない。Keyboard focus時にも表示する。

#### Table

- Header height 36〜40px。
- HeaderとFirst columnのStickyを許可。
- Column resize、sort、filterは必要な画面だけ。
- 画面幅を超える場合、重要列を固定し、低優先列を折りたたむ。
- MobileではTableを縮小せず、別のCard/List representationへ切り替える。
- PaginationまたはVirtualizationは実データ量計測後に導入する。

### 10.9 StatusBadge

BadgeはIcon + Text + Semantic colorで構成する。

#### Task

| Value | Label | Tone | Icon intent |
|---|---|---|---|
| `pending` | 未完了 | neutral / info | Circle |
| `overdue` | 期限切れ | danger | Alert circle |
| `done` | 完了 | success | Check circle |

#### Email

| Value | Label | Tone |
|---|---|---|
| `queued` | 送信待ち | neutral |
| `sent` | 送信済み | success |
| `failed` | 送信失敗 | danger |

#### Upload / Rating

| State | Label | Tone |
|---|---|---|
| uploading | アップロード中 | info |
| uploaded | アップロード済み | neutral |
| finalizing | 評価中 | info |
| done | 完了 | success |
| error | 失敗 | danger |

- BadgeのColorだけで意味を伝えない。
- `C`や`A`等のGradeはStatus colorと混同しない中立表示とする。

### 10.10 Alert / Banner

| Tone | Use |
|---|---|
| Info | 説明、AI注記、同期条件 |
| Success | 保存・送信完了後の持続的情報が必要な場合 |
| Warning | 未保存、期限接近、再計算必要 |
| Danger | 期限切れ、送信失敗、権限・Security問題 |

- BannerはPage幅いっぱいに多用しない。
- 閉じると業務上重要な警告が失われる場合、Dismiss不可とする。
- Homeの期限情報はすべてWarningにせずSeverityを分ける。

### 10.11 Tabs / Segmented Control / Filter Chip

- Tabsは同一情報階層の切替に使用する。
- Segmented controlは2〜3のView切替に限定する。
- Filter chipは現在適用中の条件を示し、個別解除可能にする。
- Filter countと`すべて解除`を提供する。
- URL Queryへ状態を反映し、Reload／共有で再現可能にすることを推奨する。

### 10.12 Dialog

- Radix Dialogを継続利用する。
- Width: 400〜560px。内容が長い場合はPageへ遷移する。
- OverlayはDark 56%、Light 40%程度。
- Dialog title、description、Close、Footer actionを標準化する。
- Open時に適切な初期Focus、Close後にTriggerへFocus return。
- Escapeで閉じる。ただし送信中など中断不可能な処理では明示的に制御する。

### 10.13 DestructiveConfirmDialog

ユーザー削除、Membership削除等に使用する。

MUST表示:

- 対象名
- 影響範囲
- 取り消し可否
- 実行できない条件
- Danger action

高影響操作では対象名の再入力を求める。単なる`本当によいですか？`は禁止する。

### 10.14 Drawer / Sheet

- Tablet navigation、Mobile More、Filterに使用する。
- Desktopの主要NavigationをDrawerだけに隠さない。
- 左Navigation Drawerと右Detail Sheetの用途を混同しない。
- Focus trap、Escape、Overlay click、Scroll lockをRadixへ委ねる。

### 10.15 Command Palette

Shortcut: `⌘K` / `Ctrl+K`

#### Groups

1. Navigate
2. Switch company
3. Search tasks / manual
4. Create or open workflow
5. Theme / Preferences
6. Help / Keyboard shortcuts

#### Rules

- 検索Inputへ初期Focus。
- Arrow、Enter、Escapeに対応。
- 最近使用したActionを上位表示できる。
- 破壊操作を即時実行しない。対象Pageまたは確認Dialogを開く。
- Roleで許可されないActionは検索結果へ表示しない。

### 10.16 Tooltip / Popover

- TooltipはIcon意味、Shortcut、Disabled理由の補助に使用する。
- 重要情報をTooltipだけに置かない。
- HoverだけでなくKeyboard focusで表示する。
- PopoverはFilter、Company switch、Date picker等のInteractive contentに使用する。

### 10.17 Toast

- Success: 4秒
- Info: 4〜5秒
- Error: 7秒または手動Dismiss
- 最大3件を推奨。現行5件から減らす。
- `aria-live=polite`、Errorは`role=alert`。
- Form validationの主表示としてToastを使用しない。
- 操作対象と次のActionがある場合、ToastへUndoまたは`詳細`を付けられる。

### 10.18 Loading / Progress / Skeleton

- 300ms未満で完了する処理ではSkeletonを出さず、必要ならButton内Spinnerのみ。
- Initial page loadは実レイアウトに近いSkeleton。
- UploadはFile単位のProgressを表示する。
- AI評価はStage textを表示する。
- 読み込み中に既存データを消す必要がない場合、Stale dataを残してRefreshing表示にする。

### 10.19 EmptyState

構成:

- 16〜24px Icon
- 短いTitle
- 1文の説明
- 必要な場合のみPrimary action

例:

- `タスクはありません` / `現在の条件に一致するタスクはありません。`
- `会社が登録されていません` / `会社を登録するとスケジュール管理を開始できます。`

### 10.20 ErrorState / ApiErrorPresenter

共通Error codeを一箇所で解釈する。

| Status / Code | UI behavior |
|---|---|
| 401 / UNAUTHORIZED | 安全なLocal `next`を付けてLoginへ |
| 403 / FORBIDDEN | Access denied、必要なRoleを説明 |
| 404 / Active Companyなし | Company selectionへ誘導 |
| 404 / Entityなし | Inline not found |
| 409 / CONFLICT | 重複・関連データを具体表示 |
| 429 / RATE_LIMITED | 再試行可能時刻を表示 |
| 5xx / INTERNAL | Retry、Support details |
| STORAGE_ERROR | FileとStorage設定を確認 |
| MAIL_ERROR | 監査保存有無を明示 |
| AI_ERROR | Fallback／再試行可否を明示 |

### 10.21 FileDropzone / UploadItem

- ClickとDrag & Dropの両方を提供する。
- Accept形式、最大サイズ、現在の会社、用途を事前表示する。
- File選択直後に形式・サイズをClient検証する。
- Upload中はProgress、Cancel可能性、Retryを表示する。
- Public URLを通常利用者へ表示しない。
- Upload完了後はFile name、size、type、statusを表示する。
- Internal File IDはDetails disclosureへ格納する。

### 10.22 FormSection / StickySaveBar

長大なCompany settingsで使用する。

- SectionごとにTitle、Description、Fields、Section actionを持つ。
- 保存単位を跨いで1つの巨大なSave buttonを置かない。
- 変更があるSectionだけ`未保存`を表示する。
- Page離脱時に未保存警告を出す。
- 保存成功後、`保存済み`と更新時刻を一時表示する。
- 税務設定変更後は`スケジュールの再計算が必要です`Bannerを表示する。

### 10.23 DateDisplay / MoneyDisplay

- `DateDisplay`はAsia/Tokyo固定、absolute dateを必ず保持。
- `MoneyDisplay`は整数円、tabular nums。
- UI内で`new Date("YYYY-MM-DD")`の環境依存解釈へ直接依存しない。

### 10.24 PermissionGate

- UI表示制御用であり、Server認可の代替ではない。
- 編集不可の場合、Formを大量のDisabled controlとして見せるよりRead-only summaryへ切り替える。
- `閲覧のみ`Badgeと、必要Roleを説明する。

### 10.25 Avatar / Identity

現行`User`モデルにはAvatar画像がないため、初期実装では画像Uploadを追加せず、氏名から生成したMonogramを使用する。

- Shape: Circle
- Size: 20 / 24 / 28 / 32px
- Background: 低彩度の決定的Color。User IDまたは氏名Hashから安定生成する。
- Text: 1〜2文字。日本語氏名では先頭1文字または姓・名の頭文字を使用する。
- Accessible name: 完全な氏名を保持する。
- Group表示: 最大3件までOverlapし、残りは`+N`。
- Company MonogramとUser Avatarを同じ意味で混用しない。
- 将来Avatar画像を導入する場合は、Storage、削除、Fallback、個人情報の扱いを別途定義する。

---

## 11. Interaction and Keyboard

### 11.1 Global shortcuts

入力欄、Textarea、ContentEditableにFocus中は、明示されたShortcut以外を発火しない。

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘⇧K` / `Ctrl+Shift+K` | Company switcher |
| `/` | 現在画面のSearchへFocus |
| `g` → `h` | Home |
| `g` → `s` | Schedule |
| `g` → `a` | Accounting |
| `g` → `d` | Documents |
| `g` → `m` | Manual |
| `j` / `k` | List row移動 |
| `Enter` | 選択行を開く／Actionを実行 |
| `Space` | Checkbox／selected task toggle。文脈を限定 |
| `Esc` | Menu、Dialog、Selectionを閉じる |
| `Shift+?` | Shortcut help |

### 11.2 High-risk actions

- 削除、Email送信、Membership解除はShortcut一発で確定しない。
- Shortcutは確認Dialogを開くところまで。
- Dialogの確定はFocus移動と明示Buttonで行う。
- `Cmd+Enter`送信を導入する場合も確認Dialog内だけに限定する。

### 11.3 Focus

- Focus ringは2px相当で常時視認可能にする。
- Mouse click時に不要なRingを出さず、`focus-visible`を使用する。
- Row selectionとKeyboard focusを同じ見た目にしない。
- Dialog close後はTriggerへ戻す。
- Navigation後はPage titleまたはMainへFocusを移す。

### 11.4 Motion feedback

- Hoverは背景またはBorderの微変化だけ。
- Activeは1px程度の移動を原則使用しない。密なTableで揺れを生むため。
- Save successでCheck iconを短時間表示してよい。
- AI生成中は静かなProgress lineとStage textを使用する。

### 11.5 Drag & Drop

現行要件ではFile uploadにのみ使用する。

- Task、Checklist、Memberの並び替えには導入しない。
- Drop targetはKeyboard alternativeを必ず持つ。
- Drag中もAccept形式と対象会社を表示する。

---

## 12. System State Model

### 12.1 Page data state

すべてのData pageは次の状態を持つ。

```ts
type PageState =
  | "initial"
  | "loading"
  | "ready"
  | "refreshing"
  | "empty"
  | "needsLogin"
  | "needsCompany"
  | "forbidden"
  | "error";
```

- `loading`と`refreshing`を分ける。
- `refreshing`時は可能なら既存データを保持する。
- `needsCompany`は通常ErrorではなくContext selection stateとして扱う。
- `forbidden`は必要Roleと戻り先を示す。

### 12.2 Mutation state

```ts
type MutationState = "idle" | "submitting" | "success" | "error";
```

- Button単位またはRow単位に保持する。
- unrelated actionsを全面ロックしない。
- Double submitを防ぐ。
- 失敗時に入力値を失わない。

### 12.3 Task status

- DBの`pending|done|overdue`と表示計算の差異をUIで再実装しない。
- Overdue判定はServer／共有Formatterを正とする。
- `期限切れから未完へ戻す`操作直後も、Due dateが過去なら表示は期限切れのままとする。

### 12.4 Unsaved state

- Company settingsはSection単位でDirty stateを持つ。
- Dirty時はNavigation attemptをInterceptし、保存／破棄／継続を選択させる。
- Browser close時の`beforeunload`は補助として使用する。

---

## 13. Screen Specifications

### 13.1 Login

#### Goal

認証情報を迷いなく入力し、最小の認知負荷で会社選択へ進む。

#### Layout

- App shellを使用しない。
- 画面中央、最大幅400px。
- Product mark、Title、Form、Error、Submitのみ。
- 背景に装飾的GradientやIllustrationを置かない。

#### Interaction

- EnterでSubmit。
- Busy時はButton内Spinner。
- ErrorはForm上部と該当Fieldへ表示。
- Password visibility toggleをIcon buttonで提供してよい。
- `next`は安全な内部Pathだけを許可する。

### 13.2 Company Selection

#### Goal

操作対象会社を明確に選択する。

#### Layout

- Search field
- Recent／All companies list
- Company name、法人種別、代表者、連絡先の必要最小限
- `会社を登録`Action

#### Keyboard

- Search後、Arrowで行移動、Enterで選択。
- 選択中は全行をロックせず、対象行へSpinner。

#### Empty

- Companyなしの場合は会社登録への明確なCTA。
- Role上登録不可になる将来仕様では、管理者への依頼文を表示する。

### 13.3 Home

#### Goal

今日の対応優先度を10秒以内に判断できる。

#### Structure

1. Page header
2. Status summary strip
3. 要対応Task list
4. 補助情報

#### Summary

| Summary | Tone | Action |
|---|---|---|
| 期限切れ | Danger | Scheduleを期限切れFilterで開く |
| 本日期限 | Warning | 本日期限を開く |
| 7日以内 | Info | 近日Taskを開く |
| 30日以内 | Neutral | 全体確認 |

- Alertごとに大Cardを並べず、1つのSummary stripまたはcompact cellsにする。
- 件数はtabular nums。
- 0件はSuccess色で過剰に祝福せず、静かなNeutral表示とする。

### 13.4 Schedule

#### Goal

生成済み税務・労務Taskを検索、確認、完了処理する。

#### Desktop layout

```text
[スケジュール]                       [スケジュールを再計算]
[Search] [期間: 今後3か月] [状態] [分類] [Filter clear]

2026年7月
○  源泉所得税・復興特別所得税 ...   税務   7月10日   期限切れ  [...]
✓  算定基礎届                         労務   7月10日   完了      [...]
```

#### Columns

- Completion control
- Title
- Category
- Due date
- Optional period
- Status
- Row menu

#### Rules

- Month headerは必ず`YYYY年M月`。
- Default filterは現行どおり今後3か月を維持する。
- `表示を増やす`ではなく、Filter chipとして期間を表現する。
- Task refreshは`スケジュールを再計算`と表示する。
- 再計算中は進捗と完了件数を表示できる設計にする。
- 完了済みTaskが削除されないことを説明する必要がある場合、Confirm dialogへ記載する。
- Search、Category、Status、Date rangeをURL Queryへ反映する。

#### Row action

- Primary inline actionはCheckbox／Status toggle。
- Row menuへ詳細、未完了へ戻す等を置ける。
- 過去期限のTaskを未完了へ戻した場合、Statusは`期限切れ`。

### 13.5 Accounting Checklist

#### Goal

年度ごとの会計資料受領状況を月単位で高速更新する。

#### Desktop

- 年度Switcher
- Search／Item filter
- Add item action
- Sticky header
- Sticky first column
- 4月〜翌3月
- 現在月ColumnをSubtle highlight

#### Cell

- Checkbox
- Saving indicator
- Error retry
- Accessible label: `{項目名} {月}月`

#### Mobile

Tableを縮小しない。

```text
[年度 2026] [月 7月]

領収書                 [完了]
通帳                   [未完了]
売上資料               [完了]
```

- 月Selectorで1か月ずつ表示。
- 項目名を左、Status toggleを右。
- 年度と月をURLまたはlocal stateに保持する。

#### Add item

- Compact dialogまたはPopover。
- 重複ErrorをFieldへ表示。
- 項目削除は現行API未実装のため、UIだけ追加しない。

### 13.6 Documents Hub

#### Goal

書類関連の2フローを、内部用途名を見せず選択できる。

#### Layout

- `財務格付け`
- `試算表送付`

大きなMarketing cardではなく、Description付きList itemまたは2-column compact panelにする。

- 財務格付け: `決算書等をアップロードし、簡易スコアとAIコメントを確認します。`
- 試算表送付: `試算表をアップロードし、確認後にメール送信します。`

### 13.7 Financial Rating

#### Goal

書類を安全に登録し、簡易評価の限界を理解した上で結果を確認する。

#### Flow

1. File selection
2. Confirmation
3. Upload
4. Rating
5. Result

#### Layout

- 上部にAI disclosure Banner
- FileDropzone
- 選択File summary
- `評価を実行`Action
- Result section

#### Result

- Grade、ScoreはCompact metric。
- Scoreを信用度の高い金融指標のように巨大表示しない。
- `算定方法`Disclosureで、ファイル名・MIME・サイズを使用した簡易算定であることを説明する。
- AI commentは独立したAI panel。
- HighlightsはListで表示し、Cardを多重にしない。
- Internal File IDはDiagnosticsに格納する。

#### Failure

- Upload失敗とAI失敗を区別する。
- AI失敗時に一般的Fallbackを表示した場合、`一般的な改善例`と明記する。

### 13.8 Trial Balance Send

#### Goal

試算表をアップロードし、宛先・件名・本文・添付を確認して送信する。

#### Desktop layout

- 左: File upload／File summary
- 右: Email compose
- 下または右下: Send action

`< 1100px`では縦積み。

#### Rules

- 宛先、件名、本文は静的Label form。
- 添付はFile nameで表示し、File IDを通常表示しない。
- Send前Dialogで次を表示する。
  - 宛先
  - 件名
  - 添付File name
  - 送信元またはReply-toの補足
- `MAIL_PROVIDER=disabled`等の実装設定名を一般利用者へ出さない。
- 送信失敗でも監査行が保存されたかを明示する。
- Provider message IDは管理者向け送信詳細へ移す。

### 13.9 Company Settings

#### Goal

会社基本情報、税務設定、自治体別納期限を、保存単位を理解しながら編集する。

#### Sub-navigation

- 基本情報
- 税務設定
- 自治体別納期限
- 将来: 通知

Desktopは左のLocal nav、MobileはTabsまたはSelect。

#### Basic information

- 法人種別はRead-only summary。
- 個人事業主の決算月12固定をField近傍で説明。
- 法人番号は13桁のInline validation。
- Section単位保存。

#### Tax settings

- 金額Fieldは整数円。
- 課税事業者`いいえ`の場合、理由Fieldを非表示またはRead-onlyにする。
- 変更保存後にSchedule再計算Bannerを表示する。

#### Recurring due dates

- 一覧はTitle、Tax type、期別、月日、Enabled、Action。
- Add formはDialogへ分離。
- DeleteはConfirm dialog。
- 無効化はSwitchまたはStatus action。
- 存在しない日付を即時検証する。

#### Read-only

権限不足時はForm controlを大量にDisabled表示せず、値をRead-only Description listで示す。

### 13.10 Personal Settings / Password

- Theme: System / Dark / Light
- Password
- Logout
- 将来の通知設定領域を確保してよいが、未実装項目を操作可能に見せない。
- LogoutはConfirm dialogを維持する。
- Passwordは現在、新規、確認。8文字以上。
- 保存後にFormをClearし、成功Feedbackを表示する。

### 13.11 Global Administration

#### Goal

大量データでもUser、Company、Membershipを安全に管理する。

#### Common pattern

- Search
- Role filter
- Company filter
- Sort
- Result count
- Data table
- Create action

#### Account management

- Create formはDialogまたはSide sheetへ分離できる。
- Roleごとに短い説明を表示する。
- Passwordは8文字以上をリアルタイム表示。
- DeleteはDestructive confirm。
- Upload／Email関連データがある場合は削除不可理由を人間向けに示す。

#### Membership management

- Company、User、Company roleを検索可能Selectにする。
- 重複登録はField error。
- 削除時にCompanyとUser名を確認する。
- 最後のOwner／Admin保護をServer仕様化するまで、UIで安全を保証したと表現しない。

### 13.12 Manual

#### Goal

業務中に必要な情報を検索し、構造化されたMarkdownとして読む。

#### List

- Search
- Updated date
- Category／Tagは将来拡張
- Keyboard navigation

#### Detail

- Markdownを安全にRenderする。
- HeadingからTable of contentsを生成する。
- Code、Table、Link、Listを正しく表示する。
- 読みやすい最大幅760px。
- Print action。
- 更新日を表示する。

#### Security

Manualも有効SessionをServerで検証する。Cookie存在だけに依存しない。

---

## 14. Responsive Behavior

### 14.1 General

- 320px幅でHorizontal overflowを発生させない。ただしData tableの意図的Scroll containerは除く。
- 200% ZoomでActionが欠落しない。
- Touch targetは最低44×44px。
- DesktopのHover-only操作にはMobile alternativeを用意する。

### 14.2 Pattern conversion

| Desktop | Mobile |
|---|---|
| Fixed sidebar | Bottom nav + More sheet |
| Multi-column toolbar | Search row + Filter sheet |
| Wide data table | Priority columns + detail sheet / card list |
| Two-column upload/compose | Sequential vertical flow |
| Local settings nav | Tabs / Select |
| Inline row actions | Overflow menu |
| Sticky save bar right | Full-width bottom save bar |

### 14.3 Accounting exception

Accounting matrixのみ、DesktopではHorizontal scrollを許可する。Mobileでは月単位Listへ必ず切り替える。

---

## 15. Accessibility

### 15.1 Standard

- WCAG 2.2 AA以上。
- Normal text 4.5:1、Large text 3:1、UI component 3:1を目標とする。
- Status、Priority、ErrorをColorだけで示さない。
- Focus ringを削除しない。

### 15.2 Semantic structure

- ページごとに1つの`h1`。
- Sectionは`h2`／`h3`で論理構造を保つ。
- NavigationにAccessible label。
- Table headerは`scope`またはHeader associationを正しく設定。
- DialogにTitle／Description。
- Form controlにProgrammatic label。

### 15.3 Keyboard

- すべてのInteractive elementへTabで到達可能。
- Custom list navigationを提供する場合もTab orderを壊さない。
- Row clickだけに依存せず、明示的Actionを提供する。
- Drag & DropにはButton／File picker alternativeを用意する。

### 15.4 Announcements

- Toast: `aria-live=polite`。
- Error: `role=alert`。
- Upload progress: `aria-live=polite`、過度な更新頻度を避ける。
- Checklist保存中はCheckboxのAccessible descriptionへ状態を付ける。

### 15.5 Motion and contrast

- Reduced motionでDrawer、Dialog、Page animationを停止またはOpacityのみへ。
- Forced colors／High contrast modeでBorderとFocusが消えないこと。
- Theme両方でSemantic colorを検証する。

---

## 16. Theme and Print

### 16.1 Theme selection

初期値:

1. 保存済みUser preference
2. OS `prefers-color-scheme`
3. Dark

Theme変更は即時反映し、Reload後も維持する。

### 16.2 Dark-native rule

- Dark themeを先に設計し、その後Lightへ反転するのではなく、両ThemeのSurface階層とText contrastを個別検証する。
- Darkで純黒の大面積は避け、Canvas `#08090a`を使用する。
- White textを全要素へ使わず、Secondary／Tertiary textを使い分ける。

### 16.3 Print

Manual、Accounting checklist、必要なSchedule一覧はPrint styleを持つ。

- White background、Black text
- Navigation、Button、Toast、Command paletteを非表示
- URLや内部IDを自動表示しない
- Table headerを各PageでRepeat
- Page breakをSection単位で制御

---

## 17. Implementation Architecture

### 17.1 Recommended directories

```text
src/
  styles/
    tokens.css
    themes/
      dark.css
      light.css
    utilities.css
  components/
    ui/
      Button.tsx
      IconButton.tsx
      TextField.tsx
      Select.tsx
      Checkbox.tsx
      Badge.tsx
      Dialog.tsx
      Popover.tsx
      Tooltip.tsx
      Toast.tsx
      Skeleton.tsx
    patterns/
      AppShell.tsx
      Sidebar.tsx
      CompanySwitcher.tsx
      PageHeader.tsx
      FilterBar.tsx
      DataTable.tsx
      EmptyState.tsx
      ErrorState.tsx
      FormSection.tsx
      StickySaveBar.tsx
      FileDropzone.tsx
      CommandPalette.tsx
  features/
    schedule/
    accounting/
    documents/
    company-settings/
    admin/
  lib/
    api/
      client.ts
      errors.ts
      contracts.ts
    date/
      display.ts
    money/
      display.ts
```

### 17.2 Component boundaries

- `ui`: 業務を知らないPrimitive。
- `patterns`: 複数Primitiveを組み合わせた汎用Pattern。
- `features`: 業務用語、API、Role、Stateを知る。
- PageはCompositionとRoutingを担当し、巨大な単一Client componentにしない。

### 17.3 API client

- `fetch`を各Pageへ散在させない。
- `credentials: include`、JSON parse、Error parseを共通化する。
- Error responseは`error.code/message/details`を正とする。
- 401／403／Active Companyなしを共通処理する。
- MutationごとにDouble submit防止を持つ。

### 17.4 Date and money

- Display formatterを共有する。
- UIが独自にFiscal yearやOverdueを算定しない。
- Date-onlyとDateTimeを型で区別する。
- MoneyはString contractを維持する。

### 17.5 Permission

- Page load時にRoleを取得してAction表示を調整できる。
- Server action／Route handlerは必ず再認可する。
- Permission checkを複数Pageへ複製せず、共有Policyとする。

### 17.6 Avoid new dependencies by default

- Icon、Variant utility、Table、Command paletteのためにLibrary追加が必要な場合、Bundle size、Accessibility、Maintenanceをレビューする。
- Radix Dialogは継続利用する。
- Storybook等の開発依存追加はPhase 2で承認する。

---

## 18. Migration Plan

### Phase 0 — Baseline

- 現行主要画面のScreenshot baselineを保存。
- Auth、Tenant、Task、Upload、MailのContract testを用意。
- 主要Keyboard flowを記録。
- 現行UIのColor、Spacing、Component使用箇所を棚卸し。

### Phase 1 — Token unification

- `tokens.css`を追加。
- 既存`--color-*`を新TokenへAlias。
- 旧`ink/panel/line/glass/button`参照を撤去。
- Dark／LightのVisual regressionを追加。
- 業務画面の構造は変更しない。

### Phase 2 — Primitives and App Shell

- Button、Field、Badge、Dialog、Toastを統一。
- AppShell、Desktop Sidebar、CompanySwitcher、Mobile navを実装。
- Link/Button入れ子を全廃。
- Command paletteのNavigation機能を実装。

### Phase 3 — Read-heavy screens

1. Home
2. Schedule
3. Accounting checklist
4. Manual

Read-heavy画面から導入し、Visual／Keyboard／Performanceを検証する。

### Phase 4 — Transactional screens

1. Company selection／registration
2. Company settings
3. Financial rating
4. Trial balance send
5. Password

未保存、Upload、Confirmation、Error recoveryを重点確認する。

### Phase 5 — Global admin

- Account management
- Membership management
- Destructive invariant
- Search／Filter／Pagination

### Phase 6 — Rollout

- Route単位またはFeature flagで段階切替。
- Role別UAT。
- Error rate、API latency、Task completion、Upload／Mail成功率を比較。
- Rollback期間中は旧UIを維持する。

---

## 19. Testing Strategy

### 19.1 Component states

各Componentで次をTest fixture化する。

- Default
- Hover
- Focus-visible
- Disabled
- Loading
- Error
- Long Japanese text
- Dark／Light
- 200% Zoom
- Reduced motion

### 19.2 Visual regression routes

最低限:

- `/login`
- `/selectcompany`
- `/home`
- `/schedule`
- `/accounting_checklist`
- `/rating`
- `/trial_balance`
- `/company_edit`
- `/account`
- `/company_member`
- `/manual/[slug]`

各RouteでDesktop 1440、Tablet 1024、Mobile 390を保存する。

### 19.3 E2E critical paths

1. Login → Company select → Home
2. Company switch → 全画面のContext更新
3. Schedule refresh → 重複なし → Task complete
4. Checklist optimistic update → success／rollback
5. Rating upload → finalize → cached result
6. Trial balance upload → confirm → send success／failure
7. Company settings save → Schedule再計算導線
8. Global User create／delete conflict
9. Membership create／duplicate／delete
10. Manual access control

### 19.4 Accessibility automation and manual test

- axe相当の自動検査
- Keyboard only
- VoiceOver／NVDAの主要Flow
- Screen readerでTable headerとDialog確認
- Forced colors
- Reduced motion
- 320px／200% Zoom

### 19.5 Performance targets

初期目標。実測に基づき更新する。

- Navigation feedback: 100ms以内
- Local interaction feedback: 50ms以内
- Main content skeleton表示: 300ms以内
- Command palette open: 100ms以内
- Search input: 16ms frameを維持
- Long list: 1000行相当でも入力遅延を起こさない設計

---

## 20. Do / Don’t

| Do | Don’t |
|---|---|
| 背景階層と余白で構造を示す | すべてをCardで囲う |
| Accentを主要ActionとActive stateへ限定 | Lavenderを装飾背景として大量使用 |
| 1px Hairlineを使う | 太い枠線でSectionを分割 |
| 6〜10pxの控えめなRadius | 16〜32pxの大きな角丸を多用 |
| 状態をIcon + Text + Colorで示す | Colorだけで完了／期限切れを示す |
| Static label formを使う | PlaceholderやFloating labelだけに依存 |
| 年を含む期限表示 | `7月`だけで年を省略する |
| File nameを表示 | UUIDを主要情報として表示 |
| AIの限界を明示 | Scoreを確定的な金融評価として演出 |
| 破壊操作で対象・影響を説明 | `本当に削除しますか？`だけを表示 |
| 短いFade／Color transition | Bounce、Glow、連続Pulse |
| LinkをLinkとして実装 | Anchor内にButtonを入れる |
| Read-only summaryを使う | 権限不足画面をDisabled formだらけにする |
| Mobile専用のAccounting list | 13列Tableを縮小表示 |
| ErrorをFieldとPage contextへ表示 | すべてToastだけで済ませる |

---

## 21. Definition of Done

### 21.1 Visual

- [ ] Dark／Lightで同一情報階層が成立する。
- [ ] Accent、Semantic colorの使用が規則内である。
- [ ] 旧`glass`、`ink`、`panel`、未定義CSS変数が残っていない。
- [ ] CardとShadowの多用がない。
- [ ] 長い日本語税務名称でもColumnが崩れない。

### 21.2 Interaction

- [ ] Keyboardだけで主要Flowを完了できる。
- [ ] Command paletteとCompany switcherがShortcutで開く。
- [ ] Focus ringが常に視認できる。
- [ ] Loading、Refreshing、Saving、Success、Errorが区別される。
- [ ] Double submitが発生しない。

### 21.3 Business safety

- [ ] Company contextが常時明示される。
- [ ] 他社データへアクセスできない。
- [ ] Task refreshで完了履歴が維持される。
- [ ] Upload purpose separationが維持される。
- [ ] Mail送信前確認と監査保存が維持される。
- [ ] Rating disclaimerが常時表示される。
- [ ] Date／Fiscal year表示がAsia/Tokyoで正しい。

### 21.4 Accessibility

- [ ] WCAG 2.2 AAの主要基準を満たす。
- [ ] 320px、200% Zoomで利用可能。
- [ ] Reduced motionが機能する。
- [ ] Dialog／DrawerのFocus managementが正しい。
- [ ] Table、Checkbox、ToastがScreen readerで理解できる。

### 21.5 Engineering

- [ ] Tokensが単一Source of Truth。
- [ ] Shared API error parserを使用。
- [ ] Date／Money formatterを共有。
- [ ] Component state fixtureとVisual testがある。
- [ ] 主要E2E flowがPassする。

---

## 22. Linear-inspired Reference Matrix

Linearの見た目を複製するのではなく、以下の設計意図をCLAS FinOpsへ適用する。

| Reference pattern | CLAS FinOps adaptation |
|---|---|
| Compact fixed sidebar | Company contextを含む248px Sidebar |
| Issues list | 税務・労務Task list |
| Status and priority chips | Task status、期限Severity、Mail status |
| Command menu | Navigation、Company switch、Search、Theme |
| Detail pane | 将来のTask／送信詳細。初期実装ではDialogまたはPage |
| Quiet dark surfaces | Dark-native Canvasと3段階Surface |
| Hairline dividers | Table、Sidebar、Toolbarの薄い区切り |
| Keyboard-first operation | Global shortcut、Row navigation、Search focus |
| Low-motion feedback | 120〜240msのFade／Color transition |

### 22.1 Visual reference assets

実際のReference screenshotをリポジトリで管理する場合は次の構成を推奨する。

```text
docs/design/reference/
  linear-sidebar.png
  linear-issues-list.png
  linear-command-menu.png
  linear-detail-pane.png
  clas-home-target.png
  clas-schedule-target.png
  clas-accounting-target.png
```

- 外部製品Screenshotは社内設計参考に限定し、配布権限を確認する。
- Screenshotだけで仕様を決めず、必ず本書のToken、State、Accessibility規則を正とする。
- 各画像にSource、取得日、注目点、使用範囲を記載する。

---

## 23. Design Governance

### 23.1 Change process

Design Token、Core component、Navigation、Status semanticsを変更する場合:

1. DESIGN.md更新
2. Before／After screenshot
3. Dark／Light／Mobile比較
4. Accessibility impact
5. Business flow impact
6. Design review
7. Implementation PR

### 23.2 Ownership

- Design Tokens: Design system owner + Frontend owner
- Business wording: Product owner + Domain reviewer
- Accessibility: Frontend owner + QA
- Tax／date meaning: Domain reviewer
- Security-sensitive UI: Backend／Security reviewer

### 23.3 Versioning

文書上部のStatusとReference commitを更新し、変更履歴を末尾へ追記する。

---

## 24. Change Log

| Date | Version | Change |
|---|---|---|
| 2026-07-17 | 0.1 | `main@8d4300d`を基準に、CLAS FinOps向けLinear-inspired Design System初版を作成 |



---

## Appendix A — Component State Matrix

| Component | Default | Hover | Active / Selected | Focus-visible | Disabled | Loading / Busy | Error |
|---|---|---|---|---|---|---|---|
| Primary Button | Accent solid | Darker accent | Darker accent | 2px focus ring | Muted surface/text | Spinner + stable label width | 通常はPage/Form側で表示 |
| Secondary Button | Surface-2 | Surface-hover | Surface-active | 2px focus ring | Muted text | Spinner | — |
| Ghost / Icon Button | Transparent | Surface-hover | Surface-active | 2px focus ring | Muted icon | Spinnerまたは操作抑止 | — |
| TextField | Surface-1 + border | Border strong | — | Accent border + ring | Read-only推奨 | End adornment spinner | Danger border + icon + text |
| Select | Surface-1 + border | Border strong | Open state | Accent ring | Read-only推奨 | Options取得中表示 | Danger border + message |
| Checkbox | Empty square | Border strong | Checked / indeterminate | Accent ring | Muted | Cell単位busy | Inline retry |
| Nav Item | Neutral text | Surface-hover | Accent-subtle | Accent ring | 非表示を優先 | — | — |
| Company Switcher | Surface-1 | Surface-hover | Menu open | Accent ring | 切替不可説明 | Spinner + Mutation lock | Inline error + retry |
| Data Row | Transparent | Surface-hover | Accent-subtle | Row outline | Mutating rowのみ抑止 | Row spinner | Error indicator |
| Status Badge | Semantic subtle | 原則変化なし | — | 非Interactive | — | Processing tone | Danger tone |
| Filter Chip | Surface-2 | Surface-hover | Accent-subtle | Accent ring | Muted | — | — |
| Dialog | Surface-3 | — | Open | Initial focus明示 | Action単位 | Action spinner | Persistent error region |
| Command Palette | Surface-3 | Result hover | Selected result | Search focus | 不可Action非表示 | Search indicator | Empty/Error result |
| Toast | Semantic surface | Close hover | — | Close focus | — | — | Errorは7秒以上 |
| FileDropzone | Hairline zone | Accent-subtle | Drag-over | Accent ring | Muted | Progress | File単位Error |
| StickySaveBar | Dirty時のみ表示 | — | — | Button focus | No changes時非表示 | Saving | Save error persistent |
| Tooltip | Hidden | Delayed open | — | Focus open | Disabled理由を説明可 | — | — |

### Appendix A.1 State naming rule

- CSSやComponent APIでは`active`を「押下中」と「選択済み」の両方に使わない。
- 押下中は`pressed`、選択済みは`selected`、Menu展開中は`open`を使用する。
- Async処理は`loading`ではなく、可能な限り`uploading`、`saving`、`sending`、`refreshing`等の具体名を使う。
- Error後に再試行できる場合は`error`だけで終了せず、`retryable`情報を持たせる。
