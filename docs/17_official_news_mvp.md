# 公式NEWS取得機能 MVP設計メモ

## 目的

公式NEWSを `rcms-api` から低頻度で取得し、saisoku側で後から扱いやすいメタ情報として保存する。

このMVPでは画面表示、通知、カレンダー表示は行わない。取得・分類・保存・再解析までを対象にする。

## 方針

- HTMLスクレイピングやPlaywrightは本実装に使わない。
- 公式本文全文、HTML全文、JSON全文、公式画像はDB保存しない。
- `content` は分類、期間抽出、`contentHash` 生成にのみ使う。
- DBに保存するのは公式URL、記事ID、タイトル、公開日時、カテゴリ、分類、本文ハッシュ、抽出した開催期間候補などに限定する。
- APIアクセスは手動実行コマンドによる少数リクエストに限定する。
- 通常運用では最新NEWSと当月周辺だけを軽く取得し、全期間の過去記事を自動巡回しない。
- 過去記事は必要な月を指定した場合のみ手動バックフィルする。

## 取得範囲とページネーション

- `latest`
  - 最新確認用の軽量取得。
  - デフォルトは1ページのみ。
  - `--max-pages` 指定時も最大2ページまでに抑える。
  - 全ページ取得には使わない。
- `month`
  - 指定月のみを対象にする。
  - `pageInfo.totalPageCnt` を見て、指定月内の全ページを取得できる。
  - `--max-pages` 指定時はそのページ数で停止する。
  - 指定月以外へ範囲を広げない。
- `range`
  - MVPでは作らない。
  - 必要になったら複数月の手動バックフィルとして別途追加する。

## 利用API

- base: `https://granbluefantasy.com/rcms-api`
- apiId: `1`
- NEWS一覧: `/news`
- カテゴリナビ: `/news-nav`
- カテゴリ別NEWS: `/categorized-news`
- 月別アーカイブ: `/news-archive`
- 記事詳細: `/news/details/{id}`

## 追加テーブル

- `source_articles`
  - 公式記事のメタ情報を保存する。
  - `contentHash` は差分検出用で、本文自体は保存しない。
- `official_news_categories`
  - `news-nav` のカテゴリID、slug、表示名を保存する。
- `extracted_news_items`
  - 詳細本文から抽出したNEWS項目を保存する。
  - イベント、キャンペーン、アップデート、ガチャ、メンテナンスなどを同じ器で扱う。
  - MVPでは1記事1件の抽出候補から始め、将来的に「これグラ」などから複数項目を抽出できる形にする。
- `news_fetch_logs`
  - 手動取得の実行種別、対象期間、取得件数、新規件数、更新件数、失敗件数、エラーを保存する。

## 記事分類

分類値:

- `monthly_plan`
- `event`
- `campaign`
- `update`
- `gacha`
- `character`
- `media`
- `maintenance`
- `other`

分類はタイトルとカテゴリslugを使うルールベース。MVPでは誤分類を完全に防ぐより、後続で補正しやすい保存形式を優先する。

## NEWS項目抽出

詳細 `content` を一時的にテキスト化し、以下を候補として抽出する。

- `item_type`
- タイトル候補
- イベント種別候補
- 開催開始日時
- 開催終了日時
- 更新日時候補
- `raw_date_text`
- `summary`
- `info_status`
- `extraction_confidence`
- `tags`
- `related_key`

対象にする主な表現:

- `開催期間`
- `実施期間`
- `提供期間`
- `販売期間`
- `交換期間`
- `YYYY/MM/DD HH:mm ～ YYYY/MM/DD HH:mm`
- `M/D HH:mm ～ M/D HH:mm`

`item_type` は `event`, `campaign`, `update`, `monthly_plan_item`, `gacha`, `character`, `maintenance`, `other` を扱う。

`event_type` はイベント系のみ使用し、判定できない場合は `unknown` にする。

`info_status` は `confirmed`, `scheduled`, `tentative`, `unknown` を扱う。

## 手動実行

通常運用では cron や Render Cron Job は使わず、画面ボタンから手動で取得する。

- `/official-news`
  - 最新NEWS取得
  - 指定月NEWS取得
  - 指定記事の再解析
- `/event-schedule`
  - 簡易操作として最新NEWS取得のみ

取得したNEWSは自動的に `event_occurrences` へ登録しない。必要な抽出項目だけを `/official-news` から「イベント予定に登録」する。

全期間取得は行わない。過去記事は必要な月だけ指定して取得する。

CLIコマンドは開発・確認用として残す。

```bash
npm run news:fetch:latest
npm run news:fetch:latest -- --max-pages 2
npm run news:fetch:month -- 202605
npm run news:fetch:month -- 2026-05
npm run news:fetch:month -- 2026-05 --max-pages 2
npm run news:reanalyze -- 9690
```

CLI出力には `fetchedPages`, `totalPageCnt`, `maxPages`, `targetMonth` を含める。

## 本実装で使う主な保存項目

- `topics_id` -> `source_article_id`
- `slug`
- `subject` -> `title`
- `ymd` + `post_time` -> `published_at`
- `categories[].module_id` -> `category_ids`
- `news-nav.categories[].slug` -> `category_slugs`
- `content` -> 保存せず、`content_hash` と抽出処理のみ

## 今後の拡張候補

- 取得済み記事の差分確認バッチ
- 管理画面での抽出結果レビュー
- 手動補正済み分類の保持
- 表示画面、カレンダー表示、通知

## モバイル再編後の配置

2026-07-25のモバイル再編後も、公式NEWSの取得、保存、再解析、イベント予定への登録、CLI、DB構造は維持する。下部ナビゲーションの「保管庫」から公式NEWSカードを選び、従来の `/official-news` を開く。保管庫へ戻るための専用リンクは画面内に追加せず、共通シェルのナビゲーションを使用する。
