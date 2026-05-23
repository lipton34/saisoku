import { Boxes, CalendarCheck2, ChevronRight, FilePlus2, Flag, Flame, ListChecks, Map, Newspaper, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TaskList } from "../components/TaskList";
import { api, type SharedGoal, type Task } from "../lib/api";

const toolCards = [
  { title: "タスク", description: "日課や週課を登録し、完了・未完了を切り替えて管理", icon: CalendarCheck2, href: "/tasks" },
  { title: "素材メモ", description: "素材ごとの必要数・所持数・優先度を記録して進捗確認", icon: Boxes, href: "/materials" },
  { title: "目標共有", description: "団員の周回・編成目標を共有し、提案や準備状況を確認", icon: Flag, href: "/goals" },
  { title: "古戦場計算", description: "日別の目標貢献度からHELL討伐数や必要時間を計算", icon: Flame, href: "/guild-war-goals" },
  { title: "公式NEWS", description: "取り込んだ公式お知らせの表示、表示切替、メモ登録", icon: Newspaper, href: "/official-news" },
  { title: "イベント予定", description: "公式NEWS由来のイベント日程と自分用メモを確認", icon: Map, href: "/event-schedule" },
  { title: "編成一覧・検索", description: "投稿済みの高難易度・周回向け編成を検索して詳細確認", icon: Swords, href: "/builds/search" },
  { title: "編成投稿", description: "プリセットや候補リストを使って編成メモを登録", icon: FilePlus2, href: "/builds/post" },
  { title: "ロードマップ", description: "実装済み・開発中・今後追加予定の機能を確認", icon: Map, href: "/roadmap" }
];

export function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      const data = await api.tasks();
      setTasks(data.tasks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "タスクの取得に失敗しました");
    }
  }

  async function loadGoals() {
    try {
      const data = await api.sharedGoals();
      setGoals(data.goals);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "団内目標の取得に失敗しました");
    }
  }

  useEffect(() => {
    void loadTasks();
    void loadGoals();
  }, []);

  async function completeTask(task: Task) {
    const data = await api.completeTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  async function reopenTask(task: Task) {
    const data = await api.reopenTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  const priorityTasks = tasks.filter((task) => !task.isCompleted).slice(0, 5);
  const latestGoals = goals.slice(0, 5);

  return (
    <div className="page-stack">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Today&apos;s Rotation</p>
          <h2>今日やることを、迷わず回収。</h2>
          <p>日課・週課を見ながら、次に足す攻略ツールへすぐ移動できます。</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button hero-action" to="/tasks">
            <ListChecks size={18} />
            タスクを登録
          </Link>
          <Link className="secondary-button hero-action" to="/goals?tab=new">
            <Flag size={18} />
            団内目標を登録
          </Link>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open Tasks</p>
              <h2>優先タスク</h2>
            </div>
            <Link className="text-link" to="/tasks">
              すべて見る
              <ChevronRight size={16} />
            </Link>
          </div>
          <TaskList compact onComplete={completeTask} onReopen={reopenTask} tasks={priorityTasks} />
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Crew Goals</p>
              <h2>団内目標</h2>
            </div>
            <Link className="text-link" to="/goals">
              すべて見る
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mini-list goal-mini-list">
            {latestGoals.length === 0 ? (
              <div className="empty-state">団内目標はまだありません。</div>
            ) : (
              latestGoals.map((goal) => (
                <Link className="mini-item goal-mini-item" key={goal.id} to="/goals">
                  <span>{goal.title}</span>
                  <small>
                    {displayGoalOwner(goal)} / {goal.category} / {goalProgress(goal)}
                  </small>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="tool-grid" aria-label="機能一覧">
        {toolCards.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link className="tool-card" key={tool.title} to={tool.href}>
              <Icon size={22} />
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
              <ChevronRight size={18} />
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function displayGoalOwner(goal: SharedGoal) {
  return goal.owner.displayName || goal.owner.username || "不明";
}

function goalProgress(goal: SharedGoal) {
  if (goal.category === "周回" && goal.targetValue !== null && goal.currentValue !== null) {
    return `${goal.currentValue}/${goal.targetValue}`;
  }

  if (goal.category === "編成") {
    const details = goal.details ?? {};
    const missingCount = [...(details.characters ?? []), ...(details.weapons ?? []), ...(details.summons ?? [])].filter(
      (part) => !part.owned
    ).length;
    return missingCount > 0 ? `未所持 ${missingCount}件` : "準備OK";
  }

  return goal.status;
}
