# Saisoku 引き継ぎメモ

最終更新: 2026-07-25

## 現在地

モバイル中心の機能再編をローカル実装済み。正本は`docs/27_mobile_first_feature_reorganization.md`。

- 共通ヘッダーと5項目の下部ナビゲーション
- ホームの個人・団内目標ボード
- 1カウンターの周回目標
- 進捗管理と目標ボードの連携
- 画像・補足中心の編成投稿と非公開下書き
- 古戦場の「目標」「討伐速度」「計算結果」タブ
- イベント予定と公式NEWSを収める保管庫
- 共通404

旧タスク、素材目標、選択式編成、編成プリセット、目標提案、ロードマップ、旧ツールはコードとルートから削除した。

## API

- `/api/auth`
- `/api/goals`
- `/api/round-goals`
- `/api/progress-goals`
- `/api/builds`
- `/api/build-drafts`
- `/api/build-masters`
- `/api/guild-war-goals`
- `/api/news`, `/api/news-items`, `/api/source-articles`, `/api/news-fetch-logs`
- `/api/official-news`
- `/api/event-series`, `/api/event-occurrences`, `/api/event-notes`

認証操作とhealth check以外は認証必須。個人目標、周回目標、進捗管理、下書きは所有者だけが取得・変更できる。団内目標と公開編成は全認証利用者が閲覧でき、変更は作成者だけが行う。

## DB変更

`prisma/migrations/20260725090000_mobile_first_reorganization`を追加済み。まだ本番DBへ適用していない。

削除対象:

- Task
- MaterialGoal、MaterialItem、MaterialPreset、MaterialPresetItem
- 旧BuildPost、旧画像行、編成リンク
- GoalProposal
- `next`、`paused`、`done`の既存目標

維持対象:

- 認証
- `now`、`later`の既存目標と関連情報
- 進捗管理
- 古戦場
- イベント予定
- 公式NEWS
- GBFマスタ

本番migration前に`preflight.sql`を読み取り専用で実行し、削除件数を確認する。続いて旧編成画像をStorageから削除するため、対象環境を確認して
`npm run migration:remove-legacy-build-images -- --confirm-delete-legacy-build-images`
を実行してからmigrationを適用する。バックアップは作成しない決定だが、Storage削除、migration、デプロイの実行直前に改めてユーザー確認を取る。

## 画像

- 最大5枚
- 1ファイル5MB
- JPEG、PNG、WebP
- 公開投稿と下書きの画像はStorage上でも独立
- 下書きから投稿する際に画像を別パスへコピー
- 投稿後も下書きを残す

## 検証

ローカル実装中に以下を確認済み。

- `npm run typecheck`
- `npm test`（進捗管理12件）
- `npm run build`
- `npm run prisma:generate`
- `git diff --check`

DB migrationを適用したAPI統合確認と、ブラウザでの360px・768px・1280px表示確認は本番反映前に必要。

## 注意

- `.env`と`.env.local`を読まない。
- 本番DBへmigrationを自動適用しない。
- NEWS取得・再解析コマンドを回帰確認目的で実行しない。
- 未検証の進捗プリセットを`isAvailable: true`にしない。
