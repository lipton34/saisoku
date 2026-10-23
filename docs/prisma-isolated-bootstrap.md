# Issue #65 — Prisma migrationの新規DB構築方針

## 発見した不整合
既存の本番DBでは32件のmigrationがすべて成功しています。しかし、
- `20260522090000_add_event_notes`（テーブル作成）
- `20260522110000_add_event_occurrences`
- `20260522085705_align_event_occurrence_relations`（外部キー変更）

という実適用順に対し、ファイル名順では最後の外部キー変更が先になります。
このため、空のDBに `prisma migrate deploy` で既存SQLを先頭から実行すると P3018 / 42P01 で失敗します。

## 運用方針
**適用済みmigrationの名前・SQL・checksum・本番DB履歴を変更しません。**
新規の使い捨てDBだけに現時点のPrisma schemaを構築し、既存migrationをベースライン済みとして記録します。これは元のSQLを再実行した結果ではありません。

### GitHub Actions検証
`scripts/bootstrapPrismaIsolatedCI.sh` を専用GitHub Actionsワークフローで実行します。スクリプトはCI環境かつローカルの `saisoku_prisma7_test`（ポート5432）以外のURLでは停止します。

1. PostgreSQL 17の一時サービスを起動
2. `prisma db push` で現行schemaを作成
3. 履歴32件を `prisma migrate resolve --applied` でベースライン登録
4. `prisma migrate status` を確認
5. `prisma migrate deploy` が再適用不要の状態で成功することを確認
6. Prisma ClientによるCRUD・トランザクションをテスト

CIのDBはテスト終了とともに破棄されます。

## 制約と残るリスク
- **既存の全SQLを空DBへ順に再適用することはできません。** この手順は現行schemaの新規構築と将来のmigration運用の基準点を用意するためのものです。
- Prisma schema以外に手作業で作ったDBオブジェクト（RLS・権限・拡張・トリガーなど）は `db push` だけでは再現できないことがあります。Supabase環境を完全に復元するバックアップ手順とは異なります。
- 本番DBでこのスクリプトを実行することは禁止。既存本番への `db push` / `migrate resolve` / `migrate deploy` は本Issueでは行いません。
- スキーマやDB権限に変更が入る場合は、新規環境で別途検証します。
