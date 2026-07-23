export type RepeatType = "daily" | "weekly" | "once";

export type User = {
  id: string;
  username: string;
  displayName: string | null;
};

export type GoalCategory = "周回" | "編成" | "その他";
export type GoalStatus = "達成" | "未達成";
export type GoalBoardStatus = "now" | "next" | "later" | "paused" | "done";
export type GoalPriority = "high" | "medium" | "low";
export type GoalEffort = "light" | "normal" | "heavy";
export type ProposalStatus = "提案中" | "受け入れ済み" | "見送り";

export type GoalFormationPart = {
  kind: "character" | "weapon" | "summon";
  name: string;
  masterId?: string | null;
  owned: boolean;
  position?: string;
};

export type SharedGoalDetails = {
  itemName?: string | null;
  questName?: string | null;
  questUrl?: string | null;
  requiredCount?: number | null;
  currentCount?: number | null;
  content?: string | null;
  sourceBuildPostId?: string | null;
  sourceBuildPostTitle?: string | null;
  characters?: GoalFormationPart[];
  weapons?: GoalFormationPart[];
  summons?: GoalFormationPart[];
};

export type GoalLinkedBuild = {
  id: string;
  title: string;
  category: string;
  questName: string;
  element: string;
  purpose: string;
  operationType: string;
  verificationStatus: string;
  ownerId: string;
};

export type GoalBuildLink = {
  id: string;
  goalId: string;
  buildId: string;
  note: string | null;
  build: GoalLinkedBuild;
  createdAt: string;
  updatedAt: string;
};

export type GoalRequiredItem = {
  id: string;
  goalId: string;
  masterItemId: string | null;
  itemKind: string;
  name: string;
  requiredCount: number;
  currentCount: number;
  importance: string;
  note: string | null;
  masterItem?: GbfMasterItem | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalRaidTarget = {
  id: string;
  goalId: string;
  questName: string;
  runType: string;
  targetCount: number;
  currentCount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalSubTask = {
  id: string;
  goalId: string;
  title: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SharedGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  description: string | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  details: SharedGoalDetails;
  progressRate: number | null;
  status: GoalStatus;
  boardStatus: GoalBoardStatus;
  priority: GoalPriority;
  effort: GoalEffort;
  dueDate: string | null;
  beginnerRecommended: boolean;
  sortOrder: number;
  memo: string | null;
  sourceProposalId: string | null;
  proposedByUserId: string | null;
  ownerId: string;
  owner: User;
  proposedByUser: User | null;
  buildLinks: GoalBuildLink[];
  requiredItems: GoalRequiredItem[];
  raidTargets: GoalRaidTarget[];
  subTasks: GoalSubTask[];
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
  details: SharedGoalDetails;
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
  details?: SharedGoalDetails;
  status?: GoalStatus;
  boardStatus?: GoalBoardStatus;
  priority?: GoalPriority;
  effort?: GoalEffort;
  dueDate?: string;
  beginnerRecommended?: boolean;
  sortOrder?: number;
  memo?: string;
};

export type GoalProposalInput = {
  targetUserId?: string;
  targetUserIds?: string[];
  title: string;
  category: GoalCategory;
  description?: string;
  targetValue?: number | string | null;
  currentValue?: number | string | null;
  details?: SharedGoalDetails;
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

export type ProgressPreset = {
  id: string;
  version: number;
  name: string;
  targetLabel: string;
  selectionLabel?: string;
  selectionOptions?: string[];
  targets: { id: string; name: string }[];
  groups: { id: string; name: string; sortOrder: number }[];
  stages: {
    id: string;
    name: string;
    groupId: string;
    kind: "stage" | "milestone";
    dependsOn: string[];
    note?: string;
  }[];
  isAvailable: boolean;
  unavailableReason?: string;
};

export type ProgressGoalStage = {
  id: string;
  name: string;
  groupId: string;
  kind: "stage" | "milestone";
  dependsOn: string[];
  note?: string;
  isManuallyDone: boolean;
  isDone: boolean;
  canComplete: boolean;
  missingDependencyIds: string[];
  requirements: {
    itemKey: string;
    itemName: string;
    requiredCount: number;
    ownedCount: number;
    shortage: number;
    isMet: boolean;
  }[];
  conditions: {
    id: string;
    label: string;
    kind: "check" | "shared-number" | "goal-number";
    requiredValue?: number;
    sharedValueKey?: string;
    note?: string;
    numericValue: number;
    isChecked: boolean;
    isMet: boolean;
  }[];
};

export type ProgressGoal = {
  id: string;
  preset: ProgressPreset;
  targetId: string;
  targetName: string;
  selection: Record<string, unknown>;
  goalStageId: string;
  targetStageId: string;
  availableTargetStageIds: string[];
  startingStageId: string | null;
  stages: ProgressGoalStage[];
  completedStageIds: string[];
  completedCount: number;
  totalStageCount: number;
  progressRate: number;
  currentStage: ProgressGoalStage | null;
  calculation: {
    requiredStageIds: string[];
    pendingStageIds: string[];
    requirements: {
      itemKey: string;
      itemName: string;
      requiredCount: number;
      ownedCount: number;
      shortage: number;
    }[];
  };
  createdAt: string;
  updatedAt: string;
};

export type GuildWarGoalDay = {
  id: string;
  dayLabel: string;
  targetContribution: string;
  currentContribution: string;
  sortOrder: number;
  memo: string | null;
};

export type GuildWarBossSpeed = {
  id: string;
  bossLevel: number;
  clearTimeSeconds: number | null;
  targetClearTimeSeconds: number | null;
  targetRuns: number;
  playStyle: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuildWarGoalPlan = {
  id: string;
  title: string;
  targetContribution: string;
  targetMeatCount: string;
  memo: string | null;
  ownerId: string;
  days: GuildWarGoalDay[];
  speeds: GuildWarBossSpeed[];
  createdAt: string;
  updatedAt: string;
};

export type GuildWarBossMaster = {
  id: string;
  eventKey: string;
  bossLevel: number;
  name: string;
  contribution: string;
  meatCost: number;
  specialMeatCost: number;
  isEnabled: boolean;
};

export type GuildWarGoalPayload = {
  title: string;
  targetContribution: string;
  targetMeatCount: string;
  memo?: string;
  days: {
    dayLabel: string;
    targetContribution: string;
    currentContribution: string;
    sortOrder: number;
    memo?: string;
  }[];
  speeds: {
    bossLevel: number;
    clearTimeSeconds: number | null;
    targetClearTimeSeconds: number | null;
    targetRuns: number;
    memo?: string;
  }[];
};

export type SourceArticleType =
  | "monthly_plan"
  | "event"
  | "campaign"
  | "update"
  | "gacha"
  | "character"
  | "media"
  | "maintenance"
  | "other";

export type ExtractedNewsItemType =
  | "event"
  | "campaign"
  | "update"
  | "monthly_plan_item"
  | "gacha"
  | "character"
  | "maintenance"
  | "other";

export type ExtractedNewsEventType =
  | "scenario_event"
  | "rerun_event"
  | "collaboration_event"
  | "guild_war"
  | "dread_barrage"
  | "rotb"
  | "xeno_clash"
  | "proving_grounds"
  | "tower_of_babyl"
  | "arcarum_event"
  | "side_story"
  | "special_event"
  | "unknown";

export type ExtractedNewsInfoStatus = "confirmed" | "scheduled" | "tentative" | "unknown";

export type ExtractedNewsItem = {
  id: string;
  itemType: ExtractedNewsItemType;
  title: string | null;
  eventType: ExtractedNewsEventType;
  startsAt: string | null;
  endsAt: string | null;
  updateAtCandidate: string | null;
  rawDateText: string | null;
  summary: string | null;
  infoStatus: ExtractedNewsInfoStatus;
  extractionConfidence: number;
  tags: string[];
  relatedKey: string | null;
  displayPriority: number;
  isVisible: boolean;
  groupKey?: string;
  groupSize?: number;
  relatedItems?: {
    id: string;
    itemType: ExtractedNewsItemType;
    title: string | null;
    startsAt: string | null;
    endsAt: string | null;
    extractionConfidence: number;
    article: {
      sourceArticleId: string;
      title: string;
      officialUrl: string;
      publishedAt: string | null;
      articleType: SourceArticleType;
    };
  }[];
  article: {
    sourceArticleId: string;
    title: string;
    officialUrl: string;
    publishedAt: string | null;
    articleType: SourceArticleType;
  };
};

export type SourceArticle = {
  id: string;
  sourceArticleId: string;
  title: string;
  officialUrl: string;
  publishedAt: string | null;
  articleType: SourceArticleType;
  fetchStatus: string;
  parseStatus: string;
  contentHash: string | null;
  lastFetchedAt: string;
  lastParsedAt: string;
  categories: { sourceCategoryId?: number; slug: string; name: string }[];
};

export type NewsFetchLog = {
  id: string;
  runType: string;
  status: "success" | "error" | "running";
  targetMonth: string | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  startedAt: string;
  finishedAt: string | null;
  fetchedCount: number;
  newCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errorMessage: string | null;
};

export type OfficialNewsFetchResult = {
  ok: boolean;
  runType: string;
  targetMonth?: string | null;
  fetchedCount?: number;
  insertedCount?: number;
  updatedCount?: number;
  failedCount?: number;
  fetchedPages?: number;
  totalPageCnt?: number;
  maxPages?: number | null;
  message: string;
  errors?: string[];
};

export type EventNoteLinkInput = {
  url: string;
  title?: string | null;
  siteName?: string | null;
  memo?: string | null;
};

export type EventNoteLink = EventNoteLinkInput & {
  id: string;
  title: string | null;
  siteName: string | null;
  memo: string | null;
};

export type EventNoteInput = {
  newsItemId?: string | null;
  eventOccurrenceId?: string | null;
  eventSeriesId?: string | null;
  eventKey?: string;
  title: string;
  minimumGoals?: string | null;
  targetWeapons?: string | null;
  targetSummons?: string | null;
  targetItems?: string | null;
  farmingNotes?: string | null;
  cautionNotes?: string | null;
  freeMemo?: string | null;
  links?: EventNoteLinkInput[];
};

export type EventNote = {
  id: string;
  eventKey: string;
  newsItemId: string | null;
  eventOccurrenceId: string | null;
  eventSeriesId: string | null;
  title: string;
  minimumGoals: string | null;
  targetWeapons: string | null;
  targetSummons: string | null;
  targetItems: string | null;
  farmingNotes: string | null;
  cautionNotes: string | null;
  freeMemo: string | null;
  sourceNoteId: string | null;
  links: EventNoteLink[];
  createdAt: string;
  updatedAt: string;
};

export type EventNoteCandidate = EventNote & {
  sourceNewsItem: {
    title: string | null;
    startsAt: string | null;
    endsAt: string | null;
    articleTitle: string;
    officialUrl: string;
  };
};

export type EventSeries = {
  id: string;
  eventKey: string;
  name: string;
  eventType: string;
  description: string | null;
  defaultMemoTemplate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventOccurrenceInput = {
  eventSeriesId: string;
  newsItemId?: string | null;
  title: string;
  startAt?: string | null;
  endAt?: string | null;
  element?: string | null;
  enemyElement?: string | null;
  advantageElement?: string | null;
  sourceType?: string;
  sourceArticleId?: string | null;
  officialUrl?: string | null;
  confidence?: string;
  memo?: string | null;
  isVisible?: boolean;
};

export type EventOccurrence = {
  id: string;
  eventSeries: EventSeries;
  newsItem: (ExtractedNewsItem & {
    sourceArticle: {
      sourceArticleId: string;
      title: string;
      officialUrl: string;
      publishedAt: string | null;
      articleType: SourceArticleType;
    };
  }) | null;
  title: string;
  startAt: string | null;
  endAt: string | null;
  element: string | null;
  enemyElement: string | null;
  advantageElement: string | null;
  sourceType: string;
  sourceArticleId: string | null;
  officialUrl: string | null;
  confidence: string;
  memo: string | null;
  isVisible: boolean;
  eventNotes: EventNote[];
  relatedNewsItems: unknown[];
  createdAt: string;
  updatedAt: string;
};

export type OfficialNewsListParams = {
  itemType?: string;
  eventType?: string;
  articleType?: string;
  runType?: string;
  status?: string;
  from?: string;
  to?: string;
  keyword?: string;
  includeHidden?: boolean;
  grouped?: boolean;
  includeRelated?: boolean;
  includeNonGame?: boolean;
  limit?: number;
  offset?: number;
};

export type BuildReferenceUrl = {
  type: string;
  title: string;
  url: string;
  memo: string;
};

export type BuildPostImage = {
  id: string;
  buildPostId: string;
  imageType: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BuildPostGoalLink = {
  id: string;
  goalId: string;
  buildId: string;
  note: string | null;
  goal: {
    id: string;
    title: string;
    category: GoalCategory;
    boardStatus: GoalBoardStatus;
    priority: GoalPriority;
    effort: GoalEffort;
    dueDate: string | null;
    ownerId: string;
  };
  createdAt: string;
  updatedAt: string;
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
  images: BuildPostImage[];
  goalLinks: BuildPostGoalLink[];
  sourcePresetId: string | null;
  sourcePresetName: string | null;
  changeMemo: string | null;
  authorName?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type BuildPostInput = Omit<BuildPost, "id" | "images" | "goalLinks" | "ownerId" | "createdAt" | "updatedAt">;

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

export type BuildMastersQuery = {
  kind?: GbfMasterKind | GbfMasterKind[];
  element?: string;
  query?: string;
  limit?: number;
  offset?: number;
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

function toQuery(params?: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) {
      return;
    }
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
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
    boardStatus?: string;
    priority?: string;
    effort?: string;
    beginnerOnly?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.set("userId", filters.userId);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.due) params.set("due", filters.due);
    if (filters?.keyword) params.set("keyword", filters.keyword);
    if (filters?.boardStatus) params.set("boardStatus", filters.boardStatus);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.effort) params.set("effort", filters.effort);
    if (filters?.beginnerOnly) params.set("beginnerOnly", "true");
    const query = params.toString();
    return request<{ goals: SharedGoal[] }>(`/api/shared-goals${query ? `?${query}` : ""}`);
  },
  sharedGoal: (id: string) => request<{ goal: SharedGoal }>(`/api/shared-goals/${id}`),
  createSharedGoal: (goal: SharedGoalInput) =>
    request<{ goal: SharedGoal }>("/api/shared-goals", { method: "POST", json: goal }),
  updateSharedGoal: (id: string, goal: Partial<SharedGoalInput>) =>
    request<{ goal: SharedGoal }>(`/api/shared-goals/${id}`, { method: "PATCH", json: goal }),
  deleteSharedGoal: (id: string) => request<void>(`/api/shared-goals/${id}`, { method: "DELETE" }),
  addGoalBuildLink: (id: string, link: { buildId: string; note?: string | null }) =>
    request<{ link: GoalBuildLink }>(`/api/shared-goals/${id}/build-links`, { method: "POST", json: link }),
  updateGoalBuildLink: (id: string, linkId: string, link: { note?: string | null }) =>
    request<{ link: GoalBuildLink }>(`/api/shared-goals/${id}/build-links/${linkId}`, {
      method: "PATCH",
      json: link
    }),
  deleteGoalBuildLink: (id: string, linkId: string) =>
    request<void>(`/api/shared-goals/${id}/build-links/${linkId}`, { method: "DELETE" }),
  addGoalRequiredItem: (
    id: string,
    item: {
      masterItemId?: string | null;
      itemKind?: string;
      name: string;
      requiredCount: number;
      currentCount?: number;
      importance?: string;
      note?: string | null;
    }
  ) => request<{ item: GoalRequiredItem }>(`/api/shared-goals/${id}/required-items`, { method: "POST", json: item }),
  updateGoalRequiredItem: (id: string, itemId: string, item: Partial<GoalRequiredItem>) =>
    request<{ item: GoalRequiredItem }>(`/api/shared-goals/${id}/required-items/${itemId}`, {
      method: "PATCH",
      json: item
    }),
  deleteGoalRequiredItem: (id: string, itemId: string) =>
    request<void>(`/api/shared-goals/${id}/required-items/${itemId}`, { method: "DELETE" }),
  addGoalRaidTarget: (
    id: string,
    target: { questName: string; runType: string; targetCount: number; currentCount?: number; note?: string | null }
  ) => request<{ target: GoalRaidTarget }>(`/api/shared-goals/${id}/raid-targets`, { method: "POST", json: target }),
  updateGoalRaidTarget: (id: string, targetId: string, target: Partial<GoalRaidTarget>) =>
    request<{ target: GoalRaidTarget }>(`/api/shared-goals/${id}/raid-targets/${targetId}`, {
      method: "PATCH",
      json: target
    }),
  deleteGoalRaidTarget: (id: string, targetId: string) =>
    request<void>(`/api/shared-goals/${id}/raid-targets/${targetId}`, { method: "DELETE" }),
  addGoalSubTask: (id: string, task: { title: string; isDone?: boolean; sortOrder?: number }) =>
    request<{ task: GoalSubTask }>(`/api/shared-goals/${id}/sub-tasks`, { method: "POST", json: task }),
  updateGoalSubTask: (id: string, taskId: string, task: Partial<GoalSubTask>) =>
    request<{ task: GoalSubTask }>(`/api/shared-goals/${id}/sub-tasks/${taskId}`, {
      method: "PATCH",
      json: task
    }),
  deleteGoalSubTask: (id: string, taskId: string) =>
    request<void>(`/api/shared-goals/${id}/sub-tasks/${taskId}`, { method: "DELETE" }),
  createGoalProposal: (proposal: GoalProposalInput) =>
    request<{ proposal: GoalProposal; proposals?: GoalProposal[] }>("/api/shared-goals/proposals", {
      method: "POST",
      json: proposal
    }),
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
  progressPresets: () => request<{ presets: ProgressPreset[] }>("/api/progress-goals/presets"),
  progressGoals: () => request<{ goals: ProgressGoal[] }>("/api/progress-goals"),
  createProgressGoal: (goal: { presetId: string; targetId: string; goalStageId: string; completedStageIds?: string[]; selection?: Record<string, string> }) =>
    request<{ goal: ProgressGoal }>("/api/progress-goals", { method: "POST", json: goal }),
  progressGoal: (goalId: string, targetStageId?: string) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}${toQuery({ targetStageId })}`),
  previewProgressGoal: (
    goalId: string,
    value: { completedStageIds: string[]; inventoryOverrides?: { itemKey: string; ownedCount: number }[]; targetStageId?: string }
  ) => request<{ goal: ProgressGoal; dependencyErrors: { stageId: string; missingDependencyIds: string[] }[] }>(
    `/api/progress-goals/${goalId}/preview`,
    { method: "POST", json: value }
  ),
  saveProgressStages: (goalId: string, completedStageIds: string[]) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}/progress`, { method: "PUT", json: { completedStageIds } }),
  updateProgressInventory: (goalId: string, itemKey: string, ownedCount: number) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}/inventory/${encodeURIComponent(itemKey)}`, { method: "PATCH", json: { ownedCount } }),
  updateProgressCondition: (goalId: string, conditionId: string, value: { isChecked?: boolean; numericValue?: number }) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}/conditions/${encodeURIComponent(conditionId)}`, { method: "PATCH", json: value }),
  completeProgressStage: (goalId: string, stageId: string) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}/stages/${encodeURIComponent(stageId)}/complete`, { method: "POST" }),
  deleteProgressGoal: (goalId: string) => request<void>(`/api/progress-goals/${goalId}`, { method: "DELETE" }),
  guildWarGoalPlan: () =>
    request<{ plan: GuildWarGoalPlan; bossMasters: GuildWarBossMaster[] }>("/api/guild-war-goals/current"),
  saveGuildWarGoalPlan: (plan: GuildWarGoalPayload) =>
    request<{ plan: GuildWarGoalPlan; bossMasters: GuildWarBossMaster[] }>("/api/guild-war-goals/current", {
      method: "PUT",
      json: plan
    }),
  resetGuildWarGoalPlan: () =>
    request<{ plan: GuildWarGoalPlan; bossMasters: GuildWarBossMaster[] }>("/api/guild-war-goals/current/reset", {
      method: "POST"
    }),
  newsItems: (params?: OfficialNewsListParams) =>
    request<{ items: ExtractedNewsItem[]; total: number; limit: number; offset: number }>(
      `/api/news-items${toQuery(params)}`
    ),
  sourceArticles: (params?: OfficialNewsListParams) =>
    request<{ articles: SourceArticle[]; total: number; limit: number; offset: number }>(
      `/api/source-articles${toQuery(params)}`
    ),
  newsFetchLogs: (params?: OfficialNewsListParams) =>
    request<{ logs: NewsFetchLog[]; total: number; limit: number; offset: number }>(
      `/api/news-fetch-logs${toQuery(params)}`
    ),
  fetchLatestOfficialNews: (payload?: { maxPages?: number }) =>
    request<OfficialNewsFetchResult>("/api/official-news/fetch/latest", {
      method: "POST",
      json: payload ?? {}
    }),
  fetchMonthlyOfficialNews: (payload: { targetMonth: string; maxPages?: number }) =>
    request<OfficialNewsFetchResult>("/api/official-news/fetch/month", {
      method: "POST",
      json: payload
    }),
  reanalyzeOfficialNews: (payload: { sourceArticleId: string }) =>
    request<OfficialNewsFetchResult>("/api/official-news/reanalyze", {
      method: "POST",
      json: payload
    }),
  eventSeries: () => request<{ series: EventSeries[] }>("/api/event-series"),
  createEventSeries: (series: {
    eventKey: string;
    name: string;
    eventType: string;
    description?: string | null;
    defaultMemoTemplate?: string | null;
  }) => request<{ series: EventSeries }>("/api/event-series", { method: "POST", json: series }),
  updateEventSeries: (id: string, series: Partial<EventSeries>) =>
    request<{ series: EventSeries }>(`/api/event-series/${id}`, { method: "PATCH", json: series }),
  eventOccurrences: (params?: {
    eventSeriesId?: string;
    eventType?: string;
    from?: string;
    to?: string;
    keyword?: string;
    includeHidden?: boolean;
  }) => request<{ occurrences: EventOccurrence[] }>(`/api/event-occurrences${toQuery(params)}`),
  createEventOccurrence: (occurrence: EventOccurrenceInput) =>
    request<{ occurrence: EventOccurrence }>("/api/event-occurrences", { method: "POST", json: occurrence }),
  updateEventOccurrence: (id: string, occurrence: EventOccurrenceInput) =>
    request<{ occurrence: EventOccurrence }>(`/api/event-occurrences/${id}`, {
      method: "PATCH",
      json: occurrence
    }),
  createEventOccurrenceFromNewsItem: (payload: Partial<EventOccurrenceInput> & { newsItemId: string }) =>
    request<{ occurrence: EventOccurrence }>("/api/event-occurrences/from-news-item", {
      method: "POST",
      json: payload
    }),
  eventNotes: (params?: { newsItemId?: string; eventOccurrenceId?: string; eventSeriesId?: string; eventKey?: string }) =>
    request<{ notes: EventNote[] }>(`/api/event-notes${toQuery(params)}`),
  eventNoteCandidates: (params: { newsItemId?: string; eventOccurrenceId?: string; eventKey?: string }) =>
    request<{ eventKey: string; candidates: EventNoteCandidate[] }>(`/api/event-notes/candidates${toQuery(params)}`),
  createEventNote: (note: EventNoteInput) =>
    request<{ note: EventNote }>("/api/event-notes", { method: "POST", json: note }),
  updateEventNote: (id: string, note: EventNoteInput) =>
    request<{ note: EventNote }>(`/api/event-notes/${id}`, { method: "PATCH", json: note }),
  deleteEventNote: (id: string) => request<void>(`/api/event-notes/${id}`, { method: "DELETE" }),
  copyEventNote: (id: string, target: { newsItemId?: string; eventOccurrenceId?: string }) =>
    request<{ note: EventNote }>(`/api/event-notes/${id}/copy`, { method: "POST", json: target }),
  buildPresets: (filters?: { category?: string; questName?: string; element?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.questName) params.set("questName", filters.questName);
    if (filters?.element) params.set("element", filters.element);
    const query = params.toString();
    return request<{ presets: BuildPreset[] }>(`/api/builds/presets${query ? `?${query}` : ""}`);
  },
  getBuildMasters: (params?: BuildMastersQuery) => {
    const kind = Array.isArray(params?.kind) ? params.kind.join(",") : params?.kind;
    return request<BuildMastersResponse>(
      `/api/build-masters${toQuery({
        kind,
        element: params?.element,
        query: params?.query,
        limit: params?.limit,
        offset: params?.offset,
      })}`,
    );
  },
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
  buildPostImages: (id: string) => request<{ images: BuildPostImage[] }>(`/api/builds/${id}/images`),
  uploadBuildPostImage: (id: string, payload: { file: File; imageType: string }) => {
    const formData = new FormData();
    formData.set("image", payload.file);
    formData.set("imageType", payload.imageType);
    return request<{ image: BuildPostImage }>(`/api/builds/${id}/images`, {
      method: "POST",
      body: formData
    });
  },
  updateBuildPostImage: (id: string, imageId: string, imageType: string) =>
    request<{ image: BuildPostImage }>(`/api/builds/${id}/images/${imageId}`, {
      method: "PATCH",
      json: { imageType }
    }),
  deleteBuildPostImage: (id: string, imageId: string) =>
    request<void>(`/api/builds/${id}/images/${imageId}`, { method: "DELETE" }),
  deleteBuildPost: (id: string) => request<void>(`/api/builds/${id}`, { method: "DELETE" })
};
