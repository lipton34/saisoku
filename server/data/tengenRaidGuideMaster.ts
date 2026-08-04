import type { RaidGuideMasterDefinition } from "./raidGuideMasters.js";

export const tengenRaidGuideMaster: RaidGuideMasterDefinition = {
  id: "the-world-of-six-dragons-six-player-v1",
  questMasterId: "quest-the-world-of-six-dragons",
  title: "6人攻略・共通行動",
  overview: "天元たる六色の理の6人攻略で共通して確認する形態別予兆、穹竜の試練、HP15%以降の連続予兆。属性・編成固有の動きは対策メモと付箋で補う。",
  revision: 3,
  isActive: true,
  references: [
    {
      id: "the-world-of-six-dragons-ref-gamewith",
      label: "GameWith 天元たる六色の理攻略",
      url: "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/420371"
    },
    {
      id: "the-world-of-six-dragons-ref-kamigame",
      label: "神ゲー攻略 天元たる六色の理攻略",
      url: "https://kamigame.jp/グラブル/クエスト/マルチバトル/天元たる六色の理.html"
    }
  ],
  rowRedirects: {
    "tengen-row-fire-wind-hp": "tengen-row-hp-trigger",
    "tengen-row-water-earth-hp": "tengen-row-hp-trigger",
    "tengen-row-light-dark-hp": "tengen-row-hp-trigger"
  },
  sections: [
    {
      id: "tengen-section-important",
      title: "挑戦前の重要事項",
      rows: [
        {
          id: "tengen-page-important",
          pageType: "heading",
          timingCondition: "挑戦前の重要事項",
          enemyAction: "・6属性各1人で挑戦\n・HP100%～40%：3形態がランダムな順番で登場\n・HP90%／70%／50%：200万ダメージ複数回\n・HP40%：全員で足並みを揃える\n・HP15%以降：毎ターン連続予兆\n\n[[page:tengen-row-opening|開幕を確認]]\n[[page:tengen-page-common|HP100%～40%共通を確認]]\n[[page:tengen-row-40-vicolor|HP40%を確認]]\n[[page:tengen-row-15-ardore|HP15%以降を確認]]",
          requiredResponse: "・主人公と編成属性を一致\n・各属性の試練解除手段を準備\n・形態別予兆の解除手段を付箋へ記載",
          dangerLevel: "caution"
        }
      ]
    },
    {
      id: "tengen-section-common",
      title: "開幕・HP100%～40%共通",
      rows: [
        {
          id: "tengen-row-opening",
          timingCondition: "開幕",
          enemyAction: "ラツィオ・エレクシオ\n・主人公と異なる属性のキャラ：最大HP100%の無属性ダメージ\n・復活不可\n・敵：HP40%以下にならない状態\n・敵：登場中の竜気Lv1\n・敵：淵源の坩堝Lv1",
          requiredResponse: "・主人公と編成属性を一致\n・6属性各1人で挑戦",
          dangerLevel: "danger"
        },
        {
          id: "tengen-page-common",
          pageType: "heading",
          timingCondition: "HP100%～40%共通",
          enemyAction: "[[page:tengen-row-form-change|HP100%／80%／60%：形態移行]]\n[[page:tengen-row-hp-trigger|HP90%／70%／50%：共通HP予兆]]\n[[page:tengen-row-ct-methos|CT：メートス・ルジェット]]\n\n[[page:tengen-page-fire-wind|火・風形態]]\n[[page:tengen-page-water-earth|水・土形態]]\n[[page:tengen-page-light-dark|光・闇形態]]",
          requiredResponse: "・現在の形態または発生条件を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-form-change",
          timingCondition: "HP100%／80%／60%",
          enemyAction: "形態移行\n・対応する2属性以外のダメージ30%軽減\n・弱体耐性UP\n・ターン終了時：弱体効果を1つ回復",
          requiredResponse: "・対応属性の奥義またはアビリティダメージ 合計2000万\n・2属性がそれぞれ解除",
          supplementalNote: "火・風、水・土、光・闇の3形態がランダムな順番で登場。軽減解除後に弱体効果を入れて攻撃を始める。",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-hp-trigger",
          timingCondition: "HP90%／70%／50%",
          enemyAction: "形態別合体技\n・火／風：朱の灼爪・翠の飄嘴\n・水／土：碧の渦核・金の巌擲\n・光／闇：白の煌閃・黒の呪禍\n\n・ダメージ：対応する2属性で各2回（各10倍）\n・弱体：対応する2属性の脆性\n・敵：対応する竜気Lvが各2上昇",
          requiredResponse: "・HP90%：200万ダメージ 9回\n・HP70%：200万ダメージ 12回\n・HP50%：200万ダメージ 15回\n・解除時：出現中の2体の竜気Lvが各1減少",
          supplementalNote: "2026年2月の緩和後は、発生しなかった該当特殊技が2個以下の場合に付与されていた強化効果と、形態移行時の対応弱体効果が撤廃されている。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-methos",
          timingCondition: "CT予兆（HP100%～40%）",
          enemyAction: "メートス・ルジェット\n・ダメージ：ランダム対象へ無属性6000×6回\n・弱体：虚脱、アビリティ封印",
          requiredResponse: "・2000万ダメージ\n・解除時：出現中の各竜気Lvが確率で1減少",
          dangerLevel: "caution"
        }
      ]
    },
    {
      id: "tengen-section-fire-wind",
      title: "火・風形態",
      rows: [
        {
          id: "tengen-page-fire-wind",
          pageType: "heading",
          timingCondition: "火・風形態",
          enemyAction: "[[page:tengen-row-fire-wind-ougi-trigger|奥義ダメージ累計5000万：インテンシス・フレイム]]\n[[page:tengen-row-fire-wind-ability-trigger|アビリティダメージ累計5000万：エクザスティブ・コラプス]]\n[[page:tengen-row-hp-trigger|HP90%／70%／50%：共通HP予兆]]\n[[page:tengen-row-ct-methos|CT：メートス・ルジェット]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-fire-wind-ougi-trigger",
          timingCondition: "奥義ダメージ累計5000万到達後の次ターン",
          enemyAction: "インテンシス・フレイム\n・ダメージ：全体火属性15倍\n・弱体：奥義ゲージ上昇量DOWN（累積／回復不可）\n・敵：ウィルナスの竜気Lv1上昇",
          requiredResponse: "・36hit\n・解除時：ウィルナスの竜気Lvが3減少",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-fire-wind-ability-trigger",
          timingCondition: "アビリティダメージ累計5000万到達後の次ターン",
          enemyAction: "エクザスティブ・コラプス\n・ダメージ：ランダム対象へ風属性3倍×12回\n・弱体：弱体耐性DOWN（累積／回復不可）\n・敵：イーウィヤの竜気Lv1上昇",
          requiredResponse: "・奥義5回\n・解除時：イーウィヤの竜気Lvが3減少",
          dangerLevel: "caution"
        }
      ]
    },
    {
      id: "tengen-section-water-earth",
      title: "水・土形態",
      rows: [
        {
          id: "tengen-page-water-earth",
          pageType: "heading",
          timingCondition: "水・土形態",
          enemyAction: "[[page:tengen-row-water-earth-ougi-trigger|奥義ダメージ累計5000万：フェロシアス・アトラクター]]\n[[page:tengen-row-water-earth-ability-trigger|アビリティダメージ累計5000万：天地激震]]\n[[page:tengen-row-hp-trigger|HP90%／70%／50%：共通HP予兆]]\n[[page:tengen-row-ct-methos|CT：メートス・ルジェット]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-water-earth-ougi-trigger",
          timingCondition: "奥義ダメージ累計5000万到達後の次ターン",
          enemyAction: "フェロシアス・アトラクター\n・ダメージ：ランダム対象へ水属性6回（合計30倍）\n・弱体：攻撃力DOWN（累積／回復不可）\n・敵：ワムデュスの竜気Lv1上昇",
          requiredResponse: "・TA4回\n・解除時：ワムデュスの竜気Lvが3減少",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-water-earth-ability-trigger",
          timingCondition: "アビリティダメージ累計5000万到達後の次ターン",
          enemyAction: "天地激震\n・ダメージ：全体土属性15倍\n・弱体：防御力DOWN（累積／回復不可）\n・敵：ガレヲンの竜気Lv1上昇",
          requiredResponse: "・FC発動\n・解除時：ガレヲンの竜気Lvが3減少",
          dangerLevel: "caution"
        }
      ]
    },
    {
      id: "tengen-section-light-dark",
      title: "光・闇形態",
      rows: [
        {
          id: "tengen-page-light-dark",
          pageType: "heading",
          timingCondition: "光・闇形態",
          enemyAction: "[[page:tengen-row-light-dark-ougi-trigger|奥義ダメージ累計5000万：万雷散華]]\n[[page:tengen-row-light-dark-ability-trigger|アビリティダメージ累計5000万：ネクロシスストーム]]\n[[page:tengen-row-hp-trigger|HP90%／70%／50%：共通HP予兆]]\n[[page:tengen-row-ct-methos|CT：メートス・ルジェット]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-light-dark-ougi-trigger",
          timingCondition: "奥義ダメージ累計5000万到達後の次ターン",
          enemyAction: "万雷散華\n・ダメージ：ランダム対象へ光属性4回（合計40倍）\n・弱体：連続攻撃確率DOWN（累積／回復不可）\n・敵：ル・オーの竜気Lv1上昇",
          requiredResponse: "・アビリティ5回\n・解除時：ル・オーの竜気Lvが3減少",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-light-dark-ability-trigger",
          timingCondition: "アビリティダメージ累計5000万到達後の次ターン",
          enemyAction: "ネクロシスストーム\n・ダメージ：全体闇属性15倍\n・弱体：回復力DOWN（累積／回復不可）\n・敵：フェディエルの竜気Lv1上昇",
          requiredResponse: "・弱体効果10回\n・解除時：フェディエルの竜気Lvが3減少",
          dangerLevel: "caution"
        }
      ]
    },
    {
      id: "tengen-section-40-15",
      title: "HP40%～15%",
      rows: [
        {
          id: "tengen-row-40-vicolor",
          timingCondition: "HP40%",
          enemyAction: "ヴィコロール・リベラティオ\n・ダメージ：火／水／土／風／光／闇属性 各1回（各1倍）\n・追加ダメージ：淵源の坩堝Lv×3000の無属性\n・味方：復活不可\n・敵：HP15%以下にならない状態\n・敵：坩堝Lvに応じた強化効果",
          requiredResponse: "・解除条件なし\n・全員の準備を確認してから通過\n・全属性ダメージカット以外で対処",
          supplementalNote: "最初の1人が通過すると穹竜の試練が開始する。全属性ダメージカット無効。坩堝Lv5以上で天命眼、Lv9以上で弱体抵抗、Lv13以上で防御力上昇無効、Lv17以上で再攻撃。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-trial",
          timingCondition: "[[page:tengen-row-40-vicolor|HP40%]]を最初の参戦者が通過後",
          enemyAction: "穹竜の試練（6ターン）\n・敵の被ダメージ上限：100万\n・ターン終了時：味方全体HP1万減少、ランダムな弱体効果\n・敵：属性ごとの真玉、攻撃力UP、対応属性追撃\n・3属性解除まで：防御力UP、弱体耐性UP",
          requiredResponse: "・TA18回 または 奥義18回\n・各属性が自身の試練を解除\n・全属性の解除確認後に攻撃再開",
          supplementalNote: "6ターン経過だけでは解除扱いにならない。FCなどによる強制予兆中断でも試練突破にならない。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-cladis",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "クラディス・ルーチェア\n・ダメージ：火／光属性、ランダム対象へ15倍×6回\n・強化効果：全て無効化\n・弱体：麻痺\n・FCゲージ30%DOWN",
          requiredResponse: "・40hit",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-atrophia",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "アトロフィア・インペトス\n・ダメージ：全体土／風属性10倍×2回\n・アビリティCT延長：2キャラ\n・奥義ゲージDOWN：2キャラ\n・FCゲージ30%DOWN",
          requiredResponse: "・2500万ダメージ",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-execration",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "エクセーザ・ラセラティオ\n・ダメージ：水／闇属性、ランダム対象へ7.5倍×8回\n・弱体：窒息、腐敗\n・FCゲージ30%DOWN",
          requiredResponse: "・ディスペル3回",
          dangerLevel: "danger"
        }
      ]
    },
    {
      id: "tengen-section-15-0",
      title: "HP15%～0%",
      rows: [
        {
          id: "tengen-row-15-ardore",
          timingCondition: "HP15%",
          enemyAction: "ルプティス・アルドーレ\n・ダメージ：全体火属性60倍\n・弱体：ガード不可\n・敵：無敵を消去",
          requiredResponse: "・FC発動",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-15-torrens",
          timingCondition: "[[page:tengen-row-15-ardore|ルプティス・アルドーレ]]の次ターン",
          enemyAction: "ルプティス・トーレンス\n・ダメージ：全体水属性60倍\n・弱体：強圧（回復不可）",
          requiredResponse: "・奥義ダメージ2000万",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-torrens-ground",
          timingCondition: "[[page:tengen-row-after-15-torrens|ルプティス・トーレンス]]の次ターン",
          enemyAction: "ルプティス・グラウンド\n・ダメージ：全体土属性60倍\n・弱体：恐怖（回復不可）",
          requiredResponse: "・アビリティダメージ2000万",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-ground-tempesta",
          timingCondition: "[[page:tengen-row-after-torrens-ground|ルプティス・グラウンド]]の次ターン",
          enemyAction: "ルプティス・テンペスタ\n・ダメージ：全体風属性60倍\n・弱体：召喚不可（回復不可）",
          requiredResponse: "・弱体効果10回",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-tempesta-splendor",
          timingCondition: "[[page:tengen-row-after-ground-tempesta|ルプティス・テンペスタ]]の次ターン",
          enemyAction: "ルプティス・スプレンド\n・ダメージ：全体光属性60倍\n・弱体：アビリティ封印（回復不可）",
          requiredResponse: "・200万ダメージ10回",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-splendor-tenebris",
          timingCondition: "[[page:tengen-row-after-tempesta-splendor|ルプティス・スプレンド]]の次ターン",
          enemyAction: "ルプティス・テネブリス\n・ダメージ：全体闇属性60倍\n・弱体：奥義封印（回復不可）",
          requiredResponse: "・FC発動",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-final-exetium",
          timingCondition: "[[page:tengen-row-after-splendor-tenebris|ルプティス・テネブリス]]の次ターン",
          enemyAction: "ラツィオ・エグゼティウム\n・サブを含む全員が戦闘不能",
          requiredResponse: "・解除不可\n・発動前に討伐",
          dangerLevel: "danger"
        }
      ]
    }
  ]
};
