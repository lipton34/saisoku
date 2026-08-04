import { tengenRaidGuideMaster } from "./tengenRaidGuideMaster.js";

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
  rowRedirects?: Record<string, string>;
  sections: RaidGuideMasterSection[];
};

const earlyCtNote = "攻撃行動前に解除すると確率でテセラが発生するため、可能なら攻撃行動で解除する。";
const porosAction = "ポースポロス\n・ダメ：ランダム 5回・合計20倍\n・追加：全体 無属性6000\n・弱体：強圧、暗闇\n・カウント：+1";
const iblisAction = "イブリース\n・ダメ：ランダム 5回・合計20倍\n・追加：全体 無属性6000\n・敵：追撃、全属性ダメカ\n・カウント：+1";
const tesseraAction = "テセラ\n・ダメ：全体ランダム 30倍\n・味方：強化全消去、奥義ゲージDOWN\n・カウント：+1\n・発生：CT予兆を攻撃行動前に解除時、確率";

export const raidGuideMasterDefinitions: RaidGuideMasterDefinition[] = [
  {
    id: "dark-rapture-zero-six-player-v1",
    questMasterId: "quest-dark-rapture-zero",
    title: "6人攻略・共通行動",
    overview: "ルシファー・ゼロの6人攻略で共通して確認する予兆と解除条件。属性・編成固有の動きは対策メモと付箋で補う。",
    revision: 7,
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
            enemyAction: "[[page:dark-rapture-zero-row-opening|開幕 → 果実]]\n[[page:dark-rapture-zero-row-80-orbital|80% → 神器]]\n[[page:dark-rapture-zero-row-60-trumpet|60% → 弱体リセット]]\n[[page:dark-rapture-zero-row-20-gospel|20% → カウント管理]]",
            requiredResponse: "・確認：該当区間を選択\n・編成固有：付箋へ記載",
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
            enemyAction: "パラダイス・ロスト\n・ダメ：全体 無属性5万\n・味方：ランダムな果実2種類",
            requiredResponse: "・準備：HP5万以上\n・確認：付与された果実",
            supplementalNote: "黄は命中低下、消費後はアンデッドに注意。赤・緑・青も使用するアビリティ種別で消費されるため、解除手段と使用順を事前に決める。",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-turn-1-the-end",
            timingCondition: "1ターン目",
            enemyAction: "ジ・エンド\n・失敗：サブ含む全員が戦闘不能",
            requiredResponse: "・解除：3000万ダメ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-95-axion",
            timingCondition: "HP95%",
            enemyAction: "アキシオン\n・ダメ：全体ランダム 3回・合計30倍\n・弱体：連撃率DOWN、虚脱\n・カウント：+1",
            requiredResponse: "・解除：TA4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-after-95-fix",
            timingCondition: "[[page:dark-rapture-zero-row-95-axion|アキシオン]]の次ターン",
            enemyAction: "フィークス\n・ダメ：全体ランダム 30倍\n・弱体：裂傷、衰弱\n・カウント：+1",
            requiredResponse: "・解除：奥義ダメ2000万",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-after-95-sephiroth",
            timingCondition: "[[page:dark-rapture-zero-row-after-95-fix|フィークス]]の次ターン",
            enemyAction: "セフィロト\n・ダメ：ランダム 12回・合計24倍\n・弱体：アビリティスロウ\n・カウント：+1",
            requiredResponse: "・解除：アビダメ1500万",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-ct-poros",
            timingCondition: "CT予兆（HP100%～81%）",
            enemyAction: porosAction,
            requiredResponse: "・解除：弱体効果7回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-ct-iblis",
            timingCondition: "CT予兆（HP100%～81%）",
            enemyAction: iblisAction,
            requiredResponse: "・解除：ディスペル2回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-early-tessera",
            timingCondition: "CT予兆を攻撃行動前に解除した場合",
            enemyAction: tesseraAction,
            requiredResponse: "・解除：150万ダメ 7hit",
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
            enemyAction: "オービタル・レゾナンス\n・神器：永遠拒絶 または 絶対否定\n・敵：通常攻撃も実行",
            requiredResponse: "・解除：不可\n・確認：神器の種類",
            supplementalNote: "HP80%移行時の特殊発生\n・HP95%以降の予兆を複数解除できず、カウント0付近で他参戦者がHP80%を通過した場合に発生報告あり",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-80-artifact",
            timingCondition: "[[page:dark-rapture-zero-row-80-orbital|HP80%]]通過後",
            enemyAction: "神器の毎ターン条件\n・永遠拒絶：TA2回未満で追加効果\n・絶対否定：25hit未満で追加効果",
            requiredResponse: "・永遠拒絶：TA2回\n・絶対否定：25hit",
            supplementalNote: "永遠拒絶のリフレクトは特に危険。CT予兆の解除条件も神器で変わる。",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-80-axion-vanitas",
            timingCondition: "[[page:dark-rapture-zero-row-80-orbital|HP80%]]の次ターン",
            enemyAction: "アキシオン・ヴァニタス\n・ダメ：ランダム 6回・合計24倍\n・弱体：強圧、暗闇\n・味方：FCゲージ-30%\n・カウント：+1",
            requiredResponse: "・通常軸：100万ダメ10回\n・アビ軸：奥義4回\n・奥義軸：40hit\n・その他：アビダメ15hit",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-fix-vanitas",
            timingCondition: "[[page:dark-rapture-zero-row-80-axion-vanitas|アキシオン・ヴァニタス]]の次ターン",
            enemyAction: "フィークス・ヴァニタス\n・ダメ：全体ランダム 3回・合計30倍\n・弱体：アビリティスロウ（2人）\n・味方：奥義ゲージDOWN、FCゲージ-30%\n・カウント：+1",
            requiredResponse: "・通常軸：弱体効果7回\n・アビ軸：TA4回\n・奥義軸：アビダメ1500万\n・その他：奥義4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-sephiroth-vanitas",
            timingCondition: "[[page:dark-rapture-zero-row-80-fix-vanitas|フィークス・ヴァニタス]]の次ターン",
            enemyAction: "セフィロト・ヴァニタス\n・ダメ：ランダム 12回・合計24倍\n・弱体：召喚不可\n・味方：FCゲージ-30%\n・カウント：+1",
            requiredResponse: "・通常軸：アビダメ1500万\n・アビ軸：40hit\n・奥義軸：TA4回\n・その他：40hit",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-ct-absolute",
            timingCondition: "CT予兆（絶対否定）",
            enemyAction: "絶対否定\n・ダメ：全体ランダム 3回・合計24倍\n・敵：与ダメUP、追撃\n・弱体：連撃率DOWN、麻痺（2人）\n・味方：FCゲージ-30%\n・カウント：+1",
            requiredResponse: "・解除：奥義4回",
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-80-ct-eternal",
            timingCondition: "CT予兆（永遠拒絶）",
            enemyAction: "永遠拒絶と完全否認\n・ダメ：全体ランダム 3回・合計24倍\n・敵：与ダメUP、追撃\n・弱体：連撃率DOWN、麻痺（2人）\n・味方：FCゲージ-30%\n・カウント：+1",
            requiredResponse: "・解除：TA3回",
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
            enemyAction: "黙示録の喇叭\n・ダメ：全体ランダム 12倍\n・味方：ランダムな果実2種類\n・初回通過：敵の弱体リセット",
            requiredResponse: "・解除：不可\n・通過：全員で確認\n・初回通過後：弱体を入れ直す",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-1",
            timingCondition: "HP55%",
            enemyAction: "十二の試練・第一節\n・ダメ：全体ランダム 120倍\n・弱体：連撃率DOWN\n・カウント初期値：-1",
            requiredResponse: "・解除：奥義5回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-2",
            timingCondition: "[[page:dark-rapture-zero-row-trial-1|第一節]]の次ターン",
            enemyAction: "十二の試練・第二節\n・ダメ：ランダム 12回・合計120倍\n・敵：弱体耐性UP\n・カウント初期値：-1",
            requiredResponse: "・解除：攻撃行動6回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-3",
            timingCondition: "[[page:dark-rapture-zero-row-trial-2|第二節]]の次ターン",
            enemyAction: "十二の試練・第三節\n・ダメ：全体ランダム 3回・合計120倍\n・弱体：奥義封印\n・カウント初期値：-1",
            requiredResponse: "・解除：3500万ダメ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-4",
            timingCondition: "[[page:dark-rapture-zero-row-trial-3|第三節]]の次ターン",
            enemyAction: "十二の試練・第四節\n・ダメ：全体ランダム 30倍\n・弱体：裂傷、衰弱（2人）\n・カウント初期値：-1",
            requiredResponse: "・解除：弱体効果10回",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-5",
            timingCondition: "[[page:dark-rapture-zero-row-trial-4|第四節]]の次ターン",
            enemyAction: "十二の試練・第五節\n・ダメ：ランダム 12回・合計120倍\n・敵：攻防UP\n・カウント初期値：-1",
            requiredResponse: "・解除：FC",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-trial-6",
            timingCondition: "[[page:dark-rapture-zero-row-trial-5|第五節]]の次ターン",
            enemyAction: "十二の試練・第六節\n・ダメ：全体ランダム 3回・合計120倍\n・敵：被ダメ減少\n・カウント初期値：-1",
            requiredResponse: "・解除：60hit",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-mid-ct-poros",
            timingCondition: "CT予兆（HP60%～21%）",
            enemyAction: porosAction,
            requiredResponse: "・解除：弱体効果7回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-mid-ct-iblis",
            timingCondition: "CT予兆（HP60%～21%）",
            enemyAction: iblisAction,
            requiredResponse: "・解除：ディスペル2回",
            supplementalNote: earlyCtNote,
            dangerLevel: "caution"
          },
          {
            id: "dark-rapture-zero-row-mid-tessera",
            timingCondition: "CT予兆を攻撃行動前に解除した場合",
            enemyAction: tesseraAction,
            requiredResponse: "・解除：アビリティ5回",
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
            enemyAction: "終末の福音\n・ダメ：全体 無属性1万\n・敵：参戦者共通の試練7～12",
            requiredResponse: "・解除：不可\n・通過：全員の予兆確認後",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-1",
            timingCondition: "[[page:dark-rapture-zero-row-20-gospel|終末の福音]]の次ターン",
            enemyAction: "アンチ・バシレイア\n・ダメ：全体ランダム 120倍\n・カウント：+1",
            requiredResponse: "・候補：奥義6回、アビリティ12回、66hit\n・解除：提示された1条件",
            supplementalNote: "解除困難ならガードやFC中断で次条件へ進む選択肢がある。",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-2",
            timingCondition: "[[page:dark-rapture-zero-row-anti-basileia-1|1回目]]を未解除の場合の次ターン",
            enemyAction: "アンチ・バシレイア\n・ダメ：全体ランダム 120倍\n・カウント：+1",
            requiredResponse: "・解除：前ターン以外の残り2条件から1つ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-anti-basileia-3",
            timingCondition: "[[page:dark-rapture-zero-row-anti-basileia-2|2回目]]も未解除の場合の次ターン",
            enemyAction: "アンチ・バシレイア\n・ダメ：全体ランダム 120倍\n・カウント：+1",
            requiredResponse: "・解除：残った最後の1条件\n・期限：3ターン以内にいずれか1条件",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-13-poros-apocalypse",
            timingCondition: "HP13%",
            enemyAction: "ポースポロス・アポカリプス\n・ダメ：全体ランダム 3回・合計30倍\n・敵：全属性ダメカ\n・弱体：強圧\n・カウント：+1",
            requiredResponse: "・解除：99,999,999ダメ",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-6-iblis-apocalypse",
            timingCondition: "HP6%",
            enemyAction: "イブリース・アポカリプス\n・ダメ：ランダム 3回・合計20倍\n・追加：全体 無属性6000\n・弱体：アビリティ封印（2人）\n・味方：奥義ゲージDOWN（2人）\n・カウント：+1",
            requiredResponse: "・解除：99hit",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-final-ct-axion",
            timingCondition: "CT予兆（HP20%以降）",
            enemyAction: "アキシオン・アポカリプス\n・ダメ：全体ランダム 3回・合計30倍\n・弱体：アンデッド\n・カウント：+1",
            requiredResponse: "・解除：FC",
            dangerLevel: "danger"
          },
          {
            id: "dark-rapture-zero-row-countdown-zero",
            timingCondition: "終末へのカウントダウン0",
            enemyAction: "ジ・エンド\n・サブを含む全員が戦闘不能",
            requiredResponse: "・解除：不可\n・回避：カウント0前に予兆解除または次区間へ通過",
            dangerLevel: "danger"
          }
        ]
      }
    ]
  },
  tengenRaidGuideMaster
];

export function validateRaidGuideMasterDefinitions(definitions = raidGuideMasterDefinitions) {
  const ids = new Set<string>();
  for (const guide of definitions) {
    if (guide.sections.length > 20) throw new Error(`${guide.id}: 区間は20件までです`);
    const rows = guide.sections.flatMap((section) => section.rows);
    for (const [sourceId, targetId] of Object.entries(guide.rowRedirects ?? {})) {
      if (rows.some((row) => row.id === sourceId)) throw new Error(`${guide.id}: 移行元の攻略行が有効なままです: ${sourceId}`);
      if (!rows.some((row) => row.id === targetId)) throw new Error(`${guide.id}: 移行先の攻略行が見つかりません: ${targetId}`);
    }
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
      const linkTargets = [row.timingCondition, row.enemyAction, row.requiredResponse, row.supplementalNote ?? ""].flatMap((value) => [...value.matchAll(/\[\[page:([^|\]]+)\|[^\]]+\]\]/g)].map((match) => match[1]));
      for (const target of linkTargets) if (!rows.some((candidate) => candidate.id === target)) throw new Error(`${row.id}: リンク先が見つかりません: ${target}`);
      if ((row.supplementalNote?.length ?? 0) > 500) throw new Error(`${row.id}: 補足は500文字までです`);
    });
  }
}
