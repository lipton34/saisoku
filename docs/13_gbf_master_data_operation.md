# GBFマスタデータ運用手順

## 1. 目的

この文書は、キャラ・武器・召喚石・ジョブ・素材・クエストのマスタデータを安全に追加・更新するための運用手順です。

saisoku では、投稿データの `name` 保存を維持しつつ、キャラ・武器・召喚石の detail JSON に `masterId` を併存保存します。マスタは DB を優先し、取得できない場合は `src/lib/buildMasters.ts` の fallback を使います。

## 2. 管理場所

DB投入用 seed は以下で管理します。

```text
server/data/gbfMasterSeed/
```

現在の構成:

```text
server/data/gbfMasterSeed/types.ts
server/data/gbfMasterSeed/jobs.ts
server/data/gbfMasterSeed/characters.ts
server/data/gbfMasterSeed/summons.ts
server/data/gbfMasterSeed/weapons.ts
server/data/gbfMasterSeed/index.ts
```

`prisma/seed.ts` は `server/data/gbfMasterSeed/index.ts` から `gbfMasterSeedItems` を読み込み、`upsert` で DB に投入します。

## 3. kind の種類

`GbfMasterKind` は以下を想定します。

```text
character
weapon
summon
job
material
quest
```

現時点の投稿フォーム候補で使うのは `character` / `weapon` / `summon` / `job` です。素材・クエストは今後の追加対象ですが、本格投入や relation 設計は別フェーズで行います。

## 4. id 命名ルール

`id` は投稿 detail JSON の `masterId` として保存されるため、原則として後から変更しません。

推奨形式:

```text
character: char-<slug>
weapon: weapon-<slug>
summon: summon-<slug>
job: job-<slug>
material: material-<slug>
quest: quest-<slug>
```

例:

```text
char-haaselia
weapon-dark-opus
summon-varuna
job-yamato
material-example
quest-mugen-hl
```

ルール:

- ASCII lowercase と `-` を使う
- 日本語名をそのまま id にしない
- 同じ種類内で重複させない
- 既存 id は変更しない
- 表記ゆれや略称は `aliases` に入れる

既存IDに改善余地があっても、投稿済みデータとの互換性を優先し、変更せず別途課題として扱います。

## 5. thumbnailPath ルール

Supabase Storage bucket は以下を前提にします。

```text
gbf-asset
```

`thumbnailPath` は bucket より後ろの相対パスだけを書きます。seed にフルURLは基本的に書きません。

推奨形式:

```text
characters/<slug>.webp
weapons/<slug>.webp
summons/<slug>.webp
jobs/<slug>.webp
materials/<slug>.webp
quests/<slug>.webp
```

例:

```text
characters/haaselia.webp
weapons/dark-opus.webp
summons/varuna.webp
jobs/yamato.webp
```

画像が未準備の場合は `thumbnailPath` を省略します。UI は従来どおりプレースホルダー表示に fallback します。

`thumbnailUrl` は例外的な直接URL用に残しますが、通常運用では `thumbnailPath` を使います。

## 6. aliases の書き方

`aliases` は検索・表記ゆれ吸収用です。正式名称そのものを大量に重複させる必要はありません。

例:

```ts
aliases: ["ハーゼ", "ハーゼリーラ"]
```

ルール:

- 略称、俗称、表記ゆれを入れる
- 空文字を入れない
- 同じ item 内で重複させない
- 別 item と紛らわしい alias は避ける

seed 実行時、alias は `normalizedAlias` に正規化され、`GbfMasterAlias` に upsert されます。

## 7. tags の書き方

`tags` は候補表示・絞り込み・簡易分類に使います。

例:

```ts
tags: ["水", "十賢者", "高難度"]
tags: ["リミテッド", "周回"]
tags: ["神石", "メイン"]
```

ルール:

- UIで見せても自然な短い語にする
- 属性、シリーズ、用途、カテゴリを入れる
- 細かすぎる内部情報は `metadata` に入れる
- 外部サイト由来の説明文や攻略文を丸ごと入れない

## 8. metadata の書き方

`metadata` は kind ごとの差分項目を入れる場所です。何でも入れすぎず、検索や表示に使う項目を中心にします。

武器:

```ts
metadata: {
  weaponType: "刀",
  series: "オメガ"
}
```

キャラ:

```ts
metadata: {
  role: "support"
}
```

クエスト:

```ts
metadata: {
  questGroup: "レヴァンス",
  difficulty: "HL",
  contentType: "周回・武器集め用"
}
```

素材:

```ts
metadata: {
  materialCategory: "強化素材"
}
```

ルール:

- キー名は英語の camelCase にする
- 値はできるだけ string / number / boolean / string[] に留める
- relation 的な情報は、将来 relation テーブルを追加するまで最小限にする

## 9. 追加手順

1. 対象 kind の seed ファイルを開く
   - キャラ: `server/data/gbfMasterSeed/characters.ts`
   - 武器: `server/data/gbfMasterSeed/weapons.ts`
   - 召喚石: `server/data/gbfMasterSeed/summons.ts`
   - ジョブ: `server/data/gbfMasterSeed/jobs.ts`

2. `GbfMasterSeedItem` を追加する

3. `id` が命名ルールに合っているか確認する

4. 画像がある場合は `thumbnailPath` を相対パスで書く

5. 必要に応じて `aliases` / `tags` / `metadata` を追加する

6. seed を実行する

```bash
npm run prisma:seed
```

7. 型チェックとビルドを実行する

```bash
npm run typecheck
npm run build
```

8. ログイン済み状態で `GET /api/build-masters` を確認する

確認観点:

- itemCount が想定件数になっている
- 既存33件が消えていない
- 追加した item の `id` / `kind` / `name` が正しい
- alias を追加した場合は aliases に返ってくる
- 投稿フォーム候補表示が空になっていない

## 10. seed の注意点

`npm run prisma:seed` は upsert です。既存 `id` の item は更新され、新しい `id` は追加されます。

注意:

- `id` を変えると別 item として追加される
- 既存 id の変更は、投稿済み `masterId` との互換性を壊す可能性がある
- seed から削除しても、現在の seed 処理では DB 上の既存 item を自動削除しない
- 使わなくなった item は、削除ではなく `isActive` 運用を検討する
- フルURLを直接持たせるより `thumbnailPath` を優先する

## 11. 今回まだ扱わないこと

以下は別フェーズで対応します。

- ジョブの `masterId` 保存
- `protagonistJobDetails` の追加
- 素材・クエストの本格データ投入
- relation テーブル
- 管理画面
- 画像アップロード機能
- 既存投稿の一括移行
