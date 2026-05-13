import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { TaskList } from "../components/TaskList";
import { api, type RepeatType, type Task } from "../lib/api";

const categories = ["日課", "週課", "イベント", "素材", "マルチ", "その他"];
const taskTemplates = [
  {
    title: "基本日課",
    description: "毎日触りやすい基本セット",
    tasks: ["島HARD Pro", "マグナPro", "アーカルム/砂箱確認", "共闘デイリーミッション"]
  },
  {
    title: "週課チェック",
    description: "週明けに確認したい項目",
    tasks: ["栄誉交換", "週ミッション確認", "武勲交換", "ショップ交換在庫確認"]
  },
  {
    title: "イベント準備",
    description: "開催中イベントの走り出し用",
    tasks: ["デイリーミッション", "戦貨/貢献度確認", "交換アイテム確認", "編成メモ更新"]
  }
];

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("日課");
  const [repeatType, setRepeatType] = useState<RepeatType>("daily");
  const [dueDate, setDueDate] = useState("");
  const [resetHourJst, setResetHourJst] = useState(5);
  const [filter, setFilter] = useState<"open" | "all" | "completed">("open");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [repeatFilter, setRepeatFilter] = useState<RepeatType | "all">("all");
  const [error, setError] = useState("");
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "open" && task.isCompleted) {
        return false;
      }
      if (filter === "completed" && !task.isCompleted) {
        return false;
      }
      if (categoryFilter !== "all" && task.category !== categoryFilter) {
        return false;
      }
      if (repeatFilter !== "all" && task.repeatType !== repeatFilter) {
        return false;
      }
      return true;
    });
  }, [categoryFilter, filter, repeatFilter, tasks]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const data = await api.createTask({
        title,
        description,
        category,
        repeatType,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        resetHourJst
      });
      setTasks((current) => [data.task, ...current]);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "タスクの登録に失敗しました");
    }
  }

  async function completeTask(task: Task) {
    const data = await api.completeTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  async function reopenTask(task: Task) {
    const data = await api.reopenTask(task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
  }

  async function deleteTask(task: Task) {
    await api.deleteTask(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  async function addTemplate(template: (typeof taskTemplates)[number]) {
    setError("");
    setIsAddingTemplate(true);

    try {
      const repeat: RepeatType = template.title === "週課チェック" ? "weekly" : "daily";
      const categoryName = template.title === "イベント準備" ? "イベント" : repeat === "weekly" ? "週課" : "日課";
      const created = await Promise.all(
        template.tasks.map((taskTitle) =>
          api.createTask({
            title: taskTitle,
            description: template.description,
            category: categoryName,
            repeatType: repeat,
            resetHourJst
          })
        )
      );
      setTasks((current) => [...created.map((item) => item.task), ...current]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "テンプレートの追加に失敗しました");
    } finally {
      setIsAddingTemplate(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Task Board</p>
        <h2>タスク登録・確認</h2>
        <p>グラブルの日課、週課、イベント準備をユーザーごとに保存します。</p>
      </section>

      <section className="content-grid task-page-grid">
        <form className="panel task-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">New Task</p>
              <h2>登録</h2>
            </div>
          </div>

          <label>
            タスク名
            <input onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>

          <label>
            メモ
            <textarea onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
          </label>

          <div className="form-row">
            <label>
              カテゴリ
              <select onChange={(event) => setCategory(event.target.value)} value={category}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              繰り返し
              <select onChange={(event) => setRepeatType(event.target.value as RepeatType)} value={repeatType}>
                <option value="daily">日課</option>
                <option value="weekly">週課</option>
                <option value="once">単発</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              期限
              <input onChange={(event) => setDueDate(event.target.value)} type="datetime-local" value={dueDate} />
            </label>
            <label>
              JSTリセット時刻
              <input
                max={23}
                min={0}
                onChange={(event) => setResetHourJst(Number(event.target.value))}
                type="number"
                value={resetHourJst}
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit">
            <Plus size={18} />
            タスク追加
          </button>

          <div className="template-block">
            <div>
              <p className="eyebrow">Templates</p>
              <h3>一括追加</h3>
            </div>
            <div className="template-grid">
              {taskTemplates.map((template) => (
                <button
                  className="template-button"
                  disabled={isAddingTemplate}
                  key={template.title}
                  onClick={() => addTemplate(template)}
                  type="button"
                >
                  <strong>{template.title}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">List</p>
              <h2>確認</h2>
            </div>
            <div className="segmented small">
              <button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")} type="button">
                未完了
              </button>
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} type="button">
                全部
              </button>
              <button
                className={filter === "completed" ? "active" : ""}
                onClick={() => setFilter("completed")}
                type="button"
              >
                完了
              </button>
            </div>
          </div>
          <div className="filter-row">
            <label>
              カテゴリ
              <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                <option value="all">すべて</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              繰り返し
              <select onChange={(event) => setRepeatFilter(event.target.value as RepeatType | "all")} value={repeatFilter}>
                <option value="all">すべて</option>
                <option value="daily">日課</option>
                <option value="weekly">週課</option>
                <option value="once">単発</option>
              </select>
            </label>
          </div>
          <TaskList onComplete={completeTask} onDelete={deleteTask} onReopen={reopenTask} tasks={filteredTasks} />
        </div>
      </section>
    </div>
  );
}
