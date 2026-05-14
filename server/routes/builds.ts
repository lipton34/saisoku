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

type CharacterDetail = {
  position: string;
  name: string;
  importance: string;
  roleMemo: string;
  substituteMemo: string;
};

type SummonDetail = {
  position: string;
  name: string;
  importance: string;
  usageMemo: string;
  substituteMemo: string;
};

type WeaponDetail = {
  name: string;
  importance: string;
  count: string;
  usageMemo: string;
  substituteMemo: string;
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
  characterDetails: CharacterDetail[];
  summonDetails: SummonDetail[];
  weaponDetails: WeaponDetail[];
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
    characterDetails: [
      { position: "フロント", name: "ハーゼリーラ", importance: "必須", roleMemo: "奥義回転と耐久補助", substituteMemo: "" },
      { position: "フロント", name: "ガブリエル", importance: "推奨", roleMemo: "火力と弱体補助", substituteMemo: "手持ちに合わせて弱体枠へ変更" },
      { position: "任意", name: "ワムデュス", importance: "代用可", roleMemo: "耐久補助", substituteMemo: "防御寄せキャラ" }
    ],
    summonDetails: [
      { position: "メイン", name: "ヴァルナ", importance: "推奨", usageMemo: "神石編成の前提", substituteMemo: "マグナ寄せの場合は要調整" },
      { position: "サブ", name: "ベルゼバブ", importance: "推奨", usageMemo: "火力・弱体補助", substituteMemo: "" },
      { position: "サブ", name: "ヤチマ", importance: "代用可", usageMemo: "召喚短縮", substituteMemo: "奥義支援召喚石" }
    ],
    weaponDetails: [
      { name: "終末武器", importance: "必須", count: "1本", usageMemo: "耐久と火力の軸", substituteMemo: "" },
      { name: "オメガ刀", importance: "推奨", count: "1本", usageMemo: "奥義寄せ", substituteMemo: "オメガ武器の得意武器違い" },
      { name: "水属性の奥義寄せ武器", importance: "自由枠", count: "数本", usageMemo: "手持ちに合わせて調整", substituteMemo: "" }
    ],
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
    characterDetails: [
      { position: "フロント", name: "サテュロス", importance: "推奨", roleMemo: "耐久と回復", substituteMemo: "防御寄せキャラ" },
      { position: "フロント", name: "オクトー", importance: "代用可", roleMemo: "奥義解除補助", substituteMemo: "奥義回転役" },
      { position: "サブ", name: "カイム", importance: "推奨", roleMemo: "サブ加護", substituteMemo: "" }
    ],
    summonDetails: [
      { position: "メイン", name: "ティターン", importance: "推奨", usageMemo: "神石編成の前提", substituteMemo: "マグナは要調整" },
      { position: "サブ", name: "ルシフェル", importance: "推奨", usageMemo: "回復・耐久", substituteMemo: "" },
      { position: "サブ", name: "ゴッドガード・ブローディア", importance: "代用可", usageMemo: "防御手段", substituteMemo: "ダメージ軽減石" }
    ],
    weaponDetails: [
      { name: "終末武器", importance: "必須", count: "1本", usageMemo: "耐久と火力の軸", substituteMemo: "" },
      { name: "オメガ武器", importance: "推奨", count: "1本", usageMemo: "予兆解除支援", substituteMemo: "" },
      { name: "HPを確保できる武器", importance: "自由枠", count: "複数", usageMemo: "耐久調整", substituteMemo: "" }
    ],
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
    characterDetails: [
      { position: "フロント", name: "パーシヴァル", importance: "必須", roleMemo: "火力軸", substituteMemo: "" },
      { position: "フロント", name: "ミカエル", importance: "推奨", roleMemo: "火力・上限補助", substituteMemo: "火力支援キャラ" },
      { position: "フロント", name: "ウィルナス", importance: "代用可", roleMemo: "火力枠", substituteMemo: "手持ちの火力枠" }
    ],
    summonDetails: [
      { position: "メイン", name: "アグニス", importance: "推奨", usageMemo: "神石編成の前提", substituteMemo: "マグナの場合は火力確認" },
      { position: "サブ", name: "ベルゼバブ", importance: "推奨", usageMemo: "時短", substituteMemo: "" },
      { position: "サブ", name: "サン", importance: "推奨", usageMemo: "与ダメ補助", substituteMemo: "" }
    ],
    weaponDetails: [
      { name: "火リミ武器", importance: "推奨", count: "複数", usageMemo: "火力確保", substituteMemo: "火力が足りる範囲で調整" },
      { name: "終末武器", importance: "必須", count: "1本", usageMemo: "上限・火力", substituteMemo: "" },
      { name: "極星器", importance: "代用可", count: "1本", usageMemo: "火力補助", substituteMemo: "" }
    ],
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

function parseCharacterDetails(value: unknown): CharacterDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const name = parseText(candidate.name);
      if (!name) {
        return null;
      }

      return {
        position: parseOptionalText(candidate.position) ?? "任意",
        name,
        importance: parseOptionalText(candidate.importance) ?? "自由枠",
        roleMemo: parseOptionalText(candidate.roleMemo) ?? "",
        substituteMemo: parseOptionalText(candidate.substituteMemo) ?? ""
      };
    })
    .filter((item): item is CharacterDetail => item !== null);
}

function parseSummonDetails(value: unknown): SummonDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const name = parseText(candidate.name);
      if (!name) {
        return null;
      }

      return {
        position: parseOptionalText(candidate.position) ?? "任意",
        name,
        importance: parseOptionalText(candidate.importance) ?? "自由枠",
        usageMemo: parseOptionalText(candidate.usageMemo) ?? "",
        substituteMemo: parseOptionalText(candidate.substituteMemo) ?? ""
      };
    })
    .filter((item): item is SummonDetail => item !== null);
}

function parseWeaponDetails(value: unknown): WeaponDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const name = parseText(candidate.name);
      if (!name) {
        return null;
      }

      return {
        name,
        importance: parseOptionalText(candidate.importance) ?? "自由枠",
        count: parseOptionalText(candidate.count) ?? "",
        usageMemo: parseOptionalText(candidate.usageMemo) ?? "",
        substituteMemo: parseOptionalText(candidate.substituteMemo) ?? ""
      };
    })
    .filter((item): item is WeaponDetail => item !== null);
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
  const characterDetails = parseCharacterDetails(body.characterDetails).length
    ? parseCharacterDetails(body.characterDetails)
    : parseCharacterDetails(source.characterDetails);
  const summonDetails = parseSummonDetails(body.summonDetails).length
    ? parseSummonDetails(body.summonDetails)
    : parseSummonDetails(source.summonDetails);
  const weaponDetails = parseWeaponDetails(body.weaponDetails).length
    ? parseWeaponDetails(body.weaponDetails)
    : parseWeaponDetails(source.weaponDetails);
  const characters = parseStringArray(body.characters).length
    ? parseStringArray(body.characters)
    : characterDetails.map((item) => item.name).filter(Boolean).length
      ? characterDetails.map((item) => item.name)
      : parseStringArray(source.characters);
  const summons = parseStringArray(body.summons).length
    ? parseStringArray(body.summons)
    : summonDetails.map((item) => item.name).filter(Boolean).length
      ? summonDetails.map((item) => item.name)
      : parseStringArray(source.summons);
  const weapons = parseStringArray(body.weapons).length
    ? parseStringArray(body.weapons)
    : weaponDetails.map((item) => item.name).filter(Boolean).length
      ? weaponDetails.map((item) => item.name)
      : parseStringArray(source.weapons);

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
    characterDetails: characterDetails as unknown as Prisma.InputJsonValue,
    summonDetails: summonDetails as unknown as Prisma.InputJsonValue,
    weaponDetails: weaponDetails as unknown as Prisma.InputJsonValue,
    characters,
    summons,
    weapons,
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
      include: { owner: { select: { displayName: true, username: true } } },
      orderBy: { updatedAt: "desc" }
    });

    res.json({
      posts: posts.map(({ owner, ...post }) => ({
        ...post,
        authorName: owner.displayName ?? owner.username
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const post = await prisma.buildPost.create({
      data: buildPostData(req.body as Record<string, unknown>, currentUserId(req)),
      include: { owner: { select: { displayName: true, username: true } } }
    });

    const { owner, ...rest } = post;
    res.status(201).json({ post: { ...rest, authorName: owner.displayName ?? owner.username } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("入力してください")) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const current = await prisma.buildPost.findFirst({
      where: { id: req.params.id, ownerId: currentUserId(req) },
      select: { id: true }
    });

    if (!current) {
      res.status(404).json({ message: "編成メモが見つかりません" });
      return;
    }

    const { owner, ...data } = buildPostData(req.body as Record<string, unknown>, currentUserId(req));
    const post = await prisma.buildPost.update({
      where: { id: req.params.id },
      data,
      include: { owner: { select: { displayName: true, username: true } } }
    });

    const { owner: postOwner, ...rest } = post;
    res.json({ post: { ...rest, authorName: postOwner.displayName ?? postOwner.username } });
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
