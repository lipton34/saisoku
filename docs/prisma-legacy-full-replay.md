# Issue #65 — 過去32件のSQL全件再適用テスト

2026-10-23、PR #69のGitHub Actions上で、空のPostgreSQL 17に全32件のSQLを適用できることを確認した。

## 検証結果
- 一時的なGitHub Actions checkout内で、外部キー調整migrationをイベント関連テーブル作成の**後**になるようフォルダ名だけ一時変更
- `prisma migrate deploy` により全32件のSQL適用成功
- `prisma migrate status` 成功
- Prisma 7のCRUD・transactionの検証成功

## 検証の性質
- 一時checkoutでのフォルダ名変更であり、リポジトリの既存migrationファイルやその中身は変更しない
- 本番の `_prisma_migrations` の履歴・チェックサムは変更しない
- CIの再適用履歴に付く**一時的なmigration名**は、本番履歴の名前と一致しない
- 既存のリポジトリをそのまま空DBに `prisma migrate deploy` すれば今後も失敗する
- Supabase固有のRLS・権限・拡張・データの完全復元を意味しない

## 運用指針
通常のCIや開発用DBの初期構築は `docs/prisma-isolated-bootstrap.md` のベースライン方式を継続する。
`.github/workflows/issue-65-full-replay.yml` は**全SQLの再適用可能性を確認するための検証専用**。
本番履歴との整合や既存migrationを修正する方針については、別途設計・検証が必要。Productionでは `prisma db push` / `migrate resolve` / `migrate deploy` をこのIssue対応のために実行しない。
