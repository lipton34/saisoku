import { CheckSquare, Filter, Hash, LoaderCircle, Milestone, MoreVertical, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api, type Goal, type GoalBoardState, type GoalSubTaskInput, type ProgressGoal, type RoundGoal } from "../lib/api";

const statuses: { value: GoalBoardState; label: string }[] = [
  { value: "unset", label: "未設定" },
  { value: "now", label: "今やる" },
  { value: "later", label: "後でやる" }
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState<"personal" | "crew">("personal");
  const [status, setStatus] = useState<GoalBoardState>("unset");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [openingGoalId, setOpeningGoalId] = useState<string | null>(null);
  const [editingRoundGoal, setEditingRoundGoal] = useState<RoundGoal | null>(null);
  const [roundCurrentCount, setRoundCurrentCount] = useState("");
  const [savingRoundCount, setSavingRoundCount] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "tasks">("overview");
  const [filterOpen, setFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "normal" | "round" | "progress">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
  const [newSubTasks, setNewSubTasks] = useState<GoalSubTaskInput[]>([]);
  const [roundCandidates, setRoundCandidates] = useState<RoundGoal[]>([]);
  const [progressCandidates, setProgressCandidates] = useState<ProgressGoal[]>([]);
  const [error, setError] = useState("");

  async function load(nextScope = scope) {
    try {
      const data = await api.goals(nextScope);
      setGoals(data.goals);
      setSelected((current) => data.goals.find((goal) => goal.id === current?.id) ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "目標を読み込めませんでした");
    }
  }

  useEffect(() => {
    void load(scope);
  }, [scope]);

  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) => {
        if (goal.boardStatus !== status) return false;
        if (keyword && !`${goal.title} ${goal.description ?? ""} ${goal.memo ?? ""}`.toLowerCase().includes(keyword.toLowerCase())) return false;
        if (sourceFilter === "round" && !goal.sourceRoundGoalId) return false;
        if (sourceFilter === "progress" && !goal.sourceProgressGoalId) return false;
        if (sourceFilter === "normal" && (goal.sourceRoundGoalId || goal.sourceProgressGoalId)) return false;
        return true;
      }),
    [goals, keyword, sourceFilter, status]
  );

  async function openGoal(goal: Goal) {
    if (openingGoalId) return;
    setOpeningGoalId(goal.id);
    try {
      if (goal.sourceRoundGoalId) {
        const response = await api.roundGoal(goal.sourceRoundGoalId);
        setEditingRoundGoal(response.goal);
        setRoundCurrentCount(String(response.goal.currentCount));
        return;
      }
      if (goal.sourceProgressGoalId) {
        const response = await api.progressGoal(goal.sourceProgressGoalId);
        navigate(`/progress-goals?goalId=${encodeURIComponent(goal.sourceProgressGoalId)}&targetStageId=${encodeURIComponent(response.goal.targetStageId)}`);
        return;
      }
      const response = await api.goal(goal.id);
      setDetailTab("overview");
      setSelected(response.goal);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "目標を開けませんでした");
    } finally {
      setOpeningGoalId(null);
    }
  }

  async function updateRoundCount() {
    if (!editingRoundGoal || savingRoundCount) return;
    const parsedCount = Number(roundCurrentCount);
    if (!Number.isSafeInteger(parsedCount) || parsedCount < 0) {
      setError("現在数は0以上の整数で入力してください");
      return;
    }
    setSavingRoundCount(true);
    try {
      await api.updateRoundGoal(editingRoundGoal.id, { currentCount: parsedCount });
      setEditingRoundGoal(null);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "現在数を更新できませんでした");
    } finally {
      setSavingRoundCount(false);
    }
  }

  async function changeStatus(goal: Goal, boardStatus: GoalBoardState) {
    try {
      await api.updateGoal(goal.id, { boardStatus, expectedUpdatedAt: goal.updatedAt });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "状態を変更できませんでした");
    }
  }

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.createGoal({ title: newTitle, description: newDescription, subTasks: newSubTasks });
      setNewTitle("");
      setNewDescription("");
      setNewSubTasks([]);
      setCreateOpen(false);
      setScope("personal");
      setStatus("unset");
      await load("personal");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "目標を作成できませんでした");
    }
  }

  async function removeGoal(goal: Goal) {
    const message = goal.sourceRoundGoalId || goal.sourceProgressGoalId
      ? "目標ボードとの連携を解除します。元のデータは残ります。"
      : "この目標を削除します。";
    if (!window.confirm(message)) return;
    try {
      if (goal.sourceRoundGoalId || goal.sourceProgressGoalId) await api.unlinkGoalSource(goal.id);
      else await api.deleteGoal(goal.id);
      setSelected(null);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "削除できませんでした");
    }
  }

  async function publish(goal: Goal) {
    if (!window.confirm("団内目標にすると個人目標へ戻せません。団内へ公開しますか？")) return;
    try {
      await api.updateGoal(goal.id, { visibility: "crew", confirmCrewPublish: true, expectedUpdatedAt: goal.updatedAt });
      setSelected(null);
      await load();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "団内へ公開できませんでした");
    }
  }

  async function toggleSubTask(task: Goal["subTasks"][number]) {
    if (!selected) return;
    try {
      const value = task.kind === "standard"
        ? { isDone: !task.effectiveIsDone, expectedUpdatedAt: task.updatedAt }
        : { completionOverride: !task.effectiveIsDone, expectedUpdatedAt: task.updatedAt };
      const response = await api.updateGoalSubTask(selected.id, task.id, value);
      setSelected(response.goal);
      await load();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "サブタスクを更新できませんでした");
    }
  }

  async function resetSubTaskAutomatic(taskId: string, updatedAt: string) {
    if (!selected) return;
    try {
      const response = await api.updateGoalSubTask(selected.id, taskId, { completionOverride: null, expectedUpdatedAt: updatedAt });
      setSelected(response.goal);
      await load();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "自動判定へ戻せませんでした");
    }
  }

  async function openLinkedSubTask(task: Goal["subTasks"][number]) {
    if (task.kind === "round" && task.sourceRoundGoalId) {
      try {
        const response = await api.roundGoal(task.sourceRoundGoalId);
        setEditingRoundGoal(response.goal);
        setRoundCurrentCount(String(response.goal.currentCount));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "数量目標を開けませんでした");
      }
    } else if (task.kind === "progress" && task.sourceProgressGoalId) {
      navigate(`/progress-goals?goalId=${encodeURIComponent(task.sourceProgressGoalId)}`);
    }
  }

  async function openCreate() {
    setCreateOpen(true);
    try {
      const [roundData, progressData] = await Promise.all([api.roundGoals(), api.progressGoals()]);
      setRoundCandidates(roundData.goals);
      setProgressCandidates(progressData.goals);
    } catch {
      setRoundCandidates([]);
      setProgressCandidates([]);
    }
  }

  return (
    <div className="page-stack goal-home-page">
      <section className="page-heading goal-home-heading">
        <div><p className="eyebrow">Goals</p><h1>目標</h1></div>
        <button aria-label="絞り込み" className="icon-button" onClick={() => setFilterOpen(true)} title="絞り込み" type="button"><Filter size={19} /></button>
      </section>

      <div className="segmented goal-scope-tabs" role="tablist" aria-label="目標の公開範囲">
        <button aria-selected={scope === "personal"} className={scope === "personal" ? "active" : ""} onClick={() => setScope("personal")} role="tab" type="button">個人目標</button>
        <button aria-selected={scope === "crew"} className={scope === "crew" ? "active" : ""} onClick={() => setScope("crew")} role="tab" type="button">団内目標</button>
      </div>
      <div className="segmented goal-status-tabs" role="tablist" aria-label="目標の状態">
        {statuses.map((item) => <button aria-selected={status === item.value} className={status === item.value ? "active" : ""} key={item.value} onClick={() => setStatus(item.value)} role="tab" type="button">{item.label}</button>)}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className="goal-board-column">
        {visibleGoals.length === 0 ? <div className="panel empty-state"><p>この状態の目標はありません。</p></div> : visibleGoals.map((goal) => {
          const ownGoal = goal.ownerId === user?.id;
          const kind = goal.sourceRoundGoalId ? "round" : goal.sourceProgressGoalId ? "progress" : "normal";
          return (
            <article className={`panel goal-board-card goal-kind-${kind}`} key={goal.id}>
              <button aria-busy={openingGoalId === goal.id} className="goal-card-main" disabled={openingGoalId !== null} onClick={() => void openGoal(goal)} type="button">
                {openingGoalId === goal.id ? <span className="goal-card-loading"><LoaderCircle aria-hidden="true" className="spin" size={19} />読み込み中…</span> : <>
                  <span><strong>{goal.title}</strong>{kind !== "normal" ? <small>{kind === "round" ? "数量目標" : "進捗管理"}</small> : null}</span>
                  {goal.description ? <p>{goal.description}</p> : null}
                  {scope === "crew" ? <small>作成者: {goal.owner.displayName ?? goal.owner.username}</small> : null}
                  {kind === "normal" && goal.totalSubTaskCount > 0 ? <small className={goal.completedSubTaskCount === goal.totalSubTaskCount ? "goal-subtask-summary done" : "goal-subtask-summary"}><CheckSquare aria-hidden="true" size={15} />{goal.completedSubTaskCount}/{goal.totalSubTaskCount}</small> : null}
                </>}
              </button>
              {ownGoal || scope === "crew" ? (
                <div className="goal-card-actions">
                  <select aria-label={`${goal.title}の状態`} onChange={(event) => void changeStatus(goal, event.target.value as GoalBoardState)} value={goal.boardStatus}>
                    {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  {!goal.sourceRoundGoalId && !goal.sourceProgressGoalId ? <details className="card-menu"><summary aria-label={`${goal.title}の操作`}><MoreVertical size={18} /></summary><div>
                    <button onClick={() => navigate(`/goal-editor/${goal.id}`)} type="button">編集</button>
                    {ownGoal ? <button className="danger-text" onClick={() => void removeGoal(goal)} type="button">削除</button> : null}
                  </div></details> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <button aria-label="目標を作成" className="floating-action" onClick={() => void openCreate()} type="button"><Plus size={23} /></button>

      {createOpen ? <div className="modal-backdrop" onMouseDown={() => setCreateOpen(false)}><form aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={createGoal} role="dialog">
        <div className="section-heading"><h2>目標を作成</h2><button aria-label="閉じる" className="icon-button" onClick={() => setCreateOpen(false)} type="button"><X size={18} /></button></div>
        <label>タイトル<input autoFocus onChange={(event) => setNewTitle(event.target.value)} required value={newTitle} /></label>
        <label>概要<textarea onChange={(event) => setNewDescription(event.target.value)} rows={4} value={newDescription} /></label>
        <fieldset className="goal-subtask-editor"><legend>サブタスク（任意）</legend>
          {newSubTasks.map((task, index) => <div className="goal-subtask-draft" key={`${task.kind}-${index}`}>
            {task.kind === "standard" ? <CheckSquare aria-label="通常サブタスク" size={17} /> : task.kind === "round" ? <Hash aria-label="数量目標" size={17} /> : <Milestone aria-label="進捗目標" size={17} />}
            <span>{task.kind === "standard" ? task.title : task.kind === "round" ? roundCandidates.find((goal) => goal.id === task.sourceRoundGoalId)?.title : progressCandidates.find((goal) => goal.id === task.sourceProgressGoalId)?.targetName}</span>
            <button aria-label="削除" className="icon-button" onClick={() => setNewSubTasks((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><X size={16} /></button>
          </div>)}
          <div className="inline-form"><label className="sr-only" htmlFor="create-standard-subtask">通常サブタスク</label><input id="create-standard-subtask" maxLength={100} onChange={(event) => setNewSubTask(event.target.value)} placeholder="作業を追加" value={newSubTask} /><button className="secondary-button" disabled={!newSubTask.trim() || newSubTasks.length >= 50} onClick={() => { setNewSubTasks((current) => [...current, { kind: "standard", title: newSubTask.trim() }]); setNewSubTask(""); }} type="button">追加</button></div>
          <label>数量目標<select onChange={(event) => { if (event.target.value) setNewSubTasks((current) => [...current, { kind: "round", sourceRoundGoalId: event.target.value }]); event.target.value = ""; }} value=""><option value="">選択してください</option>{roundCandidates.filter((candidate) => !newSubTasks.some((task) => task.kind === "round" && task.sourceRoundGoalId === candidate.id)).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></label>
          <label>進捗目標<select onChange={(event) => { if (event.target.value) setNewSubTasks((current) => [...current, { kind: "progress", sourceProgressGoalId: event.target.value }]); event.target.value = ""; }} value=""><option value="">選択してください</option>{progressCandidates.filter((candidate) => !newSubTasks.some((task) => task.kind === "progress" && task.sourceProgressGoalId === candidate.id)).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.targetName}</option>)}</select></label>
        </fieldset>
        <p className="form-hint">個人目標の「未設定」に追加されます。</p>
        <div className="dialog-actions"><button className="secondary-button" onClick={() => setCreateOpen(false)} type="button">キャンセル</button><button className="primary-button" type="submit">作成</button></div>
      </form></div> : null}

      {filterOpen ? <div className="modal-backdrop" onMouseDown={() => setFilterOpen(false)}><section aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="section-heading"><h2>絞り込み</h2><button aria-label="閉じる" className="icon-button" onClick={() => setFilterOpen(false)} type="button"><X size={18} /></button></div>
        <label>キーワード<input onChange={(event) => setKeyword(event.target.value)} value={keyword} /></label>
        <label>目標の種類<select onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)} value={sourceFilter}><option value="all">すべて</option><option value="normal">通常目標</option><option value="round">数量目標</option><option value="progress">進捗管理</option></select></label>
        <div className="dialog-actions"><button className="secondary-button" onClick={() => { setKeyword(""); setSourceFilter("all"); }} type="button">解除</button><button className="primary-button" onClick={() => setFilterOpen(false)} type="button">適用</button></div>
      </section></div> : null}

      {editingRoundGoal ? <div className="modal-backdrop" onMouseDown={() => savingRoundCount ? undefined : setEditingRoundGoal(null)}><section aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="section-heading"><div><h2>{editingRoundGoal.title}</h2><p>目標数 {editingRoundGoal.targetCount.toLocaleString()}</p></div><button aria-label="閉じる" className="icon-button" disabled={savingRoundCount} onClick={() => setEditingRoundGoal(null)} type="button"><X size={18} /></button></div>
        <label>現在数<input autoFocus disabled={savingRoundCount} inputMode="numeric" min={0} onChange={(event) => setRoundCurrentCount(event.target.value)} pattern="[0-9]*" type="number" value={roundCurrentCount} /></label>
        <div className="quick-number-actions"><button disabled={savingRoundCount} onClick={() => setRoundCurrentCount("0")} type="button">0</button><button disabled={savingRoundCount} onClick={() => setRoundCurrentCount(String(editingRoundGoal.targetCount))} type="button">目標数</button></div>
        <div className="dialog-actions"><button className="secondary-button" disabled={savingRoundCount} onClick={() => setEditingRoundGoal(null)} type="button">キャンセル</button><button className="primary-button" disabled={savingRoundCount} onClick={() => void updateRoundCount()} type="button">{savingRoundCount ? <><LoaderCircle aria-hidden="true" className="spin" size={17} />反映中…</> : "反映"}</button></div>
      </section></div> : null}

      {selected ? <div className="progress-modal-backdrop goal-detail-backdrop" onMouseDown={() => setSelected(null)}><section aria-modal="true" className="progress-modal goal-detail-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <header className="progress-modal-header"><div><h2>{selected.title}</h2><p>{selected.visibility === "crew" ? "団内目標" : "個人目標"}</p></div><button aria-label="閉じる" className="icon-button" onClick={() => setSelected(null)} type="button"><X size={18} /></button></header>
        <div className="progress-modal-body">
          <div className="segmented"><button className={detailTab === "overview" ? "active" : ""} onClick={() => setDetailTab("overview")} type="button">概要</button><button className={detailTab === "tasks" ? "active" : ""} onClick={() => setDetailTab("tasks")} type="button">サブタスク</button></div>
          {detailTab === "overview" ? <div className="goal-detail-content">
            {selected.description ? <p>{selected.description}</p> : <p className="muted-text">概要はありません。</p>}
            {selected.memo ? <p>{selected.memo}</p> : null}
          </div> : <div className="goal-subtask-list">
            {selected.subTasks.length === 0 ? <div className="empty-state"><p>サブタスクはありません。</p></div> : selected.subTasks.map((task) => <div className={`goal-subtask-card kind-${task.kind}${task.effectiveIsDone ? " done" : ""}`} key={task.id}>
              <div className="goal-subtask-main"><input aria-label={`${task.title ?? "サブタスク"}の完了状態`} checked={task.effectiveIsDone} onChange={() => void toggleSubTask(task)} type="checkbox" />{task.kind === "standard" ? <span>{task.title}</span> : <button className="text-button" onClick={() => void openLinkedSubTask(task)} type="button">{task.title}</button>}</div>
              {task.kind === "round" && task.sourceRoundGoal ? <small>{task.sourceRoundGoal.currentCount}/{task.sourceRoundGoal.targetCount}</small> : null}
              {task.kind === "progress" && task.sourceProgressGoal ? <small>{task.sourceProgressGoal.progressRate}%</small> : null}
              {task.completionOverride !== null ? <button aria-label="自動判定に戻す" className="icon-button" onClick={() => void resetSubTaskAutomatic(task.id, task.updatedAt)} title="自動判定に戻す" type="button"><RotateCcw size={16} /></button> : null}
            </div>)}
          </div>}
        </div>
        <footer className="progress-modal-footer goal-detail-actions">{selected.ownerId === user?.id ? <button className="secondary-button danger-text" onClick={() => void removeGoal(selected)} type="button">削除</button> : null}<span className="progress-modal-footer-spacer" />{selected.ownerId === user?.id && selected.visibility === "personal" ? <button className="secondary-button" onClick={() => void publish(selected)} type="button">団内へ公開</button> : null}<button className="primary-button" onClick={() => navigate(`/goal-editor/${selected.id}`)} type="button">編集</button></footer>
      </section></div> : null}
    </div>
  );
}
