import { GripVertical, MoreVertical, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type RoundGoal } from "../lib/api";

export function RoundGoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<RoundGoal[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<RoundGoal | null>(null);
  const [currentCount, setCurrentCount] = useState("");

  async function load() {
    try {
      const data = await api.roundGoals();
      setGoals(data.goals);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "周回目標を読み込めませんでした");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateCount(value: number) {
    if (!editing) return;
    try {
      await api.updateRoundGoal(editing.id, { currentCount: Math.max(0, value) });
      setEditing(null);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "現在数を更新できませんでした");
    }
  }

  async function move(goalId: string, direction: -1 | 1) {
    const index = goals.findIndex((goal) => goal.id === goalId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= goals.length) return;
    const reordered = [...goals];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setGoals(reordered);
    try {
      await api.reorderRoundGoals(reordered.map((goal) => goal.id));
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "並び順を更新できませんでした");
      await load();
    }
  }

  async function remove(goal: RoundGoal) {
    if (!window.confirm("この周回目標を削除します。目標ボードとの連携も削除されます")) return;
    try {
      await api.deleteRoundGoal(goal.id);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "削除できませんでした");
    }
  }

  return (
    <div className="page-stack compact-page">
      <section className="page-heading">
        <p className="eyebrow">Round goals</p>
        <h1>周回目標</h1>
      </section>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {goals.length === 0 ? (
        <section className="panel empty-state"><p>周回目標はまだありません。</p></section>
      ) : (
        <section className="simple-card-list">
          {goals.map((goal, index) => {
            const rate = Math.min(100, Math.round((goal.currentCount / Math.max(goal.targetCount, 1)) * 100));
            return (
              <article className="panel round-goal-card" key={goal.id}>
                <div className="card-reorder">
                  <button aria-label={`${goal.title}を上へ移動`} disabled={index === 0} onClick={() => void move(goal.id, -1)} title="上へ移動" type="button">↑</button>
                  <GripVertical aria-hidden="true" size={18} />
                  <button aria-label={`${goal.title}を下へ移動`} disabled={index === goals.length - 1} onClick={() => void move(goal.id, 1)} title="下へ移動" type="button">↓</button>
                </div>
                <button
                  className="round-goal-main"
                  onClick={() => {
                    setEditing(goal);
                    setCurrentCount(String(goal.currentCount));
                  }}
                  type="button"
                >
                  <span className="round-goal-title"><strong>{goal.title}</strong>{goal.boardGoal ? <small>目標ボード連携中</small> : null}</span>
                  <span className="round-goal-count">{goal.currentCount.toLocaleString()} / {goal.targetCount.toLocaleString()}</span>
                  <span className="progress-track"><span style={{ width: `${rate}%` }} /></span>
                  {goal.note ? <small className="round-goal-note">{goal.note}</small> : null}
                </button>
                <details className="card-menu">
                  <summary aria-label={`${goal.title}の操作`}><MoreVertical size={18} /></summary>
                  <div>
                    <button onClick={() => navigate(`/round-goals/${goal.id}/edit`)} type="button">編集</button>
                    <button className="danger-text" onClick={() => void remove(goal)} type="button">削除</button>
                  </div>
                </details>
              </article>
            );
          })}
        </section>
      )}
      <Link aria-label="周回目標を作成" className="floating-action" to="/round-goals/new"><Plus size={23} /></Link>

      {editing ? (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <section aria-modal="true" className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="section-heading"><div><h2>{editing.title}</h2><p>目標数 {editing.targetCount.toLocaleString()}</p></div></div>
            <label>現在数
              <input autoFocus inputMode="numeric" min={0} onChange={(event) => setCurrentCount(event.target.value)} pattern="[0-9]*" type="number" value={currentCount} />
            </label>
            <div className="quick-number-actions">
              <button onClick={() => setCurrentCount("0")} type="button">0</button>
              <button onClick={() => setCurrentCount(String(editing.targetCount))} type="button">目標数</button>
            </div>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setEditing(null)} type="button">キャンセル</button>
              <button className="primary-button" onClick={() => void updateCount(Number(currentCount) || 0)} type="button">反映</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
