export type RaidGuideMasterRow = {
  id: string;
  pageType?: "guide" | "heading";
  timingCondition: string;
  enemyAction: string;
  requiredResponse: string;
  supplementalNote?: string;
  dangerLevel: "normal" | "caution" | "danger";
};

export type RaidGuideMasterSection = {
  id: string;
  title: string;
  rows: RaidGuideMasterRow[];
};

export type RaidGuideMasterDefinition = {
  id: string;
  questMasterId: string;
  title: string;
  overview: string;
  revision: number;
  isActive: boolean;
  references: { id: string; label: string; url: string }[];
  sections: RaidGuideMasterSection[];
};

const earlyCtNote = "攻撃行動前に解除すると確率でテセラが発生するため、可能なら攻撃行動で解除する。";

export const raidGuideMasterDefinitions: RaidGuideMasterDefinition[] = [
  {
    id: "dark-rapture-zero-six-player-v1",
    questMasterId: "quest-dark-rapture-zero",
    title: "6人攻略・共通行動",
    overview: "ルシファー・ゼロの6人攻略で共通して確認する予兆と解除条件。属性・編成固有の動きは対策メモと付箋で補う。",
    revision: 3,
    isActive: true,
    references: [
      {
        id: "dark-rapture-zero-ref-gamewith",
        label: "GameWith ルシゼロ攻略／編成例まとめ",
        url: "https://xn--bck3aza1a2if6kra4ee0hf.gamewith.jp/article/show/431319"
      },
      {
        id: "dark-rapture-zero-ref-kamigame",
        label: "神ゲー攻略 ダークラプチャーゼロ攻略",
        url: "https://kamigame.jp/グラブル/クエスト/マルチバトル/ダーク・ラプチャー・ゼロ.html"
      }
    ],
    sections: [
      {
        id: "dark-rapture-zero-section-important",
        title: "挑戦前の重要事項",
        rows: [
          {
            id: "dark-rapture-zero-page-important",
            pageType: "heading",
            timingCondition: "挑戦前の重要事項",
            enemyAction: "開幕の果実、HP80%の神器、HP60%の弱体リセット、HP20%以降のカウント管理を先に確認する。[[page:dark-rapture-zero-row-opening|開幕の果実を確認]] [[page:dark-rapture-zero-row-80-orbital|HP80%の神器を確認]] [[page:dark-rapture-zero-row-60-trumpet|HP60%の注意を確認]] [[page:dark-rapture-zero-row-20-gospel|HP20%以降を確認]]",
            requiredResponse: "・関連ページを確認\n・編成固有の対応は付箋へ記載",
            dangerLevel: "caution"
          }
        ]
      },
      {
        id: "dark-rapture-zero-section-100-81",
        title: "HP100%～81%",
        rows: [
          {
            id: "dark-rapture-zero-row-opening",
            timingCondition: "開幕",
            enemyAction: "パラダイス・ロスト。全体に無属性5万ダメージを与え、ランダムな果実を2種類付与する。",
            requiredResponse: "・HP5万以上を確保\n・付与された果実を確認",
            supplementalNote: "黄は命中低下、消費後はアンデッドに注意。赤・緑・青も使用するアビリティ種別で消費されるため、解除手段と使用順を事前に決める。",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-turn-1-the-end",
            timingCondition: "1ターン目",
            enemyAction: "ジ・エンド。解除できない場合はサブを含む全員が戦闘不能になる。",
            requiredResponse: "・3000万ダメージ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-95-axion",
            timingCondition: "HP95%",
            enemyAction: "アキシオン。解除失敗でカウントダウンが進行する。",
            requiredResponse: "・TA 4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-after-95-fix",
            timingCondition: "HP95%予兆の次ターン",
            enemyAction: "フィークス。裂傷や衰弱を伴う。",
            requiredResponse: "・奥義ダメージ 2000万",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-after-95-sephiroth",
            timingCondition: "フィークスの次ターン",
            enemyAction: "セフィロト。アビリティスロウを伴う。",
            requiredResponse: "・アビリティダメージ 1500万",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-ct-poros",
            timingCondition: "CT予兆（HP100%～81%）",
            enemyAction: "ポースポロス。解除失敗でカウントダウンが進行する。",
            requiredResponse: "・弱体効果 7回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-ct-iblis",
            timingCondition: "CT予兆（HP100%～81%）",
            enemyAction: "イブリース。敵へ追撃と全属性ダメージカットを付与する。",
            requiredResponse: "・ディスペル 2回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-tessera",
            timingCondition: "CT予兆を攻撃行動前に解除した場合",
            enemyAction: "確率でテセラの予兆が追加発生する。",
            requiredResponse: "・150万ダメージ 7hit",
            dangerLevel: "caution"
          }
        ]
      },
      {
        id: "dark-rapture-zero-section-80-61",
        title: "HP80%～61%",
        rows: [
          {
            id: "dark-rapture-zero-row-80-orbital",
            timingCondition: "HP80%",
            enemyAction: "オービタル・レゾナンス。永遠拒絶または絶対否定の神器を構える。解除不可。",
            requiredResponse: "・解除条件なし\n・神器の種類を確認",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-80-artifact",
            timingCondition: "HP80%通過後",
            enemyAction: "永遠拒絶はTA2回未満、絶対否定は25ヒット未満のターン終了時に追加効果が発生する。",
            requiredResponse: "・永遠拒絶：TA 2回\n・絶対否定：25hit",
            supplementalNote: "永遠拒絶のリフレクトは特に危険。CT予兆の解除条件も神器で変わる。",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-80-axion-vanitas",
            timingCondition: "HP80%の次ターン",
            enemyAction: "アキシオン・ヴァニタス。解除条件は80%までの最大ダメージ比率で分岐する。",
            requiredResponse: "・通常攻撃：100万ダメージ 10回\n・アビダメ：奥義 4回\n・奥義：40hit\n・その他：アビリティダメージ 15hit",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-fix-vanitas",
            timingCondition: "アキシオン・ヴァニタスの次ターン",
            enemyAction: "フィークス・ヴァニタス。解除条件は同じダメージ比率ルートで分岐する。",
            requiredResponse: "・通常攻撃：弱体効果 7回\n・アビダメ：TA 4回\n・奥義：アビリティダメージ 1500万\n・その他：奥義 4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-sephiroth-vanitas",
            timingCondition: "フィークス・ヴァニタスの次ターン",
            enemyAction: "セフィロト・ヴァニタス。解除条件は同じダメージ比率ルートで分岐する。",
            requiredResponse: "・通常攻撃：アビリティダメージ 1500万\n・アビダメ：40hit\n・奥義：TA 4回\n・その他：40hit",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-ct-absolute",
            timingCondition: "CT予兆（絶対否定）",
            enemyAction: "絶対否定。麻痺やFCゲージ減少などを伴う。",
            requiredResponse: "・奥義 4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-ct-eternal",
            timingCondition: "CT予兆（永遠拒絶）",
            enemyAction: "永遠拒絶と完全否認。麻痺やFCゲージ減少などを伴う。",
            requiredResponse: "・TA 3回",
            dangerLevel: "danger"
          }
        ]
      },
      {
        id: "dark-rapture-zero-section-60-21",
        title: "HP60%～21%",
        rows: [
          {
            id: "dark-rapture-zero-row-60-trumpet",
            timingCondition: "HP60%",
            enemyAction: "黙示録の喇叭。果実を再付与し、最初の1人が通過すると敵の弱体効果をリセットする。解除不可。",
            requiredResponse: "・解除条件なし\n・全員で通過確認\n・1人目通過後に弱体効果を入れ直す",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-1",
            timingCondition: "HP55%",
            enemyAction: "十二の試練・第一節。解除失敗で試練効果とカウントダウン減少が残る。",
            requiredResponse: "・奥義 5回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-2",
            timingCondition: "第一節の次ターン",
            enemyAction: "十二の試練・第二節。",
            requiredResponse: "・攻撃行動 6回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-3",
            timingCondition: "第二節の次ターン",
            enemyAction: "十二の試練・第三節。",
            requiredResponse: "・3500万ダメージ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-4",
            timingCondition: "第三節の次ターン",
            enemyAction: "十二の試練・第四節。",
            requiredResponse: "・弱体効果 10回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-5",
            timingCondition: "第四節の次ターン",
            enemyAction: "十二の試練・第五節。",
            requiredResponse: "・FC発動",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-6",
            timingCondition: "第五節の次ターン",
            enemyAction: "十二の試練・第六節。",
            requiredResponse: "・60hit",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-mid-ct-poros",
            timingCondition: "CT予兆（HP60%～21%）",
            enemyAction: "ポースポロス。解除失敗でカウントダウンが進行する。",
            requiredResponse: "・弱体効果 7回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-mid-ct-iblis",
            timingCondition: "CT予兆（HP60%～21%）",
            enemyAction: "イブリース。敵へ追撃と全属性ダメージカットを付与する。",
            requiredResponse: "・ディスペル 2回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-mid-tessera",
            timingCondition: "CT予兆を攻撃行動前に解除した場合",
            enemyAction: "確率でテセラの予兆が追加発生する。",
            requiredResponse: "・アビリティ 5回",
            dangerLevel: "caution"
          }
        ]
      },
      {
        id: "dark-rapture-zero-section-20-0",
        title: "HP20%～0%",
        rows: [
          {
            id: "dark-rapture-zero-row-20-gospel",
            timingCondition: "HP20%",
            enemyAction: "終末の福音。全体に無属性1万ダメージを与え、参戦者共通の試練7～12を付与する。解除不可。",
            requiredResponse: "・解除条件なし\n・全員で予兆確認後に通過",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-1",
            timingCondition: "終末の福音の次ターン",
            enemyAction: "アンチ・バシレイア。解除条件は奥義6回、アビリティ12回、66ヒットからランダムに1つ。",
            requiredResponse: "・奥義 6回\n・アビリティ 12回\n・66hit\n※いずれか1条件",
            supplementalNote: "解除困難ならガードやFC中断で次条件へ進む選択肢がある。",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-2",
            timingCondition: "1回目を未解除の場合の次ターン",
            enemyAction: "アンチ・バシレイア。1回目とは異なる未提示条件が出る。",
            requiredResponse: "・前ターン以外の残り2条件から1つ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-3",
            timingCondition: "2回目も未解除の場合の次ターン",
            enemyAction: "アンチ・バシレイア。残る未提示条件が出る。",
            requiredResponse: "・残った最後の1条件\n※3ターン以内にいずれか1条件を解除",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-13-poros-apocalypse",
            timingCondition: "HP13%",
            enemyAction: "ポースポロス・アポカリプス。全属性ダメージカットや強圧を伴う。",
            requiredResponse: "・99,999,999ダメージ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-6-iblis-apocalypse",
            timingCondition: "HP6%",
            enemyAction: "イブリース・アポカリプス。",
            requiredResponse: "・99hit",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-final-ct-axion",
            timingCondition: "CT予兆（HP20%以降）",
            enemyAction: "アキシオン・アポカリプス。アンデッドとカウントダウン進行を伴う。",
            requiredResponse: "・FC発動",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-countdown-zero",
            timingCondition: "終末へのカウントダウン0",
            enemyAction: "ジ・エンド。サブを含む全員が戦闘不能になる。",
            requiredResponse: "・解除不可\n・カウント0到達前に予兆解除または次区間へ通過",
            dangerLevel: "danger"
          }
        ]
      }
    ]
  }
];

export function validateRaidGuideMasterDefinitions(definitions = raidGuideMasterDefinitions) {
  const ids = new Set<string>();
  for (const guide of definitions) {
    if (guide.sections.length > 20) throw new Error(`${guide.id}: 区間は20件までです`);
    const rows = guide.sections.flatMap((section) => section.rows);
    if (rows.length > 100) throw new Error(`${guide.id}: 攻略行は100件までです`);
    if (guide.references.length > 5) throw new Error(`${guide.id}: 参考URLは5件までです`);
    for (const id of [guide.id, ...guide.sections.map((section) => section.id), ...rows.map((row) => row.id), ...guide.references.map((reference) => reference.id)]) {
      if (ids.has(id)) throw new Error(`攻略メモマスターIDが重複しています: ${id}`);
      ids.add(id);
    }
    rows.forEach((row) => {
      if (!row.timingCondition.trim() || row.timingCondition.length > 100) throw new Error(`${row.id}: タイミングを確認してください`);
      if (!row.enemyAction.trim() || row.enemyAction.length > 500) throw new Error(`${row.id}: 敵行動を確認してください`);
      if (!row.requiredResponse.trim() || row.requiredResponse.length > 500) throw new Error(`${row.id}: 対応を確認してください`);
      const linkTargets = [...row.enemyAction.matchAll(/\[\[page:([^|\]]+)\|[^\]]+\]\]/g)].map((match) => match[1]);
      for (const target of linkTargets) if (!rows.some((candidate) => candidate.id === target)) throw new Error(`${row.id}: リンク先が見つかりません: ${target}`);
      if ((row.supplementalNote?.length ?? 0) > 500) throw new Error(`${row.id}: 補足は500文字までです`);
    });
  }
}
