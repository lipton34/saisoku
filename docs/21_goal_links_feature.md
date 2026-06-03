# 目標連結 Phase 3 実装メモ

## 目的

目標を中心に、関連編成・必要武器・討伐数・サブタスクを管理できるようにする。

素材数の細かい管理ではなく、団内で「準備に必要なもの」と「今進めること」を整理することを優先する。

## 対象外

- 素材の網羅的な必要数管理
- 所持状況の自動照合
- ゲーム内データ取得
- ダメージ計算
- 編成や武器の自動最適化

## DB変更

以下のテーブルを追加した。

- `goal_build_links`
- `goal_required_items`
- `goal_raid_targets`
- `goal_sub_tasks`

`goal_required_items.masterItemId` は `gbf_master_items` と任意で紐づく。
候補にない武器も自由入力できる。

## API変更

`/api/shared-goals/:id` 配下に以下を追加した。

関連編成:

- `POST /build-links`
- `PATCH /build-links/:linkId`
- `DELETE /build-links/:linkId`

必要武器:

- `POST /required-items`
- `PATCH /required-items/:itemId`
- `DELETE /required-items/:itemId`

討伐目標:

- `POST /raid-targets`
- `PATCH /raid-targets/:targetId`
- `DELETE /raid-targets/:targetId`

サブタスク:

- `POST /sub-tasks`
- `PATCH /sub-tasks/:taskId`
- `DELETE /sub-tasks/:taskId`

## 画面変更

目標詳細に以下を追加した。

- 関連編成
- 必要武器
- 討伐目標
- サブタスク

編成詳細には「この編成が関連している目標」を追加した。

## 今後の拡張余地

- 必要キャラ・必要召喚石の独立管理
- 武器マスタ検索からの追加UI
- サブタスク並び替え
- 目標ボードカード上で関連数をより詳しく表示
