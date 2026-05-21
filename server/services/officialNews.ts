import { createHash } from "node:crypto";
import type {
  ExtractedNewsEventType,
  ExtractedNewsInfoStatus,
  ExtractedNewsItemType,
  PrismaClient,
  SourceArticleType,
} from "@prisma/client";
import { prisma } from "../prisma.js";

const SOURCE = "granbluefantasy_official_news";
const API_BASE = "https://granbluefantasy.com/rcms-api";
const API_ID = "1";
const OFFICIAL_NEWS_BASE = "https://granbluefantasy.com/ja/news";
const USER_AGENT = "saisoku-official-news-fetcher/0.1";
const CATEGORY_ORDER = ["update", "character", "event", "media"];
const LATEST_NEWS_COUNT = 10;
const CATEGORY_NEWS_COUNT = 30;
const ARCHIVE_NEWS_COUNT = 30;

type FetchRunType = "latest" | "month" | "reanalyze";

type RcmsCategoryRef = {
  module_id: number;
  module_type?: string;
  topics_group_id?: number;
  slug?: string;
};

type RcmsNewsCategory = {
  topics_id: number;
  slug: string;
  subject: string;
};

type RcmsNewsArticle = {
  topics_id: number;
  ymd?: string;
  post_time?: string;
  subject: string;
  slug?: string;
  categories?: RcmsCategoryRef[];
  content?: string;
  excerpt?: string;
  thumb?: unknown;
  old_thumb?: unknown;
};

type RcmsListResponse = {
  errors?: unknown[];
  messages?: unknown[];
  list?: RcmsNewsArticle[];
  pageInfo?: {
    totalCnt?: number;
    pageNo?: number;
    totalPageCnt?: number;
  };
};

type RcmsNavResponse = {
  news?: RcmsNewsArticle[];
  categories?: RcmsNewsCategory[];
};

type RcmsDetailResponse = {
  errors?: unknown[];
  messages?: unknown[];
  details?: RcmsNewsArticle;
  prev_id?: number | null;
  next_id?: number | null;
};

type NormalizedArticle = {
  sourceArticleId: string;
  slug: string | null;
  title: string;
  officialUrl: string;
  publishedAt: Date | null;
  categoryIds: number[];
  categorySlugs: string[];
  articleType: SourceArticleType;
  contentHash: string | null;
  content: string;
};

type ExtractedNewsItemCandidate = {
  itemType: ExtractedNewsItemType;
  title: string | null;
  eventType: ExtractedNewsEventType;
  startsAt: Date | null;
  endsAt: Date | null;
  updateAtCandidate: Date | null;
  rawDateText: string | null;
  summary: string | null;
  infoStatus: ExtractedNewsInfoStatus;
  extractionConfidence: number;
  tags: string[];
  relatedKey: string | null;
  displayPriority: number;
  isVisible: boolean;
};

type ImportSummary = {
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
};

type OfficialNewsServiceOptions = {
  client?: PrismaClient;
};

export class OfficialNewsService {
  private readonly db: PrismaClient;

  constructor(options: OfficialNewsServiceOptions = {}) {
    this.db = options.client ?? prisma;
  }

  async fetchLatestNews() {
    return this.fetchNewsList("news", {
      cnt: LATEST_NEWS_COUNT,
      pageID: 1,
      _lang: "ja",
    });
  }

  async fetchCategoryNav() {
    return this.fetchJson<RcmsNavResponse>("news-nav", { _lang: "ja" });
  }

  async fetchCategorizedNews(categorySlug: string) {
    const nav = await this.fetchCategoryNav();
    const category = nav.categories?.find((item) => item.slug === categorySlug);
    return this.fetchNewsList("categorized-news", {
      cnt: CATEGORY_NEWS_COUNT,
      pageID: 1,
      filter: category ? `categories.module_id contains ${category.topics_id}` : undefined,
      _lang: "ja",
    });
  }

  async fetchMonthlyArchive(yearMonth: string) {
    const { year, month } = parseYearMonth(yearMonth);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
    return this.fetchNewsList("news-archive", {
      cnt: ARCHIVE_NEWS_COUNT,
      pageID: 1,
      filter: `(ymd >= "${startDate}" AND ymd <= "${endDate}")`,
      _lang: "ja",
    });
  }

  async fetchArticleDetail(articleId: string | number) {
    return this.fetchJson<RcmsDetailResponse>(`news/details/${articleId}`, {
      cnt: 1,
      _lang: "ja",
    });
  }

  async syncLatestNews() {
    const startedAt = new Date();
    const summary = emptySummary();
    let logError: string | null = null;

    try {
      const nav = await this.fetchCategoryNav();
      await this.upsertCategories(nav.categories ?? []);
      const latest = await this.fetchLatestNews();
      await this.importArticles(latest.list ?? [], nav.categories ?? [], summary, { fetchDetails: true });
    } catch (error) {
      summary.failedCount += 1;
      logError = toErrorMessage(error);
      summary.errors.push(logError);
    }

    await this.writeFetchLog("latest", null, startedAt, summary, logError);
    return summary;
  }

  async syncMonthlyArchive(yearMonth: string) {
    const startedAt = new Date();
    const summary = emptySummary();
    let logError: string | null = null;

    try {
      const nav = await this.fetchCategoryNav();
      await this.upsertCategories(nav.categories ?? []);
      const archive = await this.fetchMonthlyArchive(yearMonth);
      await this.importArticles(archive.list ?? [], nav.categories ?? [], summary, { fetchDetails: true });
    } catch (error) {
      summary.failedCount += 1;
      logError = toErrorMessage(error);
      summary.errors.push(logError);
    }

    await this.writeFetchLog("month", yearMonth, startedAt, summary, logError);
    return summary;
  }

  async reanalyzeArticle(articleId: string) {
    const startedAt = new Date();
    const summary = emptySummary();
    let logError: string | null = null;

    try {
      const nav = await this.fetchCategoryNav();
      await this.upsertCategories(nav.categories ?? []);
      const detail = await this.fetchArticleDetail(articleId);
      if (!detail.details) {
        throw new Error(`Article detail was empty: ${articleId}`);
      }
      await this.importArticles([detail.details], nav.categories ?? [], summary, { fetchDetails: false });
    } catch (error) {
      summary.failedCount += 1;
      logError = toErrorMessage(error);
      summary.errors.push(logError);
    }

    await this.writeFetchLog("reanalyze", articleId, startedAt, summary, logError);
    return summary;
  }

  private async importArticles(
    articles: RcmsNewsArticle[],
    categories: RcmsNewsCategory[],
    summary: ImportSummary,
    options: { fetchDetails: boolean },
  ) {
    const categoryById = new Map(categories.map((category) => [category.topics_id, category]));

    for (const article of articles) {
      summary.fetchedCount += 1;
      try {
        const detail = options.fetchDetails ? await this.fetchArticleDetail(article.topics_id) : null;
        const articleForSave = detail?.details ?? article;
        const normalized = normalizeArticle(articleForSave, categoryById);
        const previous = await this.db.sourceArticle.findUnique({
          where: {
            source_sourceArticleId: {
              source: SOURCE,
              sourceArticleId: normalized.sourceArticleId,
            },
          },
          select: {
            id: true,
            contentHash: true,
          },
        });
        const saved = await this.db.sourceArticle.upsert({
          where: {
            source_sourceArticleId: {
              source: SOURCE,
              sourceArticleId: normalized.sourceArticleId,
            },
          },
          create: {
            source: SOURCE,
            sourceArticleId: normalized.sourceArticleId,
            slug: normalized.slug,
            title: normalized.title,
            officialUrl: normalized.officialUrl,
            publishedAt: normalized.publishedAt,
            categoryIds: normalized.categoryIds,
            categorySlugs: normalized.categorySlugs,
            articleType: normalized.articleType,
            contentHash: normalized.contentHash,
            status: "active",
          },
          update: {
            slug: normalized.slug,
            title: normalized.title,
            officialUrl: normalized.officialUrl,
            publishedAt: normalized.publishedAt,
            categoryIds: normalized.categoryIds,
            categorySlugs: normalized.categorySlugs,
            articleType: normalized.articleType,
            contentHash: normalized.contentHash,
            lastCheckedAt: new Date(),
            status: "active",
          },
        });

        if (!previous) {
          summary.insertedCount += 1;
        } else if (previous.contentHash !== normalized.contentHash) {
          summary.updatedCount += 1;
        }

        await this.replaceExtractedNewsItems(saved.id, normalized);
      } catch (error) {
        summary.failedCount += 1;
        summary.errors.push(`article ${article.topics_id}: ${toErrorMessage(error)}`);
      }
    }
  }

  private async replaceExtractedNewsItems(sourceArticleId: string, article: NormalizedArticle) {
    const extractedItems = extractNewsItems(article);
    await this.db.extractedNewsItem.deleteMany({
      where: { sourceArticleId },
    });
    if (extractedItems.length === 0) return;

    await this.db.extractedNewsItem.createMany({
      data: extractedItems.map((item) => ({
        sourceArticleId,
        itemType: item.itemType,
        title: item.title,
        eventType: item.eventType,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        updateAtCandidate: item.updateAtCandidate,
        rawDateText: item.rawDateText,
        summary: item.summary,
        infoStatus: item.infoStatus,
        extractionConfidence: item.extractionConfidence,
        tags: item.tags,
        relatedKey: item.relatedKey,
        displayPriority: item.displayPriority,
        isVisible: item.isVisible,
      })),
    });
  }

  private async upsertCategories(categories: RcmsNewsCategory[]) {
    for (const category of categories) {
      await this.db.officialNewsCategory.upsert({
        where: {
          source_sourceCategoryId: {
            source: SOURCE,
            sourceCategoryId: category.topics_id,
          },
        },
        create: {
          source: SOURCE,
          sourceCategoryId: category.topics_id,
          slug: category.slug,
          name: category.subject,
          sortOrder: CATEGORY_ORDER.indexOf(category.slug) >= 0 ? CATEGORY_ORDER.indexOf(category.slug) : 999,
        },
        update: {
          slug: category.slug,
          name: category.subject,
          sortOrder: CATEGORY_ORDER.indexOf(category.slug) >= 0 ? CATEGORY_ORDER.indexOf(category.slug) : 999,
          fetchedAt: new Date(),
        },
      });
    }
  }

  private async writeFetchLog(
    runType: FetchRunType,
    targetPeriod: string | null,
    startedAt: Date,
    summary: ImportSummary,
    errorMessage: string | null,
  ) {
    await this.db.newsFetchLog.create({
      data: {
        runType,
        targetPeriod,
        fetchedCount: summary.fetchedCount,
        insertedCount: summary.insertedCount,
        updatedCount: summary.updatedCount,
        failedCount: summary.failedCount,
        errorMessage: errorMessage ?? (summary.errors.length ? summary.errors.slice(0, 10).join("\n") : null),
        startedAt,
        finishedAt: new Date(),
      },
    });
  }

  private async fetchNewsList(endpoint: string, params: Record<string, string | number | undefined>) {
    return this.fetchJson<RcmsListResponse>(endpoint, params);
  }

  private async fetchJson<T>(endpoint: string, params: Record<string, string | number | undefined>) {
    const url = buildApiUrl(endpoint, params);
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        accept: "application/json",
        "accept-language": "ja,en-US;q=0.8,en;q=0.6",
        "user-agent": USER_AGENT,
      },
    });
    if (!response.ok) {
      throw new Error(`rcms-api request failed: ${response.status} ${response.statusText} ${url}`);
    }
    return (await response.json()) as T;
  }
}

function normalizeArticle(article: RcmsNewsArticle, categoryById: Map<number, RcmsNewsCategory>): NormalizedArticle {
  const sourceArticleId = String(article.topics_id);
  const categoryIds = (article.categories ?? []).map((category) => category.module_id).filter(Number.isFinite);
  const categorySlugs = categoryIds
    .map((id) => categoryById.get(id)?.slug)
    .filter((slug): slug is string => Boolean(slug));
  const slug = article.slug?.trim() || null;
  const content = article.content ?? "";
  return {
    sourceArticleId,
    slug,
    title: article.subject.trim(),
    officialUrl: `${OFFICIAL_NEWS_BASE}/${slug || sourceArticleId}/`,
    publishedAt: parsePublishedAt(article.ymd, article.post_time),
    categoryIds,
    categorySlugs,
    articleType: classifyArticle(article.subject, categorySlugs),
    contentHash: content ? createHash("sha256").update(content).digest("hex") : null,
    content,
  };
}

function classifyArticle(title: string, categorySlugs: string[]): SourceArticleType {
  const text = title.toLowerCase();
  if (/これからの|今月号|ロードマップ/.test(title)) return "monthly_plan";
  if (/メンテナンス|不具合|障害/.test(title)) return "maintenance";
  if (/グランデフェス|レジェンドフェス|ガチャ|スターレジェンド|サプライズ.*ガチャ|スタレ/.test(title)) return "gacha";
  if (/キャンペーン|無料.*連|半額|プレゼント/.test(title)) return "campaign";
  if (/イベント|コラボ|開催のお知らせ|復刻|シナリオイベント/.test(title)) return "event";
  if (categorySlugs.includes("character") || /キャラクター|最終上限解放|バランス調整/.test(title)) return "character";
  if (categorySlugs.includes("media") || /ぐらぶるtv|配信|放送|グッズ|cd|blu-ray|サントラ/i.test(text)) return "media";
  if (categorySlugs.includes("update") || /アップデート|追加|調整|変更/.test(title)) return "update";
  return "other";
}

function extractNewsItems(article: NormalizedArticle): ExtractedNewsItemCandidate[] {
  const text = normalizeText(article.content);
  const rawDateText = findDateRangeText(text);
  const parsedRange = rawDateText ? parseDateRange(rawDateText, article.publishedAt) : { startsAt: null, endsAt: null };
  const updateAtCandidate = findUpdateAtCandidate(text, article.publishedAt);
  const title = findItemTitleCandidate(article.title, text);
  const itemType = toExtractedItemType(article.articleType);
  const eventType = itemType === "event" ? classifyEventType(article.title, text) : "unknown";
  const infoStatus = inferInfoStatus(text, parsedRange.startsAt);
  const extractionConfidence = calculateConfidence({
    title,
    startsAt: parsedRange.startsAt,
    endsAt: parsedRange.endsAt,
    rawDateText,
  });

  if (!rawDateText && !title) return [];

  return [{
    itemType,
    title,
    eventType,
    startsAt: parsedRange.startsAt,
    endsAt: parsedRange.endsAt,
    updateAtCandidate,
    rawDateText,
    summary: rawDateText,
    infoStatus,
    extractionConfidence,
    tags: buildExtractedTags(article, eventType),
    relatedKey: buildRelatedKey(article, title),
    displayPriority: 0,
    isVisible: true,
  }];
}

function findItemTitleCandidate(title: string, text: string) {
  const quoted = text.match(/(?:イベント|キャンペーン)?[「『]([^」』]{2,80})[」』](?:を)?(?:開催|実施|追加|復刻)/);
  if (quoted?.[1]) return quoted[1].trim();
  const titleQuoted = title.match(/[「『]([^」』]{2,80})[」』]/);
  if (titleQuoted?.[1]) return titleQuoted[1].trim();
  if (/開催|イベント|キャンペーン|フェス|ガチャ|アップデート|メンテナンス|不具合/.test(title)) return title.trim();
  return null;
}

function toExtractedItemType(articleType: SourceArticleType): ExtractedNewsItemType {
  if (articleType === "monthly_plan") return "monthly_plan_item";
  if (articleType === "media") return "other";
  return articleType;
}

function classifyEventType(title: string, text: string): ExtractedNewsEventType {
  const combined = `${title}\n${text}`;
  if (/コラボ|collaboration/i.test(combined)) return "collaboration_event";
  if (/復刻/.test(combined)) return "rerun_event";
  if (/決戦|古戦場/.test(combined)) return "guild_war";
  if (/ドレッドバラージュ/.test(combined)) return "dread_barrage";
  if (/四象|四象降臨/.test(combined)) return "rotb";
  if (/ゼノ/.test(combined)) return "xeno_clash";
  if (/ブレイブグラウンド/.test(combined)) return "proving_grounds";
  if (/バブ・イール|バブイール|塔/.test(combined)) return "tower_of_babyl";
  if (/アーカルム|外伝/.test(combined)) return "arcarum_event";
  if (/サイドストーリー/.test(combined)) return "side_story";
  if (/シナリオイベント|イベント[「『]/.test(combined)) return "scenario_event";
  if (/イベント|キャンペーン/.test(combined)) return "special_event";
  return "unknown";
}

function inferInfoStatus(text: string, startsAt: Date | null): ExtractedNewsInfoStatus {
  if (/予定|後日|後編を追加予定|実施予定|開催予定/.test(text)) return "scheduled";
  if (/場合があります|予定です|変更となる場合/.test(text)) return "tentative";
  if (startsAt || /開催|実施|提供|販売/.test(text)) return "confirmed";
  return "unknown";
}

function buildExtractedTags(article: NormalizedArticle, eventType: ExtractedNewsEventType) {
  return [
    article.articleType,
    ...article.categorySlugs,
    eventType !== "unknown" ? eventType : "",
  ].filter(Boolean);
}

function buildRelatedKey(article: NormalizedArticle, title: string | null) {
  const base = title ?? article.title;
  return `${article.sourceArticleId}:${base}`.slice(0, 160);
}

function findDateRangeText(text: string) {
  const labels = ["開催期間", "実施期間", "提供期間", "販売期間", "交換期間", "登場期間"];
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:：]?\\s*[^。\\n]{0,180}(?:～|~|から)[^。\\n]{0,180}`));
    if (match) return normalizeText(match[0]).slice(0, 360);
  }
  const range = text.match(/\d{4}[\/年]\d{1,2}[\/月]\d{1,2}[^。\n]{0,80}(?:～|~|から)[^。\n]{0,160}/);
  if (range) return normalizeText(range[0]).slice(0, 360);
  const shortRange = text.match(/\d{1,2}\/\d{1,2}[^。\n]{0,80}(?:～|~|から)[^。\n]{0,160}/);
  return shortRange ? normalizeText(shortRange[0]).slice(0, 360) : null;
}

function findUpdateAtCandidate(text: string, publishedAt: Date | null) {
  const match = text.match(/(?:追加|更新)(?:予定)?[^。\n]{0,60}?(\d{4}[\/年]\d{1,2}[\/月]\d{1,2}|\d{1,2}\/\d{1,2})[^0-9]{0,12}(\d{1,2}:\d{2})/);
  if (!match) return null;
  return parseLooseDate(match[1], match[2], publishedAt)?.date ?? null;
}

function parseDateRange(rawDateText: string, publishedAt: Date | null) {
  const [left, right] = rawDateText.split(/(?:～|~|から)/, 2);
  const startsAt = parseFirstDateInText(left, publishedAt);
  const endsAt = parseFirstDateInText(right ?? "", startsAt ?? publishedAt);
  return { startsAt, endsAt };
}

function parseFirstDateInText(text: string, baseDate: Date | null) {
  const full = text.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})(?:日)?(?:\s*[（(][^)）]+[）)])?[^0-9]{0,12}(\d{1,2}:\d{2})?/);
  if (full) {
    return toJstDate(Number(full[1]), Number(full[2]), Number(full[3]), full[4] ?? "00:00");
  }
  const short = text.match(/(\d{1,2})\/(\d{1,2})(?:\s*[（(][^)）]+[）)])?[^0-9]{0,12}(\d{1,2}:\d{2})?/);
  if (short) {
    const year = baseDate ? Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric" }).format(baseDate)) : new Date().getFullYear();
    return toJstDate(year, Number(short[1]), Number(short[2]), short[3] ?? "00:00");
  }
  return null;
}

function parseLooseDate(dateText: string, timeText: string, baseDate: Date | null) {
  const full = dateText.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})/);
  if (full) return { date: toJstDate(Number(full[1]), Number(full[2]), Number(full[3]), timeText) };

  const short = dateText.match(/(\d{1,2})\/(\d{1,2})/);
  if (!short) return null;
  const year = baseDate ? Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric" }).format(baseDate)) : new Date().getFullYear();
  return { date: toJstDate(year, Number(short[1]), Number(short[2]), timeText) };
}

function calculateConfidence(candidate: {
  title: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  rawDateText: string | null;
}) {
  let confidence = 0;
  if (candidate.title) confidence += 0.25;
  if (candidate.rawDateText) confidence += 0.2;
  if (candidate.startsAt) confidence += 0.25;
  if (candidate.endsAt) confidence += 0.25;
  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

function parsePublishedAt(ymd?: string, postTime?: string) {
  if (!ymd) return null;
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return toJstDate(Number(match[1]), Number(match[2]), Number(match[3]), postTime ?? "00:00:00");
}

function toJstDate(year: number, month: number, day: number, timeText: string) {
  const [hour = "0", minute = "0", second = "0"] = timeText.split(":");
  return new Date(
    Date.UTC(year, month - 1, day, Number(hour) - 9, Number(minute), Number(second)),
  );
}

function normalizeText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function buildApiUrl(endpoint: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE}/${API_ID}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function parseYearMonth(yearMonth: string) {
  const match = yearMonth.match(/^(\d{4})-?(\d{2})$/);
  if (!match) throw new Error(`Invalid yearMonth. Use YYYYMM or YYYY-MM: ${yearMonth}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`Invalid month: ${yearMonth}`);
  return { year, month };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function emptySummary(): ImportSummary {
  return {
    fetchedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
