import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

type ReferenceUrl = {
  type: string;
  title: string;
  url: string;
  memo: string;
};

type BuildPreset = {
  id: string;
  name: string;
  category: string;
  questName: string;
  element: string;
  purpose: string;
  operationType: string;
  verificationStatus: string;
  overview: string;
  presetStatus: string;
  origins: string[];
  protagonistJob: string;
  characters: string[];
  summons: string[];
  weapons: string[];
  requiredParts: string[];
  recommendedParts: string[];
  substitutableParts: string[];
  freeSlots: string[];
  substituteNotes: string;
  cautions: string;
  role?: string;
  omenNotes?: string;
  actionNotes?: string;
  failurePoints?: string;
  farmingGoal?: string;
  raidRole?: string;
  blueChest?: string;
  clearTime?: string;
  stability?: string;
  prerequisites?: string;
  weaponTarget?: string;
  rescueTiming?: string;
  farmingCautions?: string;
  referenceUrls: ReferenceUrl[];
  updatedAt: string;
};

const buildPresets: BuildPreset[] = [
  {
    id: "preset-luci-zero-water-kengo",
    name: "ルシゼロ 水剣豪 初挑戦向け",
    category: "高難度攻略用",
    questName: "ルシゼロ",
    element: "水",
    purpose: "団内練習",
    operationType: "手動",
    verificationStatus: "投稿者クリア済",
    overview: "団内練習で使うための水剣豪メモ。手持ちに合わせてキャラや石を差し替える前提。",
    presetStatus: "投稿者確認済",
    origins: ["YouTube参考", "団内実績"],
    protagonistJob: "剣豪",
    characters: ["ハーゼリーラ", "ガブリエル", "ワムデュス"],
    summons: ["ヴァルナ", "ベルゼバブ", "ヤチマ"],
    weapons: ["終末武器", "オメガ刀", "水属性の奥義寄せ武器"],
    requiredParts: ["奥義回転役", "弱体・ディスペル手段", "終末武器"],
    recommendedParts: ["高難度向けサブ加護石", "HPを確保できる武器"],
    substitutableParts: ["防御寄せキャラ", "奥義支援召喚石"],
    freeSlots: ["手持ちに合わせた耐久枠"],
    substituteNotes: "キャラ1枠は団内運用に合わせて耐久・弱体・火力のどれを優先するかで調整。",
    cautions: "外部記事の手順をそのまま保存せず、団内で使う注意点だけに整理する。",
    role: "試練・予兆対応を確認しながら動く練習枠",
    omenNotes: "解除が難しい予兆は無理に踏まず、事前に担当と召喚順を確認する。",
    actionNotes: "HP帯ごとの動きは団内メモとして追記する。",
    failurePoints: "召喚順の取り違え、弱体不足、HP不足に注意。",
    referenceUrls: [
      { type: "YouTube", title: "参考動画", url: "https://www.youtube.com/", memo: "動きの確認用。動画内再生はしない。" },
      { type: "攻略記事", title: "参考記事", url: "https://example.com/", memo: "URLと要点メモのみ保存。" }
    ],
    updatedAt: "2026-05-14"
  },
  {
    id: "preset-tengen-earth-support",
    name: "天元HL 土サポート寄せ",
    category: "高難度攻略用",
    questName: "天元HL",
    element: "土",
    purpose: "団内挑戦",
    operationType: "手動",
    verificationStatus: "未検証",
    overview: "団内初挑戦時に確認する土属性サポート寄せテンプレート。",
    presetStatus: "未検証",
    origins: ["攻略サイト参考", "投稿者作成"],
    protagonistJob: "パラディン",
    characters: ["サテュロス", "オクトー", "カイム"],
    summons: ["ティターン", "ルシフェル", "ゴッドガード・ブローディア"],
    weapons: ["終末武器", "オメガ武器", "HPを確保できる武器"],
    requiredParts: ["耐久手段", "ディスペル", "予兆解除用の奥義・アビリティ"],
    recommendedParts: ["サブ加護枠", "ダメージ軽減石"],
    substitutableParts: ["防御寄せキャラ", "弱体補助キャラ"],
    freeSlots: ["団内担当に合わせて調整"],
    substituteNotes: "未検証のため、投稿後に変更メモへ実戦差分を残す。",
    cautions: "手順の丸写しではなく、団内で必要な役割と注意点に絞る。",
    role: "耐久と解除補助",
    omenNotes: "担当属性の解除条件を事前に確認する。",
    actionNotes: "動きは練習後に更新する。",
    failurePoints: "防御手段の温存不足に注意。",
    referenceUrls: [{ type: "攻略記事", title: "参考記事", url: "https://example.com/", memo: "参照元確認用。" }],
    updatedAt: "2026-05-14"
  },
  {
    id: "preset-seofon-raid-fire-blue-chest",
    name: "シエテHL 火 青箱狙い",
    category: "周回・武器集め用",
    questName: "シエテHL",
    element: "火",
    purpose: "青箱狙い",
    operationType: "手動",
    verificationStatus: "投稿者クリア済",
    overview: "武器集め用の短時間周回メモ。速度よりも団内で再現しやすい形を優先。",
    presetStatus: "団内利用中",
    origins: ["団内実績"],
    protagonistJob: "レスラー",
    characters: ["パーシヴァル", "ミカエル", "ウィルナス"],
    summons: ["アグニス", "ベルゼバブ", "サン"],
    weapons: ["火リミ武器", "終末武器", "極星器"],
    requiredParts: ["火力役", "追撃・上限補助", "必要HP"],
    recommendedParts: ["時短用召喚石", "連撃補助"],
    substitutableParts: ["火力枠の代用キャラ"],
    freeSlots: ["手持ちに合わせた火力枠"],
    substituteNotes: "火力が足りない場合は討伐時間より安定度を優先する。",
    cautions: "救援状況により必要貢献度が変わるため、団内ルールを優先する。",
    farmingGoal: "シエテ剣集め",
    raidRole: "救援",
    blueChest: "狙う",
    clearTime: "3分前後",
    stability: "中",
    prerequisites: "火力石と最低限のHP確保",
    weaponTarget: "レヴァンス武器",
    rescueTiming: "団内の救援タイミングに合わせる。",
    farmingCautions: "青箱ラインだけを固定値として扱わず、実戦メモで補足する。",
    referenceUrls: [{ type: "その他", title: "団内メモ", url: "https://example.com/", memo: "団内運用の参照先。" }],
    updatedAt: "2026-05-14"
  }
];

function currentUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return req.user?.id ?? "";
}

function parseText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalText(value: unknown) {
  const text = parseText(value);
  return text.length > 0 ? text : null;
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => parseText(item)).filter(Boolean);
}

function parseReferenceUrls(value: unknown): ReferenceUrl[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const url = parseText(candidate.url);
      if (!url) {
        return null;
      }

      return {
        type: parseOptionalText(candidate.type) ?? "その他",
        title: parseOptionalText(candidate.title) ?? url,
        url,
        memo: parseOptionalText(candidate.memo) ?? ""
      };
    })
    .filter((item): item is ReferenceUrl => item !== null);
}

function findPreset(presetId: unknown) {
  const id = parseText(presetId);
  return buildPresets.find((preset) => preset.id === id);
}

function buildPostData(body: Record<string, unknown>, ownerId: string): Prisma.BuildPostCreateInput {
  const preset = findPreset(body.sourcePresetId);
  const source = preset ? { ...preset, title: preset.name } : body;
  const title = parseText(body.title) || parseText(source.title) || parseText(source.name);
  const category = parseText(body.category) || parseText(source.category);
  const questName = parseText(body.questName) || parseText(source.questName);
  const element = parseText(body.element) || parseText(source.element);

  if (!title || !category || !questName || !element) {
    throw new Error("編成タイトル、クエスト分類、クエスト名、属性を入力してください");
  }

  return {
    title,
    category,
    questName,
    element,
    purpose: parseText(body.purpose) || parseText(source.purpose) || "参考メモ",
    operationType: parseText(body.operationType) || parseText(source.operationType) || "未指定",
    verificationStatus: parseText(body.verificationStatus) || parseText(source.verificationStatus) || "未検証",
    overview: parseOptionalText(body.overview) ?? parseOptionalText(source.overview),
    protagonistJob: parseOptionalText(body.protagonistJob) ?? parseOptionalText(source.protagonistJob),
    characters: parseStringArray(body.characters).length ? parseStringArray(body.characters) : parseStringArray(source.characters),
    summons: parseStringArray(body.summons).length ? parseStringArray(body.summons) : parseStringArray(source.summons),
    weapons: parseStringArray(body.weapons).length ? parseStringArray(body.weapons) : parseStringArray(source.weapons),
    requiredParts: parseStringArray(body.requiredParts).length
      ? parseStringArray(body.requiredParts)
      : parseStringArray(source.requiredParts),
    recommendedParts: parseStringArray(body.recommendedParts).length
      ? parseStringArray(body.recommendedParts)
      : parseStringArray(source.recommendedParts),
    substitutableParts: parseStringArray(body.substitutableParts).length
      ? parseStringArray(body.substitutableParts)
      : parseStringArray(source.substitutableParts),
    freeSlots: parseStringArray(body.freeSlots).length ? parseStringArray(body.freeSlots) : parseStringArray(source.freeSlots),
    substituteNotes: parseOptionalText(body.substituteNotes) ?? parseOptionalText(source.substituteNotes),
    cautions: parseOptionalText(body.cautions) ?? parseOptionalText(source.cautions),
    role: parseOptionalText(body.role) ?? parseOptionalText(source.role),
    omenNotes: parseOptionalText(body.omenNotes) ?? parseOptionalText(source.omenNotes),
    actionNotes: parseOptionalText(body.actionNotes) ?? parseOptionalText(source.actionNotes),
    failurePoints: parseOptionalText(body.failurePoints) ?? parseOptionalText(source.failurePoints),
    farmingGoal: parseOptionalText(body.farmingGoal) ?? parseOptionalText(source.farmingGoal),
    raidRole: parseOptionalText(body.raidRole) ?? parseOptionalText(source.raidRole),
    blueChest: parseOptionalText(body.blueChest) ?? parseOptionalText(source.blueChest),
    clearTime: parseOptionalText(body.clearTime) ?? parseOptionalText(source.clearTime),
    stability: parseOptionalText(body.stability) ?? parseOptionalText(source.stability),
    prerequisites: parseOptionalText(body.prerequisites) ?? parseOptionalText(source.prerequisites),
    weaponTarget: parseOptionalText(body.weaponTarget) ?? parseOptionalText(source.weaponTarget),
    rescueTiming: parseOptionalText(body.rescueTiming) ?? parseOptionalText(source.rescueTiming),
    farmingCautions: parseOptionalText(body.farmingCautions) ?? parseOptionalText(source.farmingCautions),
    referenceUrls: parseReferenceUrls(body.referenceUrls).length
      ? parseReferenceUrls(body.referenceUrls)
      : parseReferenceUrls(source.referenceUrls),
    sourcePresetId: preset?.id ?? parseOptionalText(body.sourcePresetId),
    sourcePresetName: preset?.name ?? parseOptionalText(body.sourcePresetName),
    changeMemo: parseOptionalText(body.changeMemo),
    owner: { connect: { id: ownerId } }
  };
}

router.get("/presets", (req, res) => {
  const category = parseText(req.query.category);
  const questName = parseText(req.query.questName);
  const element = parseText(req.query.element);
  const presets = buildPresets.filter((preset) => {
    return (
      (!category || preset.category === category) &&
      (!questName || preset.questName === questName) &&
      (!element || preset.element === element)
    );
  });

  res.json({ presets });
});

router.get("/", async (req, res, next) => {
  try {
    const posts = await prisma.buildPost.findMany({
      where: { ownerId: currentUserId(req) },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const post = await prisma.buildPost.create({
      data: buildPostData(req.body as Record<string, unknown>, currentUserId(req))
    });

    res.status(201).json({ post });
  } catch (error) {
    if (error instanceof Error && error.message.includes("入力してください")) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await prisma.buildPost.deleteMany({
      where: { id: req.params.id, ownerId: currentUserId(req) }
    });

    if (deleted.count === 0) {
      res.status(404).json({ message: "編成メモが見つかりません" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as buildsRouter };
