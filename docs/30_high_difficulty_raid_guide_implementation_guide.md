# 高難度攻略メモ 実装・マスター拡張ガイド

最終更新: 2026-08-04

## 1. 目的

本書は、高難度攻略メモをコードから修正・拡張するための実装ガイドである。機能要件の正本は docs/29_high_difficulty_raid_guide_feature.md とし、本書では現行ファイル、マスター形式、表示記法、seed、付箋移行、検証、本番反映を具体化する。

## 2. 現在のマスター

| クエスト | 攻略メモID | revision | 区間 | 有効ページ |
| --- | --- | ---: | ---: | ---: |
| ダーク・ラプチャー・ゼロ | dark-rapture-zero-six-player-v1 | 7 | 5 | 34 |
| 天元たる六色の理 | the-world-of-six-dragons-six-player-v1 | 4 | 7 | 27 |

上限は、区間20、攻略行100、参考URL5、1ユーザー・1マスターの対策メモ10、1対策メモの付箋50、付箋本文500文字、関連編成1件である。

## 3. 関連ファイル

マスターとDB:

- server/data/gbfMasterSeed/quests.ts: クエストマスター。
- server/data/raidGuideMasters.ts: 型、ルシゼロ、全マスター配列、バリデーション。
- server/data/tengenRaidGuideMaster.ts: 天元。大きな新規マスターも専用ファイルに分離する。
- server/data/raidGuideMasters.test.ts: revision、区間数、行数、主要行の検証。
- prisma/seed.ts: upsert、無効化、並び替え、付箋移行。
- prisma/schema.prisma: 永続モデルとリレーション。
- server/routes/raidGuides.ts: API、認証、所有権、入力検証。
- src/lib/api.ts: ブラウザ側の型とAPI。

画面:

- src/pages/RaidGuideIndexPage.tsx: 最近見た3件とクエスト一覧。
- src/pages/RaidGuideDetailPage.tsx: 共通、自分、団内公開の対策メモ。
- src/pages/RaidGuideStrategyEditorPage.tsx: 対策メモと付箋の一括編集。
- src/pages/RaidGuideReaderPage.tsx: 電子書籍型リーダー。
- src/components/RaidGuideLinkedText.tsx: ページリンクとラベル＋値表示。
- src/lib/raidGuideReaderState.ts: 現在位置と最近見た情報。
- src/styles.css: raid-、raid-reader-で始まるスタイル。

初期migration:

- prisma/migrations/20260804090000_add_raid_guides
- prisma/migrations/20260804120000_add_raid_guide_heading_pages

## 4. データ関係

    GbfMasterItem(kind=quest)
      └─ RaidGuide
           ├─ RaidGuideSection
           │    └─ RaidGuideRow
           │         ├─ RaidGuideRowLink
           │         └─ RaidGuideStickyNote
           ├─ RaidGuideReference
           └─ RaidGuideStrategy
                ├─ owner: User
                ├─ buildPost: BuildPost?
                └─ RaidGuideStickyNote

削除動作:

- User削除で所有対策メモと付箋をCascade。
- 対策メモ削除で付箋をCascade。
- 編成削除でbuildPostIdをSetNull。
- 攻略メモ、区間、攻略行は通常物理削除せずisActive=false。
- 付箋から攻略行はRestrict。公開済み行を物理削除しない。

区間順はguideId + sortOrder、行順はsectionId + sortOrderで一意である。

## 5. マスター定義

最小例:

    export const exampleRaidGuideMaster: RaidGuideMasterDefinition = {
      id: "example-six-player-v1",
      questMasterId: "quest-example",
      title: "6人攻略・共通行動",
      overview: "団内向けの概要",
      revision: 1,
      isActive: true,
      references: [
        { id: "example-ref-gamewith", label: "GameWith ○○攻略", url: "https://..." },
        { id: "example-ref-kamigame", label: "神ゲー攻略 ○○攻略", url: "https://..." }
      ],
      sections: [{
        id: "example-section-important",
        title: "挑戦前の重要事項",
        rows: [{
          id: "example-page-important",
          pageType: "heading",
          timingCondition: "挑戦前の重要事項",
          enemyAction: "[[page:example-row-opening|開幕]]",
          requiredResponse: "・確認：該当区間を選択",
          dangerLevel: "caution"
        }]
      }]
    };

IDは公開後に変更しない。推奨形式:

- クエスト: quest-quest-slug
- 攻略メモ: quest-slug-six-player-v1
- 区間: short-slug-section-purpose
- 行: short-slug-row-trigger-or-action
- 見出し: short-slug-page-purpose
- 参考URL: short-slug-ref-source

同一クエストの別攻略は、同じquestMasterIdを参照する別RaidGuideとして追加する。既存攻略の更新では同じIDを維持しrevisionを上げる。

## 6. 攻略行の記述規約

個別ページは次の順にする。

1. timingCondition: 発生条件。
2. enemyAction先頭: 正式な特殊技名。
3. ダメージ。
4. 弱体、敵強化、味方効果。
5. カウントまたは竜気。
6. requiredResponse: 解除条件。
7. 解除時の竜気など。
8. supplementalNote: 主情報ではない補足。

リーダーは「・ラベル：値」を解釈し、ラベルと値を分ける。短い項目は同じ行へ入り、長い項目だけ折り返す。

推奨表記:

    特殊技名
    ・ダメ：全体 火15倍
    ・追加：全体 無属性6000
    ・弱体：強圧、暗闇
    ・敵：追撃、全属性ダメカ
    ・味方：FCゲージ-30%
    ・カウント：+1
    ・竜気：ウィルナス +1

解除欄:

    ・解除：36hit
    ・竜気：ウィルナス -3

避けるもの:

- 「○○ダメージを与える」「○○を解除する」の反復文。
- 意味が変わらない長いラベル。
- 見出しと個別ページへの解除条件の重複。
- 小さい文字や横スクロールによる押し込み。

正式な特殊技名は個別ページ先頭へ残す。目次は「奥義5000万 → インテンシス」のように短縮してよい。データ上は意味ごとに改行し、表示側のflexで短項目を横に詰める。

## 7. 見出しとページ統合

pageTypeがheadingの行は説明の重複ではなく移動用目次にする。

    [[page:example-row-ougi|奥義5000万 → 特殊技A]]
    [[page:example-row-ability|アビ5000万 → 特殊技B]]
    [[page:example-row-hp|90%／70%／50% → HP予兆]]

解除条件の正本はリンク先1ページに限定する。

ランダム形態では形態別見出しを残す。同じCT予兆が別区間で再登場する場合、戦闘順の確認に必要ならページも各区間へ残す。この場合は敵行動文字列だけ定数化し、内容差異を防ぐ。

## 8. インラインページリンク

内部記法:

    [[page:<target-row-id>|<表示文字>]]

使用可能な場所はtimingCondition、enemyAction、requiredResponse、supplementalNote、付箋本文。

validateRaidGuideMasterDefinitionsはマスター内リンク先を検証する。付箋リンクはAPI保存時に、同じ攻略メモの有効行であることを検証する。

RaidGuideLinkedTextがリンクをボタン化し、RaidGuideReaderPage.jumpToが対象行を含むページ群へ移動する。リンク元は履歴へ保存され、専用ヘッダーから戻れる。

編集画面では内部記法を見せない。splitRaidGuideLinkedTextで本文とリンクチップへ分離し、joinRaidGuideLinkedTextで保存形式へ戻す。

RaidGuideRowLinkモデルも存在するが、現行マスターは主にインラインリンクを使う。新規マスターも原則としてインラインリンクへ統一する。

## 9. revision、無効化、付箋移行

文言、順序、リンク、危険度、ページ構成を変更したらrevisionを1増やす。revisionはDBに入っている定義を識別する運用値である。

同じIDはseedで更新される。定義から外れた区間・行はisActive=falseとなり、リーダーから除外される。物理削除はしない。

公開済み行を別行へ統合するときはrowRedirectsを設定する。

    rowRedirects: {
      "old-row-id": "canonical-row-id"
    }

seedは既存行を一旦無効化し、旧行の付箋を移行先へ付け替えた後、現行行だけを再び有効化する。

制約:

- 移行元IDを現行の有効行に含めない。
- 移行先IDは現行の有効行に存在させる。
- 付箋本文内のリンク先は自動置換されない。必要なら別途移行する。

## 10. seedの動作

npm run prisma:seedは次を実行する。

1. GBFマスターをIDでupsert。
2. 全攻略メモを検証。
3. RaidGuideをupsert。
4. 既存区間のsortOrderへ1000を一時加算し、一意制約衝突を回避。
5. 既存区間・行を一旦無効化。
6. rowRedirectsの付箋を移行。
7. 現行区間・行を正しい順序でupsertし有効化。
8. 参考URLをupsert。

seedは冪等だが本番DBへの書き込みである。調査やローカルビルド目的では実行しない。

マスター追加や文言変更だけならschemaとmigrationは変更しない。モデル変更時だけschemaと新規migrationを追加する。

## 11. APIと権限

全ルートへrequireAuthを適用する。

    GET    /api/raid-guides
    GET    /api/raid-guides/:guideId
    GET    /api/raid-guides/:guideId/reader
    GET    /api/raid-guides/:guideId/reader?strategyId=:strategyId
    POST   /api/raid-guides/:guideId/strategies
    PUT    /api/raid-guide-strategies/:strategyId
    DELETE /api/raid-guide-strategies/:strategyId

リーダーAPIは有効区間、有効行、リンク、対策メモ、全付箋を1回で返し、Cache-Controlをprivate, no-storeにする。ページ移動時は通信しない。

- crewは全認証ユーザーが閲覧可能。
- personalは所有者だけ。
- 更新・削除は所有者だけ。
- expectedUpdatedAt不一致は409。
- 10冊制限はslot 1～10とSerializable transactionで保証。
- 付箋最大50件を一括保存。

## 12. リーダーと編集画面

RaidGuideReaderPageは全行をメモリへ読み込み、1・3・5ページ単位で表示する。

- 横スワイプ60px以上または前後ボタンで移動。
- 共通ヘッダーと下部ナビゲーションは非表示。
- 攻略情報は高さ最大70%。内容が少なくても引き伸ばさない。
- 付箋は下側へ重ね、選択した付箋を最前面にする。
- 横スクロールは設けない。

RaidGuideStructuredTextの解釈:

- 先頭の非箇条書き行は特殊技名として全幅・強調。
- 「・ラベル：値」はラベルと値を分離。
- 短い項目は同一行、長い項目だけ折り返し。
- 空行はグループ間の区切り。
- インラインリンクはクリック可能。

この表示変更は全マスターに影響するため、ルシゼロと天元を両方確認する。

編集画面のStickyEditorはRaidGuideStrategyEditorPageの外側で定義する。親内へ戻すと入力ごとの再マウントでフォーカスが外れ、「1文字入力すると終了する」不具合が再発する。

付箋リンクは本文へ内部記法を表示せず、リンクチップとして表示する。

## 13. 新規マスター追加手順

1. GameWithと神ゲー攻略を照合。
2. 緩和・更新日時を確認し、古い仕様を混在させない。
3. 外部記事を転載せず団内向け短縮メモへ再構成。
4. quests.tsへクエストを追加。
5. 専用マスターファイルを作成。
6. raidGuideMasterDefinitionsへ追加。
7. 安定ID、区間、行、参考URL、revisionを設定。
8. 見出しをリンク目次にし、詳細を個別ページへ一元化。
9. 「○○の次ターン」は○○のページへリンク。
10. テストへID、revision、区間数、行数、終端行を追加。
11. 仕様書と本書の現在マスター表を更新。
12. 型チェック、テスト、ビルド、diff check。
13. コミット後にユーザーがpush。
14. 本番seed。
15. Renderと本番URLを確認。
16. 認証画面で目次、リンク、1・3・5ページ表示を確認。

## 14. 既存マスター修正

文言変更:

- 行IDを維持。
- 短縮ラベル規約に合わせる。
- revisionとテスト期待値を更新。

行順変更:

- 配列順を変更する。seedがsortOrderを一時退避して再採番する。

行統合:

- 正本行を決める。
- 重複行を定義から外す。
- rowRedirectsで付箋を正本行へ移す。
- 旧行を参照するマスター内リンクを更新。

同じ予兆を複数区間へ残す:

- 戦闘順に必要なら統合しない。
- 敵行動を定数化し、解除条件だけ各行へ置く。

## 15. 検証

必須:

    npm run typecheck
    npm test
    npm run build
    git diff --check

マスター検証:

- 全IDが一意。
- 区間20以下、行100以下、参考URL5以下。
- タイミング100文字以下。
- 敵行動、対応、補足が各500文字以下。
- 全リンク先が同じマスターに存在。
- rowRedirectsの移行元が無効、移行先が有効。
- revision、区間数、行数が期待値と一致。

画面確認:

- 360px、768px、1280px以上。
- 横スクロールなし。
- 特殊技名、解除条件、竜気増減が常時表示。
- 短項目が同じ行、長文だけ折り返し。
- 1・3・5ページ、スワイプ、前後、区間移動、リンク、リンク元へ戻る。
- 付箋0件、複数、50件。
- 付箋リンク追加・削除・保存・再編集。
- 未保存警告、409競合、保存失敗時の入力保持。

## 16. 本番反映

1. ローカル検証。
2. コミット。
3. ユーザーがpush。
4. GitHub mainのSHAを確認。
5. 本番接続環境でnpm run prisma:seed。
6. Seeded ... raid guides.を確認。
7. Renderの更新時刻またはログを確認。
8. 本番URLのHTTP 200を確認。
9. リーダーを閉じて開き直し、最新マスターを取得。

注意:

- .envと.env.localは読まない。
- schema変更がなければprisma:deployは不要。
- seedをpushより先に実行すると、旧画面が新しいリンク記法を表示する可能性がある。
- git pushはユーザーが行う。
- Render Freeは起動待ちが発生する場合がある。

## 17. 既知の制約と判断基準

- マスター本文は画面から編集できない。
- 付箋本文内の旧リンク移行は自動化されていない。
- RaidGuideRowLinkは存在するが、現行マスターは主にインラインリンクを使用。
- 最近見た情報は端末内だけで別端末へ同期しない。
- 表示中のマスターは自動更新されない。
- 一般公開、コメント、通知、承認フローは対象外。

判断基準:

- 同じ情報の正本は1ページ。
- 戦闘順で再表示する価値がある情報はページを残す。
- ページ削減より戦闘中の操作回数削減を優先。
- 詳細は正式名称、目次は短縮名。
- 解除条件や竜気増減を隠さない。
- 文字を小さくする前に文言短縮、ラベル化、リンク集約。
- 色だけに意味を持たせない。
- 外部情報は最新更新と複数ソースを確認し、団内メモへ再構成する。
