# Codex指示書：キャラ・武器・召喚石サムネイル画像対応 v2

## 0. このドキュメントの目的

このドキュメントは、saisoku の高難易度向け編成共有機能において、キャラ・武器・召喚石のサムネイル画像を投稿フォームUIへ反映するための作業指示です。

今回の作業は、画像アップロード機能の実装ではありません。

目的は、ユーザー側で用意したキャラ・武器・召喚石のマスタデータと Supabase Storage 上の WebP サムネイル画像を、既存の投稿フォームUIに安全に反映することです。

---

# 1. 前提方針

saisoku の画像方針は以下です。

- 画像投稿中心にはしない
- 編成スクリーンショットの大量投稿はしない
- キャラ・武器・召喚石の小型サムネイルとして画像を扱う
- 外部攻略サイトや外部画像URLへ直接依存しない
- 画像は saisoku 側で自前保持する
- Supabase Storage に WebP 形式で配置する
- Supabase Free の範囲で軽量に運用する
- サムネイルがない場合でもUIが壊れないようにする
- MVPでは全キャラ・全武器・全召喚石の完全網羅は目指さない

---

# 2. Supabase URL と秘密情報の扱い

## 2.1 Supabase Public URL の扱い

Supabase Storage の Public URL に含まれる project ref 部分は、画像表示に必要な公開URLの一部であり、秘密情報としては扱いません。

例：

```text
https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails/characters/haaselia.webp
```

この `xxxxx.supabase.co` の部分は、Public bucket の画像をブラウザで表示するために必要な公開情報です。

ただし、Public bucket のファイルは URL を知っている人がアクセスできる前提です。  
そのため、Public bucket には公開されても問題ない小型サムネイルのみを置いてください。

## 2.2 絶対に含めてはいけない秘密情報

以下は絶対にマスタCSV、フロントエンドコード、公開リポジトリに含めないでください。

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
DATABASE_URL
DB password
JWT secret
管理者用APIキー
管理画面ログイン情報
```

特に `SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスできるため、フロントエンドやCSVに含めてはいけません。

## 2.3 thumbnail_url と thumbnail_path の方針

MVPでは、CSVに `thumbnail_url` として Supabase Storage の Public URL を直接持たせても構いません。

例：

```csv
id,name,element,category,thumbnail_url
haaselia,ハーゼリーラ,水,十賢者,https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails/characters/haaselia.webp
```

ただし、将来的に Supabase project や bucket 名が変わる可能性を考えると、より望ましいのは CSV には相対パスのみを持たせる方式です。

推奨方式：

```csv
id,name,element,category,thumbnail_path
haaselia,ハーゼリーラ,水,十賢者,characters/haaselia.webp
gabriel,ガブリエル,水,リミテッド,characters/gabriel.webp
```

アプリ側では、環境変数で定義した base URL と結合して `thumbnailUrl` を生成します。

例：

```text
VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL=https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails
```

```ts
thumbnailUrl = `${baseUrl}/${thumbnail_path}`;
```

## 2.4 今回の実装方針

今回の実装では、以下の両方に対応できるようにしてください。

```text
thumbnail_url がある場合：そのURLを優先して使う
thumbnail_path がある場合：環境変数の base URL と結合して thumbnailUrl を作る
どちらもない場合：プレースホルダー表示にする
```

優先順位は以下です。

```text
1. thumbnail_url / thumbnailUrl
2. thumbnail_path / thumbnailPath + VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL
3. プレースホルダー
```

ただし、実装を複雑にしすぎないでください。  
既存データ構造に合わせて、必要最小限で対応してください。

---

# 3. ユーザー側で用意すること

Codex作業前または並行して、ユーザー側で以下を用意します。

## 3.1 Supabase Storage の画像配置

Supabase Storage に、キャラ・武器・召喚石の WebP サムネイル画像を配置します。

想定する bucket 例：

```text
gbf-thumbnails
```

想定するフォルダ構成例：

```text
gbf-thumbnails/
  characters/
    haaselia.webp
    gabriel.webp
  weapons/
    opus_water.webp
    omega_katana.webp
  summons/
    varuna.webp
    beelzebub.webp
    yachima.webp
```

## 3.2 Supabase Bucket 設定

サムネイル表示用なので、基本は以下の設定を想定します。

```text
Public bucket: ON
Restrict file size: ON
Restrict MIME types: ON
Allowed MIME types: image/webp
```

ファイルサイズ制限の目安：

```text
100KB〜200KB 程度
```

画像サイズの目安：

```text
128px〜256px 四方程度
```

1枚あたりの容量目標：

```text
50KB前後
```

## 3.3 画像形式

画像は WebP に統一します。

```text
拡張子: .webp
MIME type: image/webp
```

JPG / PNG が混在している場合は、事前に WebP へ変換します。

## 3.4 Public URL または Public base URL の確認

Supabase Storage に配置した画像について、Public URL が取得できる状態にしておきます。

フルURL方式の例：

```text
https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails/characters/haaselia.webp
```

base URL + path 方式の例：

```text
VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL=https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails
thumbnail_path=characters/haaselia.webp
```

## 3.5 マスタデータCSVの用意

キャラ・武器・召喚石のマスタCSVを用意します。

MVPでは全件網羅ではなく、高難易度・レヴァンス周回でよく使うものを優先します。

想定ファイル例：

```text
docs/master_data/characters.csv
docs/master_data/weapons.csv
docs/master_data/summons.csv
```

または、既存の配置ルールがある場合はそれに合わせます。

## 3.6 CSVの推奨カラム

### 推奨：thumbnail_path方式

#### characters.csv

```csv
id,name,element,category,thumbnail_path
haaselia,ハーゼリーラ,水,十賢者,characters/haaselia.webp
gabriel,ガブリエル,水,リミテッド,characters/gabriel.webp
```

#### weapons.csv

```csv
id,name,element,category,thumbnail_path
opus_water,終末武器,水,終末武器,weapons/opus_water.webp
omega_katana,オメガ刀,水,オメガ武器,weapons/omega_katana.webp
```

#### summons.csv

```csv
id,name,element,category,thumbnail_path
varuna,ヴァルナ,水,神石,summons/varuna.webp
beelzebub,ベルゼバブ,闇,高難度向け,summons/beelzebub.webp
```

### 許容：thumbnail_url方式

#### characters.csv

```csv
id,name,element,category,thumbnail_url
haaselia,ハーゼリーラ,水,十賢者,https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails/characters/haaselia.webp
gabriel,ガブリエル,水,リミテッド,https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails/characters/gabriel.webp
```

## 3.7 IDの方針

`id` は安定した値にしてください。

避けたいもの：

```text
- 日本語名そのまま
- 表記ゆれしやすい文字列
- 画像URLそのもの
- 並び順に依存する番号だけ
```

推奨：

```text
- 英数字小文字
- snake_case
- 変更されにくい識別子
```

例：

```text
haaselia
gabriel
varuna
beelzebub
omega_katana
opus_water
```

## 3.8 画像が未準備のデータ

画像がまだないキャラ・武器・召喚石は、`thumbnail_url` / `thumbnail_path` を空欄にして構いません。

アプリ側ではプレースホルダー表示にしてください。

例：

```csv
id,name,element,category,thumbnail_path
unknown_weapon,水属性の奥義寄せ武器,水,自由入力,
```

---

# 4. Codexに依頼する作業範囲

Codex側では、以下を実装・確認してください。

## 4.1 既存マスタデータ構造の確認

まず、現在のキャラ・武器・召喚石マスタがどこで定義・取得されているか確認してください。

確認対象例：

- `src/components/BuildFormSteps.tsx`
- `src/pages/BuildsPage.tsx`
- master data 関連ファイル
- seed data
- Prisma seed
- API response
- static data
- CSV読み込み処理

検索キーワード例：

```text
characters
weapons
summons
thumbnail
thumbnailUrl
thumbnail_url
thumbnailPath
thumbnail_path
imageUrl
master
PartCandidate
PartThumbnail
PartSlot
```

## 4.2 thumbnail_url / thumbnail_path の取り込み

マスタデータに `thumbnail_url` または `thumbnail_path` を持たせ、投稿フォームの候補カードと選択済みスロットで表示できるようにしてください。

既存の型定義が camelCase なら、アプリ内では以下に寄せて構いません。

```ts
thumbnailUrl?: string
thumbnailPath?: string
```

CSVでは `thumbnail_url` / `thumbnail_path`、TypeScriptでは `thumbnailUrl` / `thumbnailPath` に変換する形で問題ありません。

## 4.3 base URL 環境変数の扱い

`thumbnail_path` 方式に対応するため、必要であれば以下の環境変数を利用してください。

```text
VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL
```

例：

```text
VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL=https://xxxxx.supabase.co/storage/v1/object/public/gbf-thumbnails
```

注意：

- この base URL は秘密情報ではない
- ただし service role key などの秘密情報は絶対に含めない
- `.env.example` にキー名だけ追加してもよい
- 実際の値を公開したくない場合は `.env.local` で管理する
- 既存の環境変数命名ルールがある場合はそれに合わせる

## 4.4 thumbnailUrl 生成ルール

以下のような正規化関数を作っても構いません。

```ts
function resolveThumbnailUrl(item: {
  thumbnailUrl?: string;
  thumbnail_url?: string;
  thumbnailPath?: string;
  thumbnail_path?: string;
}) {
  const directUrl = item.thumbnailUrl ?? item.thumbnail_url;
  if (directUrl) return directUrl;

  const path = item.thumbnailPath ?? item.thumbnail_path;
  const baseUrl = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL;

  if (!path || !baseUrl) return "";

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
```

ただし、render のたびに全件へ重い変換をかけないでください。  
マスタ読み込み時や `useMemo` 内など、必要最小限のタイミングで正規化してください。

## 4.5 外部画像URLに直接依存しない

外部攻略サイトの画像URLを直接参照する実装にはしないでください。

使用してよい画像URLは、ユーザーが用意した Supabase Storage の Public URL、または環境変数 base URL + `thumbnail_path` から生成したURLです。

以下は禁止です。

- GameWith画像URLを直接表示
- 神ゲー攻略画像URLを直接表示
- GBF Wiki画像URLを直接表示
- 外部サイトからアプリ実行時に画像をスクレイピング
- 候補選択時に外部サイトへ画像取得しに行く

---

# 5. サムネイル表示コンポーネントの要件

既存の `PartThumbnail` 相当のコンポーネントがある場合は、それを利用・整理してください。

要件：

- `thumbnailUrl` がある場合は画像を表示
- `thumbnailUrl` が空の場合はプレースホルダー表示
- 画像読み込みエラー時もプレースホルダー表示
- `alt` には名前を入れる
- `width` / `height` を指定する
- 候補一覧では `loading="lazy"` を使う
- 選択済みスロットでは、必要であれば `loading="eager"` または指定なしでもよい
- 画像の読み込み完了を待たずに名前は即時表示する
- 画像URLが壊れていても、UI全体が崩れない

---

# 6. 候補カードでの表示

キャラ・武器・召喚石の候補カードでは、以下を表示してください。

- サムネイル
- 名称
- 属性
- 種別 / カテゴリ

画像がない場合でもカードの高さ・幅が崩れないようにしてください。

---

# 7. 選択済みスロットでの表示

キャラ・武器・召喚石の選択済みスロットでは、以下を表示してください。

- サムネイル
- 名称
- 属性
- 重要度など既存の補足情報

未選択枠では、画像ではなく「＋」またはプレースホルダー表示で構いません。

---

# 8. 自由入力時の扱い

候補にないキャラ・武器・召喚石を自由入力した場合、サムネイルは存在しない想定です。

この場合は必ずプレースホルダー表示にしてください。

自由入力値で画像取得を試みたり、外部検索したりしないでください。

---

# 9. 既存の固定スロット仕様を維持する

以下の仕様は変更しないでください。

```text
キャラ：主人公1枠、フロント3枠、サブ2枠 / 5枠
武器：10枠 / 13枠
召喚石：メイン1枠、フレンド1枠、サブ6枠
候補一覧：2列、最大10件、ページネーション
```

---

# 10. パフォーマンスに配慮する

画像表示によりクリック反応が重くならないようにしてください。

要件：

- img に `width` / `height` を指定する
- 画像の有無でカードサイズが変わらないようにする
- 候補一覧画像は lazy load でよい
- 選択済みスロットでは、名前は即時表示する
- 画像エラー時に何度も再読み込みし続けない
- 画像URL変換処理を render ごとに重く実行しない
- master id から候補を引く場合は Map を利用する既存方針を維持する

---

# 11. プレースホルダー方針

画像がない、または読み込みに失敗した場合は、プレースホルダーを表示してください。

プレースホルダーは画像ファイルを新規追加しなくても、CSSで表現して構いません。

例：

```text
?
NO IMAGE
アイコン風のグレー枠
```

要件：

- カードサイズが変わらない
- 破損画像アイコンを見せない
- 自由入力でも自然に見える
- キャラ・武器・召喚石で共通利用できる

---

# 12. 確認してほしい動作

実装後、以下を確認してください。

## 候補一覧

- キャラ候補にサムネイルが表示される
- 武器候補にサムネイルが表示される
- 召喚石候補にサムネイルが表示される
- `thumbnailUrl` が空の場合、プレースホルダーになる
- `thumbnailPath` があり、base URL がある場合、画像URLが生成される
- `thumbnailPath` があっても base URL がない場合、プレースホルダーになる
- 画像URLが壊れている場合、プレースホルダーになる
- 候補一覧の2列・最大10件・ページネーションが維持される

## 選択済みスロット

- 候補をクリックすると、選択済みスロットにサムネイルが表示される
- 画像がなくても名前は表示される
- 自由入力したパーツではプレースホルダー表示になる
- 選択済みスロットのサイズが画像有無で崩れない

## パフォーマンス

- 候補クリック時に画像読み込み待ちで名前表示が遅れない
- 候補検索やページネーションが重くならない
- サムネイル画像の有無でレイアウトシフトが起きない

---

# 13. 実行してほしい確認コマンド

可能であれば以下を実行してください。

```bash
npm run typecheck
npm run build
```

frontend / backend に分かれている場合は、該当ディレクトリで実行してください。

---

# 14. 完了報告でまとめてほしいこと

作業完了後、以下を簡潔に報告してください。

1. 変更したファイル
2. 現在のマスタデータがどこで管理されていたか
3. `thumbnail_url` / `thumbnail_path` をどのように取り込んだか
4. 環境変数 `VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL` を使ったか
5. 候補カードでの画像表示対応内容
6. 選択済みスロットでの画像表示対応内容
7. プレースホルダー対応内容
8. 画像読み込みエラー時の対応内容
9. 自由入力時の画像扱い
10. パフォーマンス面で配慮したこと
11. 実行した確認コマンドと結果
12. ユーザー側で追加準備が必要なこと

---

# 15. 今回やらなくてよいこと

以下は今回の対象外です。

- 画像アップロード機能
- 管理画面からの画像登録機能
- 外部サイトからの自動画像取得
- 外部画像URLへの直接依存
- 全キャラ・全武器・全召喚石の完全網羅
- 高解像度画像表示
- 編成スクリーンショット投稿機能
- Supabase Storage へのファイルアップロード処理
- 画像変換処理
- Prisma schema の大規模変更

---

# Codexに渡す短文指示

```text
AGENTS.md の指示に従ってください。

今回の作業は、キャラ・武器・召喚石のサムネイル画像対応です。

まず、以下の指示書を確認してください。

- docs/11_master_thumbnail_image_integration_v2.md

今回の前提は以下です。

- 画像は Supabase Storage の Public bucket に WebP 形式で配置する
- 外部攻略サイトの画像URLには直接依存しない
- Supabase Public URL の project ref 部分は秘密情報ではない
- ただし service role key、DATABASE_URL、JWT secret などの秘密情報は絶対にフロントエンドやCSVに含めない
- CSVには `thumbnail_url` のフルURL、または `thumbnail_path` の相対パスを持たせる
- 推奨は `thumbnail_path` + `VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL` で `thumbnailUrl` を生成する方式
- 既存データに `thumbnail_url` がある場合はそれも扱えるようにする

Codex側では、既存の投稿フォームUIに対して、マスタデータの `thumbnail_url` / `thumbnail_path` を候補カードと選択済みスロットに表示できるようにしてください。

重視してほしい点は以下です。

- `thumbnail_url` がある場合はそのURLを使う
- `thumbnail_path` がある場合は `VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL` と結合して使う
- どちらもない場合はプレースホルダー表示にする
- 画像読み込みエラー時もプレースホルダー表示にする
- 自由入力したキャラ・武器・召喚石はプレースホルダー表示にする
- 候補一覧ではサムネイル、名称、属性、カテゴリを表示する
- 選択済みスロットでもサムネイルと名称を表示する
- img には width / height を指定し、レイアウトシフトを防ぐ
- 候補一覧の2列・最大10件・ページネーション仕様は維持する
- 固定スロット仕様は維持する
- 保存形式、API、Prisma schema は不要に変更しない

今回の対象外は以下です。

- 画像アップロード機能
- 外部サイトからの画像自動取得
- Supabase Storage へのアップロード処理
- 画像変換処理
- 全件網羅
- 高解像度画像表示

可能であれば以下を実行してください。

npm run typecheck
npm run build

完了後は、変更したファイル、マスタデータの場所、thumbnailUrlの取り込み方法、候補カード・選択済みスロットでの画像表示、プレースホルダー対応、画像エラー対応、確認コマンド結果を簡潔に報告してください。
```
