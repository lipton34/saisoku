import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { GoalDetail, goalPayload, type GoalFormState } from "../components/goals/GoalDetail";
import { BuildMasterCatalogProvider } from "../lib/BuildMasterCatalogContext";
import { api, type BuildPost, type MaterialGoal, type SharedGoal } from "../lib/api";
import { useBuildMasterCatalog } from "../lib/useBuildMasterCatalog";

export function GoalDetailPage() {
  const { catalog } = useBuildMasterCatalog(false);

  return (
    <BuildMasterCatalogProvider catalog={catalog}>
      <GoalDetailPageContent />
    </BuildMasterCatalogProvider>
  );
}

function GoalDetailPageContent() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goal, setGoal] = useState<SharedGoal | null>(null);
  const [materialGoals, setMaterialGoals] = useState<MaterialGoal[]>([]);
  const [buildPosts, setBuildPosts] = useState<BuildPost[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshGoal(id = goalId) {
    if (!id) return;
    const data = await api.sharedGoal(id);
    setGoal(data.goal);
  }

  useEffect(() => {
    if (!goalId) {
      setError("目標IDが指定されていません。");
      return;
    }

    setError("");
    void refreshGoal(goalId).catch((caught) => setError(caught instanceof Error ? caught.message : "目標の取得に失敗しました"));
    void api.materialGoals().then((data) => setMaterialGoals(data.goals)).catch(() => setMaterialGoals([]));
    void api.buildPosts().then((data) => setBuildPosts(data.posts)).catch(() => setBuildPosts([]));
  }, [goalId]);

  async function handleUpdateGoal(form: GoalFormState) {
    if (!goal) return false;
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const data = await api.updateSharedGoal(goal.id, goalPayload(form));
      setGoal(data.goal);
      setNotice("目標を保存しました。");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の保存に失敗しました");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteGoal(target: SharedGoal) {
    if (!window.confirm(`「${target.title}」を削除しますか？`)) {
      return;
    }

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await api.deleteSharedGoal(target.id);
      navigate("/goals");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack goal-detail-page">
      <div className="goal-detail-topbar">
        <Link className="secondary-button" to="/goals">
          <ArrowLeft size={17} />
          目標ボードへ戻る
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      <section className="panel goal-detail-page-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Goal Detail</p>
            <h2>目標詳細</h2>
          </div>
        </div>

        {goal ? (
          <GoalDetail
            buildPosts={buildPosts}
            canUpdate={goal.ownerId === user?.id}
            goal={goal}
            isSubmitting={isSubmitting}
            materialGoals={materialGoals}
            onDelete={deleteGoal}
            onRefresh={refreshGoal}
            onUpdate={handleUpdateGoal}
          />
        ) : (
          <div className="empty-state">目標を読み込んでいます。</div>
        )}
      </section>
    </div>
  );
}
