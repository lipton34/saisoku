import { ExternalLink, RefreshCcw, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  api,
  type ExtractedNewsEventType,
  type ExtractedNewsItem,
  type ExtractedNewsItemType,
  type NewsFetchLog,
  type SourceArticle,
  type SourceArticleType
} from "../lib/api";

const itemTypeOptions: { value: ExtractedNewsItemType; label: string }[] = [
  { value: "event", label: "イベント" },
  { value: "campaign", label: "キャンペーン" },
  { value: "update", label: "アップデート" },
  { value: "monthly_plan_item", label: "これグラ項目" },
  { value: "gacha", label: "ガチャ" },
  { value: "character", label: "キャラ" },
  { value: "maintenance", label: "メンテ" },
  { value: "other", label: "その他" }
];

const eventTypeOptions: { value: ExtractedNewsEventType; label: string }[] = [
  { value: "scenario_event", label: "シナリオ" },
  { value: "rerun_event", label: "復刻" },
  { value: "collaboration_event", label: "コラボ" },
  { value: "guild_war", label: "古戦場" },
  { value: "dread_barrage", label: "ドレバラ" },
  { value: "rotb", label: "四象" },
  { value: "xeno_clash", label: "ゼノ" },
  { value: "proving_grounds", label: "ブレグラ" },
  { value: "tower_of_babyl", label: "バブ塔" },
  { value: "arcarum_event", label: "アーカルム" },
  { value: "side_story", label: "サイド" },
  { value: "special_event", label: "特別" },
  { value: "unknown", label: "不明" }
];

const articleTypeOptions: { value: SourceArticleType; label: string }[] = [
  { value: "monthly_plan", label: "これグラ" },
  { value: "event", label: "イベント" },
  { value: "campaign", label: "キャンペーン" },
  { value: "update", label: "アップデート" },
  { value: "gacha", label: "ガチャ" },
  { value: "character", label: "キャラ" },
  { value: "media", label: "メディア" },
  { value: "maintenance", label: "メンテ" },
  { value: "other", label: "その他" }
];

function labelFor<T extends string>(options: { value: T; label: string }[], value: T | string | null | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? "-";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}

function formatDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00+09:00`).toISOString() : undefined;
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function periodText(item: ExtractedNewsItem) {
  if (item.startsAt && item.endsAt) {
    return `${formatDateTime(item.startsAt)} - ${formatDateTime(item.endsAt)}`;
  }
  if (item.startsAt) {
    return `${formatDateTime(item.startsAt)} から`;
  }
  if (item.endsAt) {
    return `${formatDateTime(item.endsAt)} まで`;
  }
  if (item.updateAtCandidate) {
    return `更新候補 ${formatDateTime(item.updateAtCandidate)}`;
  }
  return "-";
}

type TabKey = "items" | "articles" | "logs";

export function OfficialNewsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [items, setItems] = useState<ExtractedNewsItem[]>([]);
  const [articles, setArticles] = useState<SourceArticle[]>([]);
  const [logs, setLogs] = useState<NewsFetchLog[]>([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [articleTotal, setArticleTotal] = useState(0);
  const [logTotal, setLogTotal] = useState(0);
  const [itemType, setItemType] = useState("");
  const [eventType, setEventType] = useState("");
  const [articleType, setArticleType] = useState("");
  const [runType, setRunType] = useState("");
  const [logStatus, setLogStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const itemCounts = useMemo(() => {
    const dated = items.filter((item) => item.startsAt || item.endsAt || item.updateAtCandidate).length;
    return { dated, visible: items.filter((item) => item.isVisible).length };
  }, [items]);

  async function loadAll() {
    setError("");
    setIsLoading(true);
    try {
      const common = {
        from: formatDateInput(from),
        to: to ? new Date(`${to}T23:59:59+09:00`).toISOString() : undefined,
        keyword,
        limit: 80
      };
      const [itemData, articleData, logData] = await Promise.all([
        api.newsItems({ ...common, itemType, eventType, includeHidden }),
        api.sourceArticles({ ...common, articleType }),
        api.newsFetchLogs({ runType, status: logStatus, limit: 40 })
      ]);

      setItems(itemData.items);
      setItemTotal(itemData.total);
      setArticles(articleData.articles);
      setArticleTotal(articleData.total);
      setLogs(logData.logs);
      setLogTotal(logData.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "公式NEWS情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAll();
  }

  return (
    <div className="page-stack">
      <section className="page-heading official-news-heading">
        <div>
          <p className="eyebrow">Official News</p>
          <h2>公式NEWS</h2>
          <p>rcms-api から保存した公式NEWSメタ情報と抽出結果を確認します。</p>
        </div>
        <button className="secondary-button" disabled={isLoading} onClick={() => void loadAll()} type="button">
          <RefreshCcw size={16} />
          再読込
        </button>
      </section>

      <section className="stat-grid official-news-stats">
        <div className="stat-tile">
          <span>抽出項目</span>
          <strong>{itemTotal}</strong>
        </div>
        <div className="stat-tile">
          <span>期間あり</span>
          <strong>{itemCounts.dated}</strong>
        </div>
        <div className="stat-tile">
          <span>公式記事</span>
          <strong>{articleTotal}</strong>
        </div>
        <div className="stat-tile">
          <span>取得ログ</span>
          <strong>{logTotal}</strong>
        </div>
      </section>

      <section className="panel official-news-panel">
        <div className="section-heading">
          <div className="segmented official-news-tabs">
            <button className={activeTab === "items" ? "active" : ""} onClick={() => setActiveTab("items")} type="button">
              抽出項目
            </button>
            <button
              className={activeTab === "articles" ? "active" : ""}
              onClick={() => setActiveTab("articles")}
              type="button"
            >
              公式記事
            </button>
            <button className={activeTab === "logs" ? "active" : ""} onClick={() => setActiveTab("logs")} type="button">
              取得ログ
            </button>
          </div>
          <span className="muted-text">{isLoading ? "読込中" : "最新の保存済みデータ"}</span>
        </div>

        <form className="official-news-filter-grid" onSubmit={handleSubmit}>
          {activeTab === "items" && (
            <>
              <label>
                itemType
                <select onChange={(event) => setItemType(event.target.value)} value={itemType}>
                  <option value="">すべて</option>
                  {itemTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                eventType
                <select onChange={(event) => setEventType(event.target.value)} value={eventType}>
                  <option value="">すべて</option>
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-field official-news-checkbox">
                <input
                  checked={includeHidden}
                  onChange={(event) => setIncludeHidden(event.target.checked)}
                  type="checkbox"
                />
                非表示も含める
              </label>
            </>
          )}

          {activeTab === "articles" && (
            <label>
              articleType
              <select onChange={(event) => setArticleType(event.target.value)} value={articleType}>
                <option value="">すべて</option>
                {articleTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeTab === "logs" && (
            <>
              <label>
                runType
                <select onChange={(event) => setRunType(event.target.value)} value={runType}>
                  <option value="">すべて</option>
                  <option value="latest">latest</option>
                  <option value="month">month</option>
                  <option value="reanalyze">reanalyze</option>
                </select>
              </label>
              <label>
                status
                <select onChange={(event) => setLogStatus(event.target.value)} value={logStatus}>
                  <option value="">すべて</option>
                  <option value="success">success</option>
                  <option value="error">error</option>
                  <option value="running">running</option>
                </select>
              </label>
            </>
          )}

          {activeTab !== "logs" && (
            <>
              <label>
                from
                <input onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
              </label>
              <label>
                to
                <input onChange={(event) => setTo(event.target.value)} type="date" value={to} />
              </label>
              <label className="official-news-keyword">
                keyword
                <span className="input-with-icon">
                  <Search size={16} />
                  <input onChange={(event) => setKeyword(event.target.value)} value={keyword} />
                </span>
              </label>
            </>
          )}

          <button className="primary-button" disabled={isLoading} type="submit">
            <Search size={16} />
            検索
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        {activeTab === "items" && <NewsItemsTable items={items} />}
        {activeTab === "articles" && <SourceArticlesTable articles={articles} />}
        {activeTab === "logs" && <FetchLogsTable logs={logs} />}
      </section>
    </div>
  );
}

function NewsItemsTable({ items }: { items: ExtractedNewsItem[] }) {
  if (items.length === 0) {
    return <p className="muted-text">抽出済み項目はありません。</p>;
  }

  return (
    <div className="official-news-list" aria-label="抽出済みNEWS項目一覧">
      {items.map((item) => (
        <article className={item.isVisible ? "official-news-card" : "official-news-card hidden-item"} key={item.id}>
          <div className="official-news-card-main">
            <div className="tag-row">
              <span className="pill">{labelFor(itemTypeOptions, item.itemType)}</span>
              <span className="pill muted">{labelFor(eventTypeOptions, item.eventType)}</span>
              <span className="pill muted">{item.infoStatus}</span>
              <span className="pill muted">信頼度 {confidenceLabel(item.extractionConfidence)}</span>
            </div>
            <h3>{item.title || item.article.title}</h3>
            <dl className="official-news-facts">
              <div>
                <dt>期間</dt>
                <dd>{periodText(item)}</dd>
              </div>
              <div>
                <dt>更新候補</dt>
                <dd>{formatDateTime(item.updateAtCandidate)}</dd>
              </div>
              <div>
                <dt>参照元</dt>
                <dd>{item.article.title}</dd>
              </div>
            </dl>
            {item.rawDateText && (
              <details className="official-news-raw">
                <summary>rawDateText</summary>
                <p>{item.rawDateText}</p>
              </details>
            )}
          </div>
          <a className="secondary-button compact-action" href={item.article.officialUrl} rel="noreferrer" target="_blank">
            <ExternalLink size={16} />
            公式
          </a>
        </article>
      ))}
    </div>
  );
}

function SourceArticlesTable({ articles }: { articles: SourceArticle[] }) {
  if (articles.length === 0) {
    return <p className="muted-text">公式NEWS記事はありません。</p>;
  }

  return (
    <div className="official-news-table-wrap">
      <table className="official-news-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>タイトル</th>
            <th>公開日時</th>
            <th>分類</th>
            <th>カテゴリ</th>
            <th>状態</th>
            <th>取得/解析</th>
            <th>公式</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.sourceArticleId}</td>
              <td>{article.title}</td>
              <td>{formatDateTime(article.publishedAt)}</td>
              <td>{labelFor(articleTypeOptions, article.articleType)}</td>
              <td>{article.categories.map((category) => category.name).join(", ") || "-"}</td>
              <td>
                {article.fetchStatus} / {article.parseStatus}
              </td>
              <td>
                {formatDateTime(article.lastFetchedAt)}
                <br />
                <span className="muted-text">{formatDateTime(article.lastParsedAt)}</span>
              </td>
              <td>
                <a className="text-link" href={article.officialUrl} rel="noreferrer" target="_blank">
                  開く
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FetchLogsTable({ logs }: { logs: NewsFetchLog[] }) {
  if (logs.length === 0) {
    return <p className="muted-text">取得ログはありません。</p>;
  }

  return (
    <div className="official-news-table-wrap">
      <table className="official-news-table">
        <thead>
          <tr>
            <th>runType</th>
            <th>status</th>
            <th>targetMonth</th>
            <th>startedAt</th>
            <th>finishedAt</th>
            <th>件数</th>
            <th>error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.runType}</td>
              <td>{log.status}</td>
              <td>{log.targetMonth ?? "-"}</td>
              <td>{formatDateTime(log.startedAt)}</td>
              <td>{formatDateTime(log.finishedAt)}</td>
              <td>
                取得 {log.fetchedCount} / 新規 {log.newCount} / 更新 {log.updatedCount} / skipped {log.skippedCount}
              </td>
              <td>
                {log.errorCount}
                {log.errorMessage ? <p className="form-error">{log.errorMessage}</p> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
