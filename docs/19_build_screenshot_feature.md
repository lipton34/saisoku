# 編成スクショアップロード Phase 1 実装メモ

## 目的

既存の編成投稿機能に、編成スクショを最大5枚まで添付できる導線を追加する。

選択式のキャラ・武器・召喚石入力は維持し、スクショは入力負荷を下げるための補助情報として扱う。

## 対象外

- 画像圧縮やwebp変換のサーバー処理
- 5枚を超える大量スクショ保存
- 編成スクショの一覧大表示
- 外部サイト画像の取り込み
- 投稿コピー時のStorage画像複製

## DB変更

`BuildPostImage` を追加し、`BuildPost` と1対多で紐づける。

主な保存項目:

- 画像種別
- Storage bucket
- Storage path
- public URL
- 元ファイル名
- MIME type
- ファイルサイズ
- 表示順

## API変更

`/api/builds/:id/images` 以下に画像操作APIを追加した。

- `GET /api/builds/:id/images`
- `POST /api/builds/:id/images`
- `PATCH /api/builds/:id/images/:imageId`
- `DELETE /api/builds/:id/images/:imageId`

アップロードは `multipart/form-data` で受け付ける。

制限:

- 1編成最大5枚
- 1ファイル最大5MB
- `image/jpeg`
- `image/png`
- `image/webp`

保存先は `SUPABASE_BUILD_SCREENSHOT_BUCKET` を優先し、未設定時は `gbf-build-screenshots` を使う。

## 画面変更

編成投稿・編集フォームの Step 5 に「編成スクショ」セクションを追加した。

- 画像追加
- アップロード前プレビュー
- 画像種別選択
- 既存画像の種別変更
- 既存画像の削除

編成詳細画面には「スクショ」セクションを追加し、種類別に画像を表示する。

編成一覧カードでは、軽量化のため画像そのものは表示せず、`画像あり：n枚` のみ表示する。

## 環境変数

`.env.example` に以下を追加した。

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_BUILD_SCREENSHOT_BUCKET
```

`SUPABASE_SERVICE_ROLE_KEY` はStorageアップロードに使うため、フロントエンドへ公開しない。

## 今後の拡張余地

- 横幅1280px程度への縮小
- webp変換
- 並び順変更UI
- 投稿コピー時の画像複製
- 目標詳細や編成関連リンクとの連携
