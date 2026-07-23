import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, ListChecks, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api, type ProgressGoal, type ProgressPreset } from "../lib/api";

function dependencyClosure(preset: ProgressPreset, stageId: string, found = new Set<string>()) {
  const stage = preset.stages.find((item) => item.id === stageId);
  if (!stage || found.has(stageId)) return found;
  found.add(stageId);
  stage.dependsOn.forEach((id) => dependencyClosure(preset, id, found));
  return found;
}

function ProgressGoalEditor({
  goal,
  onChange,
  onError
}: {
  goal: ProgressGoal;
  onChange: (goal: ProgressGoal) => void;
  onError: (message: string) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftCompleted, setDraftCompleted] = useState(() => new Set(goal.completedStageIds));
  const [inventory, setInventory] = useState<Record<string, number>>(() =>
    Object.fromEntries(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount]))
  );
  const [preview, setPreview] = useState(goal);
  const [dependencyErrors, setDependencyErrors] = useState<{ stageId: string; missingDependencyIds: string[] }[]>([]);
  const [saving, setSaving] = useState(false);

  const hasProgressChanges = useMemo(() => {
    const saved = new Set(goal.completedStageIds);
    return saved.size !== draftCompleted.size || [...saved].some((id) => !draftCompleted.has(id));
  }, [draftCompleted, goal.completedStageIds]);
  const savedInventory = useMemo(
    () => new Map(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount])),
    [goal.calculation.requirements]
  );
  const hasInventoryChanges = Object.entries(inventory).some(([key, value]) => savedInventory.get(key) !== value);
  const isDirty = hasProgressChanges || hasInventoryChanges;

  useEffect(() => {
    setDraftCompleted(new Set(goal.completedStageIds));
    setPreview(goal);
    setInventory(Object.fromEntries(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount])));
    setDependencyErrors([]);
  }, [goal.id, goal.updatedAt, goal.targetStageId]);

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

  function resetDraft() {
    setDraftCompleted(new Set(goal.completedStageIds));
    setInventory(Object.fromEntries(goal.calculation.requirements.map((item) => [item.itemKey, item.ownedCount])));
    setPreview(goal);
    setDependencyErrors([]);
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

  async function save() {
    setSaving(true);
    onError("");
    try {
      const inventoryChanges = Object.entries(inventory).filter(([key, value]) => savedInventory.get(key) !== value);
      await Promise.all(inventoryChanges.map(([itemKey, ownedCount]) => api.updateProgressInventory(goal.id, itemKey, ownedCount)));
      const response = await api.saveProgressStages(goal.id, [...draftCompleted]);
      onChange(response.goal);
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

  const stageNames = new Map(goal.stages.map((stage) => [stage.id, stage.name]));

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
      <div><span>進捗</span><strong>{preview.completedCount}/{preview.totalStageCount}</strong></div>
      <div><span>進捗率</span><strong>{preview.progressRate}%</strong></div>
      <div><span>表示先</span><strong>{preview.stages.find((stage) => stage.id === preview.targetStageId)?.name}</strong></div>
    </div>

    {dependencyErrors.length > 0 && <div className="form-error">
      <CircleAlert size={17} />
      前提が未完了の中継点があります。ツリーの下側から順に完了してください。
    </div>}

    <section className="progress-material-summary">
      <h4>目標中継点までの不足素材</h4>
      {preview.calculation.requirements.length === 0
        ? <div className="empty-state">この中継点までの必要素材はありません。</div>
        : <div className="progress-material-grid">{preview.calculation.requirements.map((item) =>
          <label className="progress-material-card" key={item.itemKey}>
            <span><strong>{item.itemName}</strong><small>必要 {item.requiredCount}・不足 {item.shortage}</small></span>
            <span className="progress-owned-input"><input aria-label={`${item.itemName}の所持数`} min={0} max={9_999_999} type="number" value={inventory[item.itemKey] ?? item.ownedCount} onChange={(event) => setInventory((current) => ({ ...current, [item.itemKey]: Math.max(0, Number(event.target.value) || 0) }))} /><small>所持</small></span>
          </label>
        )}</div>}
    </section>

    <div className="progress-tree" aria-label="進捗中継点ツリー">
      <div className="progress-tree-goal"><strong>{goal.stages.find((stage) => stage.id === goal.goalStageId)?.name}</strong><span>最終ゴール</span></div>
      {[...goal.preset.groups].sort((a, b) => b.sortOrder - a.sortOrder).map((group) => {
        const stages = preview.stages.filter((stage) => stage.groupId === group.id);
        const normalStages = stages.filter((stage) => stage.kind === "stage");
        return <details className="progress-tree-group" key={group.id} open>
          <summary><span>{group.name}</span><small>{normalStages.filter((stage) => draftCompleted.has(stage.id)).length}/{normalStages.length}</small></summary>
          <div className="progress-tree-stage-list">
            {[...stages].reverse().map((stage) => {
              const checked = stage.kind === "milestone" ? stage.isDone : draftCompleted.has(stage.id);
              const missingNames = stage.missingDependencyIds.map((id) => stageNames.get(id)).filter(Boolean);
              return <div className={`progress-tree-stage${checked ? " done" : ""}`} key={stage.id}>
                <label>
                  {stage.kind === "stage"
                    ? <input type="checkbox" checked={checked} disabled={!checked && !stage.canComplete} onChange={(event) => toggleStage(stage.id, event.target.checked)} />
                    : <span className="progress-milestone-icon" aria-hidden="true"><Check size={15} /></span>}
                  <span><strong>{stage.name}</strong>{stage.note && <small>{stage.note}</small>}{!checked && missingNames.length > 0 && <small>前提：{missingNames.join("、")}</small>}</span>
                </label>
                {stage.kind === "milestone" && <span className="pill">自動判定</span>}
              </div>;
            })}
          </div>
        </details>;
      })}
    </div>

    <div className="progress-editor-actions">
      <button className="secondary-button" disabled={!isDirty || saving} onClick={resetDraft} type="button"><RotateCcw size={17} />キャンセル</button>
      <button className="primary-button" disabled={!isDirty || saving || dependencyErrors.length > 0} onClick={() => void save()} type="button"><Save size={17} />{saving ? "保存中…" : "変更を保存"}</button>
    </div>
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
    try {
      const data = await api.createProgressGoal({
        presetId,
        targetId,
        goalStageId: selectedPreset.stages.at(-1)?.id ?? "",
        completedStageIds: [...completed]
      });
      setGoals((current) => [data.goal, ...current]);
      setSearchParams({ goalId: data.goal.id, targetStageId: data.goal.targetStageId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました");
    }
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
    <section className="page-heading"><div><p className="eyebrow">Progress</p><h2>必要数の進捗</h2><p>十賢者の現在状態から、目標中継点までの不足素材を確認できます。</p></div></section>

    {error && <div className="form-error" role="alert"><CircleAlert size={18} />{error}</div>}

    <section className="progress-page-layout">
      <form className="panel progress-create-form" onSubmit={createGoal}>
        <div className="section-heading"><div><p className="eyebrow">New Goal</p><h2>目標を追加</h2></div><Plus size={22} /></div>
        {presets.some((preset) => preset.isAvailable) ? <>
          <label>プリセット<select required value={presetId} onChange={(event) => setPresetId(event.target.value)}>{presets.filter((preset) => preset.isAvailable).map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <label>{selectedPreset?.targetLabel ?? "対象"}<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}>{selectedPreset?.targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>
          <div className="progress-initial-scroll" aria-label="工程グループごとの現在状態">
            {selectedPreset?.groups.map((group) => <label key={group.id}>{group.name}
              <select value={initialByGroup[group.id] ?? ""} onChange={(event) => setInitialByGroup((current) => ({ ...current, [group.id]: event.target.value }))}>
                <option value="">未着手</option>
                {selectedPreset.stages.filter((stage) => stage.groupId === group.id && stage.kind === "stage").map((stage) => <option key={stage.id} value={stage.id}>{stage.name}まで完了</option>)}
              </select>
            </label>)}
          </div>
          <button className="primary-button" type="submit"><Plus size={18} />登録する</button>
        </> : <div className="empty-state">利用可能なプリセットはありません。</div>}
      </form>

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
            {isOpen && <ProgressGoalEditor goal={goal} onChange={replaceGoal} onError={setError} />}
          </article>;
        })}</div>}
      </div>
    </section>

    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Preset status</p><h2>プリセットデータ</h2></div></div><div className="preset-chip-list">{presets.map((preset) => <div className="preset-chip" key={`${preset.id}-${preset.version}`}><div><strong>{preset.name} v{preset.version}</strong><span>{preset.targets.length ? `${preset.targetLabel}を選択` : "対象を確認中"}・{preset.groups.map((group) => group.name).join(" / ")}</span><small>{preset.isAvailable ? "利用可能" : `確認中：${preset.unavailableReason}`}</small></div></div>)}</div></section>
  </div>;
}
