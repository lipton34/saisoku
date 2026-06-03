# Saisoku GBF Tools

React + Express + Prisma + Supabase PostgreSQL で作る、身内共有向けのグラブルお役立ちツールです。

## セットアップ

1. 依存関係を入れます。

```bash
npm install
```

2. `.env.example` を参考に `.env` を作り、Supabase の接続文字列を設定します。

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="長いランダム文字列"
INVITE_CODE="身内に共有する招待コード"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
SUPABASE_URL="https://example.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="Supabase Storageへアップロードできるservice role key"
SUPABASE_BUILD_SCREENSHOT_BUCKET="gbf-build-screenshots"
```

3. Prisma Client とDBテーブルを準備します。

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. 開発サーバーを起動します。

```bash
npm run dev
```

フロントエンドは `http://localhost:5173`、APIは `http://localhost:4000/api` で動きます。

## 主な機能

- ユーザー名 + パスワードの簡易ログイン
- ユーザーごとの日課・週課・単発タスク管理
- タスク登録、確認、完了、未完了戻し、削除
- ホームで未完了数、日課残り、週課残り、最近の完了を確認
- 素材メモ、編成メモ、イベント進捗、マルチ救援メモの拡張入口

## よく使うコマンド

```bash
npm run typecheck
npm run build
npm run prisma:studio
```
