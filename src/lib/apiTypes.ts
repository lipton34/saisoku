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

