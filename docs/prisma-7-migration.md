# Issue #56 — Prisma 7 本番反映前レビュー・切り戻し計画

## 検証済み（2026-10-23）
- Prisma ORM / Client 7.10.1、PostgreSQLアダプターを導入。既存 migration.sql は無変更。
- PR #64の最新CI 3件（認証2件＋隔離 PostgreSQL 17）成功。隔離DBでは現行schemaからのCRUD・interactive transaction、履歴ベースライン・migrate statusを確認。
- Supabase本番 ximgzkpdvnfuiwbzdckb は **Prisma履歴32件/32件成功、未完了0件**（読み取り専用で再確認）。本番DB・接続設定への変更なし。
- Render設定（ユーザー確認）：DATABASE_URLあり、DIRECT_DATABASE_URLなし。DATABASE_URLはSupabase **Session Pooler 5432**。Build: `npm install --include=dev && npm run prisma:generate && npm run build`、Start: `npm run start`、Pre-Deploy: なし。
- このPRの `server/prisma.ts` は `PrismaPg({ connectionString: process.env.DATABASE_URL!, connectionTimeoutMillis: 5000 })` を使用。Session Pooler経由での本番運用は未検証。Prisma CLIはDIRECT_DATABASE_URLがあれば優先、なければDATABASE_URLを利用する設定。
- 旧SQL全件の新規リプレイ試験は失敗：`20260522085705_align_event_occurrence_relations` が作成前の `event_notes` を参照（P3018/42P01）。**CIのベースライン成功は過去SQLリプレイ成功を意味しない**。この問題は別途対処。

## 本番反映前の安全チェック
1. Render上で稼働中の正常なデプロイIDまたはGitコミットSHAを控える（確実な切り戻し先）。現在mainはPrisma 5.22.0。
2. Renderのデプロイ方式（mainのAuto-Deployが有効か）、手動で以前のデプロイを再デプロイできるかを確認。
3. Supabaseのバックアップ/復旧手段を確認（既存の契約・提供機能に応じる）。本PRでDB schema変更を実行しないが、DB運用の保険として確認。
4. Render環境変数は既存DATABASE_URLを維持。秘密値をGitHub Issue/PR/ログへ投稿しない。DIRECT_DATABASE_URLを今回必須とはしない。
5. **Pre-Deployで `prisma migrate deploy` を追加しない。** Prisma 7の起動・ビルドに本番migrationは不要。CI隔離DBでの `db push` / `migrate resolve` は本番には実行しない。
6. 既存のRender Build Commandは動作し得るが、再現性のため `npm ci && npm run prisma:generate && npm run build` を推奨。変更する場合はデプロイ前にRender上のコマンドだけ調整し、動作確認後に固定。
7. 新たに生成ClientやSQL実行方法を追加していないか、PRの差分を再確認。Session Poolerを通した接続/SSL/タイムアウトは本番デプロイ後に短時間でスモーク確認。

## デプロイ後のスモーク確認
- Renderのbuild成功・起動ログの確認。DB資格情報や接続URLをログに出さない。
- ログイン/ログアウト/再ログイン、目標の取得/更新、編成一覧・編成画像のアップロードと閲覧、ニュース取得機能の動作を確認。
- Prisma初回接続、接続タイムアウト、コネクション枯渇、認証エラー、SSLエラーの有無をRenderログで確認。
- Supabase `_prisma_migrations` の件数・成功数・未完了数が **32/32/0** のままを読み取り専用で再確認。

## 切り戻し（DB migrationなしの場合）
1. 重大な接続/機能障害があれば、Renderで **直前の正常なデプロイをRollback/再デプロイ** する（事前に控えたデプロイID/コミットを指定）。利用可能な操作名はRender UIに従う。
2. Renderの設定変更を行った場合は、Build Command等も事前に控えた旧値へ戻す（`npm install --include=dev && npm run prisma:generate && npm run build`）。
3. ロールバック後にログイン・画面表示・DBアクセスを検証する。
4. このPRでは本番DB migrationを実行しないため、**DBをロールバックしたりmigration履歴を削除したりしない**。本番DBへの書き込みを伴う復旧作業は別途判断する。
5. PRやIssueの完了扱いは、本番スモーク確認完了後に行う。

## 未検証・留意点
- PostgreSQL 17の一時CIはSupabase Session Poolerの挙動を再現しない。
- CIは32 migrationのベースライン登録と現行スキーマの動作を確認したが、既存SQLの全件リプレイは不成功。
- Render Auto-Deploy、バックアップ提供状況、旧デプロイへの復帰可否はまだ確認していない。

参照: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
