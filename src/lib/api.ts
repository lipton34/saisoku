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
  register: (username: string, password: string, displayName: string) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      json: { username, password, displayName }
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
  reopenTask: (id: string) => request<{ task: Task }>(`/api/tasks/${id}/reopen`, { method: "POST" })
};
