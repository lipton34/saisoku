import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function RoundGoalEditorPage() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [targetCount, setTargetCount] = useState("1");
  const [currentCount, setCurrentCount] = useState("0");
  const [note, setNote] = useState("");
  const [showOnBoard, setShowOnBoard] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goalId) return;
    api.roundGoals().then(({ goals }) => {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) {
        setError("周回目標が見つかりません");
        return;
      }
      setTitle(goal.title);
      setTargetCount(String(goal.targetCount));
      setCurrentCount(String(goal.currentCount));
      setNote(goal.note ?? "");
      setShowOnBoard(Boolean(goal.boardGoal));
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "読み込めませんでした"));
  }, [goalId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const value = {
        title,
        targetCount: Number(targetCount),
        currentCount: Number(currentCount),
        note,
        showOnBoard
      };
      if (goalId) await api.updateRoundGoal(goalId, value);
      else await api.createRoundGoal(value);
      navigate("/round-goals");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack compact-page">
      <section className="page-heading"><h1>{goalId ? "周回目標を編集" : "周回目標を作成"}</h1></section>
      <form className="panel simple-form" onSubmit={submit}>
        <label>タイトル<input maxLength={100} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
        <div className="two-column-form">
          <label>目標数<input inputMode="numeric" min={1} onChange={(event) => setTargetCount(event.target.value)} required type="number" value={targetCount} /></label>
          <label>現在数<input inputMode="numeric" min={0} onChange={(event) => setCurrentCount(event.target.value)} required type="number" value={currentCount} /></label>
        </div>
        <label>メモ<textarea onChange={(event) => setNote(event.target.value)} rows={5} value={note} /></label>
        {!goalId ? <label className="checkbox-field"><input checked={showOnBoard} onChange={(event) => setShowOnBoard(event.target.checked)} type="checkbox" />目標ボードに表示</label> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="form-actions">
          <button className="secondary-button" onClick={() => navigate("/round-goals")} type="button">キャンセル</button>
          <button className="primary-button" disabled={saving} type="submit">{saving ? "保存中…" : "保存"}</button>
        </div>
      </form>
    </div>
  );
}
