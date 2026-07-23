# 進捗プリセット 素材マスター・DB調査

- 調査日: 2026-07-23
- 対象: 十賢者進捗プリセットの素材キー、既存DB、version互換性
- 関連仕様: `docs/23_progress_preset_feature.md`
- 素材調査: `docs/24_evoker_progress_research.md`
- 状態: コード・DB定義調査完了、実装未着手

## 1. 結論

十賢者プリセットの実装は可能である。

既存の `GbfMasterItem` は `GbfMasterKind.material` を受け付けるため、新しい素材マスターテーブルやenum追加は不要である。ただし、現在のseedには `material` のデータが1件もなく、進捗プリセットの `itemKey` と `GbfMasterItem` の関連付けも実装されていない。

実装時は次の構成を推奨する。

1. 十賢者で使用する具体的な素材を `GbfMasterItem(kind: material)` へseedする
2. `ProgressRequirement.itemKey` に `GbfMasterItem.id` と同じ値を使用する
3. 抽象素材はDBへ保存せず、対象賢者から具体的な素材IDの配列へ解決する
4. 所持数は既存の `UserItemInventory` を継続利用する
5. プリセット定義の検証時に、全 `itemKey` がmaterialマスターに存在することを確認する

この方法なら素材マスター追加だけではPrisma migrationを必要としない。進捗目標から素材マスターへ外部キーを追加する場合だけmigrationが必要になる。

## 2. 現在の素材関連データ構造

### 2.1 `GbfMasterItem`

既存の汎用GBFマスターで、次の種別を扱う。

- character
- weapon
- summon
- job
- material
- quest

`material` はschemaとAPI検索の両方で許可されている。一方、`server/data/gbfMasterSeed/index.ts` が読み込むのはジョブ、キャラ、召喚石、武器だけで、素材seedファイルは存在しない。

### 2.2 `UserItemInventory`

進捗プリセットの所持数はユーザー単位で共有される。

```text
一意制約: ownerId + itemKey
保持値: itemKey、itemName、ownedCount
```

この構造は、同じ素材を複数の十賢者目標や後続プリセットで共有する要件に適合する。十賢者ごとの所持数テーブルを追加する必要はない。

注意点として、`itemName` は所持数作成時の表示名の複製であり、マスターへの外部キーではない。名称変更後も古い `itemName` がDBへ残り得るが、現行の進捗レスポンスはプリセット定義側の `itemName` を表示するため、直ちに表示不整合にはならない。

### 2.3 素材目標機能との関係

既存の `/materials` は `MaterialItem.name` を自由入力で保存し、`itemKey` や素材マスターを使用していない。そのため、進捗プリセットの所持数とは共有されない。

十賢者初期実装で両機能を統合する必要はない。将来統合する場合は、自由入力名の正規化と既存データ移行が別途必要になる。

## 3. `itemKey` の確定方針

### 3.1 採用案

`GbfMasterItem.id` をそのまま `ProgressRequirement.itemKey` にする。

```text
GbfMasterItem.id: material-sephira-stone
ProgressRequirement.itemKey: material-sephira-stone
UserItemInventory.itemKey: material-sephira-stone
```

利点:

- マスター、プリセット、所持数で同じ識別子を使用できる
- 表示名の変更で所持数が分裂しない
- 後続プリセットでも同じ素材を共有できる
- seedとプリセットの不整合を自動検出できる

`docs/23_progress_preset_feature.md` にある `element:fire` は概念例であり、実装時はこのID規則へ統一する。

### 3.2 ID規則

- ASCII小文字とハイフンを使用する
- 表示名や選択値を無加工のままキーにしない
- 同じゲーム内素材には全プリセットで同じIDを使用する
- 抽象素材にはIDを発行しない
- 光・闇で2素材に分かれる場合は具体的な2IDを返す

例:

| 表示名 | `itemKey` |
| --- | --- |
| セフィラストーン | `material-sephira-stone` |
| セフィラ玉髄 | `material-sephira-jade` |
| ニューワールド・クォーツ | `material-new-world-quartz` |
| 世界のイデア | `material-world-idea` |
| 金剛晶 | `material-sunlight-stone` |
| ダマスカス骸晶 | `material-damascus-crystal` |
| 刻の流砂 | `material-eternity-sand` |

十賢者初期版で使用するIDは第10.4節の一覧を正とする。表示名から実行時に自動生成してはならない。

## 4. 十賢者で必要な素材マスター

### 4.1 共通素材

- セフィラストーン
- セフィラ玉髄
- 金剛晶
- 銀天の輝き
- 究竟の証
- 虹星晶
- 星晶塊
- ジェネシス・フラグメント
- バハムートの紫電角
- ニューワールド・クォーツ
- マリス・フラグメント
- 蒼翠の結晶
- 刻の流砂
- 世界のイデア
- ダマスカス骸晶

### 4.2 属性別素材

- 火、水、土、風のヴェルム文書
- 火、水、土、風、光、闇のアストラ
- オーロラヘイズ、カオティック・ヘイズ
- イグニス、アクア、テラ、ウェントスのブライト
- 6属性の属性エレメント
- 火、水、土、風の石片（光は火・風、闇は水・土へ分割）
- 6属性のプシュケー
- 6属性のマグナアニマ
- 6属性のマグナ2マグナアニマ
- 6属性の天司アニマ
- 6属性に対応する旧召喚アニマ、新召喚アニマ、討滅戦素材

### 4.3 召喚石・エリア別素材

- 10召喚石のイデア
- 10召喚石のウェリタス
- アクイラ、ベラトール、ケルサスのフラグメント
- 召喚石ごとのナル・グランデ島素材

### 4.4 六竜素材

| 属性 | 竜珠 | 固有素材 |
| --- | --- | --- |
| 火 | ウィルナスの竜珠 | イグナイトラブル |
| 水 | ワムデュスの竜珠 | アビサル・トラジェディー |
| 土 | ガレヲンの竜珠 | インシュラーコア |
| 風 | イーウィヤの竜珠 | ゲイルロック |
| 光 | ル・オーの竜珠 | 靂輪 |
| 闇 | フェディエルの竜珠 | トーデストリープ |

### 4.5 ゴスペル

- エゲイラ・ゴスペル
- アナリプシア・ゴスペル
- テュシア・ゴスペル
- ゲネア・ゴスペル

## 5. 抽象素材の解決方法

プリセット定義へ `対応アストラ` のような抽象素材を最終データとして登録しない。対象賢者の定義に具体的な素材IDを持たせ、段階解決時に置換する。

```text
対象賢者
  -> 属性
  -> 召喚石
  -> エリア
  -> アストラ、イデア、ウェリタス、フラグメント
  -> ブライト、ヴェルム文書、ヘイズ
  -> 六竜素材、ゴスペル
```

光のガイゼンボーガと闇のニーアは単一素材への置換ではなく、段階ごとに2件の必要素材を返す。礎武器交換のブライト各3、1凸の各7など、合計を単純に2分割できない値があるため、汎用的な「半分」計算は使用しない。

## 6. 現行進捗実装との差分

素材データを投入するだけでは確定仕様を満たせない。

| 領域 | 現行 | 必要な状態 |
| --- | --- | --- |
| プリセット定義 | 一本道の配列 | グループ、依存関係、stage/milestone |
| 素材計算 | 各段階を個別表示 | 目標中継点の全依存先を合算 |
| 完了済み工程 | 個別POST | 完了ID集合の一括保存 |
| 完了条件 | 素材充足を要求 | 素材不足でも完了可能 |
| 前後関係 | 検証なし | `dependsOn`をサーバー検証 |
| version | DBへ保存するだけ | `presetId + version`で定義解決 |
| 目標中継点 | DBの最終ゴールと同一 | URL queryで一時選択 |
| 素材マスター | 未使用 | materialマスターとキー照合 |

現行の完了APIは素材・条件が不足していると拒否するため、確定仕様と相反する。また、未完了へ戻すAPIと一括保存APIがない。

## 7. DB変更の要否

### 7.1 migrationなしで実装できる範囲

- material種別の `GbfMasterItem` seed追加
- `GbfMasterItem.id` と同じ `itemKey` の採用
- 既存 `UserItemInventory` の再利用
- `selection` JSONの再利用
- `ProgressStageProgress` による完了ID保存
- プリセットversion別定義のコード管理

### 7.2 migrationを検討する場合

次をDBで強制したい場合はmigrationが必要になる。

- `UserItemInventory.itemKey` から `GbfMasterItem.id` への外部キー
- 所持数行から重複した `itemName` を除去
- プリセットversion更新履歴をDB管理

初期実装では外部キーを追加せず、起動時または検証スクリプトでキー存在を検査する方が変更範囲が小さい。`GbfMasterItem` のseed適用前後で外部キー制約に失敗する問題も避けられる。

## 8. 旧versionデータ

現行の十賢者プリセットはversion 1、`isAvailable: false`、全素材が空である。本番DBに既存の十賢者目標がないことは確認済みである。仮に実装前の確認で行が見つかった場合も、ユーザー方針により旧十賢者目標は移行せず削除してよい。

また、現行サーバーは `presetVersion` を保存するが定義解決には使用せず、常に現在の `presetId` だけで定義を取得する。定義を上書きすると、既存目標にも新しい中継点が即時適用される。

掃除を実行する直前には、削除対象を限定するため次の件数確認を行う。

```sql
SELECT preset_id, preset_version, COUNT(*)
FROM progress_goals
GROUP BY preset_id, preset_version;
```

処理方針:

- `evokers` が0件: 削除処理は何も変更せず、そのまま新しい定義を投入する
- `evokers` が存在: `preset_id = 'evokers'` に限定して削除し、移行しない
- 他プリセットの行: 削除せず、version解決の共通基盤で旧定義を保持する

削除は関連する `ProgressStageProgress` を含むcascadeを事前確認し、別migrationまたは明示的な運用SQLで処理する。今回の文書更新ではDB操作を行わない。

## 9. 自動照合

実装データの検証処理は少なくとも次を確認する。

1. stage ID、group IDがversion内で一意
2. `dependsOn` の参照先が存在
3. 依存関係に循環がない
4. milestoneが素材を持たない
5. 全 `itemKey` がmaterialマスターseedに存在
6. `itemKey`ごとに表示名が一意
7. 必要数が1以上の整数
8. 10賢者すべてで抽象素材が残らない
9. 光・闇の特殊分割値が調査表と一致
10. 各工程の合計が `docs/24_evoker_progress_research.md` の照合値と一致

本リポジトリには一般的なテスト基盤がないため、大規模なフレームワークは追加せず、Node標準テストランナーなど依存を増やさない方法で進捗計算の自動テストを追加する。計算関数は副作用のない独立した関数にし、少なくとも次を検証する。

1. 依存中継点の再帰抽出と重複除外
2. 循環参照、未知ID、依存関係違反の拒否
3. 完了済み中継点の素材除外と未完了へ戻した際の再計上
4. 同一 `itemKey` の段階横断合算
5. 所持数を差し引いた不足数が負にならないこと
6. 工程グループごとの並行進捗
7. 光・闇の特殊分割
8. 10賢者の抽象素材解決後に未解決キーが残らないこと
9. 調査資料の段階別合計と実装データの一致
10. `presetId + version` の定義解決と旧ID alias

実装時は自動テストに加え、手動の代表ケース確認、`npm run typecheck`、`npm run build` も行う。

## 10. 召喚石強化素材の正式名称

GameWithの属性別一覧を基準に、神ゲー攻略の各アーカルム召喚石の記事で対象別の組み合わせを照合した。プリセット定義では「旧召喚アニマ」「新召喚アニマ」「討滅戦素材」「石片」「島素材」のような総称を残さず、次の正式名称へ解決する。

### 10.1 属性別の召喚アニマ

| 属性 | 旧召喚アニマ | 新召喚アニマ |
| --- | --- | --- |
| 火 | フラム＝グラスのアニマ | アテナのアニマ |
| 水 | マキュラ・マリウスのアニマ | グラニのアニマ |
| 土 | メドゥーサのアニマ | バアルのアニマ |
| 風 | ナタクのアニマ | ガルーダのアニマ |
| 光 | アポロンのアニマ | オーディンのアニマ |
| 闇 | オリヴィエのアニマ | リッチのアニマ |

闇属性の素材名は現在の記事表記に合わせて「オリヴィエのアニマ」とする。古い攻略情報にある「Dエンジェル・オリヴィエのアニマ」は表示名として採用しない。

### 10.2 SSR4凸のマグナ2素材

| 属性 | 正式名称 |
| --- | --- |
| 火 | シヴァのマグナアニマ |
| 水 | エウロペのマグナアニマ |
| 土 | ブローディアのマグナアニマ |
| 風 | グリームニルのマグナアニマ |
| 光 | メタトロンのマグナアニマ |
| 闇 | アバターのマグナアニマ |

### 10.3 SSR5凸の対象別素材

| 召喚石 | 討滅戦素材 | 石片 | ナル・グランデ島素材 |
| --- | --- | --- | --- |
| ザ・サン | 灼滅の焔角 100 | 業火の石片 50 | 修行者の覚書 50 |
| ザ・デビル | 灼滅の焔角 100 | 業火の石片 50 | レム・ペッパー 50 |
| ジャスティス | 氷獄の結晶 100 | 玉水の石片 50 | トキシックフラワー 50 |
| ザ・ムーン | 氷獄の結晶 100 | 玉水の石片 50 | 透き通るような絹 50 |
| ザ・ハングドマン | 裁考の水晶 100 | 荒土の石片 50 | ベスティエフルーツ 50 |
| ザ・タワー | 裁考の水晶 100 | 荒土の石片 50 | 割れたティーカップ 50 |
| テンペランス | 人馬の円盤 100 | 狂風の石片 50 | クルーガーハーブ 50 |
| ジャッジメント | 人馬の円盤 100 | 狂風の石片 50 | 埃まみれの書物 50 |
| ザ・スター | 妃光の水晶 100 | 業火の石片 25、狂風の石片 25 | 錆び付いた掛瓦 50 |
| デス | 幻魔の破片 100 | 玉水の石片 25、荒土の石片 25 | 巨獣骨 50 |

光・闇専用の石片は存在しないため、抽象的な「6属性の石片」は使用しない。ザ・スターは業火と狂風、デスは玉水と荒土へ分割する。

### 10.4 確定 `itemKey` 一覧

次のIDを `GbfMasterItem.id`、`ProgressRequirement.itemKey`、`UserItemInventory.itemKey` で共通利用する。

#### 共通素材

| 表示名 | `itemKey` |
| --- | --- |
| セフィラストーン | `material-sephira-stone` |
| セフィラ玉髄 | `material-sephira-jade` |
| 金剛晶 | `material-sunlight-stone` |
| 銀天の輝き | `material-silver-centrum` |
| 究竟の証 | `material-supreme-merit` |
| 虹星晶 | `material-rainbow-prism` |
| 星晶塊 | `material-flawless-prism` |
| ジェネシス・フラグメント | `material-genesis-fragment` |
| バハムートの紫電角 | `material-bahamut-purple-horn` |
| ニューワールド・クォーツ | `material-new-world-quartz` |
| マリス・フラグメント | `material-malice-fragment` |
| 蒼翠の結晶 | `material-verdant-azurite` |
| 刻の流砂 | `material-eternity-sand` |
| 世界のイデア | `material-world-idea` |
| ダマスカス骸晶 | `material-damascus-crystal` |

#### アーカルム共通系

| 表示名 | `itemKey` |
| --- | --- |
| ヴェルム文書・火 | `material-verum-proof-fire` |
| ヴェルム文書・水 | `material-verum-proof-water` |
| ヴェルム文書・土 | `material-verum-proof-earth` |
| ヴェルム文書・風 | `material-verum-proof-wind` |
| 火精のアストラ | `material-astra-fire` |
| 水精のアストラ | `material-astra-water` |
| 土精のアストラ | `material-astra-earth` |
| 風精のアストラ | `material-astra-wind` |
| 光精のアストラ | `material-astra-light` |
| 闇精のアストラ | `material-astra-dark` |
| オーロラ・ヘイズ | `material-aurora-haze` |
| カオティック・ヘイズ | `material-chaotic-haze` |
| イグニス・ブライト | `material-ignis-bright` |
| アクア・ブライト | `material-aqua-bright` |
| テラ・ブライト | `material-terra-bright` |
| ウェントス・ブライト | `material-ventosus-bright` |
| アクイラ・フラグメント | `material-aquila-fragment` |
| ベラトール・フラグメント | `material-bellator-fragment` |
| ケルサス・フラグメント | `material-celsus-fragment` |

#### 召喚石固有素材

| 対象 | イデア | `itemKey` | ウェリタス | `itemKey` |
| --- | --- | --- | --- | --- |
| ザ・サン | 太陽のイデア | `material-sun-idea` | 太陽のウェリタス | `material-sun-veritas` |
| ザ・デビル | 悪魔のイデア | `material-devil-idea` | 悪魔のウェリタス | `material-devil-veritas` |
| ジャスティス | 正義のイデア | `material-justice-idea` | 正義のウェリタス | `material-justice-veritas` |
| ザ・ムーン | 月のイデア | `material-moon-idea` | 月のウェリタス | `material-moon-veritas` |
| ザ・ハングドマン | 刑死者のイデア | `material-hanged-man-idea` | 刑死者のウェリタス | `material-hanged-man-veritas` |
| ザ・タワー | 塔のイデア | `material-tower-idea` | 塔のウェリタス | `material-tower-veritas` |
| テンペランス | 節制のイデア | `material-temperance-idea` | 節制のウェリタス | `material-temperance-veritas` |
| ジャッジメント | 審判のイデア | `material-judgement-idea` | 審判のウェリタス | `material-judgement-veritas` |
| ザ・スター | 星のイデア | `material-star-idea` | 星のウェリタス | `material-star-veritas` |
| デス | 死神のイデア | `material-death-idea` | 死神のウェリタス | `material-death-veritas` |

#### 属性素材

| 属性 | エレメント | `itemKey` | プシュケー | `itemKey` |
| --- | --- | --- | --- | --- |
| 火 | 火晶のエレメント | `material-element-fire` | 火のプシュケー | `material-psyche-fire` |
| 水 | 水晶のエレメント | `material-element-water` | 水のプシュケー | `material-psyche-water` |
| 土 | 土晶のエレメント | `material-element-earth` | 土のプシュケー | `material-psyche-earth` |
| 風 | 風晶のエレメント | `material-element-wind` | 風のプシュケー | `material-psyche-wind` |
| 光 | 光晶のエレメント | `material-element-light` | 光のプシュケー | `material-psyche-light` |
| 闇 | 闇晶のエレメント | `material-element-dark` | 闇のプシュケー | `material-psyche-dark` |

| 属性 | マグナアニマ | `itemKey` | マグナ2マグナアニマ | `itemKey` |
| --- | --- | --- | --- | --- |
| 火 | コロッサスのマグナアニマ | `material-colossus-magna-anima` | シヴァのマグナアニマ | `material-shiva-magna-anima` |
| 水 | リヴァイアサンのマグナアニマ | `material-leviathan-magna-anima` | エウロペのマグナアニマ | `material-europa-magna-anima` |
| 土 | ユグドラシルのマグナアニマ | `material-yggdrasil-magna-anima` | ブローディアのマグナアニマ | `material-brodia-magna-anima` |
| 風 | ティアマトのマグナアニマ | `material-tiamat-magna-anima` | グリームニルのマグナアニマ | `material-grimnir-magna-anima` |
| 光 | シュヴァリエのマグナアニマ | `material-luminiera-magna-anima` | メタトロンのマグナアニマ | `material-metatron-magna-anima` |
| 闇 | セレストのマグナアニマ | `material-celeste-magna-anima` | アバターのマグナアニマ | `material-avatar-magna-anima` |

| 属性 | 旧召喚アニマ | `itemKey` | 新召喚アニマ | `itemKey` |
| --- | --- | --- | --- | --- |
| 火 | フラム＝グラスのアニマ | `material-flam-glass-anima` | アテナのアニマ | `material-athena-anima` |
| 水 | マキュラ・マリウスのアニマ | `material-macula-marius-anima` | グラニのアニマ | `material-grani-anima` |
| 土 | メドゥーサのアニマ | `material-medusa-anima` | バアルのアニマ | `material-baal-anima` |
| 風 | ナタクのアニマ | `material-nataku-anima` | ガルーダのアニマ | `material-garuda-anima` |
| 光 | アポロンのアニマ | `material-apollo-anima` | オーディンのアニマ | `material-odin-anima` |
| 闇 | オリヴィエのアニマ | `material-olivia-anima` | リッチのアニマ | `material-lich-anima` |

天司アニマは火・水・土・風では単一素材、光・闇では2素材へ分割する。

| 対象属性 | 素材 |
| --- | --- |
| 火 | ミカエルのアニマ `material-michael-anima` ×20 |
| 水 | ガブリエルのアニマ `material-gabriel-anima` ×20 |
| 土 | ウリエルのアニマ `material-uriel-anima` ×20 |
| 風 | ラファエルのアニマ `material-raphael-anima` ×20 |
| 光 | ミカエルのアニマ `material-michael-anima` ×10、ラファエルのアニマ `material-raphael-anima` ×10 |
| 闇 | ガブリエルのアニマ `material-gabriel-anima` ×10、ウリエルのアニマ `material-uriel-anima` ×10 |

#### SSR5凸固有素材

| 表示名 | `itemKey` |
| --- | --- |
| 灼滅の焔角 | `material-scorched-hellfire-horn` |
| 氷獄の結晶 | `material-frozen-hell-prism` |
| 裁考の水晶 | `material-judgement-crystal` |
| 人馬の円盤 | `material-centaur-disk` |
| 妃光の水晶 | `material-princess-light-crystal` |
| 幻魔の破片 | `material-phantom-demon-fragment` |
| 業火の石片 | `material-stone-fragment-fire` |
| 玉水の石片 | `material-stone-fragment-water` |
| 荒土の石片 | `material-stone-fragment-earth` |
| 狂風の石片 | `material-stone-fragment-wind` |
| 修行者の覚書 | `material-ascetic-memorandum` |
| レム・ペッパー | `material-rem-pepper` |
| トキシックフラワー | `material-toxic-flower` |
| 透き通るような絹 | `material-translucent-silk` |
| ベスティエフルーツ | `material-bestie-fruit` |
| 割れたティーカップ | `material-broken-teacup` |
| クルーガーハーブ | `material-kluger-herb` |
| 埃まみれの書物 | `material-dusty-book` |
| 錆び付いた掛瓦 | `material-rusted-roof-tile` |
| 巨獣骨 | `material-giant-beast-bone` |

#### 六竜素材とゴスペル

| 表示名 | `itemKey` |
| --- | --- |
| ウィルナスの竜珠 | `material-wilnas-jewel` |
| ワムデュスの竜珠 | `material-wamdus-jewel` |
| ガレヲンの竜珠 | `material-galleon-jewel` |
| イーウィヤの竜珠 | `material-ewiyar-jewel` |
| ル・オーの竜珠 | `material-lu-woh-jewel` |
| フェディエルの竜珠 | `material-fediel-jewel` |
| イグナイトラブル | `material-ignite-rubble` |
| アビサル・トラジェディー | `material-abyssal-tragedy` |
| インシュラーコア | `material-insular-core` |
| ゲイルロック | `material-gale-rock` |
| 靂輪 | `material-thunder-wheel` |
| トーデストリープ | `material-todestrieb` |
| エゲイラ・ゴスペル | `material-egeira-gospel` |
| アナリプシア・ゴスペル | `material-analepsia-gospel` |
| テュシア・ゴスペル | `material-thysia-gospel` |
| ゲネア・ゴスペル | `material-genea-gospel` |

一覧内のIDは確定値であり、実装時に別名へ再変換しない。seed作成時には重複、参照漏れ、表示名の不一致を自動検証する。

## 11. 確定した方針と実装作業

### 11.1 確定したプロダクト判断

- 進捗用素材を既存 `GbfMasterItem(kind: material)` へ統合する
- `itemKey` は `GbfMasterItem.id` と同一にする
- 旧十賢者version 1の目標は移行せず、実装前に対象限定で削除する

### 11.2 実装時の作業

- material seedの作成
- 対象賢者別の置換定義
- プリセット検証処理
- version別定義解決
- 確定仕様に合わせたAPIとUIの改修

## 12. 調査対象

- `prisma/schema.prisma`
- `prisma/migrations/20260721090000_add_progress_goals/migration.sql`
- `prisma/seed.ts`
- `server/data/gbfMasterSeed/index.ts`
- `server/data/progressPresets.ts`
- `server/routes/buildMasters.ts`
- `server/routes/progressGoals.ts`
- `server/routes/materialGoals.ts`

## 13. 外部参照

- [GameWith: アーカルム召喚石の必要素材・作成方法](https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/87547)
- [神ゲー攻略: アーカルム召喚石の必要素材一覧](https://kamigame.jp/%E3%82%B0%E3%83%A9%E3%83%96%E3%83%AB/%E3%82%A2%E3%83%BC%E3%82%AB%E3%83%AB%E3%83%A0%E3%81%AE%E8%BB%A2%E4%B8%96/%E3%82%A2%E3%83%BC%E3%82%AB%E3%83%AB%E3%83%A0%E7%9F%B3.html)
- [GameWith: ヒート・オブ・ザ・サンの必要素材](https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/245167)
- [神ゲー攻略: ザ・ワールドのドロップ素材](https://kamigame.jp/%E3%82%B0%E3%83%A9%E3%83%96%E3%83%AB/%E3%82%A2%E3%83%BC%E3%82%AB%E3%83%AB%E3%83%A0%E3%81%AE%E8%BB%A2%E4%B8%96/%E3%82%B6%E3%83%BB%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89.html)
- `src/lib/api.ts`
- `src/pages/ProgressGoalsPage.tsx`
- `docs/23_progress_preset_feature.md`
- `docs/24_evoker_progress_research.md`
- `docs/preset.md`
