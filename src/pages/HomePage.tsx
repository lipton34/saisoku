import { BookOpen, Boxes, CalendarCheck2, ChevronRight, Flame, ListChecks, Map, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TaskList } from "../components/TaskList";
import { api, type Task } from "../lib/api";
import { getTaskStats } from "../lib/taskUtils";

const toolCards = [
  { title: "日課管理", description: "島HARD、マグナ、砂箱など毎日見る項目", icon: CalendarCheck2, href: "/tasks" },
  { title: "素材メモ", description: "必要数と所持数を追う素材集めの進捗表", icon: Boxes, href: "/materials" },
  { title: "編成メモ", description: "プリセットから高難易度・周回向け編成を投稿", icon: Swords, href: "/builds" },
  { title: "イベント進捗", description: "箱数、貢献度、交換残りの確認", icon: Flame, href: "/tools/events" },
  { title: "マルチ救援メモ", description: "参加条件や自発素材の備忘録", icon: BookOpen, href: "/tools/raids" },
  { title: "ロードマップ", description: "これから作る機能と実装順の確認", icon: Map, href: "/roadmap" }
];

export function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      const data = await api.tasks();
      setTasks(data.tasks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "タスクの取得に失敗しました");
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function completeTask(task: Task) {
    const data = await api.completeTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  async function reopenTask(task: Task) {
    const data = await api.reopenTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  const stats = getTaskStats(tasks);
  const priorityTasks = tasks.filter((task) => !task.isCompleted).slice(0, 5);

  return (
    <div className="page-stack">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Today&apos;s Rotation</p>
          <h2>今日やることを、迷わず回収。</h2>
          <p>日課・週課を見ながら、次に足す攻略ツールへすぐ移動できます。</p>
        </div>
        <Link className="primary-button hero-action" to="/tasks">
          <ListChecks size={18} />
          タスクを登録
        </Link>
      </section>

      <section className="stat-grid">
        <div className="stat-tile">
          <span>未完了</span>
          <strong>{stats.open}</strong>
        </div>
        <div className="stat-tile">
          <span>日課残り</span>
          <strong>{stats.dailyOpen}</strong>
        </div>
        <div className="stat-tile">
          <span>週課残り</span>
          <strong>{stats.weeklyOpen}</strong>
        </div>
        <div className="stat-tile">
          <span>完了済み</span>
          <strong>{stats.completed}</strong>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="content-grid">
        <div className="panel wide">
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
              <p className="eyebrow">Recent</p>
              <h2>最近の完了</h2>
            </div>
          </div>
          <div className="mini-list">
            {stats.recentCompleted.length === 0 ? (
              <div className="empty-state">完了履歴はまだありません。</div>
            ) : (
              stats.recentCompleted.map((task) => (
                <div className="mini-item" key={task.id}>
                  <span>{task.title}</span>
                  <small>{task.category}</small>
                </div>
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
