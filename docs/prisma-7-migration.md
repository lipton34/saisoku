# Issue #56 — Prisma 7 移行検証

このブランチは **未検証のドラフト** です。mainへのマージ、Renderへのデプロイ、本番Supabaseへのマイグレーションを実行しないでください。

## 変更内容
- Prisma ORM 7.10.1 / PostgreSQL adapter `@prisma/adapter-pg` / `pg` を指定。
- `prisma/schema.prisma` のgeneratorを `prisma-client` に変更。生成Clientを `server/generated/prisma` へ出力。
- `prisma.config.ts` でCLIの接続先を設定。`DIRECT_DATABASE_URL` があれば優先し、なければ `DATABASE_URL` を利用。
- `server/prisma.ts` で `PrismaPg` adapterを使用。
- 既存の migration.sql は変更していない。

## 現時点のブロッカー
**`package-lock.json` が未更新** のため、現時点で `npm ci` は成功しません。接続済みGitHub側のソース編集のみでは、npm registryから依存関係を取得して正しいlockfileを再生成できません。

ローカルの検証ブランチで次を行い、変更された `package-lock.json` を当該ブランチへコミットしてください。

```bash
git fetch origin
git checkout upgrade/issue-56-prisma-7
npm install
npm run prisma:generate
npm run typecheck
npm test
npm run build
npm audit
```

本番の接続URLをログに出したり、PRへ書き込んだりしないでください。`DATABASE_URL` は検証時に隔離DBへ設定してください。

## DB検証（本番への書き込み禁止）
本番Supabaseプロジェクト `ximgzkpdvnfuiwbzdckb` では、読み取り専用で `_prisma_migrations` 32件すべて正常完了を確認済み。Supabase migration履歴は別系統であり、直接件数比較しないでください。

本番接続とは切り離した隔離PostgreSQL 17 DBで、以下を確認すること：
1. `prisma migrate status` が既存32件の履歴と整合する。
2. CRUD、`$transaction`、`$executeRaw` による advisory lock が正しく動く。
3. 編成画像・目標・ログイン処理の回帰テストが通る。
4. DB接続プールと SSL 設定、タイムアウトがRender実行条件に適合する。

**検証環境でも既存本番DBに`prisma migrate dev`、`prisma migrate deploy`、`prisma db push`を実行しないでください。**

## 切り戻し
mainはPrisma 5.22.0のまま維持。未検証ブランチをマージせず破棄すれば即時切り戻し可能。将来の本番反映時には、接続先・デプロイバージョン・復旧手順を別途確認します。

公式移行ガイド: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
