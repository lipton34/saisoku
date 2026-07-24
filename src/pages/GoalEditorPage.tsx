import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function GoalEditorPage() {
  const { goalId = "" } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.goal(goalId).then(({ goal }) => {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setMemo(goal.memo ?? "");
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "目標を読み込めませんでした"));
  }, [goalId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.updateGoal(goalId, { title, description, memo });
      navigate("/");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存できませんでした");
    }
  }

  return <div className="page-stack compact-page"><section className="page-heading"><h1>目標を編集</h1></section><form className="panel simple-form" onSubmit={submit}>
    <label>タイトル<input onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
    <label>概要<textarea onChange={(event) => setDescription(event.target.value)} rows={5} value={description} /></label>
    <label>メモ<textarea onChange={(event) => setMemo(event.target.value)} rows={5} value={memo} /></label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="form-actions"><button className="secondary-button" onClick={() => navigate("/")} type="button">キャンセル</button><button className="primary-button" type="submit">保存</button></div>
  </form></div>;
}
