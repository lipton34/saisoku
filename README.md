# Saisoku GBF Tools

Saisokuは、グランブルーファンタジーの固定メンバー5人による団内運用を補助する非公開Webツールです。スマートフォンを主な利用環境とし、団内共有、目標、周回記録、イベント情報を整理します。

## 主な機能

- ユーザー名・パスワード・招待コードによる登録とログイン
- 個人目標と団内目標の3状態ボード
- 1目標1カウンターの周回目標と目標ボード連携
- 段階別の必要素材・条件・所持数を扱う進捗管理と目標ボード連携
- 画像・概要・補足・参考URLを中心とする編成公開投稿
- 所有者だけが利用できる編成下書き
- 古戦場の目標、討伐速度、計算結果
- 保管庫内のイベント予定と公式NEWS
- GBFキャラ、武器、召喚石、ジョブ、素材、クエストの内部マスタ

## 主な画面

- `/`: 個人・団内目標
- `/round-goals`: 周回目標
- `/progress-goals`: 進捗管理
- `/builds`: 編成公開投稿
- `/builds/new`: 編成作成
- `/builds/drafts`: 自分の下書き
- `/guild-war-goals`: 古戦場
- `/archive`: 保管庫
- `/event-schedule`: イベント予定
- `/official-news`: 公式NEWS

旧タスク、素材目標、旧編成、目標提案、ロードマップ、旧ツールのURLとAPIは廃止され、404を返します。

## 技術構成

- フロントエンド: React 18、Vite、TypeScript、React Router
- バックエンド: Express、TypeScript
- DB / ORM: Supabase PostgreSQL、Prisma
- 認証: bcrypt、JWT、httpOnly Cookie
- 画像保存: Supabase Storage
- デプロイ: Render Web Service
- パッケージ管理: npm

## セットアップ

Node.js 20以降とnpmを使用します。

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

`.env.example`を基に`.env`を作成してください。`.env`と`.env.local`の値はGit、文書、チャット、ログへ保存しないでください。

主な環境変数:

```env
DATABASE_URL="Supabase PostgreSQLの接続文字列"
JWT_SECRET="十分に長いランダム文字列"
INVITE_CODE="団内で共有する招待コード"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
SUPABASE_URL="https://example.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="Storageを操作できるservice role key"
SUPABASE_BUILD_SCREENSHOT_BUCKET="gbf-build-screenshots"
VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL="マスタ画像の公開ベースURL"
```

本番では`INVITE_CODE`を必ず設定してください。`SUPABASE_SERVICE_ROLE_KEY`はサーバー専用です。

## 検証

```bash
npm run typecheck
npm test
npm run build
```

UI変更は360px、768px、1280px以上で確認します。

## migration

スキーマ変更はPrisma schemaと新しいmigrationを同時に更新します。

```bash
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
```

`20260725090000_mobile_first_reorganization`は破壊的migrationです。適用前に同じディレクトリの`preflight.sql`で削除対象件数を確認してください。旧編成画像はDB migrationだけではStorageから消えないため、対象環境を再確認したうえで、migrationより先に次の明示確認付きコマンドを実行します。

```bash
npm run migration:preflight-mobile-reorganization
npm run migration:remove-legacy-build-images -- --confirm-delete-legacy-build-images
```

本番適用、Storage削除、デプロイは、ローカル検証とは分けて実行します。

## 開発資料

- [AGENTS.md](AGENTS.md)
- [全体方針](docs/01_overall_policy.md)
- [モバイル中心の機能再編・改修仕様](docs/27_mobile_first_feature_reorganization.md)
- [進捗管理](docs/23_progress_preset_feature.md)
- [古戦場](docs/16_guild_war_goal_calculator.md)
- [公式NEWS](docs/17_official_news_mvp.md)

公開URLは`https://saisoku.onrender.com`です。Renderでの現在のデプロイ状態は反映作業時に確認してください。
