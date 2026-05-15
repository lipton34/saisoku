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
  type BuildPostInput,
  type BuildPreset,
  type BuildReferenceUrl,
  type BuildSummonDetail,
  type BuildWeaponDetail,
} from "../lib/api";
import {
  buildMasterOptions,
  findBuildMaster,
  type BuildMasterKind,
  type BuildMasterItem,
} from "../lib/buildMasters";

type FormStep = 1 | 2 | 3 | 4 | 5;
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
const jobOptions = buildMasterOptions.jobs.map((item) => item.name);
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
const candidatePageSize = 10;
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

const emptyCharacterDetail: BuildCharacterDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  roleMemo: "",
  substituteMemo: "",
};

const emptySummonDetail: BuildSummonDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  usageMemo: "",
  substituteMemo: "",
};

const emptyWeaponDetail: BuildWeaponDetail = {
  name: "",
  importance: "自由枠",
  count: "",
  usageMemo: "",
  substituteMemo: "",
};

interface BuildFormStepsProps {
  form: BuildPostInput;
  onFormChange: (form: BuildPostInput) => void;
  onSubmit: (form: BuildPostInput) => Promise<void>;
  onCancel: () => void;
  onApplyPreset: (preset: BuildPreset) => void;
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

function partOptions(kind: Exclude<BuildMasterKind, "job">) {
  if (kind === "character") {
    return buildMasterOptions.characters;
  }
  if (kind === "summon") {
    return buildMasterOptions.summons;
  }
  return buildMasterOptions.weapons;
}

function partKindLabel(kind: Exclude<BuildMasterKind, "job">) {
  return kind === "character"
    ? "キャラ"
    : kind === "summon"
      ? "召喚石"
      : "武器";
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

function sameJson<T>(first: T, second: T) {
  return JSON.stringify(first) === JSON.stringify(second);
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
  name,
}: {
  kind: BuildMasterKind;
  name: string;
}) {
  const master = findBuildMaster(kind, name);
  const label = name.trim().slice(0, 2) || "?";

  if (master?.thumbnailUrl) {
    return (
      <img
        alt={name}
        className="part-thumbnail"
        height={48}
        loading="lazy"
        src={master.thumbnailUrl}
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
  name: string;
  meta?: string;
  active: boolean;
  onClick: () => void;
  onClear: () => void;
};

const PartSlot = memo(function PartSlot({
  kind,
  label,
  name,
  meta,
  active,
  onClick,
  onClear,
}: PartSlotProps) {
  const master = findBuildMaster(kind, name);

  return (
    <button
      className={`formation-slot ${active ? "active formation-slot--active" : ""} ${name ? "" : "formation-slot--empty"}`}
      onClick={onClick}
      type="button"
    >
      <PartThumbnail kind={kind} name={name} />
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
  onSelect: (name: string) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(item.name);
  }, [item.name, onSelect]);

  return (
    <button
      className={`part-candidate-card ${selected ? "selected" : ""}`}
      onClick={handleClick}
      type="button"
    >
      <PartThumbnail kind={kind} name={item.name} />
      <span>
        <strong>{item.name}</strong>
        <small>{masterMeta(item)}</small>
      </span>
      {selected && <Check size={16} />}
    </button>
  );
});

function PartCandidateBrowser({
  kind,
  activeName,
  query,
  onQueryChange,
  onSelect,
}: {
  kind: Exclude<BuildMasterKind, "job">;
  activeName: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (name: string) => void;
}) {
  const [page, setPage] = useState(1);
  const options = partOptions(kind);
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((item) =>
      [
        item.name,
        item.element,
        item.rarity,
        item.weaponType,
        item.series,
        ...(item.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
      );
  }, [normalizedQuery, options]);
  const pageCount = Math.max(1, Math.ceil(candidates.length / candidatePageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedCandidates = useMemo(
    () =>
      candidates.slice(
        (currentPage - 1) * candidatePageSize,
        currentPage * candidatePageSize,
      ),
    [candidates, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, kind]);

  return (
    <div className="part-browser">
      <div className="part-browser-header">
        <div>
          <p className="eyebrow">{partKindLabel(kind)}候補</p>
          <h3>{normalizedQuery ? "検索結果" : "候補一覧"}</h3>
        </div>
        <label className="part-search-field">
          <Search size={16} />
          <input
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`${partKindLabel(kind)}名・属性で検索`}
            value={query}
          />
        </label>
      </div>

      <div
        className="part-browser-tabs"
        role="tablist"
        aria-label={`${partKindLabel(kind)}選択表示`}
      >
        <span className="active">候補一覧</span>
        <span className={normalizedQuery ? "active" : ""}>検索結果</span>
        <span>{candidates.length}件</span>
      </div>

      <div className="part-candidate-grid">
        {pagedCandidates.map((item) => (
          <PartCandidateCard
            item={item}
            key={item.id}
            kind={kind}
            onSelect={onSelect}
            selected={activeName === item.name}
          />
        ))}
      </div>

      {candidates.length > candidatePageSize && (
        <div className="candidate-pagination" aria-label="候補ページ切り替え">
          <button
            className="secondary-button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            前へ
          </button>
          <span>
            {currentPage} / {pageCount}
          </span>
          <button
            className="secondary-button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            type="button"
          >
            次へ
          </button>
        </div>
      )}

      {candidates.length === 0 && (
        <div className="empty-state">
          候補にありません。選択中の枠に自由入力できます。
        </div>
      )}
    </div>
  );
}

export function BuildFormSteps({
  form,
  onFormChange,
  onSubmit,
  onCancel,
  onApplyPreset,
  isSubmitting = false,
  error = "",
  presets = [],
  editMode = false,
}: BuildFormStepsProps) {
  const latestFormRef = useRef(form);
  latestFormRef.current = form;
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState(0);
  const [activeSummonIndex, setActiveSummonIndex] = useState(0);
  const [characterQuery, setCharacterQuery] = useState("");
  const [weaponQuery, setWeaponQuery] = useState("");
  const [summonQuery, setSummonQuery] = useState("");
  const [subCharacterSlotCount, setSubCharacterSlotCount] = useState<2 | 5>(
    () =>
      form.characterDetails.filter((item) => item.position === "サブ").length >
      defaultSubCharacterSlots
        ? expandedSubCharacterSlots
        : defaultSubCharacterSlots,
  );
  const [weaponSlotCount, setWeaponSlotCount] = useState<10 | 13>(() =>
    form.weaponDetails.length > defaultWeaponSlots
      ? expandedWeaponSlots
      : defaultWeaponSlots,
  );

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
    if (sameJson(characterDetails, form.characterDetails)) {
      return;
    }

    onFormChange({
      ...latestFormRef.current,
      characterDetails,
    });
  }, [form.characterDetails, onFormChange, subCharacterSlotCount]);

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
    if (sameJson(weaponDetails, form.weaponDetails)) {
      return;
    }

    onFormChange({
      ...latestFormRef.current,
      weaponDetails,
    });
  }, [form.weaponDetails, onFormChange, weaponSlotCount]);

  useEffect(() => {
    if (hasFixedSummonSlotShape(form.summonDetails)) {
      return;
    }

    const summonDetails = normalizeSummons(form.summonDetails);
    if (sameJson(summonDetails, form.summonDetails)) {
      return;
    }

    onFormChange({
      ...latestFormRef.current,
      summonDetails,
    });
  }, [form.summonDetails, onFormChange]);

  function updateField<K extends keyof BuildPostInput>(
    key: K,
    value: BuildPostInput[K],
  ) {
    onFormChange({ ...form, [key]: value });
  }

  function updateCharacter(
    index: number,
    value: Partial<BuildCharacterDetail>,
  ) {
    const characterDetails = form.characterDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    onFormChange({ ...form, characterDetails });
  }

  function removeCharacter(index: number) {
    const characterDetails = form.characterDetails.map((item, itemIndex) =>
      itemIndex === index
        ? { ...emptyCharacterDetail, position: item.position }
        : item,
    );
    onFormChange({ ...form, characterDetails });
  }

  function normalizeCharacterSlots(size: 2 | 5) {
    setSubCharacterSlotCount(size);
    onFormChange({
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
    onFormChange({ ...form, weaponDetails });
  }

  function normalizeWeaponSlots(size: 10 | 13) {
    setWeaponSlotCount(size);
    onFormChange({
      ...form,
      weaponDetails: normalizeWeapons(form.weaponDetails, size),
    });
    setActiveWeaponIndex(Math.min(activeWeaponIndex, size - 1));
  }

  function removeWeapon(index: number) {
    const weaponDetails = form.weaponDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...emptyWeaponDetail } : item,
    );
    onFormChange({ ...form, weaponDetails });
  }

  function updateSummon(index: number, value: Partial<BuildSummonDetail>) {
    const summonDetails = form.summonDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    onFormChange({ ...form, summonDetails });
  }

  function removeSummon(index: number) {
    const summonDetails = form.summonDetails.map((item, itemIndex) =>
      itemIndex === index ? { ...emptySummonDetail, position: item.position } : item,
    );
    onFormChange({ ...form, summonDetails });
  }

  function updateReference(index: number, value: Partial<BuildReferenceUrl>) {
    const referenceUrls = form.referenceUrls.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...value } : item,
    );
    onFormChange({ ...form, referenceUrls });
  }

  function addReference() {
    onFormChange({
      ...form,
      referenceUrls: [
        ...form.referenceUrls,
        { type: "その他", title: "", url: "", memo: "" },
      ],
    });
  }

  function removeReference(index: number) {
    onFormChange({
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  const safeCharacterIndex =
    form.characterDetails.length > 0
      ? Math.min(activeCharacterIndex, form.characterDetails.length - 1)
      : 0;
  const safeWeaponIndex =
    form.weaponDetails.length > 0
      ? Math.min(activeWeaponIndex, form.weaponDetails.length - 1)
      : 0;
  const safeSummonIndex =
    form.summonDetails.length > 0
      ? Math.min(activeSummonIndex, form.summonDetails.length - 1)
      : 0;
  const activeCharacter = form.characterDetails[safeCharacterIndex];
  const activeWeapon = form.weaponDetails[safeWeaponIndex];
  const activeSummon = form.summonDetails[safeSummonIndex];
  const frontCharacters = form.characterDetails
    .slice(0, frontCharacterSlots)
    .map((character, index) => ({ character, index }));
  const subCharacters = form.characterDetails
    .slice(frontCharacterSlots, frontCharacterSlots + subCharacterSlotCount)
    .map((character, index) => ({
      character,
      index: frontCharacterSlots + index,
    }));
  const mainWeapon = form.weaponDetails[0] ?? emptyWeaponDetail;
  const normalWeapons = form.weaponDetails.slice(1).map((weapon, index) => ({
    weapon,
    index: index + 1,
  }));
  const mainSummon = form.summonDetails[0] ?? {
    ...emptySummonDetail,
    position: "メイン",
  };
  const friendSummon = form.summonDetails[1] ?? {
    ...emptySummonDetail,
    position: "フレンド",
  };
  const subSummons = form.summonDetails.slice(2, 8).map((summon, index) => ({
    summon,
    index: index + 2,
  }));
  const selectCharacterCandidate = useCallback(
    (name: string) => {
      const currentForm = latestFormRef.current;
      const characterDetails =
        currentForm.characterDetails.length > 0
          ? currentForm.characterDetails.map((item, itemIndex) =>
              itemIndex === safeCharacterIndex ? { ...item, name } : item,
            )
          : [
              {
                ...emptyCharacterDetail,
                position: "フロント",
                name,
              },
            ];
      onFormChange({ ...currentForm, characterDetails });
      if (currentForm.characterDetails.length === 0) {
        setActiveCharacterIndex(0);
      }
    },
    [onFormChange, safeCharacterIndex],
  );
  const selectWeaponCandidate = useCallback(
    (name: string) => {
      const currentForm = latestFormRef.current;
      const weaponDetails =
        currentForm.weaponDetails.length > 0
          ? currentForm.weaponDetails.map((item, itemIndex) =>
              itemIndex === safeWeaponIndex ? { ...item, name } : item,
            )
          : [{ ...emptyWeaponDetail, name }];
      onFormChange({ ...currentForm, weaponDetails });
      if (currentForm.weaponDetails.length === 0) {
        setActiveWeaponIndex(0);
      }
    },
    [onFormChange, safeWeaponIndex],
  );
  const selectSummonCandidate = useCallback(
    (name: string) => {
      const currentForm = latestFormRef.current;
      const summonDetails =
        currentForm.summonDetails.length > 0
          ? currentForm.summonDetails.map((item, itemIndex) =>
              itemIndex === safeSummonIndex ? { ...item, name } : item,
            )
          : [
              {
                ...emptySummonDetail,
                position: "サブ",
                name,
              },
            ];
      onFormChange({ ...currentForm, summonDetails });
      if (currentForm.summonDetails.length === 0) {
        setActiveSummonIndex(0);
      }
    },
    [onFormChange, safeSummonIndex],
  );

  return (
    <section className="build-form-steps-container">
      <form className="build-form-steps" onSubmit={handleSubmit}>
        <div className="steps-navigation">
          <div className="steps-indicator">
            {steps.map((step) => (
              <button
                className={`step-badge ${currentStep === step.id ? "active" : ""} ${stepIsValid(step.id) ? "completed" : ""}`}
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                type="button"
              >
                {step.id}
              </button>
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
              </div>

              <div className="formation-layout">
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
                            <span>{masterMeta(findBuildMaster("job", form.protagonistJob))}</span>
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
                          meta={character.importance || character.roleMemo}
                          name={character.name}
                          onClear={() => updateCharacter(index, { name: "" })}
                          onClick={() => setActiveCharacterIndex(index)}
                        />
                      ))}
                    </div>
                    </div>
                  </div>

                  <div className="formation-section">
                    <div className="formation-section-title">
                      <span>サブメンバー</span>
                      <strong>Sub Member</strong>
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
                    <div className="formation-board-scroll">
                    <div className="formation-slot-grid character-slots character-slots--sub">
                      {subCharacters.map(({ character, index }) => (
                        <PartSlot
                          active={safeCharacterIndex === index}
                          kind="character"
                          key={index}
                          label={`サブ ${subCharacters.findIndex((item) => item.index === index) + 1}`}
                          meta={character.importance || character.roleMemo}
                          name={character.name}
                          onClear={() => updateCharacter(index, { name: "" })}
                          onClick={() => setActiveCharacterIndex(index)}
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
                        className="icon-button danger"
                        onClick={() => removeCharacter(safeCharacterIndex)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <PartCandidateBrowser
                  activeName={activeCharacter?.name ?? ""}
                  kind="character"
                  onQueryChange={setCharacterQuery}
                  onSelect={selectCharacterCandidate}
                  query={characterQuery}
                />
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

              <div className="formation-layout">
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
                          meta={mainWeapon.count ? `${mainWeapon.count}本 / ${mainWeapon.importance}` : mainWeapon.importance}
                          name={mainWeapon.name}
                          onClear={() => updateWeapon(0, { name: "" })}
                          onClick={() => setActiveWeaponIndex(0)}
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
                          meta={weapon.count ? `${weapon.count}本 / ${weapon.importance}` : weapon.importance}
                          name={weapon.name}
                          onClear={() => updateWeapon(index, { name: "" })}
                          onClick={() => setActiveWeaponIndex(index)}
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

                <PartCandidateBrowser
                  activeName={activeWeapon?.name ?? ""}
                  kind="weapon"
                  onQueryChange={setWeaponQuery}
                  onSelect={selectWeaponCandidate}
                  query={weaponQuery}
                />
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

              <div className="formation-layout">
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
                          meta={mainSummon.importance}
                          name={mainSummon.name}
                          onClear={() => updateSummon(0, { name: "" })}
                          onClick={() => setActiveSummonIndex(0)}
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
                          meta={friendSummon.importance}
                          name={friendSummon.name}
                          onClear={() => updateSummon(1, { name: "" })}
                          onClick={() => setActiveSummonIndex(1)}
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
                          meta={summon.importance}
                          name={summon.name}
                          onClear={() => updateSummon(index, { name: "" })}
                          onClick={() => setActiveSummonIndex(index)}
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

                <PartCandidateBrowser
                  activeName={activeSummon?.name ?? ""}
                  kind="summon"
                  onQueryChange={setSummonQuery}
                  onSelect={selectSummonCandidate}
                  query={summonQuery}
                />
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
            {currentStep > 1 && (
              <button
                className="secondary-button"
                onClick={() => setCurrentStep((currentStep - 1) as FormStep)}
                type="button"
              >
                戻る
              </button>
            )}
            {currentStep < 5 && (
              <button
                className="primary-button"
                disabled={!stepIsValid(currentStep)}
                onClick={() => setCurrentStep((currentStep + 1) as FormStep)}
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
                    setCurrentStep(1);
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
