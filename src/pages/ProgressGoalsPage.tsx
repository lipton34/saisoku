import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, ListChecks, Plus, Trash2 } from "lucide-react";
import { api, type ProgressGoal, type ProgressPreset } from "../lib/api";
import "./ProgressGoalsPage.css";

export function ProgressGoalsPage() {
  const [presets, setPresets] = useState<ProgressPreset[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [presetId, setPresetId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [goalStageId, setGoalStageId] = useState("");
  const [startingStageId, setStartingStageId] = useState("");
  const [selection, setSelection] = useState("");
  const [error, setError] = useState("");
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);

  const selectedPreset = useMemo(() => presets.find((preset) => preset.id === presetId), [presetId, presets]);

  async function load() {
    try {
      const [presetData, goalData] = await Promise.all([api.progressPresets(), api.progressGoals()]);
      setPresets(presetData.presets);
      setGoals(goalData.goals);
      const first = presetData.presets.find((preset) => preset.isAvailable);
      setPresetId((current) => current || first?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "進捗データの取得に失敗しました");
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    setTargetId(selectedPreset?.targets[0]?.id ?? "");
    setGoalStageId(selectedPreset?.stages.at(-1)?.id ?? "");
    setStartingStageId("");
    setSelection(selectedPreset?.selectionOptions?.[0] ?? "");
  }, [selectedPreset?.id]);

  function replaceGoal(goal: ProgressGoal) {
    setGoals((current) => current.map((item) => item.id === goal.id ? goal : item));
  }

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const data = await api.createProgressGoal({
        presetId, targetId, goalStageId,
        ...(startingStageId ? { startingStageId } : {}),
        ...(selectedPreset?.selectionLabel ? { selection: { [selectedPreset.selectionLabel]: selection } } : {})
      });
      setGoals((current) => [data.goal, ...current]);
      setOpenGoalId(data.goal.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました"); }
  }

  async function updateInventory(goalId: string, itemKey: string, ownedCount: number) {
    try { replaceGoal((await api.updateProgressInventory(goalId, itemKey, ownedCount)).goal); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "所持数を保存できませんでした"); }
  }

  async function updateCondition(goalId: string, conditionId: string, value: { isChecked?: boolean; numericValue?: number }) {
    try { replaceGoal((await api.updateProgressCondition(goalId, conditionId, value)).goal); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "条件を保存できませんでした"); }
  }

  async function completeStage(goalId: string, stageId: string) {
    try { replaceGoal((await api.completeProgressStage(goalId, stageId)).goal); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "段階を完了できませんでした"); }
  }

  async function deleteGoal(goal: ProgressGoal) {
    if (!window.confirm(`「${goal.preset.name} ${goal.targetName}」を削除しますか？`)) return;
    try { await api.deleteProgressGoal(goal.id); setGoals((current) => current.filter((item) => item.id !== goal.id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "目標を削除できませんでした"); }
  }

  return <div className="page-stack">
    <section className="page-heading"><div><p className="eyebrow">Progress</p><h2>必要数の進捗</h2><p>目標の段階、足りない素材、解放条件をまとめて確認します。</p></div></section>

    <section className="content-grid task-page-grid">
      <form className="panel task-form" onSubmit={createGoal}>
        <div className="section-heading"><div><p className="eyebrow">New Goal</p><h2>目標を追加</h2></div><Plus size={22} /></div>
        {presets.some((preset) => preset.isAvailable) ? <>
          <label>プリセット<select required value={presetId} onChange={(event) => setPresetId(event.target.value)}>{presets.filter((preset) => preset.isAvailable).map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <label>{selectedPreset?.targetLabel ?? "対象"}<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}>{selectedPreset?.targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>
          {selectedPreset?.selectionLabel && <label>{selectedPreset.selectionLabel}<select value={selection} onChange={(event) => setSelection(event.target.value)}>{selectedPreset.selectionOptions?.map((option) => <option key={option}>{option}</option>)}</select></label>}
          <label>ゴール<select value={goalStageId} onChange={(event) => setGoalStageId(event.target.value)}>{selectedPreset?.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
          <label>達成済みの最終段階<select value={startingStageId} onChange={(event) => setStartingStageId(event.target.value)}><option value="">未着手</option>{selectedPreset?.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
          <button className="primary-button" type="submit"><Plus size={18} />登録する</button>
        </> : <div className="empty-state">検証済みの必要素材データを投入後、この画面から目標を登録できます。</div>}
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="panel wide">
        <div className="section-heading"><div><p className="eyebrow">Goals</p><h2>登録済みの目標</h2></div><ListChecks size={22} /></div>
        {goals.length === 0 ? <div className="empty-state">登録済みの進捗目標はありません。</div> : <div className="material-goal-list">{goals.map((goal) => {
          const isOpen = openGoalId === goal.id;
          return <article className="material-goal" key={goal.id}>
            <div className="material-goal-header"><button className="text-button" onClick={() => setOpenGoalId(isOpen ? null : goal.id)} type="button"><div><h3>{goal.preset.name}：{goal.targetName}</h3><div className="task-meta"><span>{goal.completedCount}/{goal.totalStageCount}段階</span><span>現在：{goal.currentStage?.name ?? "完了"}</span></div></div><ChevronDown size={18} /></button><button aria-label="目標を削除" className="icon-button danger" onClick={() => deleteGoal(goal)} type="button"><Trash2 size={17} /></button></div>
            <div className="progress-bar"><span style={{ width: `${goal.progressRate}%` }} /></div>
            {isOpen && <div className="material-item-list">{goal.stages.map((stage) => <div className="progress-stage" key={stage.id}>
              <div className="task-title-line"><strong>{stage.isDone ? "✓" : stage.isEligible ? "○" : "•"} {stage.name}</strong>{stage.isDone ? <span className="pill">達成済み</span> : stage.isEligible ? <button className="secondary-button" onClick={() => completeStage(goal.id, stage.id)} type="button"><CheckCircle2 size={15} />この段階を完了</button> : null}</div>
              {!stage.isDone && stage.conditions.map((condition) => <label className="progress-condition" key={condition.id}>{condition.kind === "check" ? <><input checked={condition.isChecked} onChange={(event) => updateCondition(goal.id, condition.id, { isChecked: event.target.checked })} type="checkbox" />{condition.label}</> : <><span>{condition.label}</span><input min={0} onBlur={(event) => updateCondition(goal.id, condition.id, { numericValue: Number(event.target.value) })} type="number" defaultValue={condition.numericValue} /></>} {!condition.isMet && <CircleAlert size={15} />}</label>)}
              {!stage.isDone && stage.requirements.map((item) => <div className="material-item" key={item.itemKey}><div><strong>{item.itemName}</strong><span>{item.ownedCount}/{item.requiredCount}・あと{item.shortage}</span></div><input min={0} onBlur={(event) => updateInventory(goal.id, item.itemKey, Number(event.target.value))} type="number" defaultValue={item.ownedCount} /></div>)}
            </div>)}</div>}
          </article>;
        })}</div>}
      </div>
    </section>

    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Preset status</p><h2>プリセットデータ</h2></div></div><div className="preset-chip-list progress-preset-list">{presets.map((preset) => <div className="preset-chip" key={preset.id}><div><strong>{preset.name}</strong><span>{preset.targets.length ? `${preset.targetLabel}を選択` : "対象を確認中"}・{preset.stages.map((stage) => stage.name).join(" / ")}</span><small>{preset.isAvailable ? "利用可能" : `確認中：${preset.unavailableReason}`}</small></div></div>)}</div></section>
  </div>;
}
