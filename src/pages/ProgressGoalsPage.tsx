import { FormEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, CircleAlert, ListChecks, PackageOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api, type ProgressGoal, type ProgressPreset } from "../lib/api";

function dependencyClosure(preset: ProgressPreset, stageId: string, found = new Set<string>()) {
  const stage = preset.stages.find((item) => item.id === stageId);
  if (!stage || found.has(stageId)) return found;
  found.add(stageId);
  stage.dependsOn.forEach((id) => dependencyClosure(preset, id, found));
  return found;
}

type MaterialRequirement = ProgressGoal["calculation"]["requirements"][number];
type MaterialTab = "shortage" | "arcarum" | "battle" | "other" | "all";

const materialTabs: Array<{ id: MaterialTab; label: string }> = [
  { id: "shortage", label: "不足素材" },
  { id: "arcarum", label: "アーカルム" },
  { id: "battle", label: "属性・マルチ" },
  { id: "other", label: "共通・その他" },
  { id: "all", label: "すべて" }
];

const progressGroupDescriptions: Record<string, string> = {
  "arcarum-summon": "召喚石の交換から5凸まで",
  "foundation-weapon": "礎武器の交換から5凸まで",
  domain: "第1解放から全解放まで"
};

function materialCategory(itemKey: string): Exclude<MaterialTab, "shortage" | "all"> {
  if (/(sephira|astra|idea|veritas|verum|haze|bright|fragment|new-world)/.test(itemKey)) return "arcarum";
  if (/(anima|magna|element|psyche|jewel|rubble|tragedy|insular|gale-rock|thunder-wheel|todestrieb|stone-fragment)/.test(itemKey)) return "battle";
  return "other";
}

function ProgressModal({
  title,
  description,
  size = "medium",
  onClose,
  children,
  footer,
  nested = false,
  disableEscape = false
}: {
  title: string;
  description?: string;
  size?: "small" | "medium" | "wide";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  nested?: boolean;
  disableEscape?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (disableEscape) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disableEscape, onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return <div className={`progress-modal-backdrop${nested ? " nested" : ""}`} onMouseDown={onClose}>
    <section className={`progress-modal progress-modal--${size}`} aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className="progress-modal-header">
        <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
        <button aria-label={`${title}を閉じる`} className="icon-button" onClick={onClose} title="閉じる" type="button"><X size={18} /></button>
      </header>
      <div className="progress-modal-body">{children}</div>
      {footer && <footer className="progress-modal-footer">{footer}</footer>}
    </section>
  </div>;
}

function ProgressGoalEditor({
  goal,
  onChange,
  onError,
  suppressFloatingAction
}: {
  goal: ProgressGoal;
  onChange: (goal: ProgressGoal) => void;
  onError: (message: string) => void;
  suppressFloatingAction: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftCompleted, setDraftCompleted] = useState(() => new Set(goal.completedStageIds));
  const [inventory, setInventory] = useState<Record<string, number>>(() =>
    Object.fromEntries(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount]))
  );
  const [preview, setPreview] = useState(goal);
  const [dependencyErrors, setDependencyErrors] = useState<{ stageId: string; missingDependencyIds: string[] }[]>([]);
  const [saving, setSaving] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressModalSnapshot, setProgressModalSnapshot] = useState<Set<string> | null>(null);
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [materialInventorySnapshot, setMaterialInventorySnapshot] = useState<Record<string, number> | null>(null);
  const [pinnedMaterialKeys, setPinnedMaterialKeys] = useState(() => goal.pinnedMaterialKeys);
  const [pinnedMaterialSnapshot, setPinnedMaterialSnapshot] = useState<string[] | null>(null);
  const [savingMaterials, setSavingMaterials] = useState(false);
  const [pinnedPage, setPinnedPage] = useState(0);
  const [pinnedPageSize, setPinnedPageSize] = useState(4);
  const [materialTab, setMaterialTab] = useState<MaterialTab>("shortage");
  const [editingMaterial, setEditingMaterial] = useState<MaterialRequirement | null>(null);
  const [editingCount, setEditingCount] = useState("");

  const hasProgressChanges = useMemo(() => {
    const saved = new Set(goal.completedStageIds);
    return saved.size !== draftCompleted.size || [...saved].some((id) => !draftCompleted.has(id));
  }, [draftCompleted, goal.completedStageIds]);
  const savedInventory = useMemo(
    () => new Map(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount])),
    [goal.calculation.requirements]
  );
  const hasInventoryChanges = Object.entries(inventory).some(([key, value]) => savedInventory.get(key) !== value);
  const hasPinnedMaterialChanges = goal.pinnedMaterialKeys.length !== pinnedMaterialKeys.length
    || goal.pinnedMaterialKeys.some((key) => !pinnedMaterialKeys.includes(key));
  const isDirty = hasProgressChanges || hasInventoryChanges || hasPinnedMaterialChanges;
  const materialItems = preview.calculation.requirements.map((item) => ({
    ...item,
    ownedCount: inventory[item.itemKey] ?? item.ownedCount,
    shortage: Math.max(item.requiredCount - (inventory[item.itemKey] ?? item.ownedCount), 0)
  }));
  const shortageItems = materialItems.filter((item) => item.shortage > 0);
  const pinnedMaterialItems = pinnedMaterialKeys
    .map((itemKey) => materialItems.find((item) => item.itemKey === itemKey))
    .filter((item): item is MaterialRequirement & { shortage: number } => Boolean(item));
  const pinnedPageCount = Math.max(1, Math.ceil(pinnedMaterialItems.length / pinnedPageSize));
  const visiblePinnedItems = pinnedMaterialItems.slice(pinnedPage * pinnedPageSize, (pinnedPage + 1) * pinnedPageSize);
  const visibleMaterialItems = materialItems.filter((item) => {
    if (materialTab === "all") return true;
    if (materialTab === "shortage") return item.shortage > 0;
    return materialCategory(item.itemKey) === materialTab;
  });

  useEffect(() => {
    setDraftCompleted(new Set(goal.completedStageIds));
    setPreview(goal);
    setInventory(Object.fromEntries(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount])));
    setPinnedMaterialKeys(goal.pinnedMaterialKeys);
    setPinnedPage(0);
    setDependencyErrors([]);
  }, [goal.id, goal.updatedAt, goal.targetStageId]);

  useEffect(() => {
    function updatePageSize() {
      setPinnedPageSize(window.innerWidth >= 1180 ? 8 : window.innerWidth >= 768 ? 6 : 4);
    }
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  useEffect(() => {
    setPinnedPage((current) => Math.min(current, pinnedPageCount - 1));
  }, [pinnedPageCount]);

  useEffect(() => {
    if (!isDirty) return;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await api.previewProgressGoal(goal.id, {
          completedStageIds: [...draftCompleted],
          inventoryOverrides: Object.entries(inventory).map(([itemKey, ownedCount]) => ({ itemKey, ownedCount })),
          targetStageId: goal.targetStageId
        });
        setPreview(response.goal);
        setDependencyErrors(response.dependencyErrors);
      } catch (caught) {
        onError(caught instanceof Error ? caught.message : "下書きを計算できませんでした");
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [draftCompleted, goal.id, goal.targetStageId, inventory, isDirty, onError]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  function openMaterialInput(item: MaterialRequirement) {
    setEditingMaterial(item);
    setEditingCount(String(inventory[item.itemKey] ?? item.ownedCount));
  }

  function openMaterialEditor() {
    setMaterialInventorySnapshot({ ...inventory });
    setPinnedMaterialSnapshot([...pinnedMaterialKeys]);
    setIsMaterialOpen(true);
  }

  function closeMaterialEditor() {
    if (materialInventorySnapshot) setInventory(materialInventorySnapshot);
    if (pinnedMaterialSnapshot) setPinnedMaterialKeys(pinnedMaterialSnapshot);
    setMaterialInventorySnapshot(null);
    setPinnedMaterialSnapshot(null);
    setIsMaterialOpen(false);
  }

  function togglePinnedMaterial(itemKey: string, checked: boolean) {
    setPinnedMaterialKeys((current) => checked
      ? current.includes(itemKey) || current.length >= 8 ? current : [...current, itemKey]
      : current.filter((key) => key !== itemKey));
  }

  async function saveMaterialSettings() {
    setSavingMaterials(true);
    onError("");
    try {
      const inventoryChanges = Object.entries(inventory).filter(([key, value]) => savedInventory.get(key) !== value);
      await Promise.all(inventoryChanges.map(([itemKey, ownedCount]) => api.updateProgressInventory(goal.id, itemKey, ownedCount)));
      const response = await api.saveProgressPinnedMaterials(goal.id, pinnedMaterialKeys, goal.targetStageId);
      onChange(response.goal);
      setMaterialInventorySnapshot(null);
      setPinnedMaterialSnapshot(null);
      setIsMaterialOpen(false);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "所持数と掲示素材を保存できませんでした");
    } finally {
      setSavingMaterials(false);
    }
  }

  function applyMaterialInput() {
    if (!editingMaterial) return;
    const ownedCount = Math.min(9_999_999, Math.max(0, Number(editingCount) || 0));
    setInventory((current) => ({ ...current, [editingMaterial.itemKey]: ownedCount }));
    setEditingMaterial(null);
  }

  function toggleStage(stageId: string, checked: boolean) {
    setDraftCompleted((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(stageId);
      } else {
        next.delete(stageId);
        let changed = true;
        while (changed) {
          changed = false;
          for (const stage of goal.stages) {
            const missingRequiredStage = [...dependencyClosure(goal.preset, stage.id)].some(
              (id) => id !== stage.id && goal.stages.find((item) => item.id === id)?.kind === "stage" && !next.has(id)
            );
            if (next.has(stage.id) && missingRequiredStage) {
              next.delete(stage.id);
              changed = true;
            }
          }
        }
      }
      return next;
    });
  }

  function toggleGroup(groupId: string, checked: boolean) {
    const groupStageIds = goal.stages
      .filter((stage) => stage.groupId === groupId && stage.kind === "stage")
      .map((stage) => stage.id);
    setDraftCompleted((current) => {
      const next = new Set(current);
      if (checked) {
        groupStageIds.forEach((stageId) => {
          dependencyClosure(goal.preset, stageId).forEach((dependencyId) => {
            if (goal.stages.find((stage) => stage.id === dependencyId)?.kind === "stage") next.add(dependencyId);
          });
        });
        return next;
      }
      groupStageIds.forEach((stageId) => next.delete(stageId));
      let changed = true;
      while (changed) {
        changed = false;
        for (const stage of goal.stages) {
          const hasMissingDependency = [...dependencyClosure(goal.preset, stage.id)].some(
            (id) => id !== stage.id && goal.stages.find((item) => item.id === id)?.kind === "stage" && !next.has(id)
          );
          if (next.has(stage.id) && hasMissingDependency) {
            next.delete(stage.id);
            changed = true;
          }
        }
      }
      return next;
    });
  }

  function openProgressEditor() {
    setProgressModalSnapshot(new Set(draftCompleted));
    const firstIncompleteGroup = [...goal.preset.groups]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((group) => goal.stages.some((stage) => stage.groupId === group.id && stage.kind === "stage" && !draftCompleted.has(stage.id)));
    setOpenGroupIds(new Set(firstIncompleteGroup ? [firstIncompleteGroup.id] : []));
    setIsProgressOpen(true);
  }

  function closeProgressEditor() {
    const changedInModal = progressModalSnapshot && (
      progressModalSnapshot.size !== draftCompleted.size
      || [...progressModalSnapshot].some((id) => !draftCompleted.has(id))
    );
    if (changedInModal && !window.confirm("モーダル内の未保存の進捗変更を破棄しますか？")) return;
    if (progressModalSnapshot) setDraftCompleted(new Set(progressModalSnapshot));
    setProgressModalSnapshot(null);
    setIsProgressOpen(false);
  }

  async function save(closeProgressModal = false) {
    setSaving(true);
    onError("");
    try {
      const inventoryChanges = Object.entries(inventory).filter(([key, value]) => savedInventory.get(key) !== value);
      await Promise.all(inventoryChanges.map(([itemKey, ownedCount]) => api.updateProgressInventory(goal.id, itemKey, ownedCount)));
      const response = await api.saveProgressStages(goal.id, [...draftCompleted]);
      onChange(response.goal);
      if (closeProgressModal) {
        setProgressModalSnapshot(null);
        setIsProgressOpen(false);
      }
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "進捗を保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  async function changeTargetStage(targetStageId: string) {
    if (isDirty && !window.confirm("未保存の変更を破棄して表示先を変更しますか？")) return;
    try {
      const response = await api.progressGoal(goal.id, targetStageId);
      const next = new URLSearchParams(searchParams);
      next.set("goalId", goal.id);
      next.set("targetStageId", targetStageId);
      setSearchParams(next, { replace: true });
      onChange(response.goal);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "目標中継点を変更できませんでした");
    }
  }

  return <div className="progress-editor">
    <div className="progress-editor-toolbar">
      <label>目標中継点
        <select value={goal.targetStageId} onChange={(event) => void changeTargetStage(event.target.value)}>
          {goal.stages.filter((stage) => goal.availableTargetStageIds.includes(stage.id)).map((stage) =>
            <option key={stage.id} value={stage.id}>{stage.name}{stage.id === goal.goalStageId ? "（最終ゴール）" : ""}</option>
          )}
        </select>
      </label>
      {isDirty && <span className="pill warning">未保存</span>}
    </div>

    <div className="progress-summary-grid">
      <div><span>進捗率</span><strong>{preview.progressRate}%</strong></div>
    </div>

    {dependencyErrors.length > 0 && <div className="form-error">
      <CircleAlert size={17} />
      前提が未完了の中継点があります。ツリーの下側から順に完了してください。
    </div>}

    <section className="progress-material-summary">
      <div className="progress-material-summary-heading">
        <button className="secondary-button" disabled={materialItems.length === 0} onClick={openMaterialEditor} type="button"><PackageOpen size={16} />所持数を設定</button>
        <span className="progress-shortage-count">不足 {shortageItems.length}種類</span>
      </div>
      {pinnedMaterialItems.length > 0 && <div
        className="progress-pinned-materials"
        onTouchEnd={(event) => {
          const start = Number(event.currentTarget.dataset.touchStart ?? 0);
          const distance = event.changedTouches[0]?.clientX - start;
          if (Math.abs(distance) < 45) return;
          setPinnedPage((current) => distance < 0 ? Math.min(current + 1, pinnedPageCount - 1) : Math.max(current - 1, 0));
        }}
        onTouchStart={(event) => { event.currentTarget.dataset.touchStart = String(event.touches[0]?.clientX ?? 0); }}
      >
        <div className="progress-material-preview">{visiblePinnedItems.map((item) =>
          <button className="progress-material-preview-row" key={item.itemKey} onClick={() => { openMaterialEditor(); openMaterialInput(item); }} type="button">
            <span><strong>{item.itemName}</strong><small>所持 {item.ownedCount} / 必要 {item.requiredCount}</small></span>
            <span>{item.shortage > 0 ? `不足 ${item.shortage}` : "充足"}</span>
          </button>
        )}</div>
        {pinnedPageCount > 1 && <nav aria-label="掲示素材のページ" className="progress-material-pagination">
          {Array.from({ length: pinnedPageCount }, (_, index) => <button aria-current={pinnedPage === index ? "page" : undefined} className={pinnedPage === index ? "active" : ""} key={index} onClick={() => setPinnedPage(index)} type="button">{index + 1}</button>)}
        </nav>}
      </div>}
    </section>

    {!suppressFloatingAction && !isProgressOpen && !isMaterialOpen && !editingMaterial && <button className="progress-floating-action primary-button" onClick={openProgressEditor} type="button"><ListChecks size={18} />進捗を更新</button>}

    {isProgressOpen && <ProgressModal
      description="下位の中継点から順に表示しています。系統名のチェックで、前提を含めてまとめて変更できます。"
      footer={<><button className="secondary-button" disabled={saving} onClick={closeProgressEditor} type="button">キャンセル</button><span className="progress-modal-footer-spacer" /><button className="primary-button" disabled={!hasProgressChanges || saving || dependencyErrors.length > 0} onClick={() => void save(true)} type="button"><Save size={17} />{saving ? "保存中…" : "進捗を保存"}</button></>}
      onClose={closeProgressEditor}
      size="wide"
      title="系統・中継点の進捗を編集"
    >
      {dependencyErrors.length > 0 && <div className="form-error">
        <CircleAlert size={17} />
        前提が未完了の中継点があります。下位の中継点から順に完了してください。
      </div>}
      <div className="progress-tree" aria-label="進捗中継点ツリー">
        {[...goal.preset.groups].sort((a, b) => a.sortOrder - b.sortOrder).map((group) => {
          const stages = preview.stages.filter((stage) => stage.groupId === group.id);
          const normalStages = stages.filter((stage) => stage.kind === "stage");
          const completedCount = normalStages.filter((stage) => draftCompleted.has(stage.id)).length;
          const groupChecked = normalStages.length > 0 && completedCount === normalStages.length;
          const isGroupOpen = openGroupIds.has(group.id);
          return <section className="progress-tree-group" key={group.id}>
            <div className="progress-tree-group-heading">
              <label>
                <input checked={groupChecked} disabled={normalStages.length === 0} onChange={(event) => toggleGroup(group.id, event.target.checked)} type="checkbox" />
                <span><strong>{group.name}</strong>{progressGroupDescriptions[group.id] && <small>{progressGroupDescriptions[group.id]}</small>}</span>
              </label>
              <button aria-expanded={isGroupOpen} aria-label={`${group.name}を${isGroupOpen ? "折り畳む" : "開く"}`} className="progress-tree-group-toggle" onClick={() => setOpenGroupIds((current) => {
                const next = new Set(current);
                if (next.has(group.id)) next.delete(group.id); else next.add(group.id);
                return next;
              })} type="button"><small>{completedCount}/{normalStages.length}</small><ChevronDown className={isGroupOpen ? "rotated" : ""} size={17} /></button>
            </div>
            {isGroupOpen && <div className="progress-tree-stage-list">
              {stages.map((stage) => {
                const checked = stage.kind === "milestone" ? stage.isDone : draftCompleted.has(stage.id);
                return <div className={`progress-tree-stage${checked ? " done" : ""}`} key={stage.id}>
                  <label>
                    {stage.kind === "stage"
                      ? <input type="checkbox" checked={checked} disabled={!checked && !stage.canComplete} onChange={(event) => toggleStage(stage.id, event.target.checked)} />
                      : <span className="progress-milestone-icon" aria-hidden="true"><Check size={15} /></span>}
                    <span><strong>{stage.name}</strong>{stage.note && <small>{stage.note}</small>}</span>
                  </label>
                  {stage.kind === "milestone" && <span className="pill">自動判定</span>}
                </div>;
              })}
            </div>}
          </section>;
        })}
      </div>
    </ProgressModal>}

    {isMaterialOpen && <ProgressModal
      description="素材行から所持数を入力し、「表に掲示」で目標画面へ表示する素材を最大8件まで選べます。"
      disableEscape={Boolean(editingMaterial)}
      footer={<><button className="secondary-button" disabled={savingMaterials} onClick={closeMaterialEditor} type="button">キャンセル</button><span className="progress-modal-footer-spacer" /><span className="progress-pinned-count">掲示 {pinnedMaterialKeys.length}/8件</span><button className="primary-button" disabled={savingMaterials} onClick={() => void saveMaterialSettings()} type="button"><Save size={17} />{savingMaterials ? "保存中…" : "設定を保存"}</button></>}
      onClose={closeMaterialEditor}
      size="wide"
      title="所持数を設定"
    >
      <div className="progress-material-tabs" aria-label="素材カテゴリ" role="tablist">
        {materialTabs.map((tab) => {
          const count = tab.id === "shortage"
            ? shortageItems.length
            : tab.id === "all"
              ? materialItems.length
              : materialItems.filter((item) => materialCategory(item.itemKey) === tab.id).length;
          return <button aria-selected={materialTab === tab.id} className={materialTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setMaterialTab(tab.id)} role="tab" type="button">{tab.label}<span>{count}</span></button>;
        })}
      </div>
      {visibleMaterialItems.length === 0
        ? <div className="empty-state">このカテゴリに表示する素材はありません。</div>
        : <div className="progress-material-dialog-grid">{visibleMaterialItems.map((item) =>
          <div className="progress-material-dialog-row" key={item.itemKey}>
            <button className="progress-material-value-button" onClick={() => openMaterialInput(item)} type="button">
              <span><strong>{item.itemName}</strong><small>所持 {item.ownedCount} / 必要 {item.requiredCount}</small></span>
              <span className={item.shortage > 0 ? "shortage" : "complete"}>{item.shortage > 0 ? `不足 ${item.shortage}` : "充足"}</span>
              <Pencil aria-hidden="true" size={14} />
            </button>
            <label className="progress-material-pin"><input checked={pinnedMaterialKeys.includes(item.itemKey)} disabled={!pinnedMaterialKeys.includes(item.itemKey) && pinnedMaterialKeys.length >= 8} onChange={(event) => togglePinnedMaterial(item.itemKey, event.target.checked)} type="checkbox" />表に掲示</label>
          </div>
        )}</div>}
    </ProgressModal>}

    {editingMaterial && <ProgressModal
      footer={<><button className="secondary-button" onClick={() => setEditingCount("0")} type="button">0にする</button><button className="secondary-button" onClick={() => setEditingMaterial(null)} type="button">キャンセル</button><button className="primary-button" onClick={applyMaterialInput} type="button">反映</button></>}
      nested
      onClose={() => setEditingMaterial(null)}
      size="small"
      title={editingMaterial.itemName}
    >
      <div className="progress-number-editor">
        <div><span>必要数</span><strong>{editingMaterial.requiredCount}</strong></div>
        <label>現在の所持数<input autoFocus inputMode="numeric" max={9_999_999} min={0} onChange={(event) => setEditingCount(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyMaterialInput(); }} pattern="[0-9]*" type="number" value={editingCount} /></label>
      </div>
    </ProgressModal>}
  </div>;
}

export function ProgressGoalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [presets, setPresets] = useState<ProgressPreset[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [presetId, setPresetId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [initialByGroup, setInitialByGroup] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInitialProgressOpen, setIsInitialProgressOpen] = useState(false);
  const [initialProgressSnapshot, setInitialProgressSnapshot] = useState<Record<string, string>>({});
  const [createStep, setCreateStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const openGoalId = searchParams.get("goalId");

  const selectedPreset = useMemo(() => presets.find((preset) => preset.id === presetId), [presetId, presets]);

  async function load() {
    setLoading(true);
    try {
      const [presetData, goalData] = await Promise.all([api.progressPresets(), api.progressGoals()]);
      setPresets(presetData.presets);
      const requestedGoalId = searchParams.get("goalId");
      const requestedTargetStageId = searchParams.get("targetStageId") ?? undefined;
      if (requestedGoalId && goalData.goals.some((goal) => goal.id === requestedGoalId)) {
        const detail = await api.progressGoal(requestedGoalId, requestedTargetStageId);
        setGoals(goalData.goals.map((goal) => goal.id === requestedGoalId ? detail.goal : goal));
      } else {
        setGoals(goalData.goals);
      }
      const first = presetData.presets.find((preset) => preset.isAvailable);
      setPresetId((current) => current || first?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "進捗データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    setTargetId(selectedPreset?.targets[0]?.id ?? "");
    setInitialByGroup({});
  }, [selectedPreset?.id]);

  function replaceGoal(goal: ProgressGoal) {
    setGoals((current) => current.map((item) => item.id === goal.id ? goal : item));
  }

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPreset) return;
    setError("");
    const completed = new Set<string>();
    Object.values(initialByGroup).filter(Boolean).forEach((stageId) => {
      dependencyClosure(selectedPreset, stageId).forEach((id) => {
        if (selectedPreset.stages.find((stage) => stage.id === id)?.kind === "stage") completed.add(id);
      });
    });
    setCreating(true);
    try {
      const data = await api.createProgressGoal({
        presetId,
        targetId,
        goalStageId: selectedPreset.stages.at(-1)?.id ?? "",
        completedStageIds: [...completed]
      });
      setGoals((current) => [data.goal, ...current]);
      setSearchParams({ goalId: data.goal.id, targetStageId: data.goal.targetStageId });
      setIsCreateOpen(false);
      setCreateStep(1);
      setInitialByGroup({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  function closeCreateModal() {
    const hasInput = createStep > 1 || Object.values(initialByGroup).some(Boolean);
    if (hasInput && !window.confirm("入力中の登録内容を破棄して閉じますか？")) return;
    setIsCreateOpen(false);
    setCreateStep(1);
    setInitialByGroup({});
  }

  function openInitialProgressModal() {
    setInitialProgressSnapshot({ ...initialByGroup });
    setIsInitialProgressOpen(true);
  }

  function cancelInitialProgressModal() {
    setInitialByGroup(initialProgressSnapshot);
    setIsInitialProgressOpen(false);
  }

  async function openGoal(goal: ProgressGoal) {
    if (openGoalId === goal.id) {
      setSearchParams({}, { replace: true });
      return;
    }
    try {
      const targetStageId = searchParams.get("targetStageId") ?? goal.goalStageId;
      const response = await api.progressGoal(goal.id, targetStageId);
      replaceGoal(response.goal);
      setSearchParams({ goalId: goal.id, targetStageId: response.goal.targetStageId }, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標を開けませんでした");
    }
  }

  async function deleteGoal(goal: ProgressGoal) {
    if (!window.confirm(`「${goal.preset.name} ${goal.targetName}」を削除しますか？`)) return;
    try {
      await api.deleteProgressGoal(goal.id);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      if (openGoalId === goal.id) setSearchParams({}, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標を削除できませんでした");
    }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">Progress</p><h2>必要数の進捗</h2><p>十賢者の現在状態から、目標中継点までの不足素材を確認できます。</p></div><button className="primary-button" disabled={!presets.some((preset) => preset.isAvailable)} onClick={() => { setCreateStep(1); setIsCreateOpen(true); }} type="button"><Plus size={18} />目標を登録</button></section>

    {error && <div className="form-error" role="alert"><CircleAlert size={18} />{error}</div>}

    <section className="progress-page-layout">
      <div className="panel progress-goal-panel">
        <div className="section-heading"><div><p className="eyebrow">Goals</p><h2>登録済みの目標</h2></div><ListChecks size={22} /></div>
        {loading ? <div className="empty-state">読み込み中です…</div> : goals.length === 0 ? <div className="empty-state">登録済みの進捗目標はありません。</div> : <div className="progress-goal-list">{goals.map((goal) => {
          const isOpen = openGoalId === goal.id;
          return <article className="progress-goal-card" key={goal.id}>
            <div className="progress-goal-card-header">
              <button className="text-button" onClick={() => void openGoal(goal)} type="button"><div><h3>{goal.preset.name}：{goal.targetName}</h3><div className="task-meta"><span>{goal.completedCount}/{goal.totalStageCount}中継点</span><span>次：{goal.currentStage?.name ?? "完了"}</span></div></div><ChevronDown className={isOpen ? "rotated" : ""} size={18} /></button>
              <button aria-label="目標を削除" className="icon-button danger" onClick={() => void deleteGoal(goal)} title="目標を削除" type="button"><Trash2 size={17} /></button>
            </div>
            <div className="progress-bar" aria-label={`進捗率${goal.progressRate}%`}><span style={{ width: `${goal.progressRate}%` }} /></div>
            {isOpen && <ProgressGoalEditor goal={goal} onChange={replaceGoal} onError={setError} suppressFloatingAction={isCreateOpen || isInitialProgressOpen} />}
          </article>;
        })}</div>}
      </div>
    </section>

    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Preset status</p><h2>プリセットデータ</h2></div></div><div className="preset-chip-list">{presets.map((preset) => <div className="preset-chip" key={`${preset.id}-${preset.version}`}><div><strong>{preset.name} v{preset.version}</strong><span>{preset.targets.length ? `${preset.targetLabel}を選択` : "対象を確認中"}・{preset.groups.map((group) => group.name).join(" / ")}</span><small>{preset.isAvailable ? "利用可能" : `確認中：${preset.unavailableReason}`}</small></div></div>)}</div></section>

    {isCreateOpen && selectedPreset && <ProgressModal
      description="PCとモバイルで同じ手順を使い、現在状態まで設定して登録します。"
      disableEscape={isInitialProgressOpen}
      footer={<>
        <button className="secondary-button" onClick={closeCreateModal} type="button">キャンセル</button>
        <span className="progress-modal-footer-spacer" />
        {createStep > 1 && <button className="secondary-button" onClick={() => setCreateStep((current) => current - 1)} type="button">戻る</button>}
        {createStep < 3
          ? <button className="primary-button" disabled={createStep === 1 && !targetId} onClick={() => setCreateStep((current) => current + 1)} type="button">次へ</button>
          : <button className="primary-button" disabled={creating} form="progress-create-form" type="submit"><Plus size={17} />{creating ? "登録中…" : "登録する"}</button>}
      </>}
      onClose={isInitialProgressOpen ? () => undefined : closeCreateModal}
      size="wide"
      title="目標を登録"
    >
      <div className="progress-create-steps" aria-label={`登録手順 ${createStep}/3`}>
        {["対象", "現在状態", "確認"].map((label, index) => <div className={createStep === index + 1 ? "active" : createStep > index + 1 ? "complete" : ""} key={label}><span>{index + 1}</span><strong>{label}</strong></div>)}
      </div>
      <form id="progress-create-form" onSubmit={createGoal}>
        {createStep === 1 && <div className="progress-modal-form-grid">
          <label>プリセット<select required value={presetId} onChange={(event) => setPresetId(event.target.value)}>{presets.filter((preset) => preset.isAvailable).map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <label>{selectedPreset.targetLabel}<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}>{selectedPreset.targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>
        </div>}
        {createStep === 2 && <section className="progress-initial-summary">
          <div className="progress-initial-summary-heading">
            <div><h3>工程グループごとの現在状態</h3><p>専用画面で全系統の現在地点をまとめて設定します。</p></div>
            <button className="secondary-button" onClick={openInitialProgressModal} type="button"><ListChecks size={16} />現在進捗を設定</button>
          </div>
          <div className="progress-stage-summary-grid">
            {[...selectedPreset.groups].sort((a, b) => a.sortOrder - b.sortOrder).map((group) => <div key={group.id}>
              <span>{group.name}</span>
              <strong>{selectedPreset.stages.find((stage) => stage.id === initialByGroup[group.id])?.name ?? "未着手"}</strong>
            </div>)}
          </div>
        </section>}
        {createStep === 3 && <div className="progress-create-confirm">
          <div><span>プリセット</span><strong>{selectedPreset.name}</strong></div>
          <div><span>{selectedPreset.targetLabel}</span><strong>{selectedPreset.targets.find((target) => target.id === targetId)?.name}</strong></div>
          <div className="wide"><span>現在状態</span><ul>{selectedPreset.groups.map((group) => <li key={group.id}><span>{group.name}</span><strong>{selectedPreset.stages.find((stage) => stage.id === initialByGroup[group.id])?.name ?? "未着手"}</strong></li>)}</ul></div>
        </div>}
      </form>
    </ProgressModal>}

    {isInitialProgressOpen && selectedPreset && <ProgressModal
      description="全系統の現在地点を設定します。ここでは登録内容へ反映し、DBへの保存は最後の「登録する」で行います。"
      footer={<><button className="secondary-button" onClick={cancelInitialProgressModal} type="button">キャンセル</button><span className="progress-modal-footer-spacer" /><button className="primary-button" onClick={() => setIsInitialProgressOpen(false)} type="button">登録内容に反映</button></>}
      nested
      onClose={cancelInitialProgressModal}
      size="wide"
      title="現在進捗を設定"
    >
      <div className="progress-modal-stage-grid" aria-label="工程グループごとの現在状態">
        {[...selectedPreset.groups].sort((a, b) => a.sortOrder - b.sortOrder).map((group) => <label key={group.id}>{group.name}
          <select value={initialByGroup[group.id] ?? ""} onChange={(event) => setInitialByGroup((current) => ({ ...current, [group.id]: event.target.value }))}>
            <option value="">未着手</option>
            {selectedPreset.stages.filter((stage) => stage.groupId === group.id && stage.kind === "stage").map((stage) => <option key={stage.id} value={stage.id}>{stage.name}まで完了</option>)}
          </select>
        </label>)}
      </div>
    </ProgressModal>}
  </div>;
}
