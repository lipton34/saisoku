# Saisoku GBF Tools

Saisoku は、グランブルーファンタジーの団内運用を補助する身内向けWebツールです。
攻略情報そのものを転載するのではなく、編成、目標、イベント、日々のタスクなど、団内で使う情報を整理・共有することを目的としています。

## 主な機能

- ユーザー名・パスワード・招待コードによる登録とログイン
- 日課・週課・単発タスクの登録、完了、再開、削除
- 素材目標と素材プリセット
- 高難易度・周回向け編成の投稿、検索、コピー、編集
- キャラ・武器・召喚石・ジョブの候補マスタとサムネイル
- Supabase Storageを使った編成スクリーンショット添付
- 団内目標の作成、提案、カンバン表示
- 目標と編成、必要武器、討伐数、サブタスクの連結
- 古戦場の貢献度・肉・周回速度の目標計算
- 公式NEWSの取得・整理とイベント予定への連結
- 必要素材・解放条件を段階別に扱う進捗管理基盤

進捗管理機能は基盤まで実装済みですが、必要素材データが未検証のプリセットは登録不可にしています。

## 技術構成

- フロントエンド: React 18、Vite、TypeScript、React Router
- バックエンド: Express、TypeScript
- DB / ORM: Supabase PostgreSQL、Prisma
- 認証: bcrypt、JWT、httpOnly Cookie
- 画像保存: Supabase Storage
- デプロイ: Render Web Service
- パッケージ管理: npm

## セットアップ

前提として Node.js 20 以降と npm を使用します。

1. 依存関係をインストールします。

```bash
npm install
```

2. `.env.example` をコピーして `.env` を作成します。

`.env` と `.env.local` はGit管理しません。値をドキュメント、Issue、チャット、ログへ貼り付けないでください。

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

- `DATABASE_URL` と `JWT_SECRET` はAPI起動に必要です。
- `INVITE_CODE` を設定しない場合、登録時の招待コード照合は行われません。本番では必ず設定してください。
- `SUPABASE_*` は編成スクリーンショットのアップロードに必要です。
- `VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL` は、DBマスタの相対サムネイルパスを表示する場合に使用します。

3. Prisma Clientを生成し、登録済みmigrationをDBへ適用します。

```bash
npm run prisma:generate
npm run prisma:deploy
```

4. 開発サーバーを起動します。

```bash
npm run dev
```

- フロントエンド: `http://localhost:5173`
- API: `http://localhost:4000/api`
- ヘルスチェック: `http://localhost:4000/api/health`

Viteの開発サーバーは `/api` をExpressへプロキシします。

## よく使うコマンド

```bash
npm run dev
npm run typecheck
npm run build
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

- スキーマを変更するときだけ `prisma:migrate` で新しいmigrationを作成します。
- 既存migrationを適用するだけの場合は `prisma:deploy` を使用します。
- `typecheck` はクライアントとサーバーの両方を検査します。
- `build` はPrisma Client生成、サーバーのコンパイル、Viteビルドを行います。

公式NEWS関連の調査・運用コマンド:

```bash
npm run news:fetch:latest
npm run news:fetch:month
npm run news:reanalyze
npm run news:debug:summary
```

外部サイトへのアクセスとDB更新を伴うため、対象と環境を確認してから実行してください。

## ディレクトリ構成

```text
src/                Reactアプリ
  components/       共通・機能別コンポーネント
  lib/              APIクライアント、マスタ変換、共通ロジック
  pages/            ルート単位の画面
server/             Express API
  data/             プリセット、初期マスタ
  middleware/       認証などのmiddleware
  routes/           APIルート
  services/         Storage、公式NEWSなどの外部処理
prisma/             Prisma schema、migration、seed
public/             静的アセット
docs/               全体方針、機能要件、調査・運用資料
```

主な入口は [src/main.tsx](src/main.tsx)、[src/App.tsx](src/App.tsx)、[server/index.ts](server/index.ts)、[prisma/schema.prisma](prisma/schema.prisma) です。

## 開発方針

実装前に [docs/01_overall_policy.md](docs/01_overall_policy.md) と対象機能の要件書を確認してください。
具体的な実装規約、CSS・レスポンシブ対応、検証基準は [AGENTS.md](AGENTS.md) を参照してください。

特に以下を重視します。

- 入力操作を増やしすぎず、プリセットや候補選択を活用する
- 外部サイトの本文・画像・表を転載せず、URLと団内向けメモとして扱う
- 画像を大量・高解像度で保存せず、Supabase Freeの容量と転送量を意識する
- 新規・変更画面はデスクトップだけでなくスマートフォン幅でも利用可能にする
- 認証、所有者チェック、既存データとの互換性を維持する

## 本番運用

公開URLとして `https://saisoku.onrender.com` が使用されています。

Renderの設定:

```text
Build Command: npm install --include=dev && npm run prisma:generate && npm run build
Start Command: npm run start
```

本番ではExpressが `dist/` のフロントエンド成果物を配信します。Render Freeでは無通信後の初回アクセスに起動待ちが発生することがあります。

詳細な現在地、API領域、既知の課題は [HANDOFF.md](HANDOFF.md) を参照してください。
