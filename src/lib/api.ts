import type { User, GoalSubTask, GoalSubTaskInput, ProgressPreset, ProgressGoalStage, ProgressGoal, GoalVisibility, GoalBoardState, Goal, RoundGoal, SimpleBuildImage, SimpleBuildFields, SimpleBuildPost, BuildDraft, RaidGuideStickyNote, RaidGuideStrategy, RaidGuideQuest, RaidGuideDetail, RaidGuideRow, RaidGuideReader, RaidGuideStrategyInput, GuildWarGoalDay, GuildWarBossSpeed, GuildWarGoalPlan, GuildWarBossMaster, GuildWarGoalPayload, SparkSavings, SparkSavingsInput, SparkAvailabilityPeriod, SparkTarget, SparkTargetInput, SparkTargetMasterOption, SparkHistoryEntry, SparkRewardEventType, SparkRewardMonthSummary, SourceArticleType, ExtractedNewsItemType, ExtractedNewsEventType, ExtractedNewsInfoStatus, ExtractedNewsItem, SourceArticle, NewsFetchLog, OfficialNewsFetchResult, EventNoteLinkInput, EventNoteLink, EventNoteInput, EventNote, EventNoteCandidate, EventSeries, EventOccurrenceInput, EventOccurrence, OfficialNewsListParams, GbfMasterKind, GbfMasterItem, GbfMasterAlias, BuildMastersResponse, BuildMastersQuery } from "./apiTypes";
export type { User, GoalSubTask, GoalSubTaskInput, ProgressPreset, ProgressGoalStage, ProgressGoal, GoalVisibility, GoalBoardState, Goal, RoundGoal, SimpleBuildImage, SimpleBuildFields, SimpleBuildPost, BuildDraft, RaidGuideStickyNote, RaidGuideStrategy, RaidGuideQuest, RaidGuideDetail, RaidGuideRow, RaidGuideReader, RaidGuideStrategyInput, GuildWarGoalDay, GuildWarBossSpeed, GuildWarGoalPlan, GuildWarBossMaster, GuildWarGoalPayload, SparkSavings, SparkSavingsInput, SparkAvailabilityPeriod, SparkTarget, SparkTargetInput, SparkTargetMasterOption, SparkHistoryEntry, SparkRewardEventType, SparkRewardMonthSummary, SourceArticleType, ExtractedNewsItemType, ExtractedNewsEventType, ExtractedNewsInfoStatus, ExtractedNewsItem, SourceArticle, NewsFetchLog, OfficialNewsFetchResult, EventNoteLinkInput, EventNoteLink, EventNoteInput, EventNote, EventNoteCandidate, EventSeries, EventOccurrenceInput, EventOccurrence, OfficialNewsListParams, GbfMasterKind, GbfMasterItem, GbfMasterAlias, BuildMastersResponse, BuildMastersQuery } from "./apiTypes";

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

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
    throw new ApiRequestError(message, response.status);
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
