import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Check, Plus, Search, Trash2, X } from "lucide-react";
import {
  type BuildCharacterDetail,
  type BuildMastersQuery,
  type BuildMastersResponse,
  type BuildPostInput,
  type BuildPreset,
  type BuildReferenceUrl,
  type BuildSummonDetail,
  type BuildWeaponDetail,
} from "../lib/api";
import {
  findBuildMasterInCatalog,
  resolveBuildMasterThumbnailUrl,
  type BuildMasterKind,
  type BuildMasterItem,
} from "../lib/buildMasters";
import { useBuildMasterLookup } from "../lib/BuildMasterCatalogContext";

type FormStep = 1 | 2 | 3 | 4 | 5;
type PartBrowserKind = Exclude<BuildMasterKind, "job">;
type CandidateFilters = {
  element: string;
  category: string;
  query: string;
};
type PartBucket =
  | "requiredParts"
  | "recommendedParts"
  | "substitutableParts"
  | "freeSlots";

const steps: { id: FormStep; label: string; title: string }[] = [
  { id: 1, label: "基本", title: "基本情報入力" },
  { id: 2, label: "キャラ", title: "主人公ジョブ + キャラ選択" },
  { id: 3, label: "武器", title: "武器選択" },
  { id: 4, label: "召喚石", title: "召喚石選択" },
  { id: 5, label: "その他", title: "その他情報入力" },
];

const categoryOptions = ["高難度攻略用", "周回・武器集め用"];
const elementOptions = ["火", "水", "土", "風", "光", "闇"];
const operationOptions = ["手動", "フルオート", "セミオート", "未指定"];
const verificationOptions = [
  "未検証",
  "投稿者クリア済",
  "団内クリア済",
  "要調整",
];
const highDifficultyPurposeOptions = [
  "団内挑戦",
  "団内練習",
  "個人練習",
  "ソロ挑戦",
  "クリア編成",
  "参考メモ",
];
const farmingPurposeOptions = [
  "周回向け",
  "自発向け",
  "救援向け",
  "青箱狙い",
  "参考メモ",
];
const questOptions = [
  "ルシゼロ",
  "天元HL",
  "天元HLフリークエスト",
  "ルシゼロ系フリークエスト",
  "ムゲンHL",
  "ディアスポラHL",
  "ジークフリートHL",
  "シエテHL",
  "コスモスHL",
  "アガスティアHL",
];
const importanceOptions = ["必須", "推奨", "代用可", "自由枠"];
const blueChestOptions = ["あり", "なし", "未指定"];
const stabilityOptions = ["安定", "たまに失敗", "要手動確認", "未指定"];
const prerequisiteOptions = ["マグナ", "神石", "片面"];
const referenceTypeOptions = [
  "攻略記事",
  "YouTube",
  "X",
  "note / ブログ",
  "その他",
];
const raidRoleOptions = ["自発", "救援", "どちらでも"];
const candidateFetchLimit = 30;
const emptyCandidateFilters: CandidateFilters = {
  element: "",
  category: "",
  query: "",
};
const weaponCandidateCategories = [
  "終末武器",
  "オメガ武器",
  "バハ武器",
  "マグナ武器",
  "リミテッド武器",
  "そのほか",
];
const characterCandidateCategories = [
  "リミテッド",
  "十二神将",
  "十天衆",
  "十賢者",
  "季節限定",
  "水着",
  "浴衣",
  "クリスマス",
  "バレンタイン",
  "ハロウィン",
  "ドレスアップ",
];
const legacyCharacterCandidateCategories = [
  "リミテッド",
  "十天衆",
  "十賢者",
  "高難度",
  "周回",
  "そのほか",
];
const summonCandidateCategories = [
  "神石",
  "アーカルム",
  "高難度",
  "周回",
  "そのほか",
];
const frontCharacterSlots = 3;
const defaultSubCharacterSlots = 2;
const expandedSubCharacterSlots = 5;
const defaultWeaponSlots = 10;
const expandedWeaponSlots = 13;
const summonSlots = {
  main: 1,
  friend: 1,
  sub: 6,
};
const candidateElementOptions = [
  "火",
  "水",
  "土",
  "風",
  "光",
  "闇",
  "無属性",
  "不明",
];
const seasonalCharacterTypes = [
  "水着",
  "浴衣",
  "クリスマス",
  "バレンタイン",
  "ハロウィン",
  "ドレスアップ",
];
const characterSeriesOrder = [
  "リミテッド",
  "十二神将",
  "十天衆",
  "十賢者",
  "季節限定",
  "その他",
];

const emptyCharacterDetail: BuildCharacterDetail = {
  position: "任意",
  name: "",
  masterId: null,
  importance: "自由枠",
  roleMemo: "",
  substituteMemo: "",
};

const emptySummonDetail: BuildSummonDetail = {
  position: "任意",
  name: "",
  masterId: null,
  importance: "自由枠",
  usageMemo: "",
  substituteMemo: "",
};

const emptyWeaponDetail: BuildWeaponDetail = {
  name: "",
  masterId: null,
  importance: "自由枠",
  count: "",
  usageMemo: "",
  substituteMemo: "",
};

interface BuildFormStepsProps {
  form: BuildPostInput;
  onSubmit: (form: BuildPostInput) => Promise<void>;
  onCancel: () => void;
  onApplyPreset: (preset: BuildPreset) => void;
  onLoadMasterCandidates?: (params?: BuildMastersQuery) => Promise<BuildMastersResponse>;
  isSubmitting?: boolean;
  error?: string;
  presets?: BuildPreset[];
  editMode?: boolean;
}

function masterMeta(master: BuildMasterItem | undefined) {
  if (!master) {
    return "候補外 / 自由入力";
  }

  return [
    master.element,
    master.rarity,
    master.weaponType,
    master.series,
    ...(master.tags ?? []),
  ]
    .filter(Boolean)
    .join(" / ");
}

function candidateMeta(item: BuildMasterItem) {
  return [
    candidateElement(item),
    item.category || classifyCandidate(item),
    item.weaponType,
    item.series,
  ]
    .filter(Boolean)
    .join(" / ");
}

function partKindLabel(kind: Exclude<BuildMasterKind, "job">) {
  return kind === "character"
    ? "キャラ"
    : kind === "summon"
      ? "召喚石"
      : "武器";
}

function candidateCategoryOptions(kind: PartBrowserKind) {
  if (kind === "weapon") {
    return weaponCandidateCategories;
  }
  if (kind === "summon") {
    return summonCandidateCategories;
  }
  return characterCandidateCategories;
}

function textMeta(item: BuildMasterItem, key: string) {
  const value = item.metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function itemTags(item: BuildMasterItem) {
  return item.tags ?? [];
}

function hasTag(item: BuildMasterItem, tag: string) {
  return itemTags(item).includes(tag);
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

function candidateElement(item: BuildMasterItem) {
  const element = item.element?.trim();
  if (element && candidateElementOptions.includes(element)) {
    return element;
  }

  const tagElement = candidateElementOptions
    .filter((option) => option !== "不明")
    .find((option) => hasTag(item, option));

  return tagElement ?? "不明";
}

function seasonalType(item: BuildMasterItem) {
  const metadataSeasonalType = textMeta(item, "seasonalType");
  if (seasonalCharacterTypes.includes(metadataSeasonalType)) {
    return metadataSeasonalType;
  }

  return seasonalCharacterTypes.find((type) => hasTag(item, type)) ?? "";
}

function isLimitedCharacter(item: BuildMasterItem) {
  return textMeta(item, "series") === "リミテッド" || hasTag(item, "リミテッド");
}

function isDivineGeneralCharacter(item: BuildMasterItem) {
  return (
    textMeta(item, "subSeries") === "十二神将" || hasTag(item, "十二神将")
  );
}

function isEternalsCharacter(item: BuildMasterItem) {
  return textMeta(item, "series") === "十天衆" || hasTag(item, "十天衆");
}

function isEvokerCharacter(item: BuildMasterItem) {
  return textMeta(item, "series") === "十賢者" || hasTag(item, "十賢者");
}

function isSeasonalCharacter(item: BuildMasterItem) {
  return Boolean(seasonalType(item));
}

function characterSeriesRank(item: BuildMasterItem) {
  const label = isDivineGeneralCharacter(item)
    ? "十二神将"
    : isLimitedCharacter(item)
      ? "リミテッド"
      : isEternalsCharacter(item)
        ? "十天衆"
        : isEvokerCharacter(item)
          ? "十賢者"
          : isSeasonalCharacter(item)
            ? "季節限定"
            : "その他";

  return characterSeriesOrder.indexOf(label);
}

function matchesCandidateCategory(item: BuildMasterItem, category: string) {
  if (!category) {
    return true;
  }

  if (item.kind !== "character") {
    return classifyCandidate(item) === category;
  }

  if (seasonalCharacterTypes.includes(category)) {
    return seasonalType(item) === category;
  }

  if (category === "季節限定") {
    return isSeasonalCharacter(item);
  }
  if (category === "リミテッド") {
    return isLimitedCharacter(item) || isDivineGeneralCharacter(item);
  }
  if (category === "十二神将") {
    return isDivineGeneralCharacter(item);
  }
  if (category === "十天衆") {
    return isEternalsCharacter(item);
  }
  if (category === "十賢者") {
    return isEvokerCharacter(item);
  }

  return legacyCharacterCandidateCategories.includes(category)
    ? classifyCandidate(item) === category
    : false;
}

function matchesCandidateQuery(item: BuildMasterItem, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");
  if (!normalizedQuery) {
    return true;
  }

  return [item.name, item.displayName, ...(item.aliases ?? [])]
    .filter(Boolean)
    .some((value) =>
      value?.toLocaleLowerCase("ja-JP").includes(normalizedQuery),
    );
}

function sortCandidates(kind: PartBrowserKind, items: BuildMasterItem[]) {
  if (kind !== "character") {
    return items;
  }

  return [...items].sort((first, second) => {
    const firstElementRank = candidateElementOptions.indexOf(
      candidateElement(first),
    );
    const secondElementRank = candidateElementOptions.indexOf(
      candidateElement(second),
    );
    if (firstElementRank !== secondElementRank) {
      return firstElementRank - secondElementRank;
    }

    const firstSeriesRank = characterSeriesRank(first);
    const secondSeriesRank = characterSeriesRank(second);
    if (firstSeriesRank !== secondSeriesRank) {
      return firstSeriesRank - secondSeriesRank;
    }

    return first.name.localeCompare(second.name, "ja-JP");
  });
}

function candidateBadges(item: BuildMasterItem) {
  if (item.kind !== "character") {
    return [candidateElement(item), item.category || classifyCandidate(item)]
      .filter(Boolean)
      .slice(0, 3);
  }

  const badges = [candidateElement(item)];
  const type = seasonalType(item);

  if (isLimitedCharacter(item)) {
    badges.push("リミテッド");
  }
  if (isDivineGeneralCharacter(item)) {
    badges.push("十二神将");
  }
  if (isEternalsCharacter(item)) {
    badges.push("十天衆");
  }
  if (isEvokerCharacter(item)) {
    badges.push("十賢者");
  }
  if (type) {
    badges.push(type);
  }

  return badges.slice(0, 3);
}

function classifyCandidate(item: BuildMasterItem) {
  const joined = [item.name, item.series, item.weaponType, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(" ");

  if (item.kind === "weapon") {
    if (joined.includes("終末")) return "終末武器";
    if (joined.includes("オメガ")) return "オメガ武器";
    if (joined.includes("バハ")) return "バハ武器";
    if (joined.includes("マグナ")) return "マグナ武器";
    if (joined.includes("リミ")) return "リミテッド武器";
    return "そのほか";
  }

  if (item.kind === "character") {
    const type = seasonalType(item);
    if (type) return type;
    if (isDivineGeneralCharacter(item)) return "十二神将";
    if (isLimitedCharacter(item) || joined.includes("リミ")) return "リミテッド";
    if (joined.includes("十天衆")) return "十天衆";
    if (joined.includes("十賢者")) return "十賢者";
    if (joined.includes("高難度")) return "高難度";
    if (joined.includes("周回")) return "周回";
    return "そのほか";
  }

  if (joined.includes("神石")) return "神石";
  if (joined.includes("アーカルム")) return "アーカルム";
  if (joined.includes("高難度")) return "高難度";
  if (joined.includes("周回")) return "周回";
  return "そのほか";
}

function uniqueParts(form: BuildPostInput) {
  return Array.from(
    new Set(
      [
        ...form.characterDetails.map((item) => item.name.trim()),
        ...form.weaponDetails.map((item) => item.name.trim()),
        ...form.summonDetails.map((item) => item.name.trim()),
      ].filter(Boolean),
    ),
  );
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sameItems<T extends Record<string, unknown>>(first: T[], second: T[]) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((item, index) => {
    const other = second[index];
    const keys = Object.keys(item);
    return (
      keys.length === Object.keys(other).length &&
      keys.every((key) => item[key] === other[key])
    );
  });
}

function hasFixedCharacterSlotShape(
  characterDetails: BuildCharacterDetail[],
  subSlotCount: 2 | 5,
) {
  return (
    characterDetails.length === frontCharacterSlots + subSlotCount &&
    characterDetails
      .slice(0, frontCharacterSlots)
      .every((item) => item.position === "フロント") &&
    characterDetails
      .slice(frontCharacterSlots)
      .every((item) => item.position === "サブ")
  );
}

function hasFixedWeaponSlotShape(
  weaponDetails: BuildWeaponDetail[],
  weaponSlotCount: 10 | 13,
) {
  return weaponDetails.length === weaponSlotCount;
}

function hasFixedSummonSlotShape(summonDetails: BuildSummonDetail[]) {
  return (
    summonDetails.length === summonSlots.main + summonSlots.friend + summonSlots.sub &&
    summonDetails[0]?.position === "メイン" &&
    summonDetails[1]?.position === "フレンド" &&
    summonDetails.slice(2).every((item) => item.position === "サブ")
  );
}

function normalizeCharacters(
  items: BuildCharacterDetail[],
  subSlotCount: 2 | 5,
) {
  const frontItems = items.filter((item) => item.position === "フロント");
  const subItems = items.filter((item) => item.position === "サブ");
  const fallbackItems = items.filter(
    (item) => item.position !== "フロント" && item.position !== "サブ",
  );
  const frontFallbackCount = Math.max(
    0,
    frontCharacterSlots - frontItems.length,
  );
  const orderedFront = [
    ...frontItems,
    ...fallbackItems.slice(0, frontFallbackCount),
  ];
  const orderedSub = [
    ...subItems,
    ...fallbackItems.slice(frontFallbackCount),
  ];

  return [
    ...Array.from({ length: frontCharacterSlots }, (_, index) => ({
      ...emptyCharacterDetail,
      ...orderedFront[index],
      position: "フロント",
    })),
    ...Array.from({ length: subSlotCount }, (_, index) => ({
      ...emptyCharacterDetail,
      ...orderedSub[index],
      position: "サブ",
    })),
  ];
}

function normalizeWeapons(items: BuildWeaponDetail[], slotCount: 10 | 13) {
  return Array.from({ length: slotCount }, (_, index) => ({
    ...emptyWeaponDetail,
    ...items[index],
  }));
}

function normalizeSummons(items: BuildSummonDetail[]) {
  const mainItems = items.filter((item) => item.position === "メイン");
  const friendItems = items.filter((item) => item.position === "フレンド");
  const subItems = items.filter((item) => item.position === "サブ");
  const fallbackItems = items.filter(
    (item) =>
      item.position !== "メイン" &&
      item.position !== "フレンド" &&
      item.position !== "サブ",
  );

  return [
    ...Array.from({ length: summonSlots.main }, (_, index) => ({
      ...emptySummonDetail,
      ...mainItems[index],
      position: "メイン",
    })),
    ...Array.from({ length: summonSlots.friend }, (_, index) => ({
      ...emptySummonDetail,
      ...friendItems[index],
      position: "フレンド",
    })),
    ...Array.from({ length: summonSlots.sub }, (_, index) => ({
      ...emptySummonDetail,
      ...[...subItems, ...fallbackItems][index],
      position: "サブ",
    })),
  ];
}

const PartThumbnail = memo(function PartThumbnail({
  kind,
  masterId,
  name,
}: {
  kind: BuildMasterKind;
  masterId?: string | null;
  name: string;
}) {
  const masterCatalog = useBuildMasterLookup();
  const master =
    kind === "weapon"
      ? findBuildMasterInCatalog(masterCatalog, kind, name, masterId)
      : undefined;
  const thumbnailUrl = master ? resolveBuildMasterThumbnailUrl(master) : "";
  const [hasImageError, setHasImageError] = useState(false);
  const label = name.trim().slice(0, 2) || "?";

  useEffect(() => {
    setHasImageError(false);
  }, [thumbnailUrl]);

  if (thumbnailUrl && !hasImageError) {
    return (
      <img
        alt={name}
        className="part-thumbnail"
        height={48}
        loading="lazy"
        onError={() => setHasImageError(true)}
        src={thumbnailUrl}
        title={name}
        width={48}
      />
    );
  }

  return <span className={`part-thumbnail fallback ${kind}`}>{label}</span>;
});

type PartSlotProps = {
  kind: BuildMasterKind;
  label: string;
  masterId?: string | null;
  name: string;
  meta?: string;
  active: boolean;
  onClick: () => void;
  onClear: () => void;
};

const PartSlot = memo(function PartSlot({
  kind,
  label,
  masterId,
  name,
  meta,
  active,
  onClick,
  onClear,
}: PartSlotProps) {
  const masterCatalog = useBuildMasterLookup();
  const master = findBuildMasterInCatalog(masterCatalog, kind, name, masterId);

  return (
    <button
      className={`formation-slot ${active ? "active formation-slot--active" : ""} ${name ? "" : "formation-slot--empty"}`}
      onClick={onClick}
      type="button"
    >
      <PartThumbnail kind={kind} masterId={masterId} name={name} />
      <span className="formation-slot-body">
        <small>{label}</small>
        <strong>{name || "未選択"}</strong>
        {(meta || master) && <em>{[meta, master?.element, master?.weaponType, master?.series].filter(Boolean).join(" / ")}</em>}
      </span>
      {name && (
        <span
          aria-label="選択を解除"
          className="slot-clear"
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          role="button"
          tabIndex={0}
        >
          <X size={14} />
        </span>
      )}
    </button>
  );
}, function partSlotPropsEqual(previous, next) {
  return (
    previous.kind === next.kind &&
    previous.label === next.label &&
    previous.masterId === next.masterId &&
    previous.name === next.name &&
    previous.meta === next.meta &&
    previous.active === next.active
  );
});

const PartCandidateCard = memo(function PartCandidateCard({
  kind,
  item,
  selected,
  onSelect,
}: {
  kind: Exclude<BuildMasterKind, "job">;
  item: BuildMasterItem;
  selected: boolean;
  onSelect: (item: BuildMasterItem) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <button
      className={`part-candidate-card ${selected ? "selected" : ""}`}
      onClick={handleClick}
      type="button"
    >
      <PartThumbnail kind={kind} masterId={item.id} name={item.name} />
      <span>
        <strong>{item.name}</strong>
        <small>{candidateMeta(item)}</small>
        <span className="candidate-meta-badges">
          {candidateBadges(item).map((badge) => (
            <em className="candidate-meta-badge" key={badge}>
              {badge}
            </em>
          ))}
        </span>
      </span>
      {selected && <Check size={16} />}
    </button>
  );
});

function browserCandidatesFromResponse(
  response: BuildMastersResponse,
  kind: PartBrowserKind,
): BuildMasterItem[] {
  const aliasesByMasterId = new Map<string, string[]>();

  for (const alias of response.aliases) {
    const text = alias.alias.trim();
    if (!text) {
      continue;
    }
    aliasesByMasterId.set(alias.masterItemId, [
      ...(aliasesByMasterId.get(alias.masterItemId) ?? []),
      text,
    ]);
  }

  return response.items
    .filter((item) => item.isActive && item.kind === kind)
    .map((item) => {
      const weaponType = item.metadata?.weaponType;
      const series = item.metadata?.series;

      return {
        id: item.id,
        kind,
        name: item.name,
        displayName: item.displayName ?? undefined,
        element: item.element ?? undefined,
        category: item.category ?? undefined,
        rarity: item.rarity ?? undefined,
        weaponType: typeof weaponType === "string" ? weaponType : undefined,
        series: typeof series === "string" ? series : undefined,
        tags: item.tags,
        aliases: aliasesByMasterId.get(item.id) ?? [],
        metadata: item.metadata,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        thumbnailUrl: item.thumbnailUrl ?? undefined,
        thumbnailPath: item.thumbnailPath ?? undefined,
        description: item.description ?? undefined,
        note: item.note ?? undefined,
      };
    });
}

function PartCandidateBrowser({
  kind,
  activeName,
  filters,
  onLoadCandidates,
  onFilterChange,
  onClose,
  onSelect,
}: {
  kind: PartBrowserKind;
  activeName: string;
  filters: CandidateFilters;
  onLoadCandidates?: (params?: BuildMastersQuery) => Promise<BuildMastersResponse>;
  onFilterChange: (filters: CandidateFilters) => void;
  onClose?: () => void;
  onSelect: (item: BuildMasterItem) => void;
}) {
  const [candidates, setCandidates] = useState<BuildMasterItem[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const candidateRequestRef = useRef(0);
  const elementFilter = filters.element;
  const categoryFilter = filters.category;
  const queryFilter = filters.query;
  const debouncedQueryFilter = useDebouncedValue(queryFilter.trim(), 250);
  const hasFilters = Boolean(elementFilter || categoryFilter || queryFilter);

  const loadCandidates = useCallback(async (offset: number) => {
    if (!onLoadCandidates) {
      return;
    }

    setIsLoadingCandidates(true);
    setCandidateError("");
    const requestId = candidateRequestRef.current + 1;
    candidateRequestRef.current = requestId;
    const requestedElement = debouncedQueryFilter ? "" : elementFilter;
    try {
      const response = await onLoadCandidates({
        kind,
        element: requestedElement,
        query: debouncedQueryFilter,
        limit: candidateFetchLimit,
        offset,
      });
      const nextCandidates = browserCandidatesFromResponse(response, kind);
      if (candidateRequestRef.current !== requestId) {
        return;
      }

      setCandidates((current) =>
        offset === 0
          ? nextCandidates
          : [
              ...current,
              ...nextCandidates.filter(
                (item) => !current.some((currentItem) => currentItem.id === item.id),
              ),
            ],
      );
      setLoadedCount(offset + nextCandidates.length);
      setHasMoreCandidates(nextCandidates.length === candidateFetchLimit);
    } catch (caught) {
      if (candidateRequestRef.current !== requestId) {
        return;
      }
      setCandidateError(
        caught instanceof Error ? caught.message : "候補の取得に失敗しました",
      );
    } finally {
      if (candidateRequestRef.current === requestId) {
        setIsLoadingCandidates(false);
      }
    }
  }, [debouncedQueryFilter, elementFilter, kind, onLoadCandidates]);

  useEffect(() => {
    setCandidates([]);
    setLoadedCount(0);
    setHasMoreCandidates(false);
    void loadCandidates(0);
  }, [loadCandidates]);

  const visibleCandidates = useMemo(() => {
    return sortCandidates(
      kind,
      candidates.filter((item) => {
        const matchesCategory = matchesCandidateCategory(item, categoryFilter);
        return matchesCategory;
      }),
    );
  }, [candidates, categoryFilter, kind]);

  return (
    <div className="part-browser-modal" role="dialog" aria-modal="true">
      <div className="part-browser-modal-backdrop" onClick={onClose} />
      <div className="part-browser part-browser--modal">
      <div className="part-browser-header">
        <div>
          <p className="eyebrow">{partKindLabel(kind)}候補</p>
          <h3>{hasFilters ? "絞り込み結果" : "候補一覧"}</h3>
        </div>
        {onClose && (
          <button
            aria-label="候補一覧を閉じる"
            className="icon-button part-browser-close"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        )}
        <label className="part-search-field">
          検索
          <Search size={16} />
          <input
            onChange={(event) =>
              onFilterChange({ ...filters, query: event.target.value })
            }
            placeholder={`${partKindLabel(kind)}名で検索`}
            type="search"
            value={filters.query}
          />
        </label>
      </div>

      <div className="candidate-filter-row" aria-label="分類フィルター">
        <span>分類</span>
        <div className="candidate-filter-bar">
          <button
            className={`candidate-filter-chip ${categoryFilter ? "" : "active"}`}
            onClick={() => onFilterChange({ ...filters, category: "" })}
            type="button"
          >
            すべて
          </button>
          {candidateCategoryOptions(kind).map((option) => (
            <button
              className={`candidate-filter-chip ${categoryFilter === option ? "active" : ""}`}
              key={option}
              onClick={() => onFilterChange({ ...filters, category: option })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="candidate-filter-row" aria-label="属性フィルター">
        <span>属性</span>
        <div className="candidate-filter-bar">
          <button
            className={`candidate-filter-chip ${elementFilter ? "" : "active"}`}
            onClick={() => onFilterChange({ ...filters, element: "" })}
            type="button"
          >
            すべて
          </button>
          {candidateElementOptions.map((option) => (
            <button
              className={`candidate-filter-chip ${elementFilter === option ? "active" : ""}`}
              key={option}
              onClick={() => onFilterChange({ ...filters, element: option })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div
        className="part-browser-tabs"
        role="tablist"
        aria-label={`${partKindLabel(kind)}選択表示`}
      >
        <span className="active">候補一覧</span>
        <span className={hasFilters ? "active" : ""}>絞り込み</span>
        <span>{visibleCandidates.length}件表示</span>
        {hasMoreCandidates && <span>続きあり</span>}
      </div>

      {candidateError && <div className="form-error">{candidateError}</div>}

      <div className="part-candidate-grid">
        {visibleCandidates.map((item) => (
          <PartCandidateCard
            item={item}
            key={item.id}
            kind={kind}
            onSelect={onSelect}
            selected={activeName === item.name}
          />
        ))}
      </div>

      {(hasMoreCandidates || isLoadingCandidates) && (
        <div className="candidate-pagination" aria-label="候補ページ切り替え">
          <button
            className="secondary-button"
            disabled={isLoadingCandidates}
            onClick={() => void loadCandidates(loadedCount)}
            type="button"
          >
            {isLoadingCandidates ? "読み込み中" : "もっと見る"}
          </button>
        </div>
      )}

      {!isLoadingCandidates && visibleCandidates.length === 0 && (
        <div className="empty-state candidate-empty-state">
          候補にありません。選択中の枠に自由入力できます。
        </div>
      )}
      </div>
    </div>
  );
}

export function BuildFormSteps({
  form: initialForm,
  onSubmit,
  onCancel,
  onApplyPreset,
  onLoadMasterCandidates,
  isSubmitting = false,
  error = "",
  presets = [],
  editMode = false,
}: BuildFormStepsProps) {
  const masterCatalog = useBuildMasterLookup();
  const jobOptions = useMemo(
    () => masterCatalog.options.jobs.map((item) => item.name),
    [masterCatalog.options.jobs],
  );
  const [draftForm, setDraftForm] = useState(initialForm);
  const latestFormRef = useRef(draftForm);
  latestFormRef.current = draftForm;
  const form = draftForm;
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState(0);
  const [activeSummonIndex, setActiveSummonIndex] = useState(0);
  const [openPartBrowser, setOpenPartBrowser] =
    useState<PartBrowserKind | null>(null);
  const [characterFilters, setCharacterFilters] = useState<CandidateFilters>(
    emptyCandidateFilters,
  );
  const [weaponFilters, setWeaponFilters] = useState<CandidateFilters>(
    emptyCandidateFilters,
  );
  const [summonFilters, setSummonFilters] = useState<CandidateFilters>(
    emptyCandidateFilters,
  );
  const [subCharacterSlotCount, setSubCharacterSlotCount] = useState<2 | 5>(
    () =>
      form.characterDetails.filter((item) => item.position === "サブ").length >
      defaultSubCharacterSlots
        ? expandedSubCharacterSlots
        : defaultSubCharacterSlots,
  );
  const [weaponSlotCount, setWeaponSlotCount] = useState<10 | 13>(() =>
    initialForm.weaponDetails.length > defaultWeaponSlots
      ? expandedWeaponSlots
      : defaultWeaponSlots,
  );

  function applyDraft(next: BuildPostInput) {
    latestFormRef.current = next;
    setDraftForm(next);
  }

  useEffect(() => {
    latestFormRef.current = initialForm;
    setDraftForm(initialForm);
    setSubCharacterSlotCount(
      initialForm.characterDetails.filter((item) => item.position === "サブ")
        .length > defaultSubCharacterSlots
        ? expandedSubCharacterSlots
        : defaultSubCharacterSlots,
    );
    setWeaponSlotCount(
      initialForm.weaponDetails.length > defaultWeaponSlots
        ? expandedWeaponSlots
        : defaultWeaponSlots,
    );
    setActiveCharacterIndex(0);
    setActiveWeaponIndex(0);
    setActiveSummonIndex(0);
  }, [initialForm]);

  const purposeOptions =
    form.category === "周回・武器集め用"
      ? farmingPurposeOptions
      : highDifficultyPurposeOptions;
  const selectedParts = useMemo(
    () => (currentStep === 5 ? uniqueParts(form) : []),
    [
      currentStep,
      form.characterDetails,
      form.weaponDetails,
      form.summonDetails,
    ],
  );
  const filteredPresets = useMemo(
    () =>
      presets.filter(
        (preset) =>
          preset.category === form.category &&
          (!form.questName || preset.questName === form.questName) &&
          (!form.element || preset.element === form.element),
      ),
    [form.category, form.element, form.questName, presets],
  );
  const visiblePresets = filteredPresets.length > 0 ? filteredPresets : presets;

  function goToStep(step: FormStep) {
    setCurrentStep(step);
    setOpenPartBrowser(null);
  }

  function openCandidateBrowser(kind: PartBrowserKind) {
    const syncElement = (current: CandidateFilters) =>
      form.element && current.element !== form.element
        ? { ...current, element: form.element }
        : current;

    if (kind === "character") {
      setCharacterFilters(syncElement);
    } else if (kind === "weapon") {
      setWeaponFilters(syncElement);
    } else {
      setSummonFilters(syncElement);
    }
    setOpenPartBrowser(kind);
  }

  useEffect(() => {
    const incomingSubSlotCount =
      form.characterDetails.filter((item) => item.position === "サブ").length >
      defaultSubCharacterSlots
        ? expandedSubCharacterSlots
        : defaultSubCharacterSlots;
    if (incomingSubSlotCount > subCharacterSlotCount) {
      setSubCharacterSlotCount((value) =>
        incomingSubSlotCount > value ? incomingSubSlotCount : value,
      );
      return;
    }

    if (
      hasFixedCharacterSlotShape(form.characterDetails, subCharacterSlotCount)
    ) {
      return;
    }

    const characterDetails = normalizeCharacters(
      form.characterDetails,
      subCharacterSlotCount,
    );
    if (sameItems(characterDetails, form.characterDetails)) {
      return;
    }

    applyDraft({
      ...latestFormRef.current,
      characterDetails,
    });
  }, [form.characterDetails, subCharacterSlotCount]);

  useEffect(() => {
    const incomingWeaponSlotCount =
      form.weaponDetails.length > defaultWeaponSlots
        ? expandedWeaponSlots
        : defaultWeaponSlots;

    if (incomingWeaponSlotCount > weaponSlotCount) {
      setWeaponSlotCount((value) =>
        incomingWeaponSlotCount > value ? incomingWeaponSlotCount : value,
      );
      return;
    }

    if (hasFixedWeaponSlotShape(form.weaponDetails, weaponSlotCount)) {
      return;
    }

    const weaponDetails = normalizeWeapons(form.weaponDetails, weaponSlotCount);
    if (sameItems(weaponDetails, form.weaponDetails)) {
      return;
    }

    applyDraft({
      ...latestFormRef.current,
      weaponDetails,
    });
  }, [form.weaponDetails, weaponSlotCount]);

  useEffect(() => {
    if (hasFixedSummonSlotShape(form.summonDetails)) {
      return;
    }

    const summonDetails = normalizeSummons(form.summonDetails);
    if (sameItems(summonDetails, form.summonDetails)) {
      return;
    }

    applyDraft({
      ...latestFormRef.current,
      summonDetails,
    });
  }, [form.summonDetails]);

  function updateField<K extends keyof BuildPostInput>(
    key: K,
    value: BuildPostInput[K],
  ) {
    applyDraft({ ...form, [key]: value });
  }

  function updateCharacter(
    index: number,
    value: Partial<BuildCharacterDetail>,
  ) {
    const baseCharacterDetails = hasFixedCharacterSlotShape(
      form.characterDetails,
      subCharacterSlotCount,
    )
      ? form.characterDetails
      : normalizeCharacters(form.characterDetails, subCharacterSlotCount);
    const characterDetails = baseCharacterDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    applyDraft({ ...form, characterDetails });
  }

  function removeCharacter(index: number) {
    const baseCharacterDetails = hasFixedCharacterSlotShape(
      form.characterDetails,
      subCharacterSlotCount,
    )
      ? form.characterDetails
      : normalizeCharacters(form.characterDetails, subCharacterSlotCount);
    const characterDetails = baseCharacterDetails.map((item, itemIndex) =>
      itemIndex === index
        ? { ...emptyCharacterDetail, position: item.position }
        : item,
    );
    applyDraft({ ...form, characterDetails });
  }

  function normalizeCharacterSlots(size: 2 | 5) {
    setSubCharacterSlotCount(size);
    applyDraft({
      ...form,
      characterDetails: normalizeCharacters(form.characterDetails, size),
    });
    setActiveCharacterIndex((value) =>
      Math.min(value, frontCharacterSlots + size - 1),
    );
  }

  function updateWeapon(index: number, value: Partial<BuildWeaponDetail>) {
    const weaponDetails = form.weaponDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    applyDraft({ ...form, weaponDetails });
  }

  function normalizeWeaponSlots(size: 10 | 13) {
    setWeaponSlotCount(size);
    applyDraft({
      ...form,
      weaponDetails: normalizeWeapons(form.weaponDetails, size),
    });
    setActiveWeaponIndex(Math.min(activeWeaponIndex, size - 1));
  }

  function removeWeapon(index: number) {
    const weaponDetails = form.weaponDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...emptyWeaponDetail } : item,
    );
    applyDraft({ ...form, weaponDetails });
  }

  function updateSummon(index: number, value: Partial<BuildSummonDetail>) {
    const summonDetails = form.summonDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    applyDraft({ ...form, summonDetails });
  }

  function removeSummon(index: number) {
    const summonDetails = form.summonDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...emptySummonDetail, position: item.position } : item,
    );
    applyDraft({ ...form, summonDetails });
  }

  function updateReference(index: number, value: Partial<BuildReferenceUrl>) {
    const referenceUrls = form.referenceUrls.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    applyDraft({ ...form, referenceUrls });
  }

  function addReference() {
    applyDraft({
      ...form,
      referenceUrls: [
        ...form.referenceUrls,
        { type: "その他", title: "", url: "", memo: "" },
      ],
    });
  }

  function removeReference(index: number) {
    applyDraft({
      ...form,
      referenceUrls: form.referenceUrls.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  }

  function addPartToBucket(bucket: PartBucket, partName: string) {
    const current = form[bucket] ?? [];
    if (current.includes(partName)) {
      return;
    }
    updateField(bucket, [...current, partName]);
  }

  function stepIsValid(step: FormStep) {
    if (step === 1) {
      return Boolean(
        form.title &&
        form.category &&
        form.questName &&
        form.element &&
        form.purpose &&
        form.operationType &&
        form.verificationStatus,
      );
    }
    return true;
  }

  function stepValidationMessage(step: FormStep) {
    if (step !== 1 || stepIsValid(step)) {
      return "";
    }

    const missingFields = [
      !form.title.trim() ? "編成タイトル" : "",
      !form.questName.trim() ? "クエスト名" : "",
      !form.element ? "属性" : "",
      !form.purpose ? "目的" : "",
      !form.operationType ? "操作タイプ" : "",
      !form.verificationStatus ? "検証状態" : "",
    ].filter(Boolean);

    return missingFields.length > 0
      ? `${missingFields.join(" / ")}を入力してください。概要メモは空欄でも次へ進めます。`
      : "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  const displayCharacterDetails = useMemo(
    () =>
      hasFixedCharacterSlotShape(form.characterDetails, subCharacterSlotCount)
        ? form.characterDetails
        : normalizeCharacters(form.characterDetails, subCharacterSlotCount),
    [form.characterDetails, subCharacterSlotCount],
  );
  const safeCharacterIndex =
    displayCharacterDetails.length > 0
      ? Math.min(activeCharacterIndex, displayCharacterDetails.length - 1)
      : 0;
  const safeWeaponIndex =
    form.weaponDetails.length > 0
      ? Math.min(activeWeaponIndex, form.weaponDetails.length - 1)
      : 0;
  const safeSummonIndex =
    form.summonDetails.length > 0
      ? Math.min(activeSummonIndex, form.summonDetails.length - 1)
      : 0;
  const activeCharacter = displayCharacterDetails[safeCharacterIndex];
  const activeWeapon = form.weaponDetails[safeWeaponIndex];
  const activeSummon = form.summonDetails[safeSummonIndex];
  const frontCharacters = useMemo(
    () =>
      displayCharacterDetails
        .slice(0, frontCharacterSlots)
        .map((character, index) => ({ character, index })),
    [displayCharacterDetails],
  );
  const subCharacters = useMemo(
    () =>
      displayCharacterDetails
        .slice(frontCharacterSlots, frontCharacterSlots + subCharacterSlotCount)
        .map((character, index) => ({
          character,
          index: frontCharacterSlots + index,
        })),
    [displayCharacterDetails, subCharacterSlotCount],
  );
  const mainWeapon = form.weaponDetails[0] ?? emptyWeaponDetail;
  const normalWeapons = useMemo(
    () =>
      form.weaponDetails.slice(1).map((weapon, index) => ({
        weapon,
        index: index + 1,
      })),
    [form.weaponDetails],
  );
  const mainSummon = form.summonDetails[0] ?? {
    ...emptySummonDetail,
    position: "メイン",
  };
  const friendSummon = form.summonDetails[1] ?? {
    ...emptySummonDetail,
    position: "フレンド",
  };
  const subSummons = useMemo(
    () =>
      form.summonDetails.slice(2, 8).map((summon, index) => ({
        summon,
        index: index + 2,
      })),
    [form.summonDetails],
  );
  const selectCharacterCandidate = useCallback(
    (master: BuildMasterItem) => {
      const currentForm = latestFormRef.current;
      const currentCharacterDetails = hasFixedCharacterSlotShape(
        currentForm.characterDetails,
        subCharacterSlotCount,
      )
        ? currentForm.characterDetails
        : normalizeCharacters(currentForm.characterDetails, subCharacterSlotCount);
      const characterDetails =
        currentCharacterDetails.length > 0
          ? currentCharacterDetails.map((item, itemIndex) =>
              itemIndex === safeCharacterIndex
                ? { ...item, name: master.name, masterId: master.id }
                : item,
            )
          : [
              {
                ...emptyCharacterDetail,
                position: "フロント",
                name: master.name,
                masterId: master.id,
              },
            ];
      applyDraft({ ...currentForm, characterDetails });
      setOpenPartBrowser(null);
      if (currentCharacterDetails.length === 0) {
        setActiveCharacterIndex(0);
      }
    },
    [safeCharacterIndex, subCharacterSlotCount],
  );
  const selectWeaponCandidate = useCallback(
    (master: BuildMasterItem) => {
      const currentForm = latestFormRef.current;
      const weaponDetails =
        currentForm.weaponDetails.length > 0
          ? currentForm.weaponDetails.map((item, itemIndex) =>
              itemIndex === safeWeaponIndex
                ? { ...item, name: master.name, masterId: master.id }
                : item,
            )
          : [{ ...emptyWeaponDetail, name: master.name, masterId: master.id }];
      applyDraft({ ...currentForm, weaponDetails });
      setOpenPartBrowser(null);
      if (currentForm.weaponDetails.length === 0) {
        setActiveWeaponIndex(0);
      }
    },
    [safeWeaponIndex],
  );
  const selectSummonCandidate = useCallback(
    (master: BuildMasterItem) => {
      const currentForm = latestFormRef.current;
      const summonDetails =
        currentForm.summonDetails.length > 0
          ? currentForm.summonDetails.map((item, itemIndex) =>
              itemIndex === safeSummonIndex
                ? { ...item, name: master.name, masterId: master.id }
                : item,
            )
          : [
              {
                ...emptySummonDetail,
                position: "サブ",
                name: master.name,
                masterId: master.id,
              },
            ];
      applyDraft({ ...currentForm, summonDetails });
      setOpenPartBrowser(null);
      if (currentForm.summonDetails.length === 0) {
        setActiveSummonIndex(0);
      }
    },
    [safeSummonIndex],
  );

  return (
    <section className="build-form-steps-container">
      <form className="build-form-steps" onSubmit={handleSubmit}>
        <div className="steps-navigation">
          <div className="steps-indicator">
            {steps.map((step) => (
              <span
                aria-current={currentStep === step.id ? "step" : undefined}
                className={`step-badge ${currentStep === step.id ? "active" : ""} ${stepIsValid(step.id) ? "completed" : ""}`}
                key={step.id}
              >
                {step.id}
              </span>
            ))}
          </div>
          <div className="steps-labels">
            {steps.map((step) => (
              <span
                className={currentStep === step.id ? "active" : ""}
                key={step.id}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        <div className="steps-content">
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-heading-row">
                <div>
                  <p className="eyebrow">Step 1</p>
                  <h2>{steps[0].title}</h2>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setShowPresetModal(true)}
                  type="button"
                >
                  プリセットを使う
                </button>
              </div>

              <div className="form-row">
                <label>
                  編成タイトル *
                  <input
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="例：ルシゼロ水剣豪 初挑戦向け"
                    required
                    value={form.title}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  クエスト分類 *
                  <select
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                    value={form.category}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  クエスト名 *
                  <input
                    list="build-quest-options"
                    onChange={(event) =>
                      updateField("questName", event.target.value)
                    }
                    required
                    value={form.questName}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  属性 *
                  <select
                    onChange={(event) =>
                      updateField("element", event.target.value)
                    }
                    required
                    value={form.element}
                  >
                    <option value="">選択してください</option>
                    {elementOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  目的 *
                  <select
                    onChange={(event) =>
                      updateField("purpose", event.target.value)
                    }
                    required
                    value={form.purpose}
                  >
                    <option value="">選択してください</option>
                    {purposeOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  操作タイプ *
                  <select
                    onChange={(event) =>
                      updateField("operationType", event.target.value)
                    }
                    required
                    value={form.operationType}
                  >
                    {operationOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  検証状態 *
                  <select
                    onChange={(event) =>
                      updateField("verificationStatus", event.target.value)
                    }
                    required
                    value={form.verificationStatus}
                  >
                    {verificationOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                概要メモ
                <textarea
                  onChange={(event) =>
                    updateField("overview", event.target.value)
                  }
                  rows={3}
                  value={form.overview}
                />
              </label>

              {filteredPresets.length > 0 && (
                <div className="preset-suggestion">
                  条件に合うプリセットが {filteredPresets.length} 件あります。
                  <button
                    className="secondary-button"
                    onClick={() => setShowPresetModal(true)}
                    type="button"
                  >
                    選択する
                  </button>
                </div>
              )}

              {error && <div className="form-error">{error}</div>}
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-heading-row">
                <div>
                  <p className="eyebrow">Step 2</p>
                  <h2>{steps[1].title}</h2>
                </div>
                <div className="segmented-control" aria-label="サブキャラ枠数">
                  <button
                    className={subCharacterSlotCount === 2 ? "active" : ""}
                    onClick={() => normalizeCharacterSlots(2)}
                    type="button"
                  >
                    サブ2枠
                  </button>
                  <button
                    className={subCharacterSlotCount === 5 ? "active" : ""}
                    onClick={() => normalizeCharacterSlots(5)}
                    type="button"
                  >
                    サブ5枠
                  </button>
                </div>
              </div>

              <div
                className="formation-layout formation-layout--single"
              >
                <div className="formation-board">
                  <div className="formation-section formation-section--hero">
                    <div className="formation-section-title">
                      <span>主人公</span>
                      <strong>Protagonist Job</strong>
                    </div>
                    <div className="formation-board-scroll">
                      <div className="job-picker">
                        <label>
                          主人公ジョブ
                          <select
                            onChange={(event) =>
                              updateField("protagonistJob", event.target.value)
                            }
                            value={form.protagonistJob}
                          >
                            <option value="">選択してください</option>
                            {jobOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <div className="job-preview">
                          <PartThumbnail kind="job" name={form.protagonistJob} />
                          <div>
                            <strong>{form.protagonistJob || "主人公ジョブ未選択"}</strong>
                            <span>{masterMeta(masterCatalog.find("job", form.protagonistJob))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>フロントメンバー</span>
                      <strong>Front Member</strong>
                    </div>
                    <div className="formation-board-scroll">
                    <div className="formation-slot-grid character-slots character-slots--front">
                      {frontCharacters.map(({ character, index }) => (
                        <PartSlot
                          active={safeCharacterIndex === index}
                          kind="character"
                          key={index}
                          label={`フロント ${frontCharacters.findIndex((item) => item.index === index) + 1}`}
                          masterId={character.masterId}
                          meta={character.importance || character.roleMemo}
                          name={character.name}
                          onClear={() => updateCharacter(index, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveCharacterIndex(index);
                            openCandidateBrowser("character");
                          }}
                        />
                      ))}
                    </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>サブメンバー</span>
                      <strong>Sub Member</strong>
                    </div>
                    <div className="formation-board-scroll">
                    <div className="formation-slot-grid character-slots character-slots--sub">
                      {subCharacters.map(({ character, index }) => (
                        <PartSlot
                          active={safeCharacterIndex === index}
                          kind="character"
                          key={index}
                          label={`サブ ${subCharacters.findIndex((item) => item.index === index) + 1}`}
                          masterId={character.masterId}
                          meta={character.importance || character.roleMemo}
                          name={character.name}
                          onClear={() => updateCharacter(index, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveCharacterIndex(index);
                            openCandidateBrowser("character");
                          }}
                        />
                      ))}
                      </div>
                    </div>
                  </div>

                  {activeCharacter && (
                    <div className="slot-editor">
                      <label>
                        自由入力
                        <input
                          onChange={(event) =>
                            updateCharacter(safeCharacterIndex, {
                              name: event.target.value,
                              masterId: null,
                            })
                          }
                          placeholder="候補にないキャラ名"
                          value={activeCharacter.name}
                        />
                      </label>
                      <label>
                        重要度
                        <select
                          onChange={(event) =>
                            updateCharacter(safeCharacterIndex, {
                              importance: event.target.value,
                            })
                          }
                          value={activeCharacter.importance}
                        >
                          {importanceOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        役割メモ
                        <input
                          onChange={(event) =>
                            updateCharacter(safeCharacterIndex, {
                              roleMemo: event.target.value,
                            })
                          }
                          value={activeCharacter.roleMemo}
                        />
                      </label>
                      <label>
                        代用メモ
                        <input
                          onChange={(event) =>
                            updateCharacter(safeCharacterIndex, {
                              substituteMemo: event.target.value,
                            })
                          }
                          value={activeCharacter.substituteMemo}
                        />
                      </label>
                      <button
                        className="secondary-button"
                        onClick={() => openCandidateBrowser("character")}
                        type="button"
                      >
                        <Search size={16} />
                        候補から選ぶ
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => removeCharacter(safeCharacterIndex)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {openPartBrowser === "character" && (
                  <PartCandidateBrowser
                    activeName={activeCharacter?.name ?? ""}
                    filters={characterFilters}
                    kind="character"
                    onLoadCandidates={onLoadMasterCandidates}
                    onClose={() => setOpenPartBrowser(null)}
                    onFilterChange={setCharacterFilters}
                    onSelect={selectCharacterCandidate}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-panel">
              <div className="step-heading-row">
                <div>
                  <p className="eyebrow">Step 3</p>
                  <h2>{steps[2].title}</h2>
                </div>
                <div className="segmented-control" aria-label="武器枠数">
                  <button
                    className={weaponSlotCount === 10 ? "active" : ""}
                    onClick={() => normalizeWeaponSlots(10)}
                    type="button"
                  >
                    10枠
                  </button>
                  <button
                    className={weaponSlotCount === 13 ? "active" : ""}
                    onClick={() => normalizeWeaponSlots(13)}
                    type="button"
                  >
                    13枠
                  </button>
                </div>
              </div>

              <div
                className="formation-layout formation-layout--single"
              >
                <div className="formation-board">
                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>メイン武器</span>
                      <strong>Main Weapon</strong>
                    </div>
                    <div className="formation-board-scroll">
                      <div className="formation-slot-grid weapon-main-slot">
                        <PartSlot
                          active={safeWeaponIndex === 0}
                          kind="weapon"
                          label="メイン武器"
                          masterId={mainWeapon.masterId}
                          meta={mainWeapon.count ? `${mainWeapon.count}本 / ${mainWeapon.importance}` : mainWeapon.importance}
                          name={mainWeapon.name}
                          onClear={() => updateWeapon(0, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveWeaponIndex(0);
                            openCandidateBrowser("weapon");
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>武器グリッド</span>
                      <strong>Weapon Grid</strong>
                    </div>
                    <div className="formation-board-scroll">
                    <div className="formation-slot-grid weapon-slots">
                      {normalWeapons.map(({ weapon, index }) => (
                        <PartSlot
                          active={safeWeaponIndex === index}
                          kind="weapon"
                          key={index}
                          label={`武器 ${index + 1}`}
                          masterId={weapon.masterId}
                          meta={weapon.count ? `${weapon.count}本 / ${weapon.importance}` : weapon.importance}
                          name={weapon.name}
                          onClear={() => updateWeapon(index, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveWeaponIndex(index);
                            openCandidateBrowser("weapon");
                          }}
                        />
                      ))}
                    </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>選択中の武器</span>
                      <strong>{activeWeapon ? `武器 ${safeWeaponIndex + 1}` : "未選択"}</strong>
                    </div>

                  {activeWeapon && (
                    <div className="slot-editor">
                      <label>
                        自由入力
                        <input
                          onChange={(event) =>
                            updateWeapon(safeWeaponIndex, {
                              name: event.target.value,
                              masterId: null,
                            })
                          }
                          placeholder="候補にない武器名"
                          value={activeWeapon.name}
                        />
                      </label>
                      <label>
                        重要度
                        <select
                          onChange={(event) =>
                            updateWeapon(safeWeaponIndex, {
                              importance: event.target.value,
                            })
                          }
                          value={activeWeapon.importance}
                        >
                          {importanceOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        本数
                        <input
                          onChange={(event) =>
                            updateWeapon(safeWeaponIndex, {
                              count: event.target.value,
                            })
                          }
                          value={activeWeapon.count}
                        />
                      </label>
                      <label>
                        用途
                        <input
                          onChange={(event) =>
                            updateWeapon(safeWeaponIndex, {
                              usageMemo: event.target.value,
                            })
                          }
                          value={activeWeapon.usageMemo}
                        />
                      </label>
                      <label>
                        代用
                        <input
                          onChange={(event) =>
                            updateWeapon(safeWeaponIndex, {
                              substituteMemo: event.target.value,
                            })
                          }
                          value={activeWeapon.substituteMemo}
                        />
                      </label>
                      <button
                        className="secondary-button"
                        onClick={() => openCandidateBrowser("weapon")}
                        type="button"
                      >
                        <Search size={16} />
                        候補から選ぶ
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => removeWeapon(safeWeaponIndex)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  </div>
                </div>

                {openPartBrowser === "weapon" && (
                  <PartCandidateBrowser
                    activeName={activeWeapon?.name ?? ""}
                    filters={weaponFilters}
                    kind="weapon"
                    onLoadCandidates={onLoadMasterCandidates}
                    onClose={() => setOpenPartBrowser(null)}
                    onFilterChange={setWeaponFilters}
                    onSelect={selectWeaponCandidate}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-panel">
              <div className="step-heading-row">
                <div>
                  <p className="eyebrow">Step 4</p>
                  <h2>{steps[3].title}</h2>
                </div>
              </div>

              <div
                className="formation-layout formation-layout--single"
              >
                <div className="formation-board">
                  <div className="formation-section summon-top-grid">
                    <div className="summon-primary-group">
                      <div className="formation-section-title">
                        <span>メイン召喚石</span>
                        <strong>Main Summon</strong>
                      </div>
                      <div className="formation-board-scroll">
                      <div className="formation-slot-grid summon-primary-slot">
                        <PartSlot
                          active={safeSummonIndex === 0}
                          kind="summon"
                          label="メイン"
                          masterId={mainSummon.masterId}
                          meta={mainSummon.importance}
                          name={mainSummon.name}
                          onClear={() => updateSummon(0, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveSummonIndex(0);
                            openCandidateBrowser("summon");
                          }}
                        />
                      </div>
                      </div>
                    </div>

                    <div className="summon-primary-group">
                      <div className="formation-section-title">
                        <span>フレンド召喚石候補</span>
                        <strong>Support Summon</strong>
                      </div>
                      <div className="formation-board-scroll">
                      <div className="formation-slot-grid summon-primary-slot">
                        <PartSlot
                          active={safeSummonIndex === 1}
                          kind="summon"
                          label="フレンド"
                          masterId={friendSummon.masterId}
                          meta={friendSummon.importance}
                          name={friendSummon.name}
                          onClear={() => updateSummon(1, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveSummonIndex(1);
                            openCandidateBrowser("summon");
                          }}
                        />
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>サブ召喚石</span>
                      <strong>Sub Summon</strong>
                    </div>
                    <div className="formation-board-scroll">
                    <div className="formation-slot-grid summon-slots">
                      {subSummons.map(({ summon, index }) => (
                        <PartSlot
                          active={safeSummonIndex === index}
                          kind="summon"
                          key={index}
                          label={`サブ ${subSummons.findIndex((item) => item.index === index) + 1}`}
                          masterId={summon.masterId}
                          meta={summon.importance}
                          name={summon.name}
                          onClear={() => updateSummon(index, { name: "", masterId: null })}
                          onClick={() => {
                            setActiveSummonIndex(index);
                            openCandidateBrowser("summon");
                          }}
                        />
                      ))}
                      </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>選択中の召喚石</span>
                      <strong>{activeSummon ? `${activeSummon.position} ${safeSummonIndex + 1}` : "未選択"}</strong>
                    </div>
                    {activeSummon && (
                      <div className="slot-editor">
                      <label>
                        自由入力
                        <input
                          onChange={(event) =>
                            updateSummon(safeSummonIndex, {
                              name: event.target.value,
                              masterId: null,
                            })
                          }
                          placeholder="候補にない召喚石名"
                          value={activeSummon.name}
                        />
                      </label>
                      <label>
                        重要度
                        <select
                          onChange={(event) =>
                            updateSummon(safeSummonIndex, {
                              importance: event.target.value,
                            })
                          }
                          value={activeSummon.importance}
                        >
                          {importanceOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        用途
                        <input
                          onChange={(event) =>
                            updateSummon(safeSummonIndex, {
                              usageMemo: event.target.value,
                            })
                          }
                          value={activeSummon.usageMemo}
                        />
                      </label>
                      <label>
                        代用
                        <input
                          onChange={(event) =>
                            updateSummon(safeSummonIndex, {
                              substituteMemo: event.target.value,
                            })
                          }
                          value={activeSummon.substituteMemo}
                        />
                      </label>
                      <button
                        className="secondary-button"
                        onClick={() => openCandidateBrowser("summon")}
                        type="button"
                      >
                        <Search size={16} />
                        候補から選ぶ
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => removeSummon(safeSummonIndex)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                      </div>
                    )}
                  </div>
                </div>

                {openPartBrowser === "summon" && (
                  <PartCandidateBrowser
                    activeName={activeSummon?.name ?? ""}
                    filters={summonFilters}
                    kind="summon"
                    onLoadCandidates={onLoadMasterCandidates}
                    onClose={() => setOpenPartBrowser(null)}
                    onFilterChange={setSummonFilters}
                    onSelect={selectSummonCandidate}
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="step-panel">
              <div className="step-heading-row">
                <div>
                  <p className="eyebrow">Step 5</p>
                  <h2>{steps[4].title}</h2>
                </div>
              </div>

              <div className="selected-part-picker">
                <div>
                  <p className="eyebrow">選択済みパーツ</p>
                  <h3>必須・推奨・代用可へ追加</h3>
                </div>
                <div className="selected-part-chip-grid">
                  {selectedParts.map((part) => (
                    <div className="selected-part-chip" key={part}>
                      <span>{part}</span>
                      <button
                        onClick={() => addPartToBucket("requiredParts", part)}
                        type="button"
                      >
                        必須
                      </button>
                      <button
                        onClick={() =>
                          addPartToBucket("recommendedParts", part)
                        }
                        type="button"
                      >
                        推奨
                      </button>
                      <button
                        onClick={() =>
                          addPartToBucket("substitutableParts", part)
                        }
                        type="button"
                      >
                        代用可
                      </button>
                    </div>
                  ))}
                  {selectedParts.length === 0 && (
                    <div className="empty-state">
                      前のステップで選択したパーツがここに表示されます。
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <label>
                  必須パーツ
                  <textarea
                    onChange={(event) =>
                      updateField(
                        "requiredParts",
                        linesToArray(event.target.value),
                      )
                    }
                    rows={3}
                    value={(form.requiredParts || []).join("\n")}
                  />
                </label>
                <label>
                  推奨パーツ
                  <textarea
                    onChange={(event) =>
                      updateField(
                        "recommendedParts",
                        linesToArray(event.target.value),
                      )
                    }
                    rows={3}
                    value={(form.recommendedParts || []).join("\n")}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  代用可パーツ
                  <textarea
                    onChange={(event) =>
                      updateField(
                        "substitutableParts",
                        linesToArray(event.target.value),
                      )
                    }
                    rows={3}
                    value={(form.substitutableParts || []).join("\n")}
                  />
                </label>
                <label>
                  自由枠
                  <textarea
                    onChange={(event) =>
                      updateField("freeSlots", linesToArray(event.target.value))
                    }
                    rows={3}
                    value={(form.freeSlots || []).join("\n")}
                  />
                </label>
              </div>

              {form.category === "高難度攻略用" ? (
                <div className="form-row single-column">
                  <label>
                    役割
                    <input
                      onChange={(event) =>
                        updateField("role", event.target.value)
                      }
                      value={form.role}
                    />
                  </label>
                  <label>
                    予兆対応
                    <textarea
                      onChange={(event) =>
                        updateField("omenNotes", event.target.value)
                      }
                      rows={3}
                      value={form.omenNotes}
                    />
                  </label>
                  <label>
                    行動メモ
                    <textarea
                      onChange={(event) =>
                        updateField("actionNotes", event.target.value)
                      }
                      placeholder={"開幕\n100〜80%\n80〜60%\n60〜20%\n20〜0%"}
                      rows={7}
                      value={form.actionNotes}
                    />
                  </label>
                  <label>
                    失敗ポイント
                    <textarea
                      onChange={(event) =>
                        updateField("failurePoints", event.target.value)
                      }
                      rows={3}
                      value={form.failurePoints}
                    />
                  </label>
                </div>
              ) : (
                <div className="form-row">
                  <label>
                    周回目的
                    <input
                      onChange={(event) =>
                        updateField("farmingGoal", event.target.value)
                      }
                      value={form.farmingGoal}
                    />
                  </label>
                  <label>
                    自発／救援
                    <select
                      onChange={(event) =>
                        updateField("raidRole", event.target.value)
                      }
                      value={form.raidRole}
                    >
                      <option value="">未指定</option>
                      {raidRoleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    青箱狙い
                    <select
                      onChange={(event) =>
                        updateField("blueChest", event.target.value)
                      }
                      value={form.blueChest}
                    >
                      <option value="">未指定</option>
                      {blueChestOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    討伐時間目安
                    <input
                      onChange={(event) =>
                        updateField("clearTime", event.target.value)
                      }
                      value={form.clearTime}
                    />
                  </label>
                  <label>
                    安定度
                    <select
                      onChange={(event) =>
                        updateField("stability", event.target.value)
                      }
                      value={form.stability}
                    >
                      <option value="">未指定</option>
                      {stabilityOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    編成前提
                    <select
                      onChange={(event) =>
                        updateField("prerequisites", event.target.value)
                      }
                      value={form.prerequisites}
                    >
                      <option value="">未指定</option>
                      {prerequisiteOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    武器集め対象
                    <input
                      onChange={(event) =>
                        updateField("weaponTarget", event.target.value)
                      }
                      value={form.weaponTarget}
                    />
                  </label>
                  <label>
                    救援タイミングメモ
                    <input
                      onChange={(event) =>
                        updateField("rescueTiming", event.target.value)
                      }
                      value={form.rescueTiming}
                    />
                  </label>
                  <label>
                    周回時の注意点
                    <textarea
                      onChange={(event) =>
                        updateField("farmingCautions", event.target.value)
                      }
                      rows={3}
                      value={form.farmingCautions}
                    />
                  </label>
                </div>
              )}

              <div className="form-row">
                <label>
                  代用候補
                  <textarea
                    onChange={(event) =>
                      updateField("substituteNotes", event.target.value)
                    }
                    rows={3}
                    value={form.substituteNotes}
                  />
                </label>
                <label>
                  注意点
                  <textarea
                    onChange={(event) =>
                      updateField("cautions", event.target.value)
                    }
                    rows={3}
                    value={form.cautions}
                  />
                </label>
              </div>

              {form.sourcePresetName && (
                <div className="form-row">
                  <label>
                    プリセット由来・変更メモ
                    <textarea
                      onChange={(event) =>
                        updateField("changeMemo", event.target.value)
                      }
                      rows={3}
                      value={form.changeMemo ?? ""}
                    />
                  </label>
                </div>
              )}

              <div className="section-header">
                <h3>参考URL</h3>
                <button
                  className="secondary-button"
                  onClick={addReference}
                  type="button"
                >
                  <Plus size={16} />
                  追加
                </button>
              </div>

              <div className="reference-list">
                {form.referenceUrls.map((ref, index) => (
                  <div className="reference-item" key={index}>
                    <select
                      onChange={(event) =>
                        updateReference(index, { type: event.target.value })
                      }
                      value={ref.type}
                    >
                      {referenceTypeOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <input
                      onChange={(event) =>
                        updateReference(index, { title: event.target.value })
                      }
                      placeholder="タイトル"
                      value={ref.title}
                    />
                    <input
                      onChange={(event) =>
                        updateReference(index, { url: event.target.value })
                      }
                      placeholder="https://..."
                      type="url"
                      value={ref.url}
                    />
                    <input
                      onChange={(event) =>
                        updateReference(index, { memo: event.target.value })
                      }
                      placeholder="メモ"
                      value={ref.memo}
                    />
                    <button
                      className="icon-button danger"
                      onClick={() => removeReference(index)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="steps-footer">
          <button className="secondary-button" onClick={onCancel} type="button">
            <ArrowLeft size={16} />
            キャンセル
          </button>

          <div className="steps-nav-buttons">
            {stepValidationMessage(currentStep) && (
              <span className="steps-validation-message">
                {stepValidationMessage(currentStep)}
              </span>
            )}
            {currentStep > 1 && (
              <button
                className="secondary-button"
                onClick={() => goToStep((currentStep - 1) as FormStep)}
                type="button"
              >
                戻る
              </button>
            )}
            {currentStep < 5 && (
              <button
                className="primary-button"
                disabled={!stepIsValid(currentStep)}
                onClick={() => goToStep((currentStep + 1) as FormStep)}
                type="button"
              >
                次へ
              </button>
            )}
            {currentStep === 5 && (
              <button
                className="primary-button"
                disabled={isSubmitting}
                type="submit"
              >
                {editMode ? "更新する" : "投稿する"}
              </button>
            )}
          </div>
        </div>
      </form>

      {showPresetModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPresetModal(false)}
        >
          <div
            className="modal-content preset-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Preset</p>
                <h3>プリセットを使う</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowPresetModal(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="preset-modal-list">
              {visiblePresets.map((preset) => (
                <button
                  className="preset-modal-card"
                  key={preset.id}
                  onClick={() => {
                    setSubCharacterSlotCount(
                      preset.characterDetails.filter(
                        (item) => item.position === "サブ",
                      ).length > defaultSubCharacterSlots
                        ? expandedSubCharacterSlots
                        : defaultSubCharacterSlots,
                    );
                    setWeaponSlotCount(
                      preset.weaponDetails.length > defaultWeaponSlots
                        ? expandedWeaponSlots
                        : defaultWeaponSlots,
                    );
                    onApplyPreset(preset);
                    setShowPresetModal(false);
                    goToStep(1);
                  }}
                  type="button"
                >
                  <strong>{preset.name}</strong>
                  <div className="tags">
                    <span className="pill">{preset.element}</span>
                    <span className="pill">{preset.operationType}</span>
                    <span className="pill">{preset.purpose}</span>
                    <span className="pill muted">{preset.presetStatus}</span>
                  </div>
                  <small>
                    主要パーツ:{" "}
                    {[
                      preset.protagonistJob,
                      ...preset.requiredParts,
                      ...preset.characters,
                      ...preset.summons,
                      ...preset.weapons,
                    ]
                      .filter(Boolean)
                      .slice(0, 5)
                      .join(" / ") || "未設定"}
                  </small>
                  <small>
                    参考:{" "}
                    {preset.referenceUrls.length > 0
                      ? `${preset.referenceUrls.length}件あり`
                      : "なし"}{" "}
                    / 更新:{" "}
                    {new Date(preset.updatedAt).toLocaleDateString("ja-JP")}
                  </small>
                </button>
              ))}
              {visiblePresets.length === 0 && (
                <div className="empty-state">
                  利用できるプリセットはまだありません。
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
