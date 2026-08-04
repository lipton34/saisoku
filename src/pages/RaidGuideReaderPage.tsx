import { ChevronLeft, ChevronRight, Settings, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { RaidGuideLinkedText } from "../components/RaidGuideLinkedText";
import { api, type RaidGuideReader, type RaidGuideStickyNote, type RaidGuideStrategy } from "../lib/api";
import { findRaidGuideRecent, saveRaidGuideRecent } from "../lib/raidGuideReaderState";

type PageSize = 1 | 3 | 5;

export function RaidGuideReaderPage() {
  const { guideId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const strategyId = searchParams.get("strategyId") ?? undefined;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<RaidGuideReader | null>(null);
  const [strategy, setStrategy] = useState<RaidGuideStrategy | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>(1);
  const [pageStart, setPageStart] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [linkHistory, setLinkHistory] = useState<number[]>([]);
  const [error, setError] = useState("");
  const touchStartX = useRef<number | null>(null);

  const rows = useMemo(() => guide?.sections.flatMap((section) => section.rows.map((row) => ({ ...row, sectionTitle: section.title }))) ?? [], [guide]);
  const visibleRows = rows.slice(pageStart, pageStart + pageSize);
  const currentSection = visibleRows[0]?.sectionTitle ?? "";
  const lastVisible = Math.min(pageStart + pageSize, rows.length);

  useEffect(() => {
    setError("");
    api.raidGuideReader(guideId, strategyId).then((data) => {
      setGuide(data.guide);
      setStrategy(data.strategy);
      const recent = user ? findRaidGuideRecent(user.id, guideId, strategyId ?? null) : undefined;
      const restoredSize = recent?.pageSize ?? 1;
      const restoredIndex = recent?.rowId ? data.guide.sections.flatMap((section) => section.rows).findIndex((row) => row.id === recent.rowId) : 0;
      setPageSize(restoredSize);
      setPageStart(restoredIndex >= 0 ? Math.floor(restoredIndex / restoredSize) * restoredSize : 0);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "攻略メモを読み込めませんでした"));
  }, [guideId, strategyId, user]);

  useEffect(() => {
    if (!user || !guide || !visibleRows[0]) return;
    saveRaidGuideRecent(user.id, {
      guideId: guide.id,
      strategyId: strategy?.id ?? null,
      questName: guide.questMaster.displayName ?? guide.questMaster.name,
      strategyTitle: strategy?.title ?? "共通の攻略メモ",
      authorName: strategy?.authorName ?? "書き込みなし",
      rowId: visibleRows[0].id,
      pageSize,
      viewedAt: new Date().toISOString()
    });
  }, [guide, pageSize, strategy, user, visibleRows]);

  function move(delta: number) {
    setActiveNoteId(null);
    setPageStart((current) => Math.max(0, Math.min(current + delta * pageSize, Math.max(0, rows.length - 1))));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changePageSize(value: PageSize) {
    setPageSize(value);
    setPageStart((current) => Math.floor(current / value) * value);
  }

  function jumpTo(rowId: string, rememberSource = true) {
    const index = rows.findIndex((row) => row.id === rowId);
    if (index < 0) return;
    if (rememberSource) setLinkHistory((current) => [...current.slice(-9), pageStart]);
    setPageStart(Math.floor(index / pageSize) * pageSize);
    setSettingsOpen(false);
    setActiveNoteId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToLinkSource() {
    const target = linkHistory.at(-1);
    if (target === undefined) return;
    setLinkHistory((current) => current.slice(0, -1));
    setPageStart(target);
    setSettingsOpen(false);
    setActiveNoteId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (error) return <main className="raid-reader-status"><p role="alert">{error}</p><button className="secondary-button" onClick={() => navigate(`/raid-guides/${guideId}`)} type="button">戻る</button></main>;
  if (!guide) return <main className="raid-reader-status"><p>全ページを読み込んでいます…</p></main>;

  const overallNotes = strategy?.stickyNotes.filter((note) => note.guideRowId === null) ?? [];

  return <main className="raid-reader" onTouchEnd={(event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 60) return;
    move(distance < 0 ? 1 : -1);
  }} onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}>
    <header className="raid-reader-header">
      <button aria-label="閲覧画面を閉じる" onClick={() => navigate(`/raid-guides/${guideId}`)} title="閉じる" type="button"><X /></button>
      {linkHistory.length ? <button aria-label="リンク元のページへ戻る" className="raid-reader-link-back" onClick={returnToLinkSource} title="リンク元へ戻る" type="button"><Undo2 size={18} /><span>{currentSection}</span></button> : <span className="raid-reader-section" title={currentSection}>{currentSection}</span>}
      <button aria-label="前のページ" disabled={pageStart === 0} onClick={() => move(-1)} title="前へ" type="button"><ChevronLeft /></button>
      <strong aria-label={`${pageStart + 1}から${lastVisible}ページ、全${rows.length}ページ`}>{pageStart + 1}{pageSize > 1 ? `–${lastVisible}` : ""}/{rows.length}</strong>
      <button aria-label="次のページ" disabled={lastVisible >= rows.length} onClick={() => move(1)} title="次へ" type="button"><ChevronRight /></button>
      <button aria-label="閲覧設定" onClick={() => setSettingsOpen(true)} title="設定" type="button"><Settings /></button>
    </header>

    <div className="raid-reader-pages">
      {visibleRows.map((row) => {
        const notes = [...overallNotes, ...(strategy?.stickyNotes.filter((note) => note.guideRowId === row.id) ?? [])];
        return <article className={`raid-reader-page${row.pageType === "heading" ? " is-heading" : ""}`} key={row.id}>
          <div className="raid-reader-detail">
            <div className="raid-reader-page-heading"><span>{row.sectionTitle}</span><span className={`raid-danger-label is-${row.dangerLevel}`}>{row.dangerLevel === "danger" ? "危険" : row.dangerLevel === "caution" ? "注意" : "通常"}</span></div>
            <section>{row.pageType === "guide" ? <small>タイミング・条件</small> : null}<h1>{row.timingCondition}</h1></section>
            <section>{row.pageType === "guide" ? <small>敵の行動・予兆</small> : null}<p><RaidGuideLinkedText onJump={jumpTo}>{row.enemyAction}</RaidGuideLinkedText></p></section>
            <section className="raid-reader-response"><small>{row.pageType === "heading" ? "この見出しで確認すること" : "必要な対応・解除条件"}</small><p><RaidGuideLinkedText onJump={jumpTo}>{row.requiredResponse}</RaidGuideLinkedText></p></section>
            {row.supplementalNote ? <section><small>補足・注意点</small><p>{row.supplementalNote}</p></section> : null}
            {row.outgoingLinks.length ? <nav aria-label="関連する攻略行" className="raid-reader-links">{row.outgoingLinks.map((link) => <button key={link.id} onClick={() => jumpTo(link.targetRowId)} type="button">{link.label}<ChevronRight size={16} /></button>)}</nav> : null}
          </div>
          <StickyStack activeId={activeNoteId} notes={notes} onActivate={setActiveNoteId} onJump={jumpTo} />
        </article>;
      })}
    </div>

    {settingsOpen ? <div className="modal-backdrop raid-reader-settings-backdrop" onMouseDown={() => setSettingsOpen(false)}><section aria-modal="true" className="panel raid-reader-settings" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="section-heading"><h2>閲覧設定</h2><button aria-label="設定を閉じる" className="icon-button" onClick={() => setSettingsOpen(false)} type="button"><X size={19} /></button></div>
      <fieldset><legend>一度に表示するページ数</legend><div className="segmented-control">{([1, 3, 5] as PageSize[]).map((value) => <button aria-pressed={pageSize === value} className={pageSize === value ? "active" : ""} key={value} onClick={() => changePageSize(value)} type="button">{value}ページ</button>)}</div></fieldset>
      {linkHistory.length ? <button className="secondary-button" onClick={returnToLinkSource} type="button">リンク元のページへ戻る</button> : null}
      <div className="raid-reader-jumps"><h3>区間へ移動</h3>{guide.sections.map((section) => <button key={section.id} onClick={() => jumpTo(section.rows[0]?.id ?? "", false)} type="button">{section.title}<ChevronRight size={17} /></button>)}</div>
      {strategy?.buildPost ? <Link className="secondary-button" to={`/builds/${strategy.buildPost.id}`}>関連編成を開く</Link> : null}
    </section></div> : null}
  </main>;
}

function StickyStack({ activeId, notes, onActivate, onJump }: { activeId: string | null; notes: RaidGuideStickyNote[]; onActivate: (id: string) => void; onJump: (rowId: string) => void }) {
  if (!notes.length) return <aside className="raid-reader-sticky-empty"><span>付箋なし</span></aside>;
  const activeIndex = Math.max(0, notes.findIndex((note) => note.id === activeId));
  return <aside aria-label="対策メモの付箋" className="raid-reader-stickies">{notes.map((note, index) => <div className={`raid-reader-sticky is-${note.color}${index === activeIndex ? " is-active" : ""}`} key={note.id} onClick={() => onActivate(note.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onActivate(note.id); }} role="button" style={{ transform: `translate(${index * 7}px, ${index * 9}px) rotate(${(index % 3) - 1}deg)`, zIndex: index === activeIndex ? notes.length + 1 : index + 1 }} tabIndex={0}><small>{note.guideRowId === null ? "全体" : "このページ"}</small><p><RaidGuideLinkedText onJump={onJump}>{note.body}</RaidGuideLinkedText></p><span>{index + 1}/{notes.length}</span></div>)}</aside>;
}
