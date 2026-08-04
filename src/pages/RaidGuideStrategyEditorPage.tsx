import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type RaidGuideReader, type RaidGuideStickyNote, type SimpleBuildPost } from "../lib/api";
import { joinRaidGuideLinkedText, plainRaidGuideLinkedText, splitRaidGuideLinkedText, type RaidGuidePageLink } from "../components/RaidGuideLinkedText";

type EditableSticky = {
  clientId: string;
  guideRowId: string | null;
  body: string;
  color: RaidGuideStickyNote["color"];
  links: RaidGuidePageLink[];
};

type EditorPage = { id: string; timingCondition: string; sectionTitle: string };

const colors: Array<{ value: RaidGuideStickyNote["color"]; label: string }> = [
  { value: "yellow", label: "黄" }, { value: "blue", label: "青" }, { value: "green", label: "緑" },
  { value: "pink", label: "桃" }, { value: "purple", label: "紫" }
];

function StickyEditor({ group, linkLabel, note, pages, selectedTarget, onLinkLabelChange, onLinkTargetChange, onMove, onRemove, onUpdate }: {
  group: EditableSticky[];
  linkLabel: string;
  note: EditableSticky;
  pages: EditorPage[];
  selectedTarget: string;
  onLinkLabelChange: (value: string) => void;
  onLinkTargetChange: (rowId: string, defaultLabel: string) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<EditableSticky>) => void;
}) {
  const index = group.findIndex((item) => item.clientId === note.clientId);
  const selectedPage = pages.find((page) => page.id === selectedTarget);
  return <article className={`raid-sticky-editor is-${note.color}`}>
    <textarea aria-label="付箋本文" maxLength={500} onChange={(event) => onUpdate({ body: event.target.value })} placeholder="この場所で確認すること" rows={3} value={note.body} />
    {note.links.length ? <div className="raid-sticky-link-list">{note.links.map((link, linkIndex) => <span key={`${link.rowId}-${linkIndex}`}>{link.label}<button aria-label={`${link.label}のリンクを削除`} onClick={() => onUpdate({ links: note.links.filter((_, indexToRemove) => indexToRemove !== linkIndex) })} type="button">×</button></span>)}</div> : null}
    <div className="raid-sticky-controls"><label>色<select onChange={(event) => onUpdate({ color: event.target.value as RaidGuideStickyNote["color"] })} value={note.color}>{colors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select></label>
      <button aria-label="付箋を上へ" disabled={index === 0} onClick={() => onMove(-1)} title="上へ" type="button"><ArrowUp size={17} /></button>
      <button aria-label="付箋を下へ" disabled={index === group.length - 1} onClick={() => onMove(1)} title="下へ" type="button"><ArrowDown size={17} /></button>
      <button aria-label="付箋を削除" onClick={onRemove} title="削除" type="button"><Trash2 size={17} /></button>
    </div>
    <div className="raid-sticky-link-editor"><label>ページリンク<select onChange={(event) => { const target = pages.find((page) => page.id === event.target.value); onLinkTargetChange(event.target.value, target?.timingCondition ?? ""); }} value={selectedTarget}><option value="">リンク先を選択</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.sectionTitle}：{page.timingCondition}</option>)}</select></label><label>表示文字<input maxLength={80} onChange={(event) => onLinkLabelChange(event.target.value)} value={linkLabel} /></label><button className="secondary-button" disabled={!selectedTarget || !linkLabel.trim()} onClick={() => { if (!selectedPage) return; onUpdate({ links: [...note.links, { rowId: selectedPage.id, label: linkLabel.trim() }] }); }} type="button">リンクを追加</button></div>
  </article>;
}

export function RaidGuideStrategyEditorPage() {
  const { guideId = "", strategyId } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<RaidGuideReader | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [visibility, setVisibility] = useState<"crew" | "personal">("crew");
  const [buildPostId, setBuildPostId] = useState("");
  const [builds, setBuilds] = useState<SimpleBuildPost[]>([]);
  const [notes, setNotes] = useState<EditableSticky[]>([]);
  const [deleted, setDeleted] = useState<{ note: EditableSticky; index: number } | null>(null);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkTargets, setLinkTargets] = useState<Record<string, string>>({});
  const [linkLabels, setLinkLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([api.raidGuideReader(guideId, strategyId), api.simpleBuildPosts()]).then(([reader, buildData]) => {
      setGuide(reader.guide); setBuilds(buildData.posts);
      if (reader.strategy) {
        setTitle(reader.strategy.title); setOverview(reader.strategy.overview ?? "");
        setVisibility(reader.strategy.visibility); setBuildPostId(reader.strategy.buildPostId ?? "");
        setExpectedUpdatedAt(reader.strategy.updatedAt);
        setNotes(reader.strategy.stickyNotes.map((note) => { const parsed = splitRaidGuideLinkedText(note.body); return { clientId: note.id, guideRowId: note.guideRowId, body: parsed.text, color: note.color, links: parsed.links }; }));
      }
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "編集内容を読み込めませんでした")).finally(() => setLoading(false));
  }, [guideId, strategyId]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const grouped = useMemo(() => new Map<string, EditableSticky[]>([
    ["overall", notes.filter((note) => !note.guideRowId)],
    ...(guide?.sections.flatMap((section) => section.rows).map((row) => [row.id, notes.filter((note) => note.guideRowId === row.id)] as [string, EditableSticky[]]) ?? [])
  ]), [guide, notes]);
  const pages: EditorPage[] = useMemo(() => guide?.sections.flatMap((section) => section.rows.map((row) => ({ id: row.id, timingCondition: plainRaidGuideLinkedText(row.timingCondition), sectionTitle: section.title }))) ?? [], [guide]);

  function change<T>(setter: (value: T) => void, value: T) { setter(value); setDirty(true); }

  function addNote(guideRowId: string | null) {
    if (notes.length >= 50) { setError("付箋は50件まで追加できます"); return; }
    setNotes((current) => [...current, { clientId: crypto.randomUUID(), guideRowId, body: "", color: "yellow", links: [] }]);
    setDirty(true); setError("");
  }

  function updateNote(clientId: string, patch: Partial<EditableSticky>) {
    setNotes((current) => current.map((note) => note.clientId === clientId ? { ...note, ...patch } : note)); setDirty(true);
  }

  function removeNote(clientId: string) {
    setNotes((current) => {
      const index = current.findIndex((note) => note.clientId === clientId);
      if (index < 0) return current;
      setDeleted({ note: current[index], index });
      return current.filter((note) => note.clientId !== clientId);
    });
    setDirty(true);
  }

  function moveNote(clientId: string, direction: -1 | 1) {
    setNotes((current) => {
      const index = current.findIndex((note) => note.clientId === clientId);
      if (index < 0) return current;
      const siblings = current.map((note, itemIndex) => ({ note, itemIndex })).filter((item) => item.note.guideRowId === current[index].guideRowId);
      const siblingIndex = siblings.findIndex((item) => item.itemIndex === index);
      const target = siblings[siblingIndex + direction];
      if (!target) return current;
      const copy = [...current]; [copy[index], copy[target.itemIndex]] = [copy[target.itemIndex], copy[index]]; return copy;
    });
    setDirty(true);
  }

  function cancel() {
    if (!dirty || window.confirm("未保存の変更を破棄しますか？")) navigate(`/raid-guides/${guideId}`);
  }

  async function save() {
    const invalid = notes.some((note) => !note.body.trim() || joinRaidGuideLinkedText(note.body, note.links).length > 500);
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (invalid) { setError("付箋の本文を1～500文字で入力してください"); return; }
    setSaving(true); setError("");
    const value = {
      title: title.trim(), overview: overview.trim(), visibility, buildPostId: buildPostId || null,
      expectedUpdatedAt,
      stickyNotes: notes.map((note) => ({ guideRowId: note.guideRowId, body: joinRaidGuideLinkedText(note.body, note.links), color: note.color }))
    };
    try {
      if (strategyId) await api.updateRaidGuideStrategy(strategyId, value);
      else await api.createRaidGuideStrategy(guideId, value);
      setDirty(false); navigate(`/raid-guides/${guideId}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "対策メモを保存できませんでした"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="page-stack compact-page"><div className="panel empty-state"><p>読み込み中です…</p></div></div>;
  if (!guide) return <div className="page-stack compact-page"><p className="form-error" role="alert">{error || "攻略メモが見つかりません"}</p></div>;

  return <div className="page-stack compact-page raid-strategy-editor-page">
    <section className="page-heading"><div><p className="eyebrow">{guide.questMaster.displayName ?? guide.questMaster.name}</p><h1>{strategyId ? "対策メモを編集" : "対策メモを作成"}</h1></div></section>
    <section className="panel simple-form"><label>タイトル<input maxLength={100} onChange={(event) => change(setTitle, event.target.value)} value={title} /></label><label>概要<textarea maxLength={500} onChange={(event) => change(setOverview, event.target.value)} rows={3} value={overview} /></label><label>公開範囲<select onChange={(event) => change(setVisibility, event.target.value as "crew" | "personal")} value={visibility}><option value="crew">団内公開</option><option value="personal">自分のみ</option></select></label><label>関連編成<select onChange={(event) => change(setBuildPostId, event.target.value)} value={buildPostId}><option value="">設定しない</option>{builds.map((build) => <option key={build.id} value={build.id}>{build.title}</option>)}</select></label></section>
    <section className="panel raid-sticky-location"><div className="section-heading"><div><h2>全体への付箋</h2><small>{grouped.get("overall")?.length ?? 0}件</small></div><button className="secondary-button" disabled={notes.length >= 50} onClick={() => addNote(null)} type="button"><Plus size={17} />追加</button></div>{grouped.get("overall")?.map((note) => <StickyEditor group={grouped.get("overall") ?? []} key={note.clientId} linkLabel={linkLabels[note.clientId] ?? ""} note={note} onLinkLabelChange={(value) => setLinkLabels((current) => ({ ...current, [note.clientId]: value }))} onLinkTargetChange={(rowId, defaultLabel) => { setLinkTargets((current) => ({ ...current, [note.clientId]: rowId })); setLinkLabels((current) => ({ ...current, [note.clientId]: defaultLabel })); }} onMove={(direction) => moveNote(note.clientId, direction)} onRemove={() => removeNote(note.clientId)} onUpdate={(patch) => updateNote(note.clientId, patch)} pages={pages} selectedTarget={linkTargets[note.clientId] ?? ""} />)}</section>
    {guide.sections.map((section) => <section className="raid-editor-section" key={section.id}><h2>{section.title}</h2>{section.rows.map((row) => { const rowNotes = grouped.get(row.id) ?? []; return <article className="panel raid-sticky-location" key={row.id}><div className="raid-editor-row-summary"><span className={`raid-danger-label is-${row.dangerLevel}`}>{row.dangerLevel === "danger" ? "危険" : row.dangerLevel === "caution" ? "注意" : "通常"}</span><strong>{plainRaidGuideLinkedText(row.timingCondition)}</strong><p>{row.enemyAction}</p></div><div className="section-heading"><div><h3>この行の付箋</h3><small>{rowNotes.length}件</small></div><button className="secondary-button" disabled={notes.length >= 50} onClick={() => addNote(row.id)} type="button"><Plus size={17} />追加</button></div>{rowNotes.map((note) => <StickyEditor group={rowNotes} key={note.clientId} linkLabel={linkLabels[note.clientId] ?? ""} note={note} onLinkLabelChange={(value) => setLinkLabels((current) => ({ ...current, [note.clientId]: value }))} onLinkTargetChange={(rowId, defaultLabel) => { setLinkTargets((current) => ({ ...current, [note.clientId]: rowId })); setLinkLabels((current) => ({ ...current, [note.clientId]: defaultLabel })); }} onMove={(direction) => moveNote(note.clientId, direction)} onRemove={() => removeNote(note.clientId)} onUpdate={(patch) => updateNote(note.clientId, patch)} pages={pages} selectedTarget={linkTargets[note.clientId] ?? ""} />)}</article>; })}</section>)}
    {deleted ? <div className="raid-undo"><span>付箋を削除しました</span><button onClick={() => { setNotes((current) => { const copy = [...current]; copy.splice(deleted.index, 0, deleted.note); return copy; }); setDeleted(null); }} type="button"><RotateCcw size={16} />元に戻す</button></div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="form-actions"><button className="secondary-button" disabled={saving} onClick={cancel} type="button">キャンセル</button><button className="primary-button" disabled={saving} onClick={() => void save()} type="button">{saving ? "保存中…" : "保存"}</button></div>
  </div>;
}
