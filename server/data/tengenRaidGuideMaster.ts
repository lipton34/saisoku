import type { RaidGuideMasterDefinition } from "./raidGuideMasters.js";

export const tengenRaidGuideMaster: RaidGuideMasterDefinition = {
  id: "the-world-of-six-dragons-six-player-v1",
  questMasterId: "quest-the-world-of-six-dragons",
  title: "6人攻略・共通行動",
  overview: "天元たる六色の理の6人攻略で共通して確認する形態別予兆、穹竜の試練、HP15%以降の連続予兆。属性・編成固有の動きは対策メモと付箋で補う。",
  revision: 4,
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
          enemyAction: "・編成：6属性各1人\n・100%～40%：3形態がランダム登場\n・90%／70%／50%：200万ダメ複数回\n・40%：全員で足並みを揃える\n・15%以降：毎ターン連続予兆\n\n[[page:tengen-row-opening|開幕]]\n[[page:tengen-page-common|100%～40%共通]]\n[[page:tengen-row-40-vicolor|40%]]\n[[page:tengen-row-15-ardore|15%以降]]",
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
          enemyAction: "ラツィオ・エレクシオ\n・対象：主人公と異なる属性のキャラ\n・ダメ：最大HP100%の無属性\n・味方：復活不可\n・敵：HP40%未満にならない、竜気Lv1、坩堝Lv1",
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
          enemyAction: "形態移行\n・軽減：対応2属性以外 30%\n・敵：弱体耐性UP、ターン終了時に弱体1つ回復",
          requiredResponse: "・対応属性：奥義またはアビダメ 合計2000万\n・2属性がそれぞれ解除",
          supplementalNote: "火・風、水・土、光・闇の3形態がランダムな順番で登場。軽減解除後に弱体効果を入れて攻撃を始める。",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-hp-trigger",
          timingCondition: "HP90%／70%／50%",
          enemyAction: "形態別合体技\n・火／風：朱の灼爪・翠の飄嘴\n・水／土：碧の渦核・金の巌擲\n・光／闇：白の煌閃・黒の呪禍\n\n・ダメ：対応2属性 各2回・各10倍\n・弱体：対応2属性の脆性\n・竜気：対応2体 各+2",
          requiredResponse: "・90%：200万ダメ 9回\n・70%：200万ダメ 12回\n・50%：200万ダメ 15回\n・竜気：出現中2体 各-1",
          supplementalNote: "2026年2月の緩和後は、発生しなかった該当特殊技が2個以下の場合に付与されていた強化効果と、形態移行時の対応弱体効果が撤廃されている。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-methos",
          timingCondition: "CT予兆（HP100%～40%）",
          enemyAction: "メートス・ルジェット\n・ダメ：ランダム 無属性6000×6回\n・弱体：虚脱、アビリティ封印",
          requiredResponse: "・解除：2000万ダメ\n・竜気：出現中の各竜気が確率で-1",
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
          enemyAction: "[[page:tengen-row-fire-wind-ougi-trigger|奥義5000万 → インテンシス]]\n[[page:tengen-row-fire-wind-ability-trigger|アビ5000万 → コラプス]]\n[[page:tengen-row-hp-trigger|90%／70%／50% → HP予兆]]\n[[page:tengen-row-ct-methos|CT → メートス]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-fire-wind-ougi-trigger",
          timingCondition: "奥義5000万到達後の次ターン",
          enemyAction: "インテンシス・フレイム\n・ダメ：全体 火15倍\n・弱体：奥義ゲージ上昇量DOWN（累積・回復不可）\n・竜気：ウィルナス +1",
          requiredResponse: "・解除：36hit\n・竜気：ウィルナス -3",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-fire-wind-ability-trigger",
          timingCondition: "アビ5000万到達後の次ターン",
          enemyAction: "エクザスティブ・コラプス\n・ダメ：ランダム 風3倍×12回\n・弱体：弱体耐性DOWN（累積・回復不可）\n・竜気：イーウィヤ +1",
          requiredResponse: "・解除：奥義5回\n・竜気：イーウィヤ -3",
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
          enemyAction: "[[page:tengen-row-water-earth-ougi-trigger|奥義5000万 → アトラクター]]\n[[page:tengen-row-water-earth-ability-trigger|アビ5000万 → 天地激震]]\n[[page:tengen-row-hp-trigger|90%／70%／50% → HP予兆]]\n[[page:tengen-row-ct-methos|CT → メートス]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-water-earth-ougi-trigger",
          timingCondition: "奥義5000万到達後の次ターン",
          enemyAction: "フェロシアス・アトラクター\n・ダメ：ランダム 水6回・合計30倍\n・弱体：攻撃DOWN（累積・回復不可）\n・竜気：ワムデュス +1",
          requiredResponse: "・解除：TA4回\n・竜気：ワムデュス -3",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-water-earth-ability-trigger",
          timingCondition: "アビ5000万到達後の次ターン",
          enemyAction: "天地激震\n・ダメ：全体 土15倍\n・弱体：防御DOWN（累積・回復不可）\n・竜気：ガレヲン +1",
          requiredResponse: "・解除：FC\n・竜気：ガレヲン -3",
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
          enemyAction: "[[page:tengen-row-light-dark-ougi-trigger|奥義5000万 → 万雷散華]]\n[[page:tengen-row-light-dark-ability-trigger|アビ5000万 → ネクロシス]]\n[[page:tengen-row-hp-trigger|90%／70%／50% → HP予兆]]\n[[page:tengen-row-ct-methos|CT → メートス]]",
          requiredResponse: "・確認する予兆を選択",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-light-dark-ougi-trigger",
          timingCondition: "奥義5000万到達後の次ターン",
          enemyAction: "万雷散華\n・ダメ：ランダム 光4回・合計40倍\n・弱体：連撃率DOWN（累積・回復不可）\n・竜気：ル・オー +1",
          requiredResponse: "・解除：アビリティ5回\n・竜気：ル・オー -3",
          dangerLevel: "caution"
        },
        {
          id: "tengen-row-light-dark-ability-trigger",
          timingCondition: "アビ5000万到達後の次ターン",
          enemyAction: "ネクロシスストーム\n・ダメ：全体 闇15倍\n・弱体：回復力DOWN（累積・回復不可）\n・竜気：フェディエル +1",
          requiredResponse: "・解除：弱体効果10回\n・竜気：フェディエル -3",
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
          enemyAction: "ヴィコロール・リベラティオ\n・ダメ：6属性 各1回・各1倍\n・追加：無属性 坩堝Lv×3000\n・味方：復活不可\n・敵：HP15%未満にならない、坩堝Lv連動強化",
          requiredResponse: "・解除：不可\n・通過：全員の準備確認後\n・対処：全属性ダメカ以外",
          supplementalNote: "最初の1人が通過すると穹竜の試練が開始する。全属性ダメージカット無効。坩堝Lv5以上で天命眼、Lv9以上で弱体抵抗、Lv13以上で防御力上昇無効、Lv17以上で再攻撃。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-trial",
          timingCondition: "[[page:tengen-row-40-vicolor|HP40%]]を最初の参戦者が通過後",
          enemyAction: "穹竜の試練（6ターン）\n・上限：敵の被ダメ100万\n・毎ターン：味方HP-1万、ランダム弱体\n・敵：属性別の真玉、攻撃UP、対応属性追撃\n・3属性解除まで：防御UP、弱体耐性UP",
          requiredResponse: "・解除：TA18回 または 奥義18回\n・各属性：自身の試練を解除\n・再開：全属性の解除確認後",
          supplementalNote: "6ターン経過だけでは解除扱いにならない。FCなどによる強制予兆中断でも試練突破にならない。",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-cladis",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "クラディス・ルーチェア\n・ダメ：ランダム 火／光15倍×6回\n・味方：強化全消去、FCゲージ-30%\n・弱体：麻痺",
          requiredResponse: "・解除：40hit",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-atrophia",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "アトロフィア・インペトス\n・ダメ：全体 土／風10倍×2回\n・2キャラ：アビCT延長、奥義ゲージDOWN\n・味方：FCゲージ-30%",
          requiredResponse: "・解除：2500万ダメ",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-ct-execration",
          timingCondition: "CT予兆（HP40%～15%）",
          enemyAction: "エクセーザ・ラセラティオ\n・ダメ：ランダム 水／闇7.5倍×8回\n・弱体：窒息、腐敗\n・味方：FCゲージ-30%",
          requiredResponse: "・解除：ディスペル3回",
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
          enemyAction: "ルプティス・アルドーレ\n・ダメ：全体 火60倍\n・弱体：ガード不可\n・敵：無敵消去",
          requiredResponse: "・解除：FC",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-15-torrens",
          timingCondition: "[[page:tengen-row-15-ardore|ルプティス・アルドーレ]]の次ターン",
          enemyAction: "ルプティス・トーレンス\n・ダメ：全体 水60倍\n・弱体：強圧（回復不可）",
          requiredResponse: "・解除：奥義ダメ2000万",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-torrens-ground",
          timingCondition: "[[page:tengen-row-after-15-torrens|ルプティス・トーレンス]]の次ターン",
          enemyAction: "ルプティス・グラウンド\n・ダメ：全体 土60倍\n・弱体：恐怖（回復不可）",
          requiredResponse: "・解除：アビダメ2000万",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-ground-tempesta",
          timingCondition: "[[page:tengen-row-after-torrens-ground|ルプティス・グラウンド]]の次ターン",
          enemyAction: "ルプティス・テンペスタ\n・ダメ：全体 風60倍\n・弱体：召喚不可（回復不可）",
          requiredResponse: "・解除：弱体効果10回",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-tempesta-splendor",
          timingCondition: "[[page:tengen-row-after-ground-tempesta|ルプティス・テンペスタ]]の次ターン",
          enemyAction: "ルプティス・スプレンド\n・ダメ：全体 光60倍\n・弱体：アビリティ封印（回復不可）",
          requiredResponse: "・解除：200万ダメ10回",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-after-splendor-tenebris",
          timingCondition: "[[page:tengen-row-after-tempesta-splendor|ルプティス・スプレンド]]の次ターン",
          enemyAction: "ルプティス・テネブリス\n・ダメ：全体 闇60倍\n・弱体：奥義封印（回復不可）",
          requiredResponse: "・解除：FC",
          dangerLevel: "danger"
        },
        {
          id: "tengen-row-final-exetium",
          timingCondition: "[[page:tengen-row-after-splendor-tenebris|ルプティス・テネブリス]]の次ターン",
          enemyAction: "ラツィオ・エグゼティウム\n・サブを含む全員が戦闘不能",
          requiredResponse: "・解除：不可\n・発動前に討伐",
          dangerLevel: "danger"
        }
      ]
    }
  ]
};
