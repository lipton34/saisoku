# 進捗プリセット実装・引き継ぎ記録

- 更新日: 2026-07-23
- 対象: `/progress-goals`
- 正本仕様: `docs/23_progress_preset_feature.md`
- 素材調査: `docs/24_evoker_progress_research.md`
- 素材ID・DB調査: `docs/25_progress_item_master_db_research.md`
- 状態: ユーザー指示により停止中

## 0. 停止・再開ルール

- 2026-07-23、ユーザー指示により本作業を停止した。
- この作業を自動的に再開しない。
- 別チャットや別機能の依頼を、本作業の再開指示として解釈しない。
- 再開は、この作業を行ったチャットでユーザーから明示的に再開指示が出た場合に限る。
- 再開指示があるまで、migration、seed、DB操作、本番デプロイ、追加実装、UI確認を行わない。
- 別作業で同じファイルを変更する必要がある場合は、本作業の未適用差分が存在することを先に確認し、混在や上書きを避ける。

## 1. この文書の目的

大きな実装区切りごとの完了内容、検証結果、未完了作業を記録し、中断後も同じ順序で再開できるようにする。仕様判断は本書ではなく `docs/23_progress_preset_feature.md` を正とする。

## 2. 実装順

1. 共通定義・依存計算・自動テスト
2. 素材マスターと十賢者プリセット
3. 旧十賢者データの対象限定掃除
4. API
5. UI
6. 総合検証と利用可能化

## 3. 完了した区切り

### 3.1 共通計算基盤

追加・変更:

- `server/lib/progressEngine.ts`
  - 目標中継点から依存先を再帰抽出
  - 複数経路で到達する中継点の重複除外
  - 循環参照と未知IDの検出
  - 完了済み通常中継点の除外
  - `itemKey` 単位の必要数合算
  - 所持数と不足数の算出
  - 前提を飛ばした完了集合の検出
  - プリセット構造検証
- `server/data/progressPresets.ts`
  - 工程グループ、通常中継点・集約目標、`dependsOn` を表現可能に変更
  - `presetId + version` で定義を検索可能に変更
- `server/lib/progressEngine.test.ts`
  - 依存抽出、合算、完了集合検証、循環検出をテスト
- `package.json`
  - Node標準テストランナーを使う `npm test` を追加

検証:

- `npm test`: 4件成功
- `npm run typecheck`: 成功

補足:

- `tsx --test` はsandbox内でIPCソケット作成に失敗するため、`node --import tsx --test` を採用した。
- 現行API・UIはまだ旧段階配列の挙動のままである。

### 3.2 素材マスターと十賢者プリセット

追加・変更:

- `server/data/progressMaterials.ts`
  - 調査で確定した進捗素材の固定IDと表示名を一元管理
- `server/data/gbfMasterSeed/materials.ts`
  - 全進捗素材を `GbfMasterItem(kind: material)` へ追加
- `server/data/evokerProgressPreset.ts`
  - 十賢者version 2、6工程グループ、21中継点を定義
  - 10賢者の属性、召喚石、礎武器、エリア対応を定義
  - 召喚石、加入、礎武器、領域、最終、4アビの段階別素材を定義
  - 光・闇のヴェルム文書、ブライト、天司アニマ、石片、ゴスペルの特殊分割を定義
- `prisma/migrations/20260723120000_clear_legacy_evoker_progress_goals/migration.sql`
  - `preset_id = 'evokers'` の旧目標だけを新定義投入前に削除
  - 関連する中継点・条件進捗は既存外部キーのcascadeで削除
- 自動テスト
  - 10賢者すべての構造と素材IDを検証
  - アラナンの礎武器合計を調査値と照合
  - ガイゼンボーガの特殊分割を検証
  - material seedと固定ID一覧の一致を検証

検証:

- `npm test`: 8件成功
- `npm run typecheck`: 成功

### 3.3 API

`server/routes/progressGoals.ts` を確定仕様へ更新した。

- 保存済みの `presetId + presetVersion` と対象IDで定義を解決
- `GET /api/progress-goals/:id?targetStageId=...` で計算終点を一時変更
- 最終ゴールの依存関係にない目標中継点を拒否
- 目標中継点までの未完了素材を `itemKey` 単位で合算
- `POST /api/progress-goals/:id/preview` でDBを書き換えず下書きを再計算
- `PUT /api/progress-goals/:id/progress` で完了ID集合を一括検証・保存
- 未知ID、集約目標の手動完了、前提未完了をサーバーで拒否
- 素材不足は完了拒否条件から除外
- 所持数と目標の所有者チェックを維持
- 旧単体完了APIも依存関係検証へ変更

### 3.4 UI

`src/pages/ProgressGoalsPage.tsx` と `src/styles.css` を更新した。

- 十賢者version 2を登録可能化
- 登録時に工程グループ別の現在状態を指定
- 最終ゴールを上、前提を下に置く工程グループ別の縦長ツリー
- 通常中継点と自動判定の集約目標を区別
- 前提未完了の上位中継点を操作不可にする
- 下位中継点を未完了へ戻す際、依存する上位中継点も下書きから解除
- 完了状態と所持数を下書きでプレビュー
- 保存・キャンセル、未保存表示、ブラウザー離脱時の確認
- 目標中継点をURL queryへ保持し、再読み込み時に復元
- 不足素材をカード表示し、スマートフォンでページ横スクロールを発生させない構成
- 980px以下で登録時の工程グループ選択を領域内横スクロールに変更
- 680px以下で概要と操作を1列化

検証:

- `npm test`: 8件成功
- `npm run typecheck`: 成功
- `npm run build`: 成功
- 実DBを使ったブラウザー操作と360px・768px・1280pxの実画面確認: 未実施

## 4. 次に行う作業

1. `.env` または実行環境の `DATABASE_URL` を確認できるまでDB操作を行わない
2. 接続先確認後、migrationとseedを対象環境へ適用
3. 認証済みユーザーで十賢者目標を登録
4. 下書きプレビュー、一括保存、後戻り、目標中継点queryを実DBで確認
5. 360px、768px、1280pxで実画面を確認
6. 発見した問題を修正後、再度test、typecheck、buildを実行

現時点でコード上の既知ブロッカーはない。DB接続先を確認できない間は、migration、seed、本番デプロイ、実データを使う動作確認を行わない。

## 5. 再開時の確認

```bash
git status --short
npm test
npm run typecheck
```

ユーザー所有の既存文書変更を破棄しないこと。`dist/`、`dist-server/`、生成Prisma Clientは直接編集しない。
再開時は最初に本書の停止・再開ルールと最新状況を読み、DB接続先が確認できるまでDB操作を行わない。
