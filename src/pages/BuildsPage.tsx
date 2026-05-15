import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CopyPlus, ExternalLink, FilePenLine, FilePlus2, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  api,
  type BuildCharacterDetail,
  type BuildPost,
  type BuildPostInput,
  type BuildPreset,
  type BuildReferenceUrl,
  type BuildSummonDetail,
  type BuildWeaponDetail
} from "../lib/api";
import { useAuth } from "../components/AuthContext";
import { buildMasterOptions, findBuildMaster, type BuildMasterKind, type BuildMasterItem } from "../lib/buildMasters";
import { BuildFormSteps } from "../components/BuildFormSteps";

const emptyForm: BuildPostInput = {
  title: "",
  category: "高難度攻略用",
  questName: "",
  element: "",
  purpose: "参考メモ",
  operationType: "未指定",
  verificationStatus: "未検証",
  overview: "",
  protagonistJob: "",
  characterDetails: [],
  summonDetails: [],
  weaponDetails: [],
  characters: [],
  summons: [],
  weapons: [],
  requiredParts: [],
  recommendedParts: [],
  substitutableParts: [],
  freeSlots: [],
  substituteNotes: "",
  cautions: "",
  role: "",
  omenNotes: "",
  actionNotes: "",
  failurePoints: "",
  farmingGoal: "",
  raidRole: "",
  blueChest: "",
  clearTime: "",
  stability: "",
  prerequisites: "",
  weaponTarget: "",
  rescueTiming: "",
  farmingCautions: "",
  referenceUrls: [],
  sourcePresetId: null,
  sourcePresetName: null,
  changeMemo: null
};

const categoryOptions = ["高難度攻略用", "周回・武器集め用"];
const elementOptions = ["火", "水", "土", "風", "光", "闇"];
const operationOptions = ["手動", "フルオート", "セミオート", "未指定"];
const verificationOptions = ["未検証", "投稿者クリア済", "団内クリア済", "要調整"];
const highDifficultyPurposeOptions = ["団内挑戦", "団内練習", "個人練習", "ソロ挑戦", "クリア編成", "参考メモ"];
const farmingPurposeOptions = ["周回向け", "自発向け", "救援向け", "青箱狙い", "参考メモ"];
const questOptions = ["ルシゼロ", "天元HL", "天元HLフリークエスト", "ルシゼロ系フリークエスト", "ムゲンHL", "ディアスポラHL", "ジークフリートHL", "シエテHL", "コスモスHL", "アガスティアHL"];
const jobOptions = buildMasterOptions.jobs.map((item) => item.name);
const characterOptions = buildMasterOptions.characters.map((item) => item.name);
const summonOptions = buildMasterOptions.summons.map((item) => item.name);
const weaponOptions = buildMasterOptions.weapons.map((item) => item.name);
const importanceOptions = ["必須", "推奨", "代用可", "自由枠"];
const characterPositionOptions = ["フロント", "サブ", "任意"];
const summonPositionOptions = ["メイン", "フレンド", "サブ", "任意"];
const blueChestOptions = ["あり", "なし", "未指定"];
const stabilityOptions = ["安定", "たまに失敗", "要手動確認", "未指定"];
const prerequisiteOptions = ["マグナ", "神石", "片面"];
const referenceTypeOptions = ["攻略記事", "YouTube", "X", "note / ブログ", "その他"];
const listCategoryOptions = categoryOptions;
const sourceTypeOptions = ["すべて", "投稿編成", "プリセット"];
const allPurposeOptions = Array.from(new Set([...highDifficultyPurposeOptions, ...farmingPurposeOptions]));
const raidRoleOptions = ["自発", "救援", "どちらでも"];
const buildTabOptions = ["search", "form"] as const;

type BuildTab = (typeof buildTabOptions)[number];

type ListCategory = (typeof listCategoryOptions)[number];
type SourceType = (typeof sourceTypeOptions)[number];

type BuildListFilters = {
  category: ListCategory;
  questName: string;
  element: string;
  purpose: string;
  operationType: string;
  verificationStatus: string;
  sourceType: SourceType;
  keyword: string;
  role: string;
  hasActionNotes: boolean;
  hasReferenceUrls: boolean;
  raidRole: string;
  blueChest: string;
  stability: string;
  prerequisites: string;
};

type BuildListItem = {
  id: string;
  title: string;
  sourceType: Exclude<SourceType, "すべて">;
  category: string;
  questName: string;
  element: string;
  purpose: string;
  operationType: string;
  verificationStatus: string;
  overview: string | null;
  protagonistJob: string;
  characterDetails: BuildCharacterDetail[];
  summonDetails: BuildSummonDetail[];
  weaponDetails: BuildWeaponDetail[];
  characters: string[];
  summons: string[];
  weapons: string[];
  requiredParts: string[];
  recommendedParts: string[];
  substitutableParts: string[];
  freeSlots: string[];
  substituteNotes: string | null;
  cautions: string | null;
  role?: string | null;
  omenNotes?: string | null;
  actionNotes?: string | null;
  failurePoints?: string | null;
  farmingGoal?: string | null;
  raidRole?: string | null;
  blueChest?: string | null;
  clearTime?: string | null;
  stability?: string | null;
  prerequisites?: string | null;
  weaponTarget?: string | null;
  rescueTiming?: string | null;
  farmingCautions?: string | null;
  referenceUrls: BuildReferenceUrl[];
  authorName: string;
  updatedAt: string;
  preset?: BuildPreset;
  post?: BuildPost;
};

const emptyListFilters: BuildListFilters = {
  category: "高難度攻略用",
  questName: "",
  element: "",
  purpose: "",
  operationType: "",
  verificationStatus: "",
  sourceType: "すべて",
  keyword: "",
  role: "",
  hasActionNotes: false,
  hasReferenceUrls: false,
  raidRole: "",
  blueChest: "",
  stability: "",
  prerequisites: ""
};

const emptyCharacterDetail: BuildCharacterDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  roleMemo: "",
  substituteMemo: ""
};

const emptySummonDetail: BuildSummonDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  usageMemo: "",
  substituteMemo: ""
};

const emptyWeaponDetail: BuildWeaponDetail = {
  name: "",
  importance: "自由枠",
  count: "",
  usageMemo: "",
  substituteMemo: ""
};

const emptyReferenceUrl: BuildReferenceUrl = {
  type: "その他",
  title: "",
  url: "",
  memo: ""
};

function namesFromCharacters(items: BuildCharacterDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function namesFromSummons(items: BuildSummonDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function namesFromWeapons(items: BuildWeaponDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function toLines(items: string[]) {
  return items.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function presetToForm(preset: BuildPreset): BuildPostInput {
  return {
    ...emptyForm,
    title: preset.name,
    category: preset.category,
    questName: preset.questName,
    element: preset.element,
    purpose: preset.purpose,
    operationType: preset.operationType,
    verificationStatus: preset.verificationStatus,
    overview: preset.overview,
    protagonistJob: preset.protagonistJob,
    characterDetails: preset.characterDetails,
    summonDetails: preset.summonDetails,
    weaponDetails: preset.weaponDetails,
    characters: preset.characters,
    summons: preset.summons,
    weapons: preset.weapons,
    requiredParts: preset.requiredParts,
    recommendedParts: preset.recommendedParts,
    substitutableParts: preset.substitutableParts,
    freeSlots: preset.freeSlots,
    substituteNotes: preset.substituteNotes,
    cautions: preset.cautions,
    role: preset.role ?? "",
    omenNotes: preset.omenNotes ?? "",
    actionNotes: preset.actionNotes ?? "",
    failurePoints: preset.failurePoints ?? "",
    farmingGoal: preset.farmingGoal ?? "",
    raidRole: preset.raidRole ?? "",
    blueChest: preset.blueChest ?? "",
    clearTime: preset.clearTime ?? "",
    stability: preset.stability ?? "",
    prerequisites: preset.prerequisites ?? "",
    weaponTarget: preset.weaponTarget ?? "",
    rescueTiming: preset.rescueTiming ?? "",
    farmingCautions: preset.farmingCautions ?? "",
    referenceUrls: preset.referenceUrls,
    sourcePresetId: preset.id,
    sourcePresetName: preset.name,
    changeMemo: ""
  };
}

function postToForm(post: BuildPost): BuildPostInput {
  return {
    ...post,
    title: `${post.title} コピー`,
    sourcePresetId: post.sourcePresetId,
    sourcePresetName: post.sourcePresetName ?? post.title,
    changeMemo: post.changeMemo ?? ""
  };
}

function postToEditForm(post: BuildPost): BuildPostInput {
  return {
    ...post,
    sourcePresetId: post.sourcePresetId,
    sourcePresetName: post.sourcePresetName,
    changeMemo: post.changeMemo ?? ""
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function textOrDash(value: string | null | undefined) {
  return value?.trim() || "未入力";
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function categoryLabel(category: string) {
  return category === "高難度攻略用" ? "高難易度" : "その他";
}

function referenceSummary(referenceUrls: BuildReferenceUrl[]) {
  if (referenceUrls.length === 0) {
    return "なし";
  }

  const types = uniqueValues(referenceUrls.map((ref) => ref.type));
  return types.map((type) => `${type}あり`).join(" / ");
}

function mainParts(item: BuildListItem) {
  return uniqueValues([
    item.protagonistJob,
    ...item.requiredParts,
    ...item.characters,
    ...item.summons,
    ...item.weapons
  ]).slice(0, 5);
}

function detailPath(item: BuildListItem) {
  return `/builds/${item.sourceType === "プリセット" ? "preset" : "post"}/${item.id}`;
}

function masterMeta(master: BuildMasterItem | undefined) {
  if (!master) {
    return "自由入力";
  }

  return [master.element, master.rarity, master.weaponType, master.series, ...(master.tags ?? [])].filter(Boolean).join(" / ");
}

function notesToBlocks(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return [];
  }

  const knownHeadings = ["開幕", "100〜80%", "80〜60%", "60〜20%", "20〜0%", "予兆対応", "失敗ポイント", "その他メモ"];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const blocks: { title: string; body: string }[] = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of lines) {
    const normalized = line.replace(/[:：]$/, "");
    if (knownHeadings.includes(normalized)) {
      if (current) {
        blocks.push({ title: current.title, body: current.body.join("\n") });
      }
      current = { title: normalized, body: [] };
      continue;
    }

    if (!current) {
      current = { title: "メモ", body: [] };
    }
    current.body.push(line);
  }

  if (current) {
    blocks.push({ title: current.title, body: current.body.join("\n") });
  }

  return blocks.filter((block) => block.body.trim());
}

function normalizePreset(preset: BuildPreset): BuildListItem {
  return {
    ...preset,
    title: preset.name,
    sourceType: "プリセット",
    overview: preset.overview,
    substituteNotes: preset.substituteNotes,
    cautions: preset.cautions,
    role: preset.role ?? null,
    omenNotes: preset.omenNotes ?? null,
    actionNotes: preset.actionNotes ?? null,
    failurePoints: preset.failurePoints ?? null,
    farmingGoal: preset.farmingGoal ?? null,
    raidRole: preset.raidRole ?? null,
    blueChest: preset.blueChest ?? null,
    clearTime: preset.clearTime ?? null,
    stability: preset.stability ?? null,
    prerequisites: preset.prerequisites ?? null,
    weaponTarget: preset.weaponTarget ?? null,
    rescueTiming: preset.rescueTiming ?? null,
    farmingCautions: preset.farmingCautions ?? null,
    authorName: "団内テンプレート",
    preset
  };
}

function normalizePost(post: BuildPost): BuildListItem {
  return {
    ...post,
    sourceType: "投稿編成",
    overview: post.overview ?? null,
    protagonistJob: post.protagonistJob ?? "",
    substituteNotes: post.substituteNotes ?? null,
    cautions: post.cautions ?? null,
    role: post.role ?? null,
    omenNotes: post.omenNotes ?? null,
    actionNotes: post.actionNotes ?? null,
    failurePoints: post.failurePoints ?? null,
    farmingGoal: post.farmingGoal ?? null,
    raidRole: post.raidRole ?? null,
    blueChest: post.blueChest ?? null,
    clearTime: post.clearTime ?? null,
    stability: post.stability ?? null,
    prerequisites: post.prerequisites ?? null,
    weaponTarget: post.weaponTarget ?? null,
    rescueTiming: post.rescueTiming ?? null,
    farmingCautions: post.farmingCautions ?? null,
    authorName: post.authorName ?? "自分",
    post
  };
}

function searchableText(item: BuildListItem) {
  return [
    item.title,
    item.questName,
    item.category,
    item.element,
    item.purpose,
    item.operationType,
    item.verificationStatus,
    item.overview,
    item.cautions,
    item.actionNotes,
    item.farmingCautions,
    item.protagonistJob,
    item.authorName,
    ...item.characters,
    ...item.summons,
    ...item.weapons,
    ...item.requiredParts,
    ...item.recommendedParts,
    ...item.substitutableParts,
    ...item.freeSlots,
    ...item.characterDetails.flatMap((detail) => [detail.name, detail.roleMemo, detail.substituteMemo]),
    ...item.summonDetails.flatMap((detail) => [detail.name, detail.usageMemo, detail.substituteMemo]),
    ...item.weaponDetails.flatMap((detail) => [detail.name, detail.usageMemo, detail.substituteMemo]),
    ...item.referenceUrls.flatMap((ref) => [ref.title, ref.type, ref.memo])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="muted-text">未入力</span>;
  }

  return <span>{items.slice(0, 3).join(" / ")}</span>;
}

function PartThumbnail({ kind, name }: { kind: BuildMasterKind; name: string }) {
  const master = findBuildMaster(kind, name);
  const label = name.trim().slice(0, 2) || "?";

  if (master?.thumbnailUrl) {
    return <img alt="" className="part-thumbnail" loading="lazy" src={master.thumbnailUrl} />;
  }

  return <span className={`part-thumbnail fallback ${kind}`}>{label}</span>;
}

function PartDetailRow({
  kind,
  name,
  meta,
  importance,
  note,
  substitute
}: {
  kind: BuildMasterKind;
  name: string;
  meta?: string;
  importance?: string;
  note?: string;
  substitute?: string;
}) {
  const master = kind === "job" ? findBuildMaster("job", name) : findBuildMaster(kind, name);

  return (
    <div className="part-detail-row">
      <PartThumbnail kind={kind} name={name} />
      <div>
        <strong>{name}</strong>
        <span>{meta || masterMeta(master)}</span>
        {note && <small>{note}</small>}
        {substitute && <small>代用: {substitute}</small>}
      </div>
      {importance && <span className="pill muted">{importance}</span>}
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="summary-list">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">未入力</p>
      )}
    </div>
  );
}

function BuildListCard({
  item,
  canDelete,
  onOpenDetail,
  onApplyPreset,
  onCopyPost,
  onDeletePost
}: {
  item: BuildListItem;
  canDelete: boolean;
  onOpenDetail: (item: BuildListItem) => void;
  onApplyPreset: (preset: BuildPreset) => void;
  onCopyPost: (post: BuildPost) => void;
  onDeletePost: (post: BuildPost) => void;
}) {
  const parts = mainParts(item);
  const actionLabel = item.category === "高難度攻略用" ? "行動メモ" : "周回メモ";
  const hasMemo = hasText(item.actionNotes) || hasText(item.farmingCautions);

  return (
    <article className="build-search-card">
      <div className="build-search-card-header">
        <div>
          <div className="tag-row">
            <span className={item.sourceType === "プリセット" ? "pill" : "pill muted"}>{item.sourceType}</span>
            <span className="pill muted">{categoryLabel(item.category)}</span>
          </div>
          <h3>{item.title}</h3>
          <div className="task-meta">
            <span>{item.questName}</span>
            <span>投稿者: {item.authorName}</span>
            <span>更新: {formatDate(item.updatedAt)}</span>
          </div>
        </div>
        <div className="task-actions">
          <button aria-label="詳細画面を開く" className="secondary-button compact-action" onClick={() => onOpenDetail(item)} type="button">
            詳細
          </button>
          {item.preset && (
            <button aria-label="このプリセットを投稿フォームへ反映" className="icon-button" onClick={() => onApplyPreset(item.preset!)} type="button">
              <FilePlus2 size={16} />
            </button>
          )}
          {item.post && (
            <>
              <button aria-label="この編成をコピーして新規投稿" className="icon-button" onClick={() => onCopyPost(item.post!)} type="button">
                <CopyPlus size={16} />
              </button>
              {canDelete && (
                <button aria-label="編成メモを削除" className="icon-button danger" onClick={() => onDeletePost(item.post!)} type="button">
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="tag-row">
        <span className="pill">{item.element}</span>
        <span className="pill muted">{item.operationType}</span>
        <span className="pill muted">{item.purpose}</span>
        <span className="pill muted">{item.verificationStatus}</span>
        {item.stability && <span className="pill muted">{item.stability}</span>}
        {item.prerequisites && <span className="pill muted">{item.prerequisites}</span>}
      </div>

      {item.overview && <p className="build-card-note">{item.overview}</p>}

      <dl className="build-card-facts">
        <div>
          <dt>主要パーツ</dt>
          <dd>
            <CompactList items={parts} />
          </dd>
        </div>
        <div>
          <dt>参考</dt>
          <dd>{referenceSummary(item.referenceUrls)}</dd>
        </div>
        <div>
          <dt>{actionLabel}</dt>
          <dd>{hasMemo ? "あり" : "なし"}</dd>
        </div>
      </dl>

      {item.category === "周回・武器集め用" && (
        <div className="build-card-note compact">
          {[item.raidRole, item.blueChest, item.clearTime, item.weaponTarget].filter(Boolean).join(" / ") || "周回条件は詳細で確認"}
        </div>
      )}
    </article>
  );
}

function BuildDetailView({
  item,
  canEdit,
  onBack,
  onApplyPreset,
  onCopyPost,
  onEditPost
}: {
  item: BuildListItem;
  canEdit: boolean;
  onBack: () => void;
  onApplyPreset: (preset: BuildPreset) => void;
  onCopyPost: (post: BuildPost) => void;
  onEditPost: (post: BuildPost) => void;
}) {
  const requiredCharacters = item.characterDetails.filter((detail) => detail.importance === "必須");
  const requiredSummons = item.summonDetails.filter((detail) => detail.importance === "必須");
  const requiredWeapons = item.weaponDetails.filter((detail) => detail.importance === "必須");
  const substituteRows = [
    ...item.characterDetails
      .filter((detail) => hasText(detail.substituteMemo))
      .map((detail) => ({ from: detail.name, to: detail.substituteMemo, note: detail.roleMemo })),
    ...item.summonDetails
      .filter((detail) => hasText(detail.substituteMemo))
      .map((detail) => ({ from: detail.name, to: detail.substituteMemo, note: detail.usageMemo })),
    ...item.weaponDetails
      .filter((detail) => hasText(detail.substituteMemo))
      .map((detail) => ({ from: detail.name, to: detail.substituteMemo, note: detail.usageMemo }))
  ];
  const actionBlocks = notesToBlocks(item.actionNotes);
  const labels = [
    item.element,
    item.operationType,
    item.purpose,
    item.verificationStatus,
    item.category === "周回・武器集め用" ? item.stability : item.role,
    item.category === "周回・武器集め用" ? item.prerequisites : undefined
  ].filter(Boolean);

  return (
    <section className="build-detail-page">
      <div className="build-detail-topbar">
        <button className="secondary-button" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          一覧へ
        </button>
        <div className="task-actions">
          {item.preset && (
            <button className="primary-button" onClick={() => onApplyPreset(item.preset!)} type="button">
              <FilePlus2 size={18} />
              このプリセットで投稿
            </button>
          )}
          {item.post && (
            <button className="primary-button" onClick={() => onCopyPost(item.post!)} type="button">
              <CopyPlus size={18} />
              コピーして新規投稿
            </button>
          )}
          {item.post && canEdit && (
            <button className="secondary-button" onClick={() => onEditPost(item.post!)} type="button">
              <FilePenLine size={16} />
              編集する
            </button>
          )}
        </div>
      </div>

      <section className="panel build-detail-hero">
        <div>
          <p className="eyebrow">{item.sourceType}</p>
          <h2>{item.title}</h2>
          <div className="tag-row">
            {labels.map((label) => (
              <span className="pill" key={label}>{label}</span>
            ))}
          </div>
          {item.overview && <p>{item.overview}</p>}
        </div>
        <div className="build-detail-side-meta">
          <span>{item.questName}</span>
          <span>投稿者: {item.authorName}</span>
          <span>更新: {formatDate(item.updatedAt)}</span>
        </div>
      </section>

      {item.category === "周回・武器集め用" && (
        <section className="panel">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Farming</p>
              <h2>周回条件</h2>
            </div>
          </div>
          <dl className="detail-fact-grid">
            <div><dt>自発 / 救援</dt><dd>{textOrDash(item.raidRole)}</dd></div>
            <div><dt>青箱狙い</dt><dd>{textOrDash(item.blueChest)}</dd></div>
            <div><dt>討伐時間目安</dt><dd>{textOrDash(item.clearTime)}</dd></div>
            <div><dt>安定度</dt><dd>{textOrDash(item.stability)}</dd></div>
            <div><dt>編成前提</dt><dd>{textOrDash(item.prerequisites)}</dd></div>
            <div><dt>武器集め対象</dt><dd>{textOrDash(item.weaponTarget)}</dd></div>
            <div><dt>救援タイミング</dt><dd>{textOrDash(item.rescueTiming)}</dd></div>
          </dl>
        </section>
      )}

      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Required</p>
            <h2>必須パーツ</h2>
          </div>
        </div>
        <div className="required-part-grid">
          {requiredCharacters.map((detail) => (
            <PartDetailRow key={`req-char-${detail.name}`} kind="character" name={detail.name} importance={detail.importance} note={detail.roleMemo} substitute={detail.substituteMemo} />
          ))}
          {requiredSummons.map((detail) => (
            <PartDetailRow key={`req-summon-${detail.name}`} kind="summon" name={detail.name} importance={detail.importance} note={detail.usageMemo} substitute={detail.substituteMemo} />
          ))}
          {requiredWeapons.map((detail) => (
            <PartDetailRow key={`req-weapon-${detail.name}`} kind="weapon" name={detail.name} importance={detail.importance} note={detail.usageMemo} substitute={detail.substituteMemo} />
          ))}
          {requiredCharacters.length + requiredSummons.length + requiredWeapons.length === 0 &&
            item.requiredParts.map((part) => <PartDetailRow key={`req-${part}`} kind="weapon" name={part} importance="必須" />)}
          {requiredCharacters.length + requiredSummons.length + requiredWeapons.length === 0 && item.requiredParts.length === 0 && (
            <div className="empty-state compact">必須パーツは未入力です。</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Substitutes</p>
            <h2>代用候補</h2>
          </div>
        </div>
        <div className="substitute-grid">
          {substituteRows.map((row) => (
            <div className="substitute-row" key={`${row.from}-${row.to}`}>
              <strong>{row.from}</strong>
              <span>{row.to}</span>
              {row.note && <small>{row.note}</small>}
            </div>
          ))}
          {item.substituteNotes && <p className="build-card-note">{item.substituteNotes}</p>}
          {substituteRows.length === 0 && !item.substituteNotes && <div className="empty-state compact">代用候補は未入力です。</div>}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Parts</p>
            <h2>編成パーツ</h2>
          </div>
        </div>
        <div className="parts-section-grid">
          <div>
            <h3>主人公ジョブ</h3>
            <PartDetailRow kind="job" name={item.protagonistJob || "未入力"} />
          </div>
          <div>
            <h3>キャラ</h3>
            <div className="part-list">
              {item.characterDetails.map((detail) => (
                <PartDetailRow key={`char-${detail.name}-${detail.position}`} kind="character" name={detail.name} meta={detail.position} importance={detail.importance} note={detail.roleMemo} substitute={detail.substituteMemo} />
              ))}
              {item.characterDetails.length === 0 && <p className="muted-text">未入力</p>}
            </div>
          </div>
          <div>
            <h3>召喚石</h3>
            <div className="part-list">
              {item.summonDetails.map((detail) => (
                <PartDetailRow key={`summon-${detail.name}-${detail.position}`} kind="summon" name={detail.name} meta={detail.position} importance={detail.importance} note={detail.usageMemo} substitute={detail.substituteMemo} />
              ))}
              {item.summonDetails.length === 0 && <p className="muted-text">未入力</p>}
            </div>
          </div>
          <div>
            <h3>武器</h3>
            <div className="part-list">
              {item.weaponDetails.map((detail) => (
                <PartDetailRow key={`weapon-${detail.name}-${detail.count}`} kind="weapon" name={detail.name} meta={detail.count || undefined} importance={detail.importance} note={detail.usageMemo} substitute={detail.substituteMemo} />
              ))}
              {item.weaponDetails.length === 0 && <p className="muted-text">未入力</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">{item.category === "高難度攻略用" ? "Action" : "Farming Memo"}</p>
            <h2>{item.category === "高難度攻略用" ? "行動メモ・注意点" : "周回メモ・注意点"}</h2>
          </div>
        </div>
        {item.category === "高難度攻略用" ? (
          <div className="action-note-grid">
            {item.omenNotes && <SummaryList title="予兆対応" items={[item.omenNotes]} />}
            {actionBlocks.map((block) => <SummaryList key={block.title} title={block.title} items={[block.body]} />)}
            {item.failurePoints && <SummaryList title="失敗ポイント" items={[item.failurePoints]} />}
            {item.cautions && <SummaryList title="注意点" items={[item.cautions]} />}
          </div>
        ) : (
          <div className="action-note-grid">
            {item.farmingGoal && <SummaryList title="周回目的" items={[item.farmingGoal]} />}
            {item.farmingCautions && <SummaryList title="周回時の注意点" items={[item.farmingCautions]} />}
            {item.cautions && <SummaryList title="注意点" items={[item.cautions]} />}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">References</p>
            <h2>参考URL</h2>
          </div>
        </div>
        <div className="detail-reference-list">
          {item.referenceUrls.map((ref) => (
            <a href={ref.url} key={`${ref.type}-${ref.url}`} rel="noreferrer" target="_blank">
              <ExternalLink size={16} />
              <strong>{ref.title}</strong>
              <span>{ref.type}</span>
              {ref.memo && <small>{ref.memo}</small>}
            </a>
          ))}
          {item.referenceUrls.length === 0 && <div className="empty-state compact">参考URLは未入力です。</div>}
        </div>
      </section>

      {(item.post?.sourcePresetName || item.post?.changeMemo || item.preset) && (
        <section className="panel">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Source</p>
              <h2>由来・変更メモ</h2>
            </div>
          </div>
          {item.preset && <p className="material-note">プリセット状態: {item.preset.presetStatus} / 由来: {item.preset.origins.join(" / ")}</p>}
          {item.post?.sourcePresetName && <p className="material-note">元プリセット: {item.post.sourcePresetName}</p>}
          {item.post?.changeMemo && <p className="material-note">変更メモ: {item.post.changeMemo}</p>}
        </section>
      )}
    </section>
  );
}

export function BuildsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sourceType, buildId } = useParams();
  const [presets, setPresets] = useState<BuildPreset[]>([]);
  const [posts, setPosts] = useState<BuildPost[]>([]);
  const [form, setForm] = useState<BuildPostInput>(emptyForm);
  const [activeBuildTab, setActiveBuildTab] = useState<BuildTab>("search");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState<BuildListFilters>(emptyListFilters);
  const [error, setError] = useState("");

  const purposeOptions = form.category === "周回・武器集め用" ? farmingPurposeOptions : highDifficultyPurposeOptions;
  const visiblePurposeOptions =
    listFilters.category === "高難度攻略用"
      ? highDifficultyPurposeOptions
      : listFilters.category === "周回・武器集め用"
        ? farmingPurposeOptions
        : allPurposeOptions;

  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      return (
        preset.category === form.category &&
        (!form.questName || preset.questName === form.questName) &&
        (!form.element || preset.element === form.element)
      );
    });
  }, [form.category, form.element, form.questName, presets]);

  const listItems = useMemo(() => {
    return [...presets.map(normalizePreset), ...posts.map(normalizePost)].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [posts, presets]);

  const filteredListItems = useMemo(() => {
    const keyword = listFilters.keyword.trim().toLowerCase();

    return listItems.filter((item) => {
      const matchesKeyword = !keyword || searchableText(item).includes(keyword);

      return (
        item.category === listFilters.category &&
        (!listFilters.questName || item.questName === listFilters.questName) &&
        (!listFilters.element || item.element === listFilters.element) &&
        (!listFilters.purpose || item.purpose === listFilters.purpose) &&
        (!listFilters.operationType || item.operationType === listFilters.operationType) &&
        (!listFilters.verificationStatus || item.verificationStatus === listFilters.verificationStatus) &&
        (listFilters.sourceType === "すべて" || item.sourceType === listFilters.sourceType) &&
        (!listFilters.role || item.role === listFilters.role) &&
        (!listFilters.hasActionNotes || hasText(item.actionNotes) || hasText(item.farmingCautions)) &&
        (!listFilters.hasReferenceUrls || item.referenceUrls.length > 0) &&
        (!listFilters.raidRole || item.raidRole === listFilters.raidRole) &&
        (!listFilters.blueChest || item.blueChest === listFilters.blueChest) &&
        (!listFilters.stability || item.stability === listFilters.stability) &&
        (!listFilters.prerequisites || item.prerequisites === listFilters.prerequisites) &&
        matchesKeyword
      );
    });
  }, [listFilters, listItems]);

  const roleOptions = useMemo(() => uniqueValues(listItems.map((item) => item.role ?? "")), [listItems]);
  const selectedItem = useMemo(() => {
    if (!sourceType || !buildId) {
      return null;
    }

    const expectedSourceType = sourceType === "preset" ? "プリセット" : sourceType === "post" ? "投稿編成" : "";
    return listItems.find((item) => item.sourceType === expectedSourceType && item.id === buildId) ?? null;
  }, [buildId, listItems, sourceType]);

  async function load() {
    try {
      const [presetData, postData] = await Promise.all([api.buildPresets(), api.buildPosts()]);
      setPresets(presetData.presets);
      setPosts(postData.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "編成メモの取得に失敗しました");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update<K extends keyof BuildPostInput>(key: K, value: BuildPostInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateListFilter<K extends keyof BuildListFilters>(key: K, value: BuildListFilters[K]) {
    setListFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "category" ? { purpose: "", questName: "", role: "", raidRole: "", blueChest: "", stability: "", prerequisites: "" } : {})
    }));
  }

  function updateLines(key: keyof BuildPostInput, value: string) {
    setForm((current) => ({ ...current, [key]: fromLines(value) }));
  }

  function updateCharacter(index: number, value: Partial<BuildCharacterDetail>) {
    setForm((current) => {
      const characterDetails = current.characterDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...value } : item
      );
      return { ...current, characterDetails, characters: namesFromCharacters(characterDetails) };
    });
  }

  function updateSummon(index: number, value: Partial<BuildSummonDetail>) {
    setForm((current) => {
      const summonDetails = current.summonDetails.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item));
      return { ...current, summonDetails, summons: namesFromSummons(summonDetails) };
    });
  }

  function updateWeapon(index: number, value: Partial<BuildWeaponDetail>) {
    setForm((current) => {
      const weaponDetails = current.weaponDetails.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item));
      return { ...current, weaponDetails, weapons: namesFromWeapons(weaponDetails) };
    });
  }

  function updateReference(index: number, value: Partial<BuildReferenceUrl>) {
    setForm((current) => ({
      ...current,
      referenceUrls: current.referenceUrls.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item))
    }));
  }

  function addCharacter() {
    setForm((current) => ({ ...current, characterDetails: [...current.characterDetails, emptyCharacterDetail] }));
  }

  function addSummon() {
    setForm((current) => ({ ...current, summonDetails: [...current.summonDetails, emptySummonDetail] }));
  }

  function addWeapon() {
    setForm((current) => ({ ...current, weaponDetails: [...current.weaponDetails, emptyWeaponDetail] }));
  }

  function addReference() {
    setForm((current) => ({ ...current, referenceUrls: [...current.referenceUrls, emptyReferenceUrl] }));
  }

  function removeCharacter(index: number) {
    setForm((current) => {
      const characterDetails = current.characterDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, characterDetails, characters: namesFromCharacters(characterDetails) };
    });
  }

  function removeSummon(index: number) {
    setForm((current) => {
      const summonDetails = current.summonDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, summonDetails, summons: namesFromSummons(summonDetails) };
    });
  }

  function removeWeapon(index: number) {
    setForm((current) => {
      const weaponDetails = current.weaponDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, weaponDetails, weapons: namesFromWeapons(weaponDetails) };
    });
  }

  function removeReference(index: number) {
    setForm((current) => ({
      ...current,
      referenceUrls: current.referenceUrls.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function applyPreset(preset: BuildPreset) {
    const next = presetToForm(preset);
    setForm(next);
    setEditingPostId(null);
    setActiveBuildTab("form");
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingPostId(null);
    setActiveBuildTab("form");
    setError("");
  }

  async function submit(formData: BuildPostInput) {
    setError("");

    try {
      const payload = {
        ...formData,
        characters: namesFromCharacters(formData.characterDetails),
        summons: namesFromSummons(formData.summonDetails),
        weapons: namesFromWeapons(formData.weaponDetails),
        referenceUrls: formData.referenceUrls.filter((ref) => ref.url.trim())
      };
      const data = editingPostId ? await api.updateBuildPost(editingPostId, payload) : await api.createBuildPost(payload);
      setPosts((current) => {
        if (!editingPostId) {
          return [data.post, ...current];
        }
        return current.map((post) => (post.id === data.post.id ? data.post : post));
      });
      resetForm();
      setActiveBuildTab("search");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "編成メモの保存に失敗しました");
    }
  }

  async function deletePost(post: BuildPost) {
    await api.deleteBuildPost(post.id);
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  function copyPost(post: BuildPost) {
    const next = postToForm(post);
    setForm(next);
    setEditingPostId(null);
    setActiveBuildTab("form");
    setError("");
  }

  function editPost(post: BuildPost) {
    setForm(postToEditForm(post));
    setEditingPostId(post.id);
    setActiveBuildTab("form");
    setError("");
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Build Presets</p>
          <h2>編成プリセット</h2>
          <p>編成を探す画面と、投稿する画面を切り替えて使えます。</p>
        </div>
        <button className="primary-button" onClick={resetForm} type="button">
          <FilePlus2 size={18} />
          空フォーム
        </button>
      </section>

      {error && <p className="form-error">{error}</p>}

      <datalist id="build-quest-options">
        {questOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-job-options">
        {jobOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-character-options">
        {characterOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-summon-options">
        {summonOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-weapon-options">
        {weaponOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      {selectedItem && (
        <BuildDetailView
          canEdit={selectedItem.post?.ownerId === user?.id}
          item={selectedItem}
          onApplyPreset={(preset) => {
            applyPreset(preset);
            navigate("/builds");
          }}
          onBack={() => navigate("/builds")}
          onCopyPost={(post) => {
            copyPost(post);
            navigate("/builds");
          }}
          onEditPost={(post) => {
            editPost(post);
            navigate("/builds");
          }}
        />
      )}

      <div className="segmented build-main-tabs" role="tablist" aria-label="編成メモの表示切り替え">
        <button className={activeBuildTab === "search" ? "active" : ""} onClick={() => setActiveBuildTab("search")} type="button">
          編成一覧・検索
        </button>
        <button className={activeBuildTab === "form" ? "active" : ""} onClick={() => setActiveBuildTab("form")} type="button">
          投稿フォーム
        </button>
      </div>

      {activeBuildTab === "search" && (
      <section className="panel build-search-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Build Search</p>
            <h2>編成一覧・検索</h2>
          </div>
          <button className="secondary-button" onClick={() => setListFilters(emptyListFilters)} type="button">
            <RotateCcw size={16} />
            リセット
          </button>
        </div>

        <div className="segmented build-category-switch">
          {listCategoryOptions.map((option) => (
            <button
              className={listFilters.category === option ? "active" : ""}
              key={option}
              onClick={() => updateListFilter("category", option)}
              type="button"
            >
              {categoryLabel(option)}
            </button>
          ))}
        </div>

        <div className="build-filter-grid">
          <label>
            クエスト名
            <select onChange={(event) => updateListFilter("questName", event.target.value)} value={listFilters.questName}>
              <option value="">すべて</option>
              {questOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            属性
            <select onChange={(event) => updateListFilter("element", event.target.value)} value={listFilters.element}>
              <option value="">すべて</option>
              {elementOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            加護石
            <select onChange={(event) => updateListFilter("prerequisites", event.target.value)} value={listFilters.prerequisites}>
              <option value="">すべて</option>
              {prerequisiteOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <details className="advanced-search">
            <summary>詳細検索</summary>
            <div className="advanced-filter-grid">
              <label className="keyword-field">
                キーワード
                <span className="input-with-icon">
                  <Search size={16} />
                  <input
                    onChange={(event) => updateListFilter("keyword", event.target.value)}
                    placeholder="タイトル、キャラ名、召喚石名、武器名、メモ"
                    value={listFilters.keyword}
                  />
                </span>
              </label>
              <label>
                投稿種別
                <select onChange={(event) => updateListFilter("sourceType", event.target.value)} value={listFilters.sourceType}>
                  {sourceTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                目的
                <select onChange={(event) => updateListFilter("purpose", event.target.value)} value={listFilters.purpose}>
                  <option value="">すべて</option>
                  {visiblePurposeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                操作タイプ
                <select onChange={(event) => updateListFilter("operationType", event.target.value)} value={listFilters.operationType}>
                  <option value="">すべて</option>
                  {operationOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                検証状態
                <select onChange={(event) => updateListFilter("verificationStatus", event.target.value)} value={listFilters.verificationStatus}>
                  <option value="">すべて</option>
                  {verificationOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              {listFilters.category !== "周回・武器集め用" && (
                <>
                  <label>
                    役割
                    <select onChange={(event) => updateListFilter("role", event.target.value)} value={listFilters.role}>
                      <option value="">すべて</option>
                      {roleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={listFilters.hasActionNotes}
                      onChange={(event) => updateListFilter("hasActionNotes", event.target.checked)}
                      type="checkbox"
                    />
                    行動メモあり
                  </label>
                </>
              )}

              {listFilters.category !== "高難度攻略用" && (
                <>
                  <label>
                    自発 / 救援
                    <select onChange={(event) => updateListFilter("raidRole", event.target.value)} value={listFilters.raidRole}>
                      <option value="">すべて</option>
                      {raidRoleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    青箱狙い
                    <select onChange={(event) => updateListFilter("blueChest", event.target.value)} value={listFilters.blueChest}>
                      <option value="">すべて</option>
                      {blueChestOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    安定度
                    <select onChange={(event) => updateListFilter("stability", event.target.value)} value={listFilters.stability}>
                      <option value="">すべて</option>
                      {stabilityOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label className="checkbox-field">
                <input
                  checked={listFilters.hasReferenceUrls}
                  onChange={(event) => updateListFilter("hasReferenceUrls", event.target.checked)}
                  type="checkbox"
                />
                参考URLあり
              </label>
            </div>
          </details>
        </div>

        <div className="build-search-summary">
          <strong>{filteredListItems.length}</strong>
          <span>件表示 / 全{listItems.length}件</span>
        </div>

        <div className="build-search-list">
          {filteredListItems.map((item) => (
            <BuildListCard
              canDelete={item.post?.ownerId === user?.id}
              item={item}
              key={`${item.sourceType}-${item.id}`}
              onOpenDetail={(target) => navigate(detailPath(target))}
              onApplyPreset={applyPreset}
              onCopyPost={copyPost}
              onDeletePost={deletePost}
            />
          ))}
          {filteredListItems.length === 0 && <div className="empty-state">条件に合う編成はまだありません。</div>}
        </div>
      </section>
      )}

      {activeBuildTab === "form" && (
      <section className="content-grid">
        <BuildFormSteps
          error={error}
          editMode={Boolean(editingPostId)}
          form={form}
          isSubmitting={false}
          onApplyPreset={applyPreset}
          onCancel={() => {
            resetForm();
            setActiveBuildTab("search");
          }}
          onFormChange={setForm}
          onSubmit={submit}
          presets={presets}
        />
      </section>
      )}
    </div>
  );
}
