import { CheckCircle2, Circle, Clock, RotateCcw, Trash2 } from "lucide-react";
import type { Task } from "../lib/api";
import { formatDateTime, repeatLabels } from "../lib/taskUtils";

type TaskListProps = {
  tasks: Task[];
  onComplete: (task: Task) => void;
  onReopen: (task: Task) => void;
  onDelete?: (task: Task) => void;
  compact?: boolean;
};

export function TaskList({ tasks, onComplete, onReopen, onDelete, compact = false }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="empty-state">登録済みのタスクはまだありません。</div>;
  }

  return (
    <div className={compact ? "task-list compact" : "task-list"}>
      {tasks.map((task) => (
        <article className={task.isCompleted ? "task-row completed" : "task-row"} key={task.id}>
          <button
            aria-label={task.isCompleted ? "未完了に戻す" : "完了にする"}
            className="task-check"
            onClick={() => (task.isCompleted ? onReopen(task) : onComplete(task))}
            type="button"
          >
            {task.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
          <div className="task-body">
            <div className="task-title-line">
              <h3>{task.title}</h3>
              <span className="pill">{repeatLabels[task.repeatType]}</span>
              <span className="pill muted">{task.category}</span>
            </div>
            {task.description && <p>{task.description}</p>}
            <div className="task-meta">
              <Clock size={14} />
              {formatDateTime(task.dueDate)}
              <span>JST {task.resetHourJst}:00 リセット</span>
            </div>
          </div>
          <div className="task-actions">
            {task.isCompleted && (
              <button aria-label="未完了に戻す" className="icon-button" onClick={() => onReopen(task)} type="button">
                <RotateCcw size={17} />
              </button>
            )}
            {onDelete && (
              <button aria-label="削除" className="icon-button danger" onClick={() => onDelete(task)} type="button">
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
