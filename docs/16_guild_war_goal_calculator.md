# 16_古戦場目標計算機能_要件定義.md

## 1. 目的

saisoku に、古戦場期間中の貢献度目標を管理し、目標達成に必要な討伐数・肉数・討伐時間を計算できる機能を追加する。

この機能では、単に「何体倒せばよいか」を出すだけでなく、ユーザーが入力した討伐速度をもとに、どのHELLを周回するのが最も時間効率が良いかを判断できるようにする。

## 2. 背景

古戦場では、目標貢献度に対して以下を事前に見積もりたい。

- 全日程でどれくらいの貢献度を稼ぐ必要があるか
- 日程ごとにどれくらい稼ぐ必要があるか
- 各HELLを何体倒せば目標に届くか
- 必要な通常肉数はいくつか
- 250HELLを使う場合、専用素材がいくつ必要か
- 自分の討伐速度では、150HELL / 200HELL / 250HELL のどれが時間効率が良いか
- 150HELLがX分の場合、200HELLや250HELLは何分以内なら上回るか

saisoku は団内運用補助ツールであり、外部攻略サイトをそのまま保存するのではなく、団内向けに必要な値と計算結果を整理して扱う。

## 3. 実装方針

### 3.1 基本方針

- 古戦場の目標計算機能を新規追加する
- 既存の団内目標共有機能とは壊さず、別ページまたは別セクションとして追加する
- 古戦場ごとの貢献度・肉数はマスタとして扱う
- 外部サイトからの常時スクレイピングは行わない
- 初期値はアプリ側に固定値として持つか、DBの初期マスタとして登録する
- 将来的な仕様変更に備えて、ボスごとの値は定数ベタ書きではなく差し替え可能にする
- 計算結果は大きな数値を扱うため、貢献度は BigInt 相当で扱う

### 3.2 MVPでやること

- 全体目標貢献度を入力・保存・リセットできる
- 日程ごとに目標貢献度を入力できる
- 日程別目標合計と全体目標との差分を表示する
- 各日程の目標に対して、各HELLだけで達成する場合の必要討伐数を計算する
- 必要通常肉数を表示する
- 250HELLの専用素材必要数を通常肉とは別に表示する
- 各HELLの討伐速度を入力できる
- 討伐速度から貢献度/分・貢献度/時を計算する
- 時間効率ランキングを表示する
- 日程目標達成に必要な総討伐時間を表示する
- 150HELL基準、200HELL基準の損益分岐時間を表示する
- スマホ表示で表が崩れないよう、表部分は横スクロール可能にする

### 3.3 MVPでやらないこと

- ゲーム内データの自動取得
- 外部サイトからの常時スクレイピング
- 複数HELLを混ぜた最適配分の自動算出
- 肉集め時間まで含めた総合最適化
- 救援待ち時間、リザルト時間、硬直時間の厳密計算
- フルオート失敗率の考慮
- 団員ごとの目標割当
- 実績入力・進捗率管理
- ランキング機能
- 古戦場ボーダー予測

## 4. ボスマスタ初期値

初期マスタは以下とする。

> 注意: 古戦場の仕様変更により値が変わる可能性があるため、将来的にはイベントごとに編集・差し替えできる設計にする。

| 難易度 | 表示名 | 1体あたり貢献度 | 通常肉コスト | 250専用素材コスト | 備考 |
|---:|---|---:|---:|---:|---|
| 90 | 90HELL | 305000 | 5 | 0 | 予選・本戦序盤向け |
| 95 | 95HELL | 910000 | 10 | 0 | 本戦1日目以降 |
| 100 | 100HELL | 2680000 | 20 | 0 | 本戦向け |
| 150 | 150HELL | 4100000 | 20 | 0 | 100HELLより効率が高い |
| 200 | 200HELL | 20000000 | 20 | 0 | 通常肉での高効率枠 |
| 250 | 250HELL | 75000000 | 0 | 20 | 通常肉ではなく専用素材を使用 |

### 4.1 250HELLの扱い

250HELLは通常肉ではなく、90HELL〜200HELLからドロップする専用素材を使って自発する。

そのため、計算結果では以下を分けて表示する。

- 必要通常肉数
- 必要250専用素材数

250HELLを通常肉20個として扱わないこと。

## 5. 日程区分

MVPでは、開催日そのものではなく、古戦場内の日程ラベルとして扱う。

初期日程は以下。

| 表示順 | 日程ラベル | 初期目標貢献度 |
|---:|---|---:|
| 1 | 予選1日目 | 0 |
| 2 | 予選2日目 | 0 |
| 3 | インターバル | 0 |
| 4 | 本戦1日目 | 0 |
| 5 | 本戦2日目 | 0 |
| 6 | 本戦3日目 | 0 |
| 7 | 本戦4日目 | 0 |

将来的には、古戦場名・属性・開始日・終了日を持たせてもよい。

## 6. 入力項目

### 6.1 全体目標

| 項目 | 型 | 必須 | 内容 |
|---|---|---:|---|
| title | string | 任意 | 例: 2026年6月 火古戦場 |
| totalTargetContribution | bigint | 必須 | 全日程合計の目標貢献度 |
| memo | string | 任意 | 目標メモ |

### 6.2 日程別目標

| 項目 | 型 | 必須 | 内容 |
|---|---|---:|---|
| dayLabel | string | 必須 | 予選1日目、本戦1日目など |
| targetContribution | bigint | 必須 | 日程ごとの目標貢献度 |
| memo | string | 任意 | 日程ごとのメモ |

### 6.3 討伐速度

| 項目 | 型 | 必須 | 内容 |
|---|---|---:|---|
| bossLevel | number | 必須 | 90 / 95 / 100 / 150 / 200 / 250 |
| clearTimeMinutes | number | 任意 | 分 |
| clearTimeSeconds | number | 任意 | 秒 |
| playStyle | string | 任意 | 手動 / フルオート / セミオート / 未指定 |
| memo | string | 任意 | 編成メモ、安定度など |

内部保存時は `clearTimeSecondsTotal` のように秒単位へ正規化する。

例:

```text
3分30秒 = 210秒
12分00秒 = 720秒
```

## 7. 計算仕様

### 7.1 日程別目標合計

```text
dayTargetTotal = sum(day.targetContribution)
difference = totalTargetContribution - dayTargetTotal
```

表示例:

```text
全体目標: 15,000,000,000
日程別目標合計: 14,700,000,000
差分: 300,000,000
```

差分がある場合は、警告または補足メッセージを表示する。

### 7.2 必要討伐数

```text
requiredRuns = ceil(dayTargetContribution / bossContribution)
```

例:

```text
日程目標: 4,000,000,000
200HELL貢献度: 20,000,000

requiredRuns = ceil(4,000,000,000 / 20,000,000)
requiredRuns = 200
```

### 7.3 必要通常肉数

```text
requiredMeat = requiredRuns * meatCost
```

例:

```text
200HELL requiredRuns = 200
meatCost = 20

requiredMeat = 200 * 20
requiredMeat = 4,000
```

### 7.4 必要250専用素材数

```text
requiredSpecialMeat = requiredRuns * specialMeatCost
```

250HELL以外は `0` になる。

### 7.5 討伐速度から時間効率を計算

```text
clearTimeMinutes = clearTimeSecondsTotal / 60
contributionPerMinute = bossContribution / clearTimeMinutes
contributionPerHour = contributionPerMinute * 60
```

または秒単位で以下でもよい。

```text
contributionPerSecond = bossContribution / clearTimeSecondsTotal
contributionPerMinute = contributionPerSecond * 60
contributionPerHour = contributionPerSecond * 3600
```

### 7.6 必要総討伐時間

```text
requiredTotalBattleSeconds = requiredRuns * clearTimeSecondsTotal
```

表示時は、以下のように変換する。

```text
48時間48分
40時間00分
31時間30分
```

### 7.7 時間効率ランキング

討伐速度が入力されているHELLのみを対象に、以下の値で降順ソートする。

```text
contributionPerMinute
```

表示項目:

- 順位
- 難易度
- 討伐時間
- 貢献度/分
- 貢献度/時
- 操作タイプ
- メモ

### 7.8 損益分岐計算

基準HELLと比較先HELLの時間効率が等しくなる討伐時間を計算する。

```text
breakEvenSeconds = baseClearTimeSeconds * compareBossContribution / baseBossContribution
```

比較先HELLの実際の討伐時間が `breakEvenSeconds` 以下なら、比較先HELLの方が時間効率が良い。

#### 例: 150HELLが3分の場合、200HELLは何分以内ならよいか

```text
base = 150HELL
baseClearTimeSeconds = 180
baseBossContribution = 4,100,000
compareBossContribution = 20,000,000

breakEvenSeconds = 180 * 20,000,000 / 4,100,000
breakEvenSeconds = 878.04...
```

表示:

```text
150HELLが3分00秒の場合、200HELLは14分38秒以内なら150HELLより時間効率が良い
```

#### 例: 200HELLが12分の場合、250HELLは何分以内ならよいか

```text
base = 200HELL
baseClearTimeSeconds = 720
baseBossContribution = 20,000,000
compareBossContribution = 75,000,000

breakEvenSeconds = 720 * 75,000,000 / 20,000,000
breakEvenSeconds = 2700
```

表示:

```text
200HELLが12分00秒の場合、250HELLは45分00秒以内なら200HELLより時間効率が良い
```

## 8. 画面仕様

### 8.1 ページ名

候補:

```text
古戦場目標計算
```

URL候補:

```text
/guild-war-goals
/gw-goals
```

既存ルーティングに合わせる。

### 8.2 画面構成

画面は以下の順で構成する。

1. 全体目標入力
2. 日程別目標入力
3. 討伐速度入力
4. 目標との差分表示
5. 時間効率ランキング
6. 日程別の必要討伐数・必要肉数・必要総討伐時間
7. 損益分岐表
8. 注意書き

### 8.3 全体目標入力エリア

表示例:

```text
古戦場目標計算

古戦場名: [2026年6月 火古戦場]
全体目標貢献度: [15,000,000,000]

[保存] [リセット]
```

### 8.4 日程別目標入力エリア

表示例:

```text
日程別目標

予選1日目       [500,000,000]
予選2日目       [500,000,000]
インターバル    [0]
本戦1日目       [2,000,000,000]
本戦2日目       [3,000,000,000]
本戦3日目       [4,000,000,000]
本戦4日目       [5,000,000,000]
```

差分表示:

```text
全体目標: 15,000,000,000
日程別目標合計: 15,000,000,000
差分: 0
```

差分がある場合:

```text
日程別目標合計が全体目標より 300,000,000 少ないです
```

### 8.5 討伐速度入力エリア

表示例:

```text
討伐速度設定

90HELL      [0]分 [30]秒   操作: [手動]
95HELL      [1]分 [10]秒   操作: [手動]
100HELL     [2]分 [30]秒   操作: [手動]
150HELL     [3]分 [00]秒   操作: [手動]
200HELL     [12]分 [00]秒  操作: [フルオート]
250HELL     [35]分 [00]秒  操作: [フルオート]

[時間効率を計算]
```

### 8.6 時間効率ランキング

表示例:

```text
時間効率ランキング

1位 250HELL
討伐時間: 35分00秒
貢献度/分: 2,142,857
貢献度/時: 128,571,420

2位 200HELL
討伐時間: 12分00秒
貢献度/分: 1,666,666
貢献度/時: 100,000,000

3位 150HELL
討伐時間: 3分00秒
貢献度/分: 1,366,666
貢献度/時: 82,000,000
```

### 8.7 日程別計算結果

表示例:

```text
本戦3日目 目標: 4,000,000,000

難易度    必要討伐数    必要通常肉    必要250専用素材    討伐時間    必要総討伐時間
150HELL   976体         19,520        0                 3分00秒     約48時間48分
200HELL   200体         4,000         0                 12分00秒    約40時間00分
250HELL   54体          0             1,080             35分00秒    約31時間30分
```

討伐時間未入力の場合:

```text
未計算
```

### 8.8 損益分岐表

表示例:

```text
損益分岐

150HELLが3分00秒の場合:
- 200HELLは14分38秒以内なら、150HELLより時間効率が良い
- 250HELLは54分53秒以内なら、150HELLより時間効率が良い

200HELLが12分00秒の場合:
- 250HELLは45分00秒以内なら、200HELLより時間効率が良い
```

### 8.9 注意書き

画面下部に以下の注意書きを表示する。

```text
※時間効率は入力された討伐時間のみで計算しています。
※肉集め時間、救援待ち時間、リザルト時間、失敗率は含みません。
※250HELLは通常肉ではなく専用素材を使うため、通常肉とは別に表示しています。
※古戦場の仕様変更により、貢献度や必要素材数が変わる場合があります。
```

## 9. データ設計案

既存の Prisma 構成に合わせて追加する場合の案。

### 9.1 GuildWarGoalPlan

古戦場1回分の目標を管理する。

```prisma
model GuildWarGoalPlan {
  id                 String   @id @default(cuid())
  title              String
  targetContribution BigInt   @default(0)
  memo               String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  days               GuildWarGoalDay[]
  speeds             GuildWarBossSpeed[]
}
```

### 9.2 GuildWarGoalDay

日程別の目標を管理する。

```prisma
model GuildWarGoalDay {
  id                 String   @id @default(cuid())
  planId             String
  dayLabel           String
  targetContribution BigInt   @default(0)
  sortOrder          Int
  memo               String?

  plan               GuildWarGoalPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
}
```

### 9.3 GuildWarBossMaster

ボスごとの貢献度・必要素材数を管理する。

```prisma
model GuildWarBossMaster {
  id              String   @id @default(cuid())
  eventKey        String   @default("default")
  bossLevel       Int
  name            String
  contribution    BigInt
  meatCost        Int      @default(0)
  specialMeatCost Int      @default(0)
  isEnabled       Boolean  @default(true)
  sortOrder       Int

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([eventKey])
  @@unique([eventKey, bossLevel])
}
```

### 9.4 GuildWarBossSpeed

ユーザーが入力した討伐速度を管理する。

```prisma
model GuildWarBossSpeed {
  id                    String   @id @default(cuid())
  planId                String
  bossLevel             Int
  clearTimeSecondsTotal Int?
  playStyle             String?  // 手動 / フルオート / セミオート / 未指定
  memo                  String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  plan                  GuildWarGoalPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
  @@unique([planId, bossLevel])
}
```

## 10. フロントエンド実装方針

### 10.1 表示コンポーネント候補

既存構成に合わせて分割する。

```text
src/pages/GuildWarGoalsPage.tsx
src/components/guildWar/GuildWarGoalForm.tsx
src/components/guildWar/GuildWarDayTargetsTable.tsx
src/components/guildWar/GuildWarSpeedForm.tsx
src/components/guildWar/GuildWarEfficiencyRanking.tsx
src/components/guildWar/GuildWarCalculationResults.tsx
src/components/guildWar/GuildWarBreakEvenTable.tsx
src/lib/guildWarCalculations.ts
```

### 10.2 計算ロジック

計算ロジックは UI コンポーネントに直接書かず、以下のようなユーティリティに切り出す。

```text
src/lib/guildWarCalculations.ts
```

関数候補:

```ts
type GuildWarBoss = {
  bossLevel: number;
  name: string;
  contribution: bigint;
  meatCost: number;
  specialMeatCost: number;
};

type GuildWarSpeed = {
  bossLevel: number;
  clearTimeSecondsTotal?: number | null;
};

export function calculateRequiredRuns(
  targetContribution: bigint,
  bossContribution: bigint
): bigint;

export function calculateRequiredMeat(
  requiredRuns: bigint,
  meatCost: number
): bigint;

export function calculateRequiredSpecialMeat(
  requiredRuns: bigint,
  specialMeatCost: number
): bigint;

export function calculateContributionPerMinute(
  bossContribution: bigint,
  clearTimeSecondsTotal: number
): number;

export function calculateContributionPerHour(
  bossContribution: bigint,
  clearTimeSecondsTotal: number
): number;

export function calculateRequiredBattleSeconds(
  requiredRuns: bigint,
  clearTimeSecondsTotal: number
): bigint;

export function calculateBreakEvenSeconds(
  baseClearTimeSeconds: number,
  baseContribution: bigint,
  compareContribution: bigint
): number;
```

### 10.3 BigIntの扱い

貢献度・必要討伐数・必要肉数は大きな値になるため、可能な限り BigInt で扱う。

ただし、表示やAPIレスポンスでは JSON が BigInt を直接扱えないため、以下のどちらかに統一する。

- APIでは文字列として返す
- フロントで受け取った後に BigInt に変換する

例:

```ts
const contribution = BigInt(boss.contribution);
```

## 11. バックエンド/API案

既存の構成に合わせて実装する。

### 11.1 API候補

```text
GET    /api/guild-war-goals
POST   /api/guild-war-goals
GET    /api/guild-war-goals/:id
PATCH  /api/guild-war-goals/:id
DELETE /api/guild-war-goals/:id

GET    /api/guild-war-boss-masters
```

MVPでは、単一の目標だけ扱う場合、以下でもよい。

```text
GET   /api/guild-war-goal
PUT   /api/guild-war-goal
POST  /api/guild-war-goal/reset
```

既存アプリの設計に合わせること。

### 11.2 リセット仕様

リセットボタンでは以下を初期化する。

- 全体目標貢献度
- 日程別目標
- 討伐速度
- メモ

ボスマスタはリセット対象外。

## 12. バリデーション

### 12.1 貢献度

- 空欄は 0 として扱う
- 負の値は不可
- 小数は不可
- カンマ入力は許容してもよい
  - 例: `15,000,000,000`
  - 内部ではカンマ除去して数値化

### 12.2 討伐時間

- 分・秒ともに空欄の場合は未入力扱い
- 秒は 0〜59 を推奨
- 合計0秒は不可
- 負の値は不可
- 未入力HELLは時間効率ランキングから除外
- 未入力HELLは必要総討伐時間を「未計算」と表示

### 12.3 250HELL

- 通常肉列には 0 を表示
- 専用素材列に必要数を表示
- 通常肉換算はMVPでは行わない

## 13. 表示フォーマット

### 13.1 数値

貢献度・肉数はカンマ区切りで表示する。

```text
15,000,000,000
4,000
1,080
```

### 13.2 時間

秒数は以下のように表示する。

| 秒数 | 表示 |
|---:|---|
| 30 | 0分30秒 |
| 180 | 3分00秒 |
| 878 | 14分38秒 |
| 7200 | 2時間00分 |
| 175680 | 48時間48分 |

## 14. テスト観点

### 14.1 計算テスト

- 目標4,000,000,000で200HELLが200体になる
- 目標4,000,000,000で150HELLが976体になる
- 目標4,000,000,000で250HELLが54体になる
- 200HELL 200体で通常肉4,000になる
- 250HELL 54体で専用素材1,080になる
- 150HELL 3分の場合、200HELL損益分岐が約14分38秒になる
- 200HELL 12分の場合、250HELL損益分岐が45分00秒になる

### 14.2 入力テスト

- 未入力を0として扱える
- カンマ付き数値を扱える
- 負の値で保存できない
- 0秒の討伐時間で保存できない
- 秒が60以上の場合の扱いが破綻しない
- BigInt相当の大きな値でも表示が崩れない

### 14.3 UIテスト

- スマホ幅で表が横スクロールできる
- 長い数値でもレイアウトが崩れない
- 討伐速度未入力のHELLがランキングから除外される
- 250HELLの通常肉が0、専用素材が別列に表示される
- リセットで目標・日程・速度が初期化される

## 15. Codexへの実装指示文

以下を Codex に渡す。

```text
docs/01_overall_policy.md を確認したうえで、古戦場目標計算機能を実装してください。

今回の目的:
- 古戦場全体の目標貢献度を入力できる
- 日程ごとに目標貢献度を分配できる
- 各日程の目標達成に必要なHELL討伐数を計算できる
- 必要な通常肉数と250HELL専用素材数を表示できる
- 各HELLの討伐速度を入力し、時間効率を比較できる
- 150HELLがX分の場合、200HELLや250HELLが何分以内なら時間効率で上回るかを表示できる

実装対象:
1. 古戦場目標計算ページを追加する
2. 全体目標貢献度を入力・保存・リセットできる
3. 日程別目標を入力・保存できる
4. 日程別目標の合計と全体目標との差分を表示する
5. 各日程ごとに、90/95/100/150/200/250HELLのみで達成する場合の必要討伐数を表示する
6. 90〜200HELLは通常肉、250HELLは専用素材として分けて表示する
7. 各HELLごとの討伐時間を入力できる
8. 討伐時間から貢献度/分・貢献度/時を表示する
9. 時間効率ランキングを表示する
10. 日程別目標達成に必要な総討伐時間を表示する
11. 損益分岐表を表示する
12. スマホ表示でも表が崩れないよう、横スクロール可能にする

ボスマスタ初期値:
- 90HELL: contribution 305000, meatCost 5, specialMeatCost 0
- 95HELL: contribution 910000, meatCost 10, specialMeatCost 0
- 100HELL: contribution 2680000, meatCost 20, specialMeatCost 0
- 150HELL: contribution 4100000, meatCost 20, specialMeatCost 0
- 200HELL: contribution 20000000, meatCost 20, specialMeatCost 0
- 250HELL: contribution 75000000, meatCost 0, specialMeatCost 20

日程初期値:
- 予選1日目
- 予選2日目
- インターバル
- 本戦1日目
- 本戦2日目
- 本戦3日目
- 本戦4日目

必要討伐数計算:
- requiredRuns = ceil(dayTargetContribution / bossContribution)

必要肉数計算:
- requiredMeat = requiredRuns * meatCost
- requiredSpecialMeat = requiredRuns * specialMeatCost

時間効率計算:
- clearTimeMinutes = clearTimeSecondsTotal / 60
- contributionPerMinute = bossContribution / clearTimeMinutes
- contributionPerHour = contributionPerMinute * 60
- requiredBattleTimeSeconds = requiredRuns * clearTimeSecondsTotal

損益分岐計算:
- breakEvenSeconds = baseClearTimeSeconds * compareBossContribution / baseBossContribution

表示例:
- 150HELLが3分00秒の場合、200HELLは14分38秒以内なら150HELLより時間効率が良い
- 200HELLが12分00秒の場合、250HELLは45分00秒以内なら200HELLより時間効率が良い

注意:
- 250HELLは通常肉ではなく専用素材で自発するため、通常肉とは別列で表示する
- 討伐時間が未入力のHELLは時間効率ランキングから除外する
- 未入力の場合、必要総討伐時間は「未計算」と表示する
- 0秒や負の値は保存・計算しない
- 時間効率は戦闘時間のみで計算し、肉集め時間や失敗率は含めない
- 外部サイトからの常時スクレイピングは行わない
- 既存の団内目標共有機能を壊さない
- 既存のデザイン・CSSに合わせる
- 可能であれば docs/16_guild_war_goal_calculator.md を追加し、仕様と計算式を記録する

確認:
- npm run build が通ること
- prisma generate が必要な場合は通ること
- 全体目標と日別目標の差分が正しく表示されること
- 0や未入力でエラーにならないこと
- 250HELLの必要数が通常肉ではなく専用素材列に表示されること
- 損益分岐時間が正しく表示されること
```

## 16. 参考情報

値確認に使用した主な参考情報。

- GameWith: 古戦場の各難易度のチャンク効率、貢献度、250HELL専用素材
- GameWith: 250HELLの自発素材と解放条件
- 神ゲー攻略: 200HELL / 250HELLの効率、時間効率の考え方

saisoku内では、これらの本文・表・画像を丸ごと保存せず、必要な数値と参照元メモのみを扱う。

## 16. モバイル再編後の画面構成

2026-07-25のモバイル再編では、計算式、保存データ、API、既存マスタを維持し、画面名を「古戦場」、URLを `/guild-war-goals` とする。画面は次の3タブで構成する。

1. 目標: 全体目標と、選択中の1日程の目標を入力する。
2. 討伐速度: 選択中の1HELLの速度と操作種別を入力する。
3. 計算結果: 必要討伐数、肉、時間効率、損益分岐を確認する。

日程とHELLは切り替え操作で選び、狭い画面に全入力欄を同時表示しない。保存ボタンは画面下部から到達しやすい固定位置に置き、未保存変更がある状態でページを離れる場合は確認する。

リセットは通常の保存操作から分離して「操作詳細」内へ置き、確認後に全体目標、日程別目標、討伐速度、メモを初期化する。ボスマスタは従来どおりリセット対象外とする。

### 変更履歴

- 2026-07-25: モバイル再編後の3タブ、単一日程・単一HELL表示、固定保存、未保存確認、リセット導線を追記。
