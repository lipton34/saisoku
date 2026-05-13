export type RepeatType = "daily" | "weekly" | "once";

export type User = {
  id: string;
  username: string;
  displayName: string | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  repeatType: RepeatType;
  dueDate: string | null;
  resetHourJst: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
};

export type MaterialItem = {
  id: string;
  name: string;
  requiredCount: number;
  ownedCount: number;
  note: string | null;
  goalId: string;
  createdAt: string;
  updatedAt: string;
};

export type MaterialGoal = {
  id: string;
  title: string;
  questName: string | null;
  note: string | null;
  ownerId: string;
  items: MaterialItem[];
  createdAt: string;
  updatedAt: string;
};

type RequestOptions = RequestInit & {
  json?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    body: options.json ? JSON.stringify(options.json) : options.body
  });

  if (!response.ok) {
    let message = "通信に失敗しました";
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: User | null }>("/api/auth/me"),
  login: (username: string, password: string) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", json: { username, password } }),
  register: (username: string, password: string, displayName: string, inviteCode: string) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      json: { username, password, displayName, inviteCode }
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  tasks: () => request<{ tasks: Task[] }>("/api/tasks"),
  createTask: (task: {
    title: string;
    description?: string;
    category: string;
    repeatType: RepeatType;
    dueDate?: string;
    resetHourJst: number;
  }) => request<{ task: Task }>("/api/tasks", { method: "POST", json: task }),
  updateTask: (id: string, task: Partial<Task>) =>
    request<{ task: Task }>(`/api/tasks/${id}`, { method: "PATCH", json: task }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id: string) => request<{ task: Task }>(`/api/tasks/${id}/complete`, { method: "POST" }),
  reopenTask: (id: string) => request<{ task: Task }>(`/api/tasks/${id}/reopen`, { method: "POST" }),
  materialGoals: () => request<{ goals: MaterialGoal[] }>("/api/material-goals"),
  createMaterialGoal: (goal: {
    title: string;
    questName?: string;
    note?: string;
    firstItemName?: string;
    firstRequiredCount?: number;
    firstOwnedCount?: number;
  }) => request<{ goal: MaterialGoal }>("/api/material-goals", { method: "POST", json: goal }),
  updateMaterialGoal: (id: string, goal: Partial<MaterialGoal>) =>
    request<{ goal: MaterialGoal }>(`/api/material-goals/${id}`, { method: "PATCH", json: goal }),
  deleteMaterialGoal: (id: string) => request<void>(`/api/material-goals/${id}`, { method: "DELETE" }),
  createMaterialItem: (
    goalId: string,
    item: { name: string; requiredCount: number; ownedCount?: number; note?: string }
  ) => request<{ item: MaterialItem }>(`/api/material-goals/${goalId}/items`, { method: "POST", json: item }),
  updateMaterialItem: (goalId: string, itemId: string, item: Partial<MaterialItem>) =>
    request<{ item: MaterialItem }>(`/api/material-goals/${goalId}/items/${itemId}`, {
      method: "PATCH",
      json: item
    }),
  deleteMaterialItem: (goalId: string, itemId: string) =>
    request<void>(`/api/material-goals/${goalId}/items/${itemId}`, { method: "DELETE" })
};
