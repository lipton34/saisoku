export type User = {
  id: string;
  username: string;
  displayName: string | null;
};

export type GoalSubTask = {
  id: string;
  goalId: string;
  kind: "standard" | "round" | "progress";
  title: string | null;
  isDone: boolean;
  automaticIsDone: boolean;
  effectiveIsDone: boolean;
  completionOverride: boolean | null;
  sortOrder: number;
  sourceRoundGoalId: string | null;
  sourceProgressGoalId: string | null;
  sourceRoundGoal: RoundGoal | null;
  sourceProgressGoal: { id: string; targetName: string; progressRate: number } | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalSubTaskInput =
  | { kind: "standard"; title: string }
  | { kind: "round"; sourceRoundGoalId: string }
  | { kind: "progress"; sourceProgressGoalId: string };


export type ProgressPreset = {
  id: string;
  version: number;
  name: string;
  targetLabel: string;
  selectionLabel?: string;
  selectionOptions?: string[];
  fields?: Array<
    | { id: string; label: string; type: "select"; options: string[]; defaultValue: string }
    | { id: string; label: string; type: "integer"; min: number; max: number; defaultValue: number }
  >;
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
  pinnedMaterialKeys: string[];
  goalStageId: string;
  targetStageId: string;
  availableTargetStageIds: string[];
  startingStageId: string | null;
  stages: ProgressGoalStage[];
  completedStageIds: string[];
  completedCount: number;
  totalStageCount: number;
  progressRate: number;
  sortOrder?: number;
  boardGoal?: Goal | null;
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

export type GoalVisibility = "personal" | "crew";
export type GoalBoardState = "unset" | "now" | "later";

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  memo: string | null;
  visibility: GoalVisibility;
  boardStatus: GoalBoardState;
  sortOrder: number;
  ownerId: string;
  owner: { id: string; username: string; displayName: string | null };
  sourceRoundGoalId: string | null;
  sourceRoundGoal: RoundGoal | null;
  sourceProgressGoalId: string | null;
  sourceProgressGoal: {
    id: string;
    presetName: string;
    targetName: string;
    goalStageId: string;
    updatedAt: string;
  } | null;
  subTasks: GoalSubTask[];
  completedSubTaskCount: number;
  totalSubTaskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RoundGoal = {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  note: string | null;
  sortOrder: number;
  ownerId: string;
  boardGoal: Goal | null;
  createdAt: string;
  updatedAt: string;
};

export type SimpleBuildImage = {
  id: string;
  publicUrl: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  displayOrder: number;
};

export type SimpleBuildFields = {
  title?: string | null;
  questName?: string | null;
  overview?: string | null;
  supplementalNotes?: string | null;
  referenceUrl?: string | null;
};

export type SimpleBuildPost = SimpleBuildFields & {
  id: string;
  title: string;
  normalizedTitle: string;
  ownerId: string;
  authorName: string;
  images: SimpleBuildImage[];
  createdAt: string;
  updatedAt: string;
};

export type BuildDraft = SimpleBuildFields & {
  id: string;
  ownerId: string;
  images: SimpleBuildImage[];
  createdAt: string;
  updatedAt: string;
};

export type RaidGuideStickyNote = {
  id: string;
  strategyId: string;
  guideRowId: string | null;
  body: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RaidGuideStrategy = {
  id: string;
  guideId: string;
  ownerId: string;
  title: string;
  overview: string | null;
  visibility: "crew" | "personal";
  buildPostId: string | null;
  slotNumber: number;
  owner: { id: string; username: string; displayName: string | null };
  authorName: string;
  stickyNotes: RaidGuideStickyNote[];
  stickyNoteCount: number;
  buildPost: {
    id: string;
    title: string;
    questName: string | null;
    images: SimpleBuildImage[];
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type RaidGuideQuest = {
  id: string;
  name: string;
  element: string | null;
  category: string | null;
  guides: { id: string; title: string; createdAt: string }[];
};

export type RaidGuideDetail = {
  id: string;
  questMasterId: string;
  title: string;
  overview: string | null;
  revision: number;
  isActive: boolean;
  questMaster: { id: string; name: string; displayName: string | null; element: string | null };
  references: { id: string; url: string; label: string; sortOrder: number }[];
  createdAt: string;
  updatedAt: string;
};

export type RaidGuideRow = {
  id: string;
  guideId: string;
  sectionId: string;
  timingCondition: string;
  enemyAction: string;
  requiredResponse: string;
  supplementalNote: string | null;
  pageType: "guide" | "heading";
  dangerLevel: "normal" | "caution" | "danger";
  sortOrder: number;
  outgoingLinks: { id: string; targetRowId: string; label: string; sortOrder: number }[];
};

export type RaidGuideReader = RaidGuideDetail & {
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    rows: RaidGuideRow[];
  }>;
};

export type RaidGuideStrategyInput = {
  title: string;
  overview?: string;
  visibility: "crew" | "personal";
  buildPostId?: string | null;
  expectedUpdatedAt?: string;
  stickyNotes: Array<{
    guideRowId: string | null;
    body: string;
    color: RaidGuideStickyNote["color"];
  }>;
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

export type SparkSavings = {
  id: string;
  crystalCount: number;
  singleTicketCount: number;
  tenPullTicketCount: number;
  historyStartedAt: string | null;
  historySummaryStartMonth: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SparkSavingsInput = {
  crystalCount: string;
  singleTicketCount: string;
  tenPullTicketCount: string;
};

export type SparkAvailabilityPeriod = { id: string; kind: "annual" | "permanent" | "irregular"; displayLabel: string; startMonth: number | null; startPart: string | null; endMonth: number | null; endPart: string | null; isActive: boolean; updatedAt: string };
export type SparkTarget = { id: string; itemType: "character" | "summon" | "weapon"; name: string; masterItemId: string | null; desiredCount: number; ownedCount: number; availabilityLinks: { availabilityPeriod: SparkAvailabilityPeriod }[]; note: string | null; sortOrder: number; goalLinks: { goal: { id: string; title: string; visibility: string } }[]; buildLinks: { buildPost: { id: string; title: string } }[]; updatedAt: string };
export type SparkTargetInput = { itemType: string; name: string; masterItemId: string | null; desiredCount: number; ownedCount: number; availabilityPeriodIds: string[]; note: string | null; sortOrder: number; goalIds: string[]; buildPostIds: string[] };
export type SparkTargetMasterOption = { id: string; name: string; displayName: string | null; element: string | null; category: string | null; availabilityPeriods: { id: string; displayLabel: string }[] };
export type SparkHistoryEntry = { id: string; entryType: "start" | "earn" | "spend" | "adjustment"; crystalDelta: number; singleTicketDelta: number; tenPullTicketDelta: number; crystalBalance: number; singleTicketBalance: number; tenPullTicketBalance: number; title: string; memo: string | null; createdAt: string };
export type SparkRewardEventType = { id: string; name: string; aggregationKind: "scheduled" | "monthlyBaseline"; isActive: boolean; sortOrder: number; updatedAt: string };
export type SparkRewardMonthSummary = { year: number; month: number; min: number | null; max: number | null; records: { id: string; name: string; eventTypeName: string; min: number | null; max: number | null }[]; schedules: { id: string; name: string; eventTypeName: string; startedOn: string; endedOn: string | null }[] };

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
  goals: (scope: "personal" | "crew") => request<{ goals: Goal[] }>(`/api/goals?scope=${scope}`),
  goal: (id: string) => request<{ goal: Goal }>(`/api/goals/${id}`),
  createGoal: (goal: { title: string; description?: string; memo?: string; subTasks?: GoalSubTaskInput[] }) =>
    request<{ goal: Goal }>("/api/goals", { method: "POST", json: goal }),
  updateGoal: (
    id: string,
    goal: Partial<Pick<Goal, "title" | "description" | "memo" | "visibility" | "boardStatus">> & {
      confirmCrewPublish?: boolean;
      expectedUpdatedAt?: string;
    }
  ) => request<{ goal: Goal }>(`/api/goals/${id}`, { method: "PATCH", json: goal }),
  deleteGoal: (id: string) => request<void>(`/api/goals/${id}`, { method: "DELETE" }),
  unlinkGoalSource: (id: string) => request<void>(`/api/goals/${id}/source-link`, { method: "DELETE" }),
  createGoalSubTask: (id: string, value: GoalSubTaskInput & { expectedGoalUpdatedAt?: string }) =>
    request<{ goal: Goal }>(`/api/goals/${id}/sub-tasks`, { method: "POST", json: value }),
  updateGoalSubTask: (
    id: string,
    subTaskId: string,
    value: { title?: string; isDone?: boolean; completionOverride?: boolean | null; expectedUpdatedAt?: string }
  ) =>
    request<{ goal: Goal }>(`/api/goals/${id}/sub-tasks/${subTaskId}`, {
      method: "PATCH",
      json: value
    }),
  reorderGoalSubTasks: (id: string, subTaskIds: string[], expectedGoalUpdatedAt: string) =>
    request<{ goal: Goal }>(`/api/goals/${id}/sub-tasks/order`, {
      method: "PUT",
      json: { subTaskIds, expectedGoalUpdatedAt }
    }),
  deleteGoalSubTask: (id: string, subTaskId: string, expectedGoalUpdatedAt: string) =>
    request<{ goal: Goal }>(`/api/goals/${id}/sub-tasks/${subTaskId}?expectedGoalUpdatedAt=${encodeURIComponent(expectedGoalUpdatedAt)}`, {
      method: "DELETE"
    }),
  roundGoals: () => request<{ goals: RoundGoal[] }>("/api/round-goals"),
  createRoundGoal: (goal: {
    title: string;
    targetCount: number;
    currentCount?: number;
    note?: string;
    showOnBoard?: boolean;
  }) => request<{ goal: RoundGoal }>("/api/round-goals", { method: "POST", json: goal }),
  roundGoal: (id: string) => request<{ goal: RoundGoal }>(`/api/round-goals/${id}`),
  updateRoundGoal: (id: string, goal: Partial<Omit<RoundGoal, "id" | "ownerId" | "boardGoal" | "createdAt" | "updatedAt">> & { showOnBoard?: boolean }) =>
    request<{ goal: RoundGoal }>(`/api/round-goals/${id}`, { method: "PATCH", json: goal }),
  reorderRoundGoals: (goalIds: string[]) =>
    request<void>("/api/round-goals/order", { method: "PUT", json: { goalIds } }),
  deleteRoundGoal: (id: string) => request<void>(`/api/round-goals/${id}`, { method: "DELETE" }),
  simpleBuildPosts: (query?: string) =>
    request<{ posts: SimpleBuildPost[] }>(`/api/builds${toQuery({ query })}`),
  simpleBuildPost: (id: string) => request<{ post: SimpleBuildPost }>(`/api/builds/${id}`),
  createSimpleBuildPost: (post: SimpleBuildFields) =>
    request<{ post: SimpleBuildPost }>("/api/builds", { method: "POST", json: post }),
  updateSimpleBuildPost: (id: string, post: SimpleBuildFields) =>
    request<{ post: SimpleBuildPost }>(`/api/builds/${id}`, { method: "PATCH", json: post }),
  deleteSimpleBuildPost: (id: string) => request<void>(`/api/builds/${id}`, { method: "DELETE" }),
  buildDrafts: () => request<{ drafts: BuildDraft[] }>("/api/build-drafts"),
  buildDraft: (id: string) => request<{ draft: BuildDraft }>(`/api/build-drafts/${id}`),
  createBuildDraft: (draft: SimpleBuildFields) =>
    request<{ draft: BuildDraft }>("/api/build-drafts", { method: "POST", json: draft }),
  updateBuildDraft: (id: string, draft: SimpleBuildFields) =>
    request<{ draft: BuildDraft }>(`/api/build-drafts/${id}`, { method: "PATCH", json: draft }),
  publishBuildDraft: (id: string) =>
    request<{ post: SimpleBuildPost }>(`/api/build-drafts/${id}/publish`, { method: "POST" }),
  deleteBuildDraft: (id: string) => request<void>(`/api/build-drafts/${id}`, { method: "DELETE" }),
  raidGuideQuests: () => request<{ quests: RaidGuideQuest[] }>("/api/raid-guides"),
  raidGuide: (guideId: string) => request<{
    guide: RaidGuideDetail;
    ownStrategies: RaidGuideStrategy[];
    crewStrategies: RaidGuideStrategy[];
  }>(`/api/raid-guides/${guideId}`),
  raidGuideReader: (guideId: string, strategyId?: string) =>
    request<{ guide: RaidGuideReader; strategy: RaidGuideStrategy | null }>(
      `/api/raid-guides/${guideId}/reader${toQuery({ strategyId })}`
    ),
  createRaidGuideStrategy: (guideId: string, value: RaidGuideStrategyInput) =>
    request<{ strategy: RaidGuideStrategy }>(`/api/raid-guides/${guideId}/strategies`, { method: "POST", json: value }),
  updateRaidGuideStrategy: (strategyId: string, value: RaidGuideStrategyInput) =>
    request<{ strategy: RaidGuideStrategy }>(`/api/raid-guide-strategies/${strategyId}`, { method: "PUT", json: value }),
  deleteRaidGuideStrategy: (strategyId: string) =>
    request<void>(`/api/raid-guide-strategies/${strategyId}`, { method: "DELETE" }),
  uploadSimpleBuildImage: (kind: "posts" | "drafts", id: string, file: File) => {
    const formData = new FormData();
    formData.set("image", file);
    const base = kind === "posts" ? "/api/builds" : "/api/build-drafts";
    return request<{ image: SimpleBuildImage }>(`${base}/${id}/images`, { method: "POST", body: formData });
  },
  deleteSimpleBuildImage: (kind: "posts" | "drafts", id: string, imageId: string) => {
    const base = kind === "posts" ? "/api/builds" : "/api/build-drafts";
    return request<void>(`${base}/${id}/images/${imageId}`, { method: "DELETE" });
  },
  reorderSimpleBuildImages: (kind: "posts" | "drafts", id: string, imageIds: string[]) => {
    const base = kind === "posts" ? "/api/builds" : "/api/build-drafts";
    return request<void>(`${base}/${id}/images/order`, { method: "PUT", json: { imageIds } });
  },
  progressPresets: () => request<{ presets: ProgressPreset[] }>("/api/progress-goals/presets"),
  progressGoals: () => request<{ goals: ProgressGoal[] }>("/api/progress-goals"),
  createProgressGoal: (goal: { presetId: string; targetId: string; goalStageId: string; completedStageIds?: string[]; selection?: Record<string, string>; showOnBoard?: boolean }) =>
    request<{ goal: ProgressGoal }>("/api/progress-goals", { method: "POST", json: goal }),
  reorderProgressGoals: (goalIds: string[]) =>
    request<void>("/api/progress-goals/order", { method: "PUT", json: { goalIds } }),
  linkProgressGoalToBoard: (goalId: string) =>
    request<{ goal: Goal }>(`/api/progress-goals/${goalId}/board-link`, { method: "POST" }),
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
  saveProgressPinnedMaterials: (goalId: string, itemKeys: string[], targetStageId: string) =>
    request<{ goal: ProgressGoal }>(`/api/progress-goals/${goalId}/pinned-materials`, { method: "PUT", json: { itemKeys, targetStageId } }),
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
  sparkSavings: () => request<{ sparkSavings: SparkSavings | null }>("/api/spark-savings"),
  saveSparkSavings: (value: SparkSavingsInput) =>
    request<{ sparkSavings: SparkSavings; message: string }>("/api/spark-savings", {
      method: "PUT",
      json: value
    }),
  resetSparkSavings: () =>
    request<{ sparkSavings: SparkSavings | null; message: string }>("/api/spark-savings/reset", {
      method: "POST"
    }),
  activateSparkHistory: () => request<{ sparkSavings: SparkSavings; message: string }>("/api/spark-savings/history/activate", { method: "POST" }),
  sparkHistory: (cursor?: string) => request<{ entries: SparkHistoryEntry[]; nextCursor: string | null }>(`/api/spark-savings/history${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  sparkHistorySummary: () => request<{ months: { month: string; earnedEquivalent: number; spentEquivalent: number; adjustmentEquivalent: number; entryCount: number }[] }>("/api/spark-savings/history/summary"),
  addSparkHistory: (value: SparkSavingsInput & { entryType: string; title: string; memo: string | null }) => request<{ sparkSavings: SparkSavings; entry: SparkHistoryEntry; message: string }>("/api/spark-savings/history/entries", { method: "POST", json: value }),
  updateSparkHistoryStart: (month: string) => request<{ sparkSavings: SparkSavings; message: string }>("/api/spark-savings/history/summary-start", { method: "PATCH", json: { month } }),
  deleteSparkHistory: () => request<{ sparkSavings: SparkSavings; message: string }>("/api/spark-savings/history", { method: "DELETE" }),
  sparkTargets: (showCompleted = false) => request<{ targets: SparkTarget[] }>(`/api/spark-targets?showCompleted=${showCompleted}`),
  sparkTargetOptions: () => request<{ periods: SparkAvailabilityPeriod[] }>("/api/spark-targets/options"),
  sparkTargetMasterOptions: (kind: string, query: string, filters: { element?: string; category?: string; series?: string }) => {
    const params = new URLSearchParams({ kind, query });
    if (filters.element) params.set("element", filters.element);
    if (filters.category) params.set("category", filters.category);
    if (filters.series) params.set("series", filters.series);
    return request<{ items: SparkTargetMasterOption[] }>(`/api/spark-targets/master-options?${params.toString()}`);
  },
  sparkTargetLinkOptions: (type: "goal" | "build", query: string) => request<{ items: { id: string; title: string }[] }>(`/api/spark-targets/link-options?type=${type}&query=${encodeURIComponent(query)}`),
  createSparkTarget: (value: SparkTargetInput) => request<{ target: SparkTarget; message: string }>("/api/spark-targets", { method: "POST", json: value }),
  updateSparkTarget: (id: string, value: SparkTargetInput) => request<{ target: SparkTarget; message: string }>(`/api/spark-targets/${id}`, { method: "PUT", json: value }),
  deleteSparkTarget: (id: string) => request<{ message: string }>(`/api/spark-targets/${id}`, { method: "DELETE" }),
  sparkRewardSummary: () => request<{ months: SparkRewardMonthSummary[] }>("/api/spark-rewards/summary"),
  sparkAvailabilityPeriods: () => request<{ periods: SparkAvailabilityPeriod[] }>("/api/spark-rewards/availability-periods"),
  createSparkAvailabilityPeriod: (value: Record<string, unknown>) => request<{ period: SparkAvailabilityPeriod; message: string }>("/api/spark-rewards/availability-periods", { method: "POST", json: value }),
  updateSparkAvailabilityPeriod: (id: string, value: Record<string, unknown>) => request<{ period: SparkAvailabilityPeriod; message: string }>(`/api/spark-rewards/availability-periods/${id}`, { method: "PUT", json: value }),
  deleteSparkAvailabilityPeriod: (id: string) => request<{ message: string }>(`/api/spark-rewards/availability-periods/${id}`, { method: "DELETE" }),
  sparkRewardEventTypes: () => request<{ eventTypes: SparkRewardEventType[] }>("/api/spark-rewards/event-types"),
  createSparkRewardEventType: (value: Record<string, unknown>) => request<{ eventType: SparkRewardEventType; message: string }>("/api/spark-rewards/event-types", { method: "POST", json: value }),
  updateSparkRewardEventType: (id: string, value: Record<string, unknown>) => request<{ eventType: SparkRewardEventType; message: string }>(`/api/spark-rewards/event-types/${id}`, { method: "PUT", json: value }),
  deleteSparkRewardEventType: (id: string) => request<{ message: string }>(`/api/spark-rewards/event-types/${id}`, { method: "DELETE" }),
  sparkRewardRecords: () => request<{ records: Array<Record<string, unknown> & { id: string; occurrenceName: string; year: number; month: number; updatedAt: string; eventType: SparkRewardEventType }> }>("/api/spark-rewards/records"),
  createSparkRewardRecord: (value: Record<string, unknown>) => request<{ message: string }>("/api/spark-rewards/records", { method: "POST", json: value }),
  updateSparkRewardRecord: (id: string, value: Record<string, unknown>) => request<{ message: string }>(`/api/spark-rewards/records/${id}`, { method: "PUT", json: value }),
  deleteSparkRewardRecord: (id: string) => request<{ message: string }>(`/api/spark-rewards/records/${id}`, { method: "DELETE" }),
  sparkRewardSchedules: () => request<{ schedules: Array<Record<string, unknown> & { id: string; name: string; startedOn: string; endedOn: string | null; updatedAt: string; eventType: SparkRewardEventType }> }>("/api/spark-rewards/schedules"),
  createSparkRewardSchedule: (value: Record<string, unknown>) => request<{ message: string }>("/api/spark-rewards/schedules", { method: "POST", json: value }),
  updateSparkRewardSchedule: (id: string, value: Record<string, unknown>) => request<{ message: string }>(`/api/spark-rewards/schedules/${id}`, { method: "PUT", json: value }),
  deleteSparkRewardSchedule: (id: string) => request<{ message: string }>(`/api/spark-rewards/schedules/${id}`, { method: "DELETE" }),
  updateSparkRewardMonthStatus: (year: number, month: number, isComplete: boolean) => request<{ message: string }>(`/api/spark-rewards/month-statuses/${year}/${month}`, { method: "PUT", json: { isComplete } }),
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
  }
};
