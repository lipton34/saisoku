# Codex指示書：Phase 4 DBマスタ運用準備

AGENTS.md の指示に従ってください。

Phase 3 で、キャラ・武器・召喚石の detail JSON に `masterId` を併存保存できるようになりました。

ジョブについては、現時点では `protagonistJob: string` のまま据え置きます。  
今回、ジョブの `masterId` 保存や `protagonistJobDetails` の追加は行わないでください。

今回は Phase 4 として、DBマスタの運用準備を進めてください。

目的は、今後キャラ・武器・召喚石・素材・クエストのマスタ件数を増やしていけるように、seedデータとマスタ追加手順を整理することです。

今回は投稿フォームUIの大幅変更や Prisma schema 変更は行わないでください。

---

## 1. 前提

Phase 1〜3で以下は完了済みです。

- `GbfMasterItem` / `GbfMasterAlias` のDBテーブル追加
- 既存 `buildMasters.ts` 相当の初期マスタ33件を seed 化
- `GET /api/build-masters` の追加
- フロント側で DBマスタ優先 + `buildMasters.ts` fallback 併用
- `byId` / `byKindAndName` / `byKind` / `byKindAndAlias` の Map 化
- キャラ・武器・召喚石の detail JSON に `masterId` を併存保存
- `name` 保存は維持
- 自由入力時は `masterId: null`
- 既存投稿互換は維持

---

## 2. 今回やってほしいこと

### 2.1 seedデータ構造の確認・整理

現在の以下を確認してください。

- `server/data/gbfMasterSeed.ts`
- `prisma/seed.ts`
- `src/lib/buildMasters.ts`
- `GbfMasterItem` / `GbfMasterAlias` の型

今後、マスタ件数が増えても管理しやすい構造になっているか確認してください。

必要であれば、seedデータを以下のように種別ごとに分割してください。

```text
server/data/gbfMasterSeed/characters.ts
server/data/gbfMasterSeed/weapons.ts
server/data/gbfMasterSeed/summons.ts
server/data/gbfMasterSeed/jobs.ts
server/data/gbfMasterSeed/index.ts
```

ただし、既存の seed 実行方法を壊さないでください。

---

### 2.2 id 命名ルールを整理

今後マスタを増やす前提で、`id` の命名ルールを整理してください。

例：

```text
character: char-haaselia
weapon: weapon-opus-water
summon: summon-varuna
job: job-yamato
material: material-...
quest: quest-...
```

既存IDがある場合は、破壊的変更にならないよう注意してください。

ID変更が必要そうな場合は、今回は変更せず、課題として報告してください。

---

### 2.3 thumbnailPath ルールを整理

Supabase Storage の bucket は以下を使う想定です。

```text
gbf-asset
```

`thumbnailPath` は bucket より後ろの相対パスで統一してください。

例：

```text
characters/haaselia.webp
weapons/opus_water.webp
summons/varuna.webp
jobs/yamato.webp
materials/...
quests/...
```

フルURLは seed に直接持たせず、基本は `thumbnailPath` を使う方針にしてください。

ただし、既存の `thumbnailUrl` 対応は残してください。

---

### 2.4 aliases / tags / metadata の書き方を整理

マスタ追加時に迷わないよう、以下の扱いを整理してください。

- `aliases`
- `tags`
- `metadata`

#### キャラの例

```ts
aliases: ["ハーゼ", "ハーゼリーラ"],
tags: ["水", "十賢者", "高難度"],
metadata: {
  role: "support"
}
```

#### 武器の例

```ts
metadata: {
  weaponType: "刀",
  series: "オメガ"
}
```

#### クエストの例

```ts
metadata: {
  questGroup: "レヴァンス",
  difficulty: "HL",
  contentType: "周回・武器集め用"
}
```

#### 素材の例

```ts
metadata: {
  materialCategory: "強化素材";
}
```

---

### 2.5 マスタ追加手順ドキュメントを作成

`docs` 配下に、マスタ追加手順をまとめたMarkdownを作成してください。

ファイル名案：

```text
docs/13_gbf_master_data_operation.md
```

内容には以下を含めてください。

- マスタデータの管理場所
- seedデータの構成
- id 命名ルール
- kind の種類
- thumbnailPath の書き方
- Supabase Storage bucket の前提
- aliases の書き方
- tags の書き方
- metadata の書き方
- 画像が未準備の場合の扱い
- `npm run prisma:seed` の使い方
- 追加後の確認方法
- 注意点

---

### 2.6 seedの upsert 維持

既存どおり、seedは upsert で再実行可能な状態を維持してください。

以下を壊さないでください。

- `npm run prisma:seed`
- 既存33件の投入
- `GbfMasterItem` / `GbfMasterAlias`
- `GET /api/build-masters`
- fallback仕様

---

## 3. 今回やらないこと

以下は今回の対象外です。

- Prisma schema 変更
- migration 作成
- 投稿フォームUIの大幅変更
- `masterId` 保存仕様の変更
- ジョブの `masterId` 保存
- `protagonistJobDetails` の追加
- 既存投稿の一括移行
- 管理画面作成
- 画像アップロード機能
- Supabase Storage へのアップロード処理
- 外部サイトからの画像自動取得
- relation テーブル追加
- 素材・クエストの本格データ投入

---

## 4. 確認してほしいこと

可能であれば以下を実行してください。

```bash
npm run prisma:seed
npm run typecheck
npm run build
```

また、可能であれば以下も確認してください。

- `GET /api/build-masters` が従来どおり動く
- `itemCount` が変に減っていない
- alias がある場合に投入できる
- fallback仕様が壊れていない
- 投稿フォームの候補表示が壊れていない

---

## 5. 完了報告でまとめてほしいこと

完了後は以下を簡潔に報告してください。

1. 変更したファイル
2. seedデータ構造の整理内容
3. id 命名ルール
4. thumbnailPath ルール
5. aliases / tags / metadata の扱い
6. 作成したドキュメント
7. 既存仕様に影響がないこと
8. 実行した確認コマンドと結果
9. Phase 5で対応すべきこと

---

```

```
