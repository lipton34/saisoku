export type RepeatType = "daily" | "weekly" | "once";

export type User = {
  id: string;
  username: string;
  displayName: string | null;
};

export type GoalCategory = "古戦場" | "高難度" | "周回" | "育成" | "その他";
export type GoalStatus = "未着手" | "進行中" | "達成" | "中止";
export type ProposalStatus = "提案中" | "受け入れ済み" | "見送り";

export type SharedGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  description: string | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  progressRate: number | null;
  status: GoalStatus;
  dueDate: string | null;
  memo: string | null;
  sourceProposalId: string | null;
  proposedByUserId: string | null;
  ownerId: string;
  owner: User;
  proposedByUser: User | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalProposal = {
  id: string;
  proposerUserId: string;
  proposer: User;
  targetUserId: string;
  targetUser: User;
  title: string;
  category: GoalCategory;
  description: string | null;
  targetValue: number | null;
  unit: string | null;
  dueDate: string | null;
  proposalMemo: string | null;
  status: ProposalStatus;
  acceptedGoalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SharedGoalInput = {
  title: string;
  category: GoalCategory;
  description?: string;
  targetValue?: number | string | null;
  currentValue?: number | string | null;
  unit?: string;
  status?: GoalStatus;
  dueDate?: string;
  memo?: string;
};

export type GoalProposalInput = {
  targetUserId: string;
  title: string;
  category: GoalCategory;
  description?: string;
  targetValue?: number | string | null;
  unit?: string;
  dueDate?: string;
  proposalMemo?: string;
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

export type MaterialPresetItem = {
  id: string;
  name: string;
  requiredCount: number;
  note: string | null;
  presetId: string;
  createdAt: string;
  updatedAt: string;
};

export type MaterialPreset = {
  id: string;
  name: string;
  questName: string | null;
  note: string | null;
  ownerId: string;
  items: MaterialPresetItem[];
  createdAt: string;
  updatedAt: string;
};

export type BuildReferenceUrl = {
  type: string;
  title: string;
  url: string;
  memo: string;
};

export type BuildCharacterDetail = {
  position: string;
  name: string;
  masterId?: string | null;
  importance: string;
  roleMemo: string;
  substituteMemo: string;
};

export type BuildSummonDetail = {
  position: string;
  name: string;
  masterId?: string | null;
  importance: string;
  usageMemo: string;
  substituteMemo: string;
};

export type BuildWeaponDetail = {
  name: string;
  masterId?: string | null;
  importance: string;
  count: string;
  usageMemo: string;
  substituteMemo: string;
};

export type BuildPreset = {
  id: string;
  name: string;
  category: string;
  questName: string;
  element: string;
  purpose: string;
  operationType: string;
  verificationStatus: string;
  overview: string;
  presetStatus: string;
  origins: string[];
  protagonistJob: string;
  characterDetails: BuildCharacterDetail[];
  summonDetails: BuildSummonDetail[];
  weaponDetails: BuildWeaponDetail[];
  characters: string[];
  summons: string[];
  weapons: string[];
  requiredParts: string[];
  recommendedParts: string[];
  substitutableParts: string[];
  freeSlots: string[];
  substituteNotes: string;
  cautions: string;
  role?: string;
  omenNotes?: string;
  actionNotes?: string;
  failurePoints?: string;
  farmingGoal?: string;
  raidRole?: string;
  blueChest?: string;
  clearTime?: string;
  stability?: string;
  prerequisites?: string;
  weaponTarget?: string;
  rescueTiming?: string;
  farmingCautions?: string;
  referenceUrls: BuildReferenceUrl[];
  updatedAt: string;
};

export type BuildPost = Omit<BuildPreset, "id" | "name" | "presetStatus" | "origins" | "updatedAt"> & {
  id: string;
  title: string;
  sourcePresetId: string | null;
  sourcePresetName: string | null;
  changeMemo: string | null;
  authorName?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type BuildPostInput = Omit<BuildPost, "id" | "ownerId" | "createdAt" | "updatedAt">;

export type GbfMasterKind = "character" | "weapon" | "summon" | "job" | "material" | "quest";

export type GbfMasterItem = {
  id: string;
  kind: GbfMasterKind;
  name: string;
  displayName: string | null;
  element: string | null;
  rarity: string | null;
  category: string | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  note: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type GbfMasterAlias = {
  id: string;
  masterItemId: string;
  alias: string;
  normalizedAlias: string;
};

export type BuildMastersResponse = {
  items: GbfMasterItem[];
  aliases: GbfMasterAlias[];
};

type RequestOptions = RequestInit & {
  json?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasJson = Object.prototype.hasOwnProperty.call(options, "json");
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(hasJson ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    body: hasJson ? JSON.stringify(options.json) : options.body
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
  users: () => request<{ users: User[] }>("/api/shared-goals/members"),
  sharedGoals: (filters?: {
    userId?: string;
    category?: string;
    status?: string;
    due?: string;
    keyword?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.set("userId", filters.userId);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.due) params.set("due", filters.due);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    const query = params.toString();
    return request<{ goals: SharedGoal[] }>(`/api/shared-goals${query ? `?${query}` : ""}`);
  },
  sharedGoal: (id: string) => request<{ goal: SharedGoal }>(`/api/shared-goals/${id}`),
  createSharedGoal: (goal: SharedGoalInput) =>
    request<{ goal: SharedGoal }>("/api/shared-goals", { method: "POST", json: goal }),
  updateSharedGoal: (id: string, goal: Partial<SharedGoalInput>) =>
    request<{ goal: SharedGoal }>(`/api/shared-goals/${id}`, { method: "PATCH", json: goal }),
  createGoalProposal: (proposal: GoalProposalInput) =>
    request<{ proposal: GoalProposal }>("/api/shared-goals/proposals", { method: "POST", json: proposal }),
  goalProposalInbox: (status?: ProposalStatus | "all") => {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ proposals: GoalProposal[] }>(`/api/shared-goals/proposals/inbox/list${query}`);
  },
  acceptGoalProposal: (id: string) =>
    request<{ proposal: GoalProposal; goal: SharedGoal }>(`/api/shared-goals/proposals/${id}/accept`, {
      method: "POST"
    }),
  declineGoalProposal: (id: string) =>
    request<{ proposal: GoalProposal }>(`/api/shared-goals/proposals/${id}/decline`, { method: "POST" }),
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
    request<void>(`/api/material-goals/${goalId}/items/${itemId}`, { method: "DELETE" }),
  materialPresets: () => request<{ presets: MaterialPreset[] }>("/api/material-goals/presets"),
  createMaterialPresetFromGoal: (goalId: string, name?: string) =>
    request<{ preset: MaterialPreset }>(`/api/material-goals/presets/from-goal/${goalId}`, {
      method: "POST",
      json: { name }
    }),
  applyMaterialPreset: (presetId: string, goal: { title: string; questName?: string; note?: string }) =>
    request<{ goal: MaterialGoal }>(`/api/material-goals/presets/${presetId}/apply`, {
      method: "POST",
      json: goal
    }),
  deleteMaterialPreset: (presetId: string) =>
    request<void>(`/api/material-goals/presets/${presetId}`, { method: "DELETE" }),
  buildPresets: (filters?: { category?: string; questName?: string; element?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.questName) params.set("questName", filters.questName);
    if (filters?.element) params.set("element", filters.element);
    const query = params.toString();
    return request<{ presets: BuildPreset[] }>(`/api/builds/presets${query ? `?${query}` : ""}`);
  },
  getBuildMasters: () => request<BuildMastersResponse>("/api/build-masters"),
  buildPosts: () => request<{ posts: BuildPost[] }>("/api/builds"),
  createBuildPost: (post: BuildPostInput) =>
    request<{ post: BuildPost }>("/api/builds", {
      method: "POST",
      json: post
    }),
  updateBuildPost: (id: string, post: BuildPostInput) =>
    request<{ post: BuildPost }>(`/api/builds/${id}`, {
      method: "PATCH",
      json: post
    }),
  deleteBuildPost: (id: string) => request<void>(`/api/builds/${id}`, { method: "DELETE" })
};
