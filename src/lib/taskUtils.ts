import type { RepeatType, Task } from "./api";

export const repeatLabels: Record<RepeatType, string> = {
  daily: "日課",
  weekly: "週課",
  once: "単発"
};

export function formatDateTime(value: string | null) {
  if (!value) {
    return "期限なし";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getTaskStats(tasks: Task[]) {
  const openTasks = tasks.filter((task) => !task.isCompleted);
  const completedTasks = tasks.filter((task) => task.isCompleted);
  const dailyOpen = openTasks.filter((task) => task.repeatType === "daily").length;
  const weeklyOpen = openTasks.filter((task) => task.repeatType === "weekly").length;

  return {
    total: tasks.length,
    open: openTasks.length,
    completed: completedTasks.length,
    dailyOpen,
    weeklyOpen,
    recentCompleted: completedTasks
      .filter((task) => task.completedAt)
      .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime())
      .slice(0, 4)
  };
}
