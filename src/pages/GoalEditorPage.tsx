import { ArrowDown, ArrowUp, CheckSquare, Hash, Milestone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Goal, type ProgressGoal, type RoundGoal } from "../lib/api";

export function GoalEditorPage() {
  const { goalId = "" } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memo, setMemo] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [roundGoals, setRoundGoals] = useState<RoundGoal[]>([]);
  const [progressGoals, setProgressGoals] = useState<ProgressGoal[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.goal(goalId), api.roundGoals(), api.progressGoals()]).then(([goalData, roundData, progressData]) => {
      setGoal(goalData.goal);
      setTitle(goalData.goal.title);
      setDescription(goalData.goal.description ?? "");
      setMemo(goalData.goal.memo ?? "");
      setRoundGoals(roundData.goals);
      setProgressGoals(progressData.goals);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "目標を読み込めませんでした"));
  }, [goalId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!goal || saving) return;
    setSaving(true);
    try {
      const response = await api.updateGoal(goalId, { title, description, memo, expectedUpdatedAt: goal.updatedAt });
      setGoal(response.goal);
      navigate("/");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  async function addStandard() {
    if (!goal || !newTitle.trim()) return;
    try {
      const response = await api.createGoalSubTask(goal.id, { kind: "standard", title: newTitle.trim(), expectedGoalUpdatedAt: goal.updatedAt });
      setGoal(response.goal);
      setNewTitle("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "サブタスクを追加できませんでした");
    }
  }

  async function addLink(kind: "round" | "progress", sourceId: string) {
    if (!goal || !sourceId) return;
    try {
      const response = kind === "round"
        ? await api.createGoalSubTask(goal.id, { kind, sourceRoundGoalId: sourceId, expectedGoalUpdatedAt: goal.updatedAt })
        : await api.createGoalSubTask(goal.id, { kind, sourceProgressGoalId: sourceId, expectedGoalUpdatedAt: goal.updatedAt });
      setGoal(response.goal);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "リンクを追加できませんでした");
    }
  }

  async function renameSubTask(id: string, value: string, updatedAt: string) {
    if (!goal || !value.trim()) return;
    try {
      const response = await api.updateGoalSubTask(goal.id, id, { title: value.trim(), expectedUpdatedAt: updatedAt });
      setGoal(response.goal);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "名称を変更できませんでした");
    }
  }

  async function removeSubTask(id: string) {
    if (!goal || !window.confirm("このサブタスクを削除しますか？")) return;
    try {
      const response = await api.deleteGoalSubTask(goal.id, id, goal.updatedAt);
      setGoal(response.goal);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "サブタスクを削除できませんでした");
    }
  }

  async function moveSubTask(index: number, offset: -1 | 1) {
    if (!goal) return;
    const next = [...goal.subTasks];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      const response = await api.reorderGoalSubTasks(goal.id, next.map((item) => item.id), goal.updatedAt);
      setGoal(response.goal);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "並び順を変更できませんでした");
    }
  }

  if (!goal) {
    return <div className="page-stack compact-page">{error ? <p className="form-error" role="alert">{error}</p> : <p>読み込み中…</p>}</div>;
  }

  const canLink = goal.visibility === "personal";
  const linkedRoundIds = new Set(goal.subTasks.flatMap((item) => item.sourceRoundGoalId ? [item.sourceRoundGoalId] : []));
  const linkedProgressIds = new Set(goal.subTasks.flatMap((item) => item.sourceProgressGoalId ? [item.sourceProgressGoalId] : []));

  return <div className="page-stack compact-page">
    <section className="page-heading"><h1>目標を編集</h1></section>
    <form className="panel simple-form" onSubmit={submit}>
      <label>タイトル<input maxLength={100} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label>概要<textarea onChange={(event) => setDescription(event.target.value)} rows={5} value={description} /></label>
      <label>メモ<textarea onChange={(event) => setMemo(event.target.value)} rows={5} value={memo} /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="form-actions"><button className="secondary-button" onClick={() => navigate("/")} type="button">キャンセル</button><button className="primary-button" disabled={saving} type="submit">{saving ? "保存中…" : "保存"}</button></div>
    </form>

    <section className="panel goal-subtask-editor">
      <div className="section-heading"><div><h2>サブタスク</h2><p>{goal.completedSubTaskCount}/{goal.totalSubTaskCount}</p></div></div>
      {goal.subTasks.length === 0 ? <div className="empty-state"><p>サブタスクはありません。</p></div> : <div className="goal-subtask-list">
        {goal.subTasks.map((item, index) => <div className={`goal-subtask-card kind-${item.kind}${item.effectiveIsDone ? " done" : ""}`} key={item.id}>
          <span className="goal-subtask-kind">{item.kind === "standard" ? <CheckSquare aria-label="通常サブタスク" size={18} /> : item.kind === "round" ? <Hash aria-label="数量目標" size={18} /> : <Milestone aria-label="進捗目標" size={18} />}</span>
          {item.kind === "standard"
            ? <input aria-label="サブタスク名" defaultValue={item.title ?? ""} maxLength={100} onBlur={(event) => { if (event.target.value.trim() !== item.title) void renameSubTask(item.id, event.target.value, item.updatedAt); }} />
            : <span>{item.title}</span>}
          <div className="goal-subtask-row-actions">
            <button aria-label="上へ移動" className="icon-button" disabled={index === 0} onClick={() => void moveSubTask(index, -1)} title="上へ移動" type="button"><ArrowUp size={16} /></button>
            <button aria-label="下へ移動" className="icon-button" disabled={index === goal.subTasks.length - 1} onClick={() => void moveSubTask(index, 1)} title="下へ移動" type="button"><ArrowDown size={16} /></button>
            <button aria-label="削除" className="icon-button danger" onClick={() => void removeSubTask(item.id)} title="削除" type="button"><Trash2 size={16} /></button>
          </div>
        </div>)}
      </div>}
      <div className="inline-form"><label className="sr-only" htmlFor="new-goal-subtask">通常サブタスク</label><input id="new-goal-subtask" maxLength={100} onChange={(event) => setNewTitle(event.target.value)} placeholder="作業を追加" value={newTitle} /><button className="secondary-button" disabled={!newTitle.trim() || goal.totalSubTaskCount >= 50} onClick={() => void addStandard()} type="button">追加</button></div>
      {canLink ? <>
        <label>数量目標<select disabled={goal.totalSubTaskCount >= 50} onChange={(event) => { void addLink("round", event.target.value); event.target.value = ""; }} value=""><option value="">選択してください</option>{roundGoals.filter((item) => !linkedRoundIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>進捗目標<select disabled={goal.totalSubTaskCount >= 50} onChange={(event) => { void addLink("progress", event.target.value); event.target.value = ""; }} value=""><option value="">選択してください</option>{progressGoals.filter((item) => !linkedProgressIds.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.targetName}</option>)}</select></label>
      </> : null}
    </section>
  </div>;
}
