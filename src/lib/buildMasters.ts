import type { GbfMasterAlias, GbfMasterItem as ApiGbfMasterItem } from "./api";

export type BuildMasterKind = "character" | "summon" | "weapon" | "job";
export type GbfMasterKind = BuildMasterKind | "material" | "quest";

export type BuildMasterItem = {
  id: string;
  kind: BuildMasterKind;
  name: string;
  displayName?: string;
  element?: string;
  category?: string;
  rarity?: string;
  weaponType?: string;
  series?: string;
  tags?: string[];
  aliases?: string[];
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  description?: string;
  note?: string;
};

export type BuildMasterOptions = {
  characters: BuildMasterItem[];
  summons: BuildMasterItem[];
  weapons: BuildMasterItem[];
  jobs: BuildMasterItem[];
};

export type BuildMasterCatalog = {
  items: BuildMasterItem[];
  options: BuildMasterOptions;
  byId: Map<string, BuildMasterItem>;
  byKindAndName: Map<string, BuildMasterItem>;
  byKindAndAlias: Map<string, BuildMasterItem>;
  byKind: Map<BuildMasterKind, BuildMasterItem[]>;
  find: (kind: BuildMasterKind, name: string) => BuildMasterItem | undefined;
};

const supabaseStoragePublicBaseUrl =
  import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_BASE_URL?.trim() ?? "";

function cleanOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function resolveBuildMasterThumbnailUrl(item: {
  thumbnailUrl?: string;
  thumbnail_url?: string;
  thumbnailPath?: string;
  thumbnail_path?: string;
}) {
  const directUrl = cleanOptionalText(item.thumbnailUrl ?? item.thumbnail_url);
  if (directUrl) {
    return directUrl;
  }

  const thumbnailPath = cleanOptionalText(item.thumbnailPath ?? item.thumbnail_path);
  if (!thumbnailPath || !supabaseStoragePublicBaseUrl) {
    return "";
  }

  return `${supabaseStoragePublicBaseUrl.replace(/\/$/, "")}/${thumbnailPath.replace(/^\//, "")}`;
}

export const buildMasterItems: BuildMasterItem[] = [
  { id: "job-kengo", kind: "job", name: "剣豪", tags: ["奥義", "高難度"] },
  { id: "job-yamato", kind: "job", name: "ヤマト", tags: ["予兆対応", "高難度"] },
  { id: "job-manadiver", kind: "job", name: "マナダイバー", tags: ["フルオート", "周回"] },
  { id: "job-berserker", kind: "job", name: "ベルセルク", tags: ["火力", "周回"] },
  { id: "job-paladin", kind: "job", name: "パラディン", tags: ["耐久", "高難度"] },
  { id: "job-robinhood", kind: "job", name: "ロビンフッド", tags: ["弱体", "高難度"] },
  { id: "job-chaos-ruler", kind: "job", name: "カオスルーダー", tags: ["弱体"] },
  { id: "job-relic-buster", kind: "job", name: "レリックバスター", tags: ["周回"] },
  { id: "job-wrestler", kind: "job", name: "レスラー", tags: ["短期", "周回"] },

  { id: "char-haaselia", kind: "character", name: "ハーゼリーラ", element: "水", rarity: "SSR", thumbnailPath: "characters/haaselia.webp", tags: ["十賢者", "高難度"] },
  { id: "char-gabriel", kind: "character", name: "ガブリエル", element: "水", rarity: "SSR", thumbnailPath: "characters/gabriel.webp", tags: ["リミテッド", "高難度"] },
  { id: "char-wamdus", kind: "character", name: "ワムデュス", element: "水", rarity: "SSR", thumbnailPath: "characters/wamdus.webp", tags: ["リミテッド", "耐久"] },
  { id: "char-satyr", kind: "character", name: "サテュロス", element: "土", rarity: "SSR", thumbnailPath: "characters/satyr.webp", tags: ["耐久"] },
  { id: "char-okto", kind: "character", name: "オクトー", element: "土", rarity: "SSR", thumbnailPath: "characters/okto.webp", tags: ["十天衆", "奥義"] },
  { id: "char-caim", kind: "character", name: "カイム", element: "土", rarity: "SSR", thumbnailPath: "characters/caim.webp", tags: ["十賢者", "サブ"] },
  { id: "char-percival", kind: "character", name: "パーシヴァル", element: "火", rarity: "SSR", thumbnailPath: "characters/percival.webp", tags: ["リミテッド", "周回"] },
  { id: "char-michael", kind: "character", name: "ミカエル", element: "火", rarity: "SSR", thumbnailPath: "characters/michael.webp", tags: ["リミテッド", "周回"] },
  { id: "char-wilnas", kind: "character", name: "ウィルナス", element: "火", rarity: "SSR", thumbnailPath: "characters/wilnas.webp", tags: ["リミテッド", "火力"] },

  { id: "summon-varuna", kind: "summon", name: "ヴァルナ", element: "水", rarity: "SSR", thumbnailPath: "summons/varuna.webp", tags: ["神石", "メイン"] },
  { id: "summon-titan", kind: "summon", name: "ティターン", element: "土", rarity: "SSR", thumbnailPath: "summons/titan.webp", tags: ["神石", "メイン"] },
  { id: "summon-agni", kind: "summon", name: "アグニス", element: "火", rarity: "SSR", thumbnailPath: "summons/agni.webp", tags: ["神石", "メイン"] },
  { id: "summon-bubz", kind: "summon", name: "ベルゼバブ", element: "無属性", rarity: "SSR", thumbnailPath: "summons/beelzebub.webp", tags: ["高難度", "周回"] },
  { id: "summon-yatima", kind: "summon", name: "ヤチマ", element: "無属性", rarity: "SSR", thumbnailPath: "summons/yatima.webp", tags: ["高難度"] },
  { id: "summon-lucifer", kind: "summon", name: "ルシフェル", element: "光", rarity: "SSR", thumbnailPath: "summons/lucifer.webp", tags: ["回復", "耐久"] },
  { id: "summon-godguard-brodia", kind: "summon", name: "ゴッドガード・ブローディア", element: "土", rarity: "SSR", thumbnailPath: "summons/godguard-brodia.webp", tags: ["防御"] },
  { id: "summon-sun", kind: "summon", name: "サン", element: "火", rarity: "SSR", thumbnailPath: "summons/sun.webp", tags: ["アーカルム", "周回"] },

  { id: "weapon-ultima", kind: "weapon", name: "オメガ武器", element: "無属性", rarity: "SSR", series: "オメガ", thumbnailPath: "weapons/omega.webp", tags: ["高難度"] },
  { id: "weapon-dark-opus", kind: "weapon", name: "終末武器", element: "可変", rarity: "SSR", series: "終末", thumbnailPath: "weapons/dark-opus.webp", tags: ["必須級"] },
  { id: "weapon-kyokusei", kind: "weapon", name: "極星器", element: "無属性", rarity: "SSR", series: "極星器", thumbnailPath: "weapons/kyokusei.webp", tags: ["周回"] }
];

export const buildMasterOptions = {
  characters: buildMasterItems.filter((item) => item.kind === "character"),
  summons: buildMasterItems.filter((item) => item.kind === "summon"),
  weapons: buildMasterItems.filter((item) => item.kind === "weapon"),
  jobs: buildMasterItems.filter((item) => item.kind === "job")
};

function isBuildMasterKind(kind: GbfMasterKind): kind is BuildMasterKind {
  return kind === "character" || kind === "summon" || kind === "weapon" || kind === "job";
}

function optionalText(value: string | null | undefined) {
  const text = value?.trim();
  return text || undefined;
}

function metadataText(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function kindAndValueKey(kind: BuildMasterKind, value: string) {
  return `${kind}:${value.trim()}`;
}

function aliasMap(aliases: GbfMasterAlias[] | undefined) {
  const byMasterId = new Map<string, string[]>();

  for (const alias of aliases ?? []) {
    const text = alias.alias.trim();
    if (!text) {
      continue;
    }

    byMasterId.set(alias.masterItemId, [...(byMasterId.get(alias.masterItemId) ?? []), text]);
  }

  return byMasterId;
}

function normalizeDbMasterItem(item: ApiGbfMasterItem, aliases: string[]): BuildMasterItem | null {
  if (!item.isActive || !isBuildMasterKind(item.kind)) {
    return null;
  }

  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    displayName: optionalText(item.displayName),
    element: optionalText(item.element),
    category: optionalText(item.category),
    rarity: optionalText(item.rarity),
    weaponType: metadataText(item.metadata, "weaponType"),
    series: metadataText(item.metadata, "series"),
    tags: item.tags,
    aliases,
    metadata: item.metadata,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    thumbnailUrl: optionalText(item.thumbnailUrl),
    thumbnailPath: optionalText(item.thumbnailPath),
    description: optionalText(item.description),
    note: optionalText(item.note)
  };
}

function sortMasterItems(items: BuildMasterItem[]) {
  return [...items].sort((first, second) => {
    const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }
    return first.name.localeCompare(second.name, "ja-JP");
  });
}

function toBuildMasterOptions(items: BuildMasterItem[]): BuildMasterOptions {
  return {
    characters: sortMasterItems(items.filter((item) => item.kind === "character")),
    summons: sortMasterItems(items.filter((item) => item.kind === "summon")),
    weapons: sortMasterItems(items.filter((item) => item.kind === "weapon")),
    jobs: sortMasterItems(items.filter((item) => item.kind === "job"))
  };
}

function buildCatalogIndexes(items: BuildMasterItem[]) {
  const byId = new Map<string, BuildMasterItem>();
  const byKindAndName = new Map<string, BuildMasterItem>();
  const byKindAndAlias = new Map<string, BuildMasterItem>();
  const byKind = new Map<BuildMasterKind, BuildMasterItem[]>([
    ["character", []],
    ["summon", []],
    ["weapon", []],
    ["job", []]
  ]);

  for (const item of items) {
    byId.set(item.id, item);
    byKindAndName.set(kindAndValueKey(item.kind, item.name), item);
    byKind.get(item.kind)?.push(item);

    for (const alias of item.aliases ?? []) {
      byKindAndAlias.set(kindAndValueKey(item.kind, alias), item);
    }
  }

  for (const [kind, values] of byKind) {
    byKind.set(kind, sortMasterItems(values));
  }

  return { byId, byKindAndName, byKindAndAlias, byKind };
}

export function createBuildMasterCatalog(
  dbItems?: ApiGbfMasterItem[],
  dbAliases?: GbfMasterAlias[],
): BuildMasterCatalog {
  const mergedById = new Map<string, BuildMasterItem>();

  for (const item of buildMasterItems) {
    mergedById.set(item.id, item);
  }

  const aliasesByMasterId = aliasMap(dbAliases);
  for (const item of dbItems ?? []) {
    const normalized = normalizeDbMasterItem(item, aliasesByMasterId.get(item.id) ?? []);
    if (!normalized) {
      continue;
    }
    mergedById.set(normalized.id, normalized);
  }

  const items = sortMasterItems([...mergedById.values()]);
  const indexes = buildCatalogIndexes(items);
  const options = toBuildMasterOptions(items);

  return {
    items,
    options,
    ...indexes,
    find: (kind, name) => {
      const normalized = name.trim();
      if (!normalized) {
        return undefined;
      }

      return (
        indexes.byKindAndName.get(kindAndValueKey(kind, normalized)) ??
        indexes.byKindAndAlias.get(kindAndValueKey(kind, normalized))
      );
    }
  };
}

export const fallbackBuildMasterCatalog = createBuildMasterCatalog();

const buildMasterIndex = fallbackBuildMasterCatalog.byKindAndName;

export function findBuildMaster(kind: BuildMasterKind, name: string) {
  const normalized = name.trim();
  return buildMasterIndex.get(`${kind}:${normalized}`);
}

export function findBuildMasterInCatalog(
  catalog: BuildMasterCatalog,
  kind: BuildMasterKind,
  name: string,
  masterId?: string | null,
) {
  const id = masterId?.trim();
  if (id) {
    const byId = catalog.byId.get(id) ?? fallbackBuildMasterCatalog.byId.get(id);
    if (byId?.kind === kind) {
      return byId;
    }
  }

  return catalog.find(kind, name) ?? findBuildMaster(kind, name);
}
