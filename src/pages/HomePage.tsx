import { Filter, MoreVertical, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api, type Goal, type GoalBoardState } from "../lib/api";

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
  const [detailTab, setDetailTab] = useState<"overview" | "tasks">("overview");
  const [filterOpen, setFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "normal" | "round" | "progress">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
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

  function openGoal(goal: Goal) {
    if (goal.sourceRoundGoalId) {
      navigate("/round-goals");
      return;
    }
    if (goal.sourceProgressGoalId) {
      navigate("/progress-goals");
      return;
    }
    setDetailTab("overview");
    setSelected(goal);
  }

  async function changeStatus(goal: Goal, boardStatus: GoalBoardState) {
    try {
      await api.updateGoal(goal.id, { boardStatus });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "状態を変更できませんでした");
    }
  }

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.createGoal({ title: newTitle, description: newDescription });
      setNewTitle("");
      setNewDescription("");
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
      await api.updateGoal(goal.id, { visibility: "crew", confirmCrewPublish: true });
      setSelected(null);
      await load();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "団内へ公開できませんでした");
    }
  }

  async function addSubTask(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !newSubTask.trim()) return;
    try {
      await api.createGoalSubTask(selected.id, newSubTask);
      setNewSubTask("");
      await load();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "サブタスクを追加できませんでした");
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
              <button className="goal-card-main" onClick={() => openGoal(goal)} type="button">
                <span><strong>{goal.title}</strong>{kind !== "normal" ? <small>{kind === "round" ? "周回目標" : "進捗管理"}</small> : null}</span>
                {goal.description ? <p>{goal.description}</p> : null}
                {scope === "crew" ? <small>作成者: {goal.owner.displayName ?? goal.owner.username}</small> : null}
              </button>
              {ownGoal ? (
                <div className="goal-card-actions">
                  <select aria-label={`${goal.title}の状態`} onChange={(event) => void changeStatus(goal, event.target.value as GoalBoardState)} value={goal.boardStatus}>
                    {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <details className="card-menu"><summary aria-label={`${goal.title}の操作`}><MoreVertical size={18} /></summary><div>
                    {!goal.sourceRoundGoalId && !goal.sourceProgressGoalId ? <button onClick={() => navigate(`/goal-editor/${goal.id}`)} type="button">編集</button> : null}
                    <button className="danger-text" onClick={() => void removeGoal(goal)} type="button">{goal.sourceRoundGoalId || goal.sourceProgressGoalId ? "連携解除" : "削除"}</button>
                  </div></details>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <button aria-label="目標を作成" className="floating-action" onClick={() => setCreateOpen(true)} type="button"><Plus size={23} /></button>

      {createOpen ? <div className="modal-backdrop" onMouseDown={() => setCreateOpen(false)}><form aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={createGoal} role="dialog">
        <div className="section-heading"><h2>目標を作成</h2><button aria-label="閉じる" className="icon-button" onClick={() => setCreateOpen(false)} type="button"><X size={18} /></button></div>
        <label>タイトル<input autoFocus onChange={(event) => setNewTitle(event.target.value)} required value={newTitle} /></label>
        <label>概要<textarea onChange={(event) => setNewDescription(event.target.value)} rows={4} value={newDescription} /></label>
        <p className="form-hint">個人目標の「未設定」に追加されます。</p>
        <div className="dialog-actions"><button className="secondary-button" onClick={() => setCreateOpen(false)} type="button">キャンセル</button><button className="primary-button" type="submit">作成</button></div>
      </form></div> : null}

      {filterOpen ? <div className="modal-backdrop" onMouseDown={() => setFilterOpen(false)}><section aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="section-heading"><h2>絞り込み</h2><button aria-label="閉じる" className="icon-button" onClick={() => setFilterOpen(false)} type="button"><X size={18} /></button></div>
        <label>キーワード<input onChange={(event) => setKeyword(event.target.value)} value={keyword} /></label>
        <label>目標の種類<select onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)} value={sourceFilter}><option value="all">すべて</option><option value="normal">通常目標</option><option value="round">周回目標</option><option value="progress">進捗管理</option></select></label>
        <div className="dialog-actions"><button className="secondary-button" onClick={() => { setKeyword(""); setSourceFilter("all"); }} type="button">解除</button><button className="primary-button" onClick={() => setFilterOpen(false)} type="button">適用</button></div>
      </section></div> : null}

      {selected ? <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><section aria-modal="true" className="panel goal-detail-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="section-heading"><div><h2>{selected.title}</h2><p>{selected.visibility === "crew" ? "団内目標" : "個人目標"}</p></div><button aria-label="閉じる" className="icon-button" onClick={() => setSelected(null)} type="button"><X size={18} /></button></div>
        <div className="segmented"><button className={detailTab === "overview" ? "active" : ""} onClick={() => setDetailTab("overview")} type="button">概要・関連情報</button><button className={detailTab === "tasks" ? "active" : ""} onClick={() => setDetailTab("tasks")} type="button">サブタスク</button></div>
        {detailTab === "overview" ? <div className="goal-detail-content">
          {selected.description ? <p>{selected.description}</p> : <p className="muted-text">概要はありません。</p>}
          {selected.memo ? <p>{selected.memo}</p> : null}
          {selected.requiredItems.length || selected.raidTargets.length ? <div><h3>関連情報</h3>{selected.requiredItems.map((item) => <p key={item.id}>{item.name} {item.currentCount} / {item.requiredCount}</p>)}{selected.raidTargets.map((target) => <p key={target.id}>{target.questName} {target.currentCount} / {target.targetCount}</p>)}</div> : null}
        </div> : <div className="goal-subtask-list">
          {selected.subTasks.map((task) => <label className="checkbox-field" key={task.id}><input checked={task.isDone} disabled={selected.ownerId !== user?.id} onChange={() => void api.updateGoalSubTaskNew(selected.id, task.id, { isDone: !task.isDone }).then(() => load())} type="checkbox" />{task.title}</label>)}
          {selected.ownerId === user?.id ? <form className="inline-form" onSubmit={addSubTask}><label className="sr-only" htmlFor="new-sub-task">サブタスク</label><input id="new-sub-task" onChange={(event) => setNewSubTask(event.target.value)} placeholder="サブタスクを追加" value={newSubTask} /><button className="secondary-button" type="submit">追加</button></form> : null}
        </div>}
        {selected.ownerId === user?.id ? <div className="dialog-actions">{selected.visibility === "personal" ? <button className="secondary-button" onClick={() => void publish(selected)} type="button">団内へ公開</button> : null}<button className="primary-button" onClick={() => navigate(`/goal-editor/${selected.id}`)} type="button">編集</button></div> : null}
      </section></div> : null}
    </div>
  );
}
