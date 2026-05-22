import { ExternalLink, RefreshCcw, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  api,
  type EventNote,
  type EventNoteCandidate,
  type EventNoteInput,
  type EventNoteLinkInput,
  type EventOccurrence,
  type EventOccurrenceInput,
  type EventSeries
} from "../lib/api";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00+09:00`).toISOString() : undefined;
}

function toDateTimeIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const emptyOccurrenceForm = (series: EventSeries[]): EventOccurrenceInput => ({
  eventSeriesId: series[0]?.id ?? "",
  title: "",
  startAt: null,
  endAt: null,
  element: "",
  enemyElement: "",
  advantageElement: "",
  sourceType: "manual",
  confidence: "manual",
  memo: "",
  isVisible: true
});

export function EventSchedulePage() {
  const [series, setSeries] = useState<EventSeries[]>([]);
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>([]);
  const [eventSeriesId, setEventSeriesId] = useState("");
  const [eventType, setEventType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventOccurrenceInput>(() => emptyOccurrenceForm([]));
  const [error, setError] = useState("");
  const [newsUpdateMessage, setNewsUpdateMessage] = useState("");
  const [isUpdatingNews, setIsUpdatingNews] = useState(false);

  const eventTypes = useMemo(() => [...new Set(series.map((item) => item.eventType))], [series]);

  async function load() {
    setError("");
    try {
      const seriesData = await api.eventSeries();
      setSeries(seriesData.series);
      setForm((current) => ({ ...current, eventSeriesId: current.eventSeriesId || seriesData.series[0]?.id || "" }));
      const occurrenceData = await api.eventOccurrences({
        eventSeriesId,
        eventType,
        from: fromDateInput(from),
        to: to ? new Date(`${to}T23:59:59+09:00`).toISOString() : undefined,
        keyword,
        includeHidden
      });
      setOccurrences(occurrenceData.occurrences);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "イベント予定の取得に失敗しました");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyOccurrenceForm(series));
    setIsEditorOpen(true);
  }

  function openEdit(occurrence: EventOccurrence) {
    setEditingId(occurrence.id);
    setForm({
      eventSeriesId: occurrence.eventSeries.id,
      title: occurrence.title,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      element: occurrence.element ?? "",
      enemyElement: occurrence.enemyElement ?? "",
      advantageElement: occurrence.advantageElement ?? "",
      sourceType: occurrence.sourceType,
      officialUrl: occurrence.officialUrl,
      confidence: occurrence.confidence,
      memo: occurrence.memo ?? "",
      isVisible: occurrence.isVisible
    });
    setIsEditorOpen(true);
  }

  async function saveOccurrence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateEventOccurrence(editingId, form);
      } else {
        await api.createEventOccurrence(form);
      }
      setIsEditorOpen(false);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "イベント予定の保存に失敗しました");
    }
  }

  async function updateOfficialNews() {
    setError("");
    setNewsUpdateMessage("");
    setIsUpdatingNews(true);
    try {
      const result = await api.fetchLatestOfficialNews();
      setNewsUpdateMessage(
        `${result.message}。必要なNEWSは /official-news からイベント予定に登録してください。`
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "公式NEWS更新に失敗しました");
    } finally {
      setIsUpdatingNews(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Event Schedule</p>
          <h2>イベント予定</h2>
          <p>公式NEWSや手動登録を元に、実際の開催単位でイベントを確認します。</p>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" disabled={isUpdatingNews} onClick={() => void updateOfficialNews()} type="button">
            <RefreshCcw size={16} />
            {isUpdatingNews ? "更新中..." : "公式NEWSを更新"}
          </button>
          <button className="secondary-button" onClick={() => void load()} type="button">
            <RefreshCcw size={16} />
            再読込
          </button>
          <button className="primary-button" onClick={openCreate} type="button">
            手動作成
          </button>
        </div>
      </section>
      {newsUpdateMessage ? <p className="form-notice">{newsUpdateMessage}</p> : null}

      <section className="panel official-news-panel">
        <form className="official-news-filter-grid" onSubmit={submitFilters}>
          <label>
            eventType
            <select onChange={(event) => setEventType(event.target.value)} value={eventType}>
              <option value="">すべて</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            eventSeries
            <select onChange={(event) => setEventSeriesId(event.target.value)} value={eventSeriesId}>
              <option value="">すべて</option>
              {series.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
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
          <label className="checkbox-field official-news-checkbox">
            <input checked={includeHidden} onChange={(event) => setIncludeHidden(event.target.checked)} type="checkbox" />
            非表示も含める
          </label>
          <button className="primary-button" type="submit">
            <Search size={16} />
            検索
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="event-schedule-list">
        {occurrences.map((occurrence) => (
          <article className="event-occurrence-card" key={occurrence.id}>
            <div className="event-occurrence-header">
              <div>
                <div className="tag-row">
                  <span className="pill">{occurrence.eventSeries.name}</span>
                  <span className="pill muted">{occurrence.sourceType}</span>
                  <span className="pill muted">{occurrence.confidence}</span>
                </div>
                <h3>{occurrence.title}</h3>
              </div>
              <button className="secondary-button compact-action" onClick={() => openEdit(occurrence)} type="button">
                編集
              </button>
            </div>
            <dl className="official-news-facts">
              <div>
                <dt>開催期間</dt>
                <dd>{formatDateTime(occurrence.startAt)} - {formatDateTime(occurrence.endAt)}</dd>
              </div>
              <div>
                <dt>属性</dt>
                <dd>{occurrence.element || occurrence.advantageElement || "-"}</dd>
              </div>
              <div>
                <dt>情報源</dt>
                <dd>{occurrence.officialUrl ? <a className="text-link" href={occurrence.officialUrl} rel="noreferrer" target="_blank">公式URL</a> : "-"}</dd>
              </div>
            </dl>
            {occurrence.memo ? <p className="event-occurrence-memo">{occurrence.memo}</p> : null}
            {occurrence.newsItem ? (
              <details className="official-news-related">
                <summary>関連NEWS</summary>
                <div className="official-news-related-list">
                  <a href={occurrence.newsItem.sourceArticle.officialUrl} rel="noreferrer" target="_blank">
                    <span className="pill muted">{occurrence.newsItem.itemType}</span>
                    <strong>{occurrence.newsItem.title || occurrence.newsItem.sourceArticle.title}</strong>
                    <small>{formatDateTime(occurrence.newsItem.sourceArticle.publishedAt)}</small>
                  </a>
                </div>
              </details>
            ) : null}
            <OccurrenceNoteSection occurrence={occurrence} />
          </article>
        ))}
        {occurrences.length === 0 ? <p className="empty-state">イベント予定はまだありません。</p> : null}
      </section>

      {isEditorOpen ? (
        <div className="event-note-modal-backdrop" onMouseDown={() => setIsEditorOpen(false)}>
          <div className="event-note-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="inline-section-heading">
              <h3>{editingId ? "イベント予定編集" : "イベント予定作成"}</h3>
              <button className="secondary-button compact-action" onClick={() => setIsEditorOpen(false)} type="button">
                キャンセル
              </button>
            </div>
            <form className="event-note-form" onSubmit={saveOccurrence}>
              <label>
                イベントシリーズ
                <select onChange={(event) => setForm((current) => ({ ...current, eventSeriesId: event.target.value }))} required value={form.eventSeriesId}>
                  {series.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name}</option>
                  ))}
                </select>
              </label>
              <label>
                イベント名
                <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} />
              </label>
              <div className="form-row">
                <label>開始<input onChange={(event) => setForm((current) => ({ ...current, startAt: toDateTimeIso(event.target.value) }))} type="datetime-local" value={toDatetimeLocal(form.startAt ?? null)} /></label>
                <label>終了<input onChange={(event) => setForm((current) => ({ ...current, endAt: toDateTimeIso(event.target.value) }))} type="datetime-local" value={toDatetimeLocal(form.endAt ?? null)} /></label>
              </div>
              <div className="form-row">
                <label>属性<input onChange={(event) => setForm((current) => ({ ...current, element: event.target.value }))} value={form.element ?? ""} /></label>
                <label>敵属性<input onChange={(event) => setForm((current) => ({ ...current, enemyElement: event.target.value }))} value={form.enemyElement ?? ""} /></label>
              </div>
              <div className="form-row">
                <label>有利属性<input onChange={(event) => setForm((current) => ({ ...current, advantageElement: event.target.value }))} value={form.advantageElement ?? ""} /></label>
                <label>信頼度<input onChange={(event) => setForm((current) => ({ ...current, confidence: event.target.value }))} value={form.confidence ?? ""} /></label>
              </div>
              <label>公式URL<input onChange={(event) => setForm((current) => ({ ...current, officialUrl: event.target.value }))} value={form.officialUrl ?? ""} /></label>
              <label>メモ<textarea onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} rows={3} value={form.memo ?? ""} /></label>
              <button className="primary-button compact-action" type="submit">保存</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const emptyNoteForm = (occurrence: EventOccurrence): EventNoteInput => ({
  eventOccurrenceId: occurrence.id,
  eventSeriesId: occurrence.eventSeries.id,
  title: occurrence.title,
  minimumGoals: "",
  targetWeapons: "",
  targetSummons: "",
  targetItems: "",
  farmingNotes: "",
  cautionNotes: "",
  freeMemo: "",
  links: []
});

function OccurrenceNoteSection({ occurrence }: { occurrence: EventOccurrence }) {
  const [notes, setNotes] = useState<EventNote[]>(occurrence.eventNotes ?? []);
  const [candidates, setCandidates] = useState<EventNoteCandidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(notes[0]?.id ?? null);
  const [form, setForm] = useState<EventNoteInput>(() => notes[0] ? noteToForm(notes[0], occurrence) : emptyNoteForm(occurrence));

  async function loadNotes() {
    const [noteData, candidateData] = await Promise.all([
      api.eventNotes({ eventOccurrenceId: occurrence.id }),
      api.eventNoteCandidates({ eventOccurrenceId: occurrence.id })
    ]);
    setNotes(noteData.notes);
    setCandidates(candidateData.candidates);
    setEditingId(noteData.notes[0]?.id ?? null);
    setForm(noteData.notes[0] ? noteToForm(noteData.notes[0], occurrence) : emptyNoteForm(occurrence));
  }

  useEffect(() => {
    void loadNotes();
  }, [occurrence.id]);

  function updateField(field: keyof EventNoteInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { ...form, eventOccurrenceId: occurrence.id, eventSeriesId: occurrence.eventSeries.id };
    if (editingId) await api.updateEventNote(editingId, payload);
    else await api.createEventNote(payload);
    setIsOpen(false);
    await loadNotes();
  }

  async function copyCandidate(candidate: EventNoteCandidate) {
    const result = await api.copyEventNote(candidate.id, { eventOccurrenceId: occurrence.id });
    setNotes([result.note]);
    setEditingId(result.note.id);
    setForm(noteToForm(result.note, occurrence));
    setIsOpen(true);
  }

  const note = notes[0] ?? null;
  return (
    <>
      <details className="event-note-box">
        <summary>攻略メモ</summary>
        <div className="event-note-body">
          <div className="inline-section-heading">
            <h4>今回のメモ</h4>
            <button className="secondary-button compact-action" onClick={() => setIsOpen(true)} type="button">{note ? "編集" : "作成"}</button>
          </div>
          {note ? <EventNoteSummary note={note} /> : <p className="muted-text">攻略メモはまだありません。</p>}
          {candidates.length > 0 ? (
            <details className="event-note-candidates">
              <summary>過去メモ候補 {candidates.length}件</summary>
              <div className="event-note-candidate-list">
                {candidates.map((candidate) => (
                  <article key={candidate.id}>
                    <strong>{candidate.title}</strong>
                    <p>{candidate.minimumGoals?.slice(0, 80) || "最低限やることは未入力です。"}</p>
                    <button className="secondary-button compact-action" onClick={() => copyCandidate(candidate)} type="button">このメモを今回にコピー</button>
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
              <h3>攻略メモ</h3>
              <button className="secondary-button compact-action" onClick={() => setIsOpen(false)} type="button">キャンセル</button>
            </div>
            <form className="event-note-form" onSubmit={saveNote}>
              <label>メモタイトル<input onChange={(event) => updateField("title", event.target.value)} required value={form.title} /></label>
              <label>最低限やること<textarea onChange={(event) => updateField("minimumGoals", event.target.value)} rows={3} value={form.minimumGoals ?? ""} /></label>
              <label>集める武器<textarea onChange={(event) => updateField("targetWeapons", event.target.value)} rows={3} value={form.targetWeapons ?? ""} /></label>
              <label>周回メモ<textarea onChange={(event) => updateField("farmingNotes", event.target.value)} rows={3} value={form.farmingNotes ?? ""} /></label>
              <label>注意点<textarea onChange={(event) => updateField("cautionNotes", event.target.value)} rows={3} value={form.cautionNotes ?? ""} /></label>
              <button className="primary-button compact-action" type="submit">保存</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EventNoteSummary({ note }: { note: EventNote }) {
  return (
    <div className="event-note-summary">
      <strong>{note.title}</strong>
      {note.minimumGoals ? <p>{note.minimumGoals}</p> : null}
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

function noteToForm(note: EventNote, occurrence: EventOccurrence): EventNoteInput {
  return {
    eventOccurrenceId: occurrence.id,
    eventSeriesId: occurrence.eventSeries.id,
    title: note.title,
    minimumGoals: note.minimumGoals ?? "",
    targetWeapons: note.targetWeapons ?? "",
    targetSummons: note.targetSummons ?? "",
    targetItems: note.targetItems ?? "",
    farmingNotes: note.farmingNotes ?? "",
    cautionNotes: note.cautionNotes ?? "",
    freeMemo: note.freeMemo ?? "",
    links: note.links
  };
}
