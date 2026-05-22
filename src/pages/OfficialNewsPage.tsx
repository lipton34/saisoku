import { ExternalLink, RefreshCcw, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  api,
  type EventNote,
  type EventNoteCandidate,
  type EventNoteInput,
  type EventNoteLinkInput,
  type EventOccurrenceInput,
  type EventSeries,
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
  const [eventSeries, setEventSeries] = useState<EventSeries[]>([]);
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
  const [includeNonGame, setIncludeNonGame] = useState(false);
  const [disableGrouping, setDisableGrouping] = useState(false);
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
      const [itemData, articleData, logData, seriesData] = await Promise.all([
        api.newsItems({
          ...common,
          itemType,
          eventType,
          includeHidden,
          includeNonGame,
          grouped: !disableGrouping,
          includeRelated: true
        }),
        api.sourceArticles({ ...common, articleType }),
        api.newsFetchLogs({ runType, status: logStatus, limit: 40 }),
        api.eventSeries()
      ]);

      setItems(itemData.items);
      setItemTotal(itemData.total);
      setArticles(articleData.articles);
      setArticleTotal(articleData.total);
      setLogs(logData.logs);
      setLogTotal(logData.total);
      setEventSeries(seriesData.series);
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
              <label className="checkbox-field official-news-checkbox">
                <input
                  checked={includeNonGame}
                  onChange={(event) => setIncludeNonGame(event.target.checked)}
                  type="checkbox"
                />
                メディア等も含める
              </label>
              <label className="checkbox-field official-news-checkbox">
                <input
                  checked={disableGrouping}
                  onChange={(event) => setDisableGrouping(event.target.checked)}
                  type="checkbox"
                />
                グルーピング解除
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

        {activeTab === "items" && <NewsItemsTable eventSeries={eventSeries} items={items} />}
        {activeTab === "articles" && <SourceArticlesTable articles={articles} />}
        {activeTab === "logs" && <FetchLogsTable logs={logs} />}
      </section>
    </div>
  );
}

function NewsItemsTable({ eventSeries, items }: { eventSeries: EventSeries[]; items: ExtractedNewsItem[] }) {
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
              {item.groupSize && item.groupSize > 1 ? <span className="pill muted">関連 {item.groupSize - 1}</span> : null}
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
            {item.relatedItems && item.relatedItems.length > 0 ? (
              <details className="official-news-related">
                <summary>関連NEWS {item.relatedItems.length}件</summary>
                <div className="official-news-related-list">
                  {item.relatedItems.map((related) => (
                    <a href={related.article.officialUrl} key={related.id} rel="noreferrer" target="_blank">
                      <span className="pill muted">{labelFor(itemTypeOptions, related.itemType)}</span>
                      <strong>{related.title || related.article.title}</strong>
                      <small>
                        {formatDateTime(related.article.publishedAt)} / 信頼度{" "}
                        {confidenceLabel(related.extractionConfidence)}
                      </small>
                    </a>
                  ))}
                </div>
              </details>
            ) : null}
            <EventOccurrenceRegister item={item} series={eventSeries} />
            <EventNoteSection item={item} />
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

const emptyNoteForm = (item: ExtractedNewsItem): EventNoteInput => ({
  newsItemId: item.id,
  title: item.title || item.article.title,
  minimumGoals: "",
  targetWeapons: "",
  targetSummons: "",
  targetItems: "",
  farmingNotes: "",
  cautionNotes: "",
  freeMemo: "",
  links: []
});

function inferSeriesId(item: ExtractedNewsItem, series: EventSeries[]) {
  const text = `${item.title ?? ""} ${item.article.title}`.toLowerCase();
  const matchKey =
    /古戦場|決戦/.test(text) ? "guild_war" :
    /ドレッドバラージュ/.test(text) ? "dread_barrage" :
    /四象/.test(text) ? "rotb" :
    /十天衆戦記/.test(text) ? "tenju_senki" :
    /アーカルム|外伝/.test(text) ? "arcarum_event" :
    /ブレイブグラウンド/.test(text) ? "proving_grounds" :
    /ゼノ/.test(text) ? "xeno_clash" :
    /コラボ|collab|fullmetal/.test(text) || item.eventType === "collaboration_event" ? "collaboration_event" :
    item.eventType === "scenario_event" ? "scenario_event" :
    "other";
  return series.find((entry) => entry.eventKey === matchKey)?.id ?? series[0]?.id ?? "";
}

function EventOccurrenceRegister({ item, series }: { item: ExtractedNewsItem; series: EventSeries[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<EventOccurrenceInput>(() => ({
    eventSeriesId: inferSeriesId(item, series),
    newsItemId: item.id,
    title: item.title || item.article.title,
    startAt: item.startsAt,
    endAt: item.endsAt,
    sourceType: item.itemType === "monthly_plan_item" ? "monthly_plan" : "official_news",
    officialUrl: item.article.officialUrl,
    confidence: item.infoStatus,
    isVisible: true
  }));

  useEffect(() => {
    setForm((current) => ({
      ...current,
      eventSeriesId: current.eventSeriesId || inferSeriesId(item, series)
    }));
  }, [item.id, series]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await api.createEventOccurrenceFromNewsItem({
        ...form,
        newsItemId: item.id
      });
      setIsOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "イベント予定の登録に失敗しました");
    }
  }

  return (
    <>
      <button className="secondary-button compact-action event-occurrence-register-button" onClick={() => setIsOpen(true)} type="button">
        イベント予定に登録
      </button>
      {isOpen ? (
        <div className="event-note-modal-backdrop" onMouseDown={() => setIsOpen(false)}>
          <div className="event-note-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="inline-section-heading">
              <div>
                <p className="eyebrow">Event Schedule</p>
                <h3>イベント予定に登録</h3>
              </div>
              <button className="secondary-button compact-action" onClick={() => setIsOpen(false)} type="button">
                キャンセル
              </button>
            </div>
            <form className="event-note-form" onSubmit={submit}>
              <label>
                イベントシリーズ
                <select
                  onChange={(event) => setForm((current) => ({ ...current, eventSeriesId: event.target.value }))}
                  required
                  value={form.eventSeriesId}
                >
                  {series.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                イベント名
                <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} />
              </label>
              <div className="form-row">
                <label>
                  開始
                  <input
                    onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value ? new Date(event.target.value).toISOString() : null }))}
                    type="datetime-local"
                  />
                </label>
                <label>
                  終了
                  <input
                    onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value ? new Date(event.target.value).toISOString() : null }))}
                    type="datetime-local"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  属性
                  <input onChange={(event) => setForm((current) => ({ ...current, element: event.target.value }))} value={form.element ?? ""} />
                </label>
                <label>
                  有利属性
                  <input onChange={(event) => setForm((current) => ({ ...current, advantageElement: event.target.value }))} value={form.advantageElement ?? ""} />
                </label>
              </div>
              <label>
                メモ
                <textarea onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} rows={3} value={form.memo ?? ""} />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="primary-button compact-action" type="submit">
                登録
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EventNoteSection({ item }: { item: ExtractedNewsItem }) {
  const [notes, setNotes] = useState<EventNote[]>([]);
  const [candidates, setCandidates] = useState<EventNoteCandidate[]>([]);
  const [eventKey, setEventKey] = useState("");
  const [form, setForm] = useState<EventNoteInput>(() => emptyNoteForm(item));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    setError("");
    setIsLoading(true);
    try {
      const [noteData, candidateData] = await Promise.all([
        api.eventNotes({ newsItemId: item.id }),
        api.eventNoteCandidates({ newsItemId: item.id })
      ]);
      setNotes(noteData.notes);
      setCandidates(candidateData.candidates);
      setEventKey(candidateData.eventKey);
      if (noteData.notes[0]) {
        setForm(noteToForm(noteData.notes[0], item.id));
        setEditingId(noteData.notes[0].id);
      } else {
        setForm({ ...emptyNoteForm(item), eventKey: candidateData.eventKey });
        setEditingId(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "攻略メモの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, [item.id]);

  function updateField(field: keyof EventNoteInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLink(index: number, field: keyof EventNoteLinkInput, value: string) {
    setForm((current) => {
      const links = [...(current.links ?? [])];
      links[index] = { ...links[index], [field]: value };
      return { ...current, links };
    });
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        newsItemId: item.id,
        eventKey,
        links: (form.links ?? []).filter((link) => link.url.trim())
      };
      const result = editingId ? await api.updateEventNote(editingId, payload) : await api.createEventNote(payload);
      setNotes([result.note]);
      setForm(noteToForm(result.note, item.id));
      setEditingId(result.note.id);
      setIsOpen(false);
      void loadNotes();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "攻略メモの保存に失敗しました");
    }
  }

  async function copyCandidate(candidate: EventNoteCandidate) {
    setError("");
    try {
      const result = await api.copyEventNote(candidate.id, { newsItemId: item.id });
      setNotes([result.note]);
      setForm(noteToForm(result.note, item.id));
      setEditingId(result.note.id);
      setIsOpen(true);
      void loadNotes();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "過去メモのコピーに失敗しました");
    }
  }

  async function deleteNote() {
    if (!editingId) return;
    setError("");
    try {
      await api.deleteEventNote(editingId);
      setNotes([]);
      setForm({ ...emptyNoteForm(item), eventKey });
      setEditingId(null);
      setIsOpen(false);
      void loadNotes();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "攻略メモの削除に失敗しました");
    }
  }

  const currentNote = notes[0] ?? null;

  return (
    <>
      <details className="event-note-box">
        <summary>攻略メモ</summary>

        <div className="event-note-body">
          <div className="inline-section-heading">
            <div>
              <p className="eyebrow">Current Memo</p>
              <h4>今回のメモ</h4>
            </div>
            <button className="secondary-button compact-action" onClick={() => setIsOpen(true)} type="button">
              {currentNote ? "編集" : "作成"}
            </button>
          </div>

          {isLoading ? <p className="muted-text">攻略メモを確認中...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          {currentNote ? <EventNoteSummary note={currentNote} /> : <p className="muted-text">このNEWS項目の攻略メモはまだありません。</p>}

          {candidates.length > 0 ? (
            <details className="event-note-candidates">
              <summary>過去メモ候補 {candidates.length}件</summary>
              <div className="event-note-candidate-list">
                {candidates.map((candidate) => (
                  <article key={candidate.id}>
                    <strong>{candidate.title}</strong>
                    <small>
                      {formatDateTime(candidate.createdAt)} / {candidate.sourceNewsItem.title || candidate.sourceNewsItem.articleTitle}
                    </small>
                    <p>{previewText(candidate.minimumGoals)}</p>
                    <button className="secondary-button compact-action" onClick={() => copyCandidate(candidate)} type="button">
                      このメモを今回にコピー
                    </button>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </details>

      {isOpen ? (
        <div className="event-note-modal-backdrop" onMouseDown={() => setIsOpen(false)}>
          <div className="event-note-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="inline-section-heading">
              <div>
                <p className="eyebrow">Event Memo</p>
                <h3>{currentNote ? "攻略メモ編集" : "攻略メモ作成"}</h3>
              </div>
              <button className="secondary-button compact-action" onClick={() => setIsOpen(false)} type="button">
                キャンセル
              </button>
            </div>
            <form className="event-note-form" onSubmit={saveNote}>
              <label>
                メモタイトル
                <input onChange={(event) => updateField("title", event.target.value)} required value={form.title} />
              </label>
              <div className="event-note-form-grid">
                <NoteTextarea label="最低限やること" field="minimumGoals" form={form} updateField={updateField} />
                <NoteTextarea label="集める武器" field="targetWeapons" form={form} updateField={updateField} />
                <NoteTextarea label="集める召喚石" field="targetSummons" form={form} updateField={updateField} />
                <NoteTextarea label="重要アイテム" field="targetItems" form={form} updateField={updateField} />
                <NoteTextarea label="周回メモ" field="farmingNotes" form={form} updateField={updateField} />
                <NoteTextarea label="注意点" field="cautionNotes" form={form} updateField={updateField} />
                <NoteTextarea label="その他メモ" field="freeMemo" form={form} updateField={updateField} />
              </div>
              <div className="event-note-link-editor">
                <div className="inline-section-heading">
                  <h4>参考リンク</h4>
                  <button
                    className="secondary-button compact-action"
                    onClick={() =>
                      setForm((current) => ({ ...current, links: [...(current.links ?? []), { url: "", title: "", siteName: "", memo: "" }] }))
                    }
                    type="button"
                  >
                    リンク追加
                  </button>
                </div>
                {(form.links ?? []).map((link, index) => (
                  <div className="event-note-link-row" key={index}>
                    <input onChange={(event) => updateLink(index, "url", event.target.value)} placeholder="URL" value={link.url} />
                    <input onChange={(event) => updateLink(index, "title", event.target.value)} placeholder="タイトル" value={link.title ?? ""} />
                    <input onChange={(event) => updateLink(index, "siteName", event.target.value)} placeholder="サイト名" value={link.siteName ?? ""} />
                    <input onChange={(event) => updateLink(index, "memo", event.target.value)} placeholder="自分用メモ" value={link.memo ?? ""} />
                  </div>
                ))}
              </div>
              <div className="button-row">
                <button className="primary-button compact-action" type="submit">
                  攻略メモを保存
                </button>
                {editingId ? (
                  <button className="secondary-button danger-button compact-action" onClick={deleteNote} type="button">
                    攻略メモを削除
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function NoteTextarea({
  label,
  field,
  form,
  updateField
}: {
  label: string;
  field: keyof EventNoteInput;
  form: EventNoteInput;
  updateField: (field: keyof EventNoteInput, value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea onChange={(event) => updateField(field, event.target.value)} rows={3} value={String(form[field] ?? "")} />
    </label>
  );
}

function EventNoteSummary({ note }: { note: EventNote }) {
  const fields = [
    ["最低限", note.minimumGoals],
    ["武器", note.targetWeapons],
    ["召喚石", note.targetSummons],
    ["重要アイテム", note.targetItems],
    ["周回", note.farmingNotes],
    ["注意", note.cautionNotes],
    ["その他", note.freeMemo]
  ];

  return (
    <div className="event-note-summary">
      <strong>{note.title}</strong>
      <dl>
        {fields
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      {note.links.length > 0 ? (
        <div className="reference-list">
          {note.links.map((link) => (
            <a href={link.url} key={link.id} rel="noreferrer" target="_blank">
              <ExternalLink size={14} />
              {link.title || link.siteName || link.url}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function noteToForm(note: EventNote, newsItemId: string): EventNoteInput {
  return {
    newsItemId,
    eventKey: note.eventKey,
    title: note.title,
    minimumGoals: note.minimumGoals ?? "",
    targetWeapons: note.targetWeapons ?? "",
    targetSummons: note.targetSummons ?? "",
    targetItems: note.targetItems ?? "",
    farmingNotes: note.farmingNotes ?? "",
    cautionNotes: note.cautionNotes ?? "",
    freeMemo: note.freeMemo ?? "",
    links: note.links.map((link) => ({
      url: link.url,
      title: link.title ?? "",
      siteName: link.siteName ?? "",
      memo: link.memo ?? ""
    }))
  };
}

function previewText(value: string | null) {
  if (!value) return "最低限やることは未入力です。";
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
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
