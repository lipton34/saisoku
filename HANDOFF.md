# Saisoku 引き継ぎメモ

最終更新: 2026-07-27

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
- `npm test`（進捗管理29件）
- `npm run build`
- `npm run prisma:generate`
- `git diff --check`

2026-07-27、十天衆version 2を追加した。

- 最終ゴールはLv150
- 最終上限解放は40箱コースのみ
- 天星器属性変更先を登録・保存し、加入から超越までの対象別素材へ反映
- 十天衆10人×6属性の素材定義と依存関係を自動テストで確認
- ゲーム乱舞とVIP de グランブルーファンタジー攻略Wikiを追加照合し、天星器覚醒第3・第5段階はGameWith記載値で確定
- 十天衆version 2を`isAvailable: true`で利用可能化
- 雄偉者たちの矜持を終末の暗晶30、漆黒の棘翅30、狡知の魔角30、碧麗の証1へ展開したversion 3を新規登録用に追加
- 本番にversion 2目標が1件あるため、version 2は非公開の読み取り互換定義として維持

2026-07-27、終末武器version 1を追加した。

- マグナ・神石の6属性各1本、計12武器に対応
- 3凸交換から限界超越Lv250完成までを段階化
- 本数1～10本の素材倍率と、第3スキルの旧・超越後・計算対象外を選択可能
- 属性、武器種、マグナ2、六竜、恩寵、レヴァンス、ブライト、光輪を対象別素材へ置換
- 旧ID `terminus-weapon` は読み取りaliasとして維持

同日、確認結果を反映したversion 2を新規登録用に追加した。

- 第3スキルを段階と素材計算から除外
- 武器名へ「火マグナ」「火神石」のように属性と加護区分を併記
- 1本しか入手できないため本数入力を削除し、常に1本分を計算
- version 1は既存目標の読み取り互換用として維持

本番反映時は、コードのデプロイ前または同じ保守時間内に `npm run prisma:seed` を実行し、追加した進捗素材マスターをDBへupsertする。今回の変更にPrisma schema・migrationの追加はない。

DB migrationを適用したAPI統合確認と、ブラウザでの360px・768px・1280px表示確認は本番反映前に必要。

## 注意

- `.env`と`.env.local`を読まない。
- 本番DBへmigrationを自動適用しない。
- NEWS取得・再解析コマンドを回帰確認目的で実行しない。
- 未検証の進捗プリセットを`isAvailable: true`にしない。
