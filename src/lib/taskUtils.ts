import type { RepeatType, Task } from "./api";

export const repeatLabels: Record<RepeatType, string> = {
  daily: "日課",
  weekly: "週課",
  once: "単発"
};

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatDateTime(value: string | null) {
  if (!value) {
    return "期限なし";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function getTaskStats(tasks: Task[]) {
  const completedTasks: Task[] = [];
  let dailyOpen = 0;
  let weeklyOpen = 0;
  let open = 0;

  for (const task of tasks) {
    if (task.isCompleted) {
      completedTasks.push(task);
      continue;
    }

    open += 1;
    if (task.repeatType === "daily") {
      dailyOpen += 1;
    } else if (task.repeatType === "weekly") {
      weeklyOpen += 1;
    }
  }

  return {
    total: tasks.length,
    open,
    completed: completedTasks.length,
    dailyOpen,
    weeklyOpen,
    recentCompleted: completedTasks
      .filter((task) => task.completedAt)
      .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime())
      .slice(0, 4)
  };
}
