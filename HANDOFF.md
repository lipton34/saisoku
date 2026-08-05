# Saisoku 引き継ぎメモ

最終更新: 2026-08-05

## 現在地

モバイル中心の機能再編をローカル実装済み。正本は`docs/27_mobile_first_feature_reorganization.md`。

- 保管庫アイコンを含む共通ヘッダーと、右端を「便利」とする5項目の下部ナビゲーション
- ホームの個人・団内目標ボード
- 1カウンターの数量目標
- 通常作業、数量目標、進捗目標を組み合わせる目標サブタスク
- 進捗管理と目標ボードの連携
- 画像・補足中心の編成投稿と非公開下書き
- 古戦場の「目標」「討伐速度」「計算結果」タブ
- 団内共通の教科書と、利用者ごとの付箋付き対策メモからなる高難度攻略メモ
- 本人専用の宝晶石・ガチャチケット天井貯金
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
- `/api/raid-guides`, `/api/raid-guide-strategies`
- `/api/spark-savings`
- `/api/news`, `/api/news-items`, `/api/source-articles`, `/api/news-fetch-logs`
- `/api/official-news`
- `/api/event-series`, `/api/event-occurrences`, `/api/event-notes`

認証操作とhealth check以外は認証必須。個人目標、数量目標、進捗管理、下書きは所有者だけが取得・変更できる。団内目標は全認証利用者が閲覧・共同編集でき、目標全体の削除だけは作成者に限定する。公開編成の変更は作成者だけが行う。

高難度攻略メモのマスタ本文はコード管理で、利用者は変更できない。対策メモは1利用者・1攻略メモにつき最大10件、付箋は1対策メモにつき最大50件で、変更・削除は所有者だけが行う。マスタはルシファー・ゼロ（34ページ）と天元たる六色の理（7区間・27ページ）を定義している。`20260804090000_add_raid_guides`は適用済み。見出しページを追加する`20260804120000_add_raid_guide_heading_pages`は本番DBへ未適用。

攻略メモのコード構成、マスター追加、短縮表記、インラインリンク、行統合時の付箋移行、seed、本番反映は `docs/30_high_difficulty_raid_guide_implementation_guide.md` を参照する。

## 天井貯金

正本は `docs/31_spark_savings_feature.md`。宝晶石、単発チケット、10連チケットをユーザーごとに1件保存し、300連固定の天井までに追加で必要な宝晶石を端数込みで計算する。現在の合計回数は300で丸めず、301連以上の超過分も表示する。

天井貯金の残高、狙い目、履歴は個人データとし、排出時期、獲得イベント、過去実績、開催予定、月別集計状態は認証利用者間の共有データとする。残高のリセットではレコードを削除せず、履歴有効時だけ調整履歴を同一トランザクションで作成する。

基本版は本番適用済み。拡張版として4タブ、狙い目と目標・編成リンク、任意履歴、共有データCRUD、監査ログ、3か月の獲得目安、`20260805120000_expand_spark_savings`をローカル実装した。初期マスターは空であり、調査・ユーザー確認後に別途登録する。拡張migrationとアプリはまだ本番へ反映していない。

後続の狙い目、排出時期、獲得目安、任意履歴は `docs/32_spark_savings_expansion_feature.md` で仕様確定済み・未実装。排出時期と獲得イベントの初期マスターは未調査で、推測値を有効化しない。実装時は既存所持数を維持し、目的、使用予定日、貯金全体メモをpreflight確認後に削除する。

## サブタスク再設計

`20260729090000_goal_subtask_rebuild`をローカル実装済み。本番DBへは未適用。

- 既存`goal_sub_tasks`テーブルと目標との1対多関係を流用
- 通常サブタスク、数量目標リンク、進捗目標リンクを共通順序で管理
- 数量・進捗リンクは自動完了判定と手動上書きに対応
- 目標カードへ達成済み件数と総数を表示
- 旧サブタスク、必要武器、討伐目標の行はmigrationで削除
- `goal_required_items`と`goal_raid_targets`テーブルも削除
- 適用前にmigrationディレクトリの`preflight.sql`を読み取り専用で実行する

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
- `npm test`（進捗管理32件）
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

2026-07-27、ドラゴニックウェポンversion 1を追加した。

- 6属性各1本の3凸交換、4凸、5凸、オリジン化に対応
- 属性、武器種、属性の輝き、六竜固有素材、属性の鱗を対象別素材へ置換
- 第2・第3スキルとテルマ交換は計算対象外
- 旧ID `draconic-weapon` は読み取りaliasとして維持

本番反映時は、コードのデプロイ前または同じ保守時間内に `npm run prisma:seed` を実行し、追加した進捗素材マスターをDBへupsertする。今回の変更にPrisma schema・migrationの追加はない。

DB migrationを適用したAPI統合確認と、ブラウザでの360px・768px・1280px表示確認は本番反映前に必要。

## 注意

- `.env`と`.env.local`を読まない。
- 本番DBへmigrationを自動適用しない。
- NEWS取得・再解析コマンドを回帰確認目的で実行しない。
- 未検証の進捗プリセットを`isAvailable: true`にしない。
