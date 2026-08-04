import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type RaidGuideReader, type RaidGuideStickyNote, type SimpleBuildPost } from "../lib/api";

type EditableSticky = {
  clientId: string;
  guideRowId: string | null;
  body: string;
  color: RaidGuideStickyNote["color"];
};

const colors: Array<{ value: RaidGuideStickyNote["color"]; label: string }> = [
  { value: "yellow", label: "黄" }, { value: "blue", label: "青" }, { value: "green", label: "緑" },
  { value: "pink", label: "桃" }, { value: "purple", label: "紫" }
];

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

  useEffect(() => {
    Promise.all([api.raidGuideReader(guideId, strategyId), api.simpleBuildPosts()]).then(([reader, buildData]) => {
      setGuide(reader.guide); setBuilds(buildData.posts);
      if (reader.strategy) {
        setTitle(reader.strategy.title); setOverview(reader.strategy.overview ?? "");
        setVisibility(reader.strategy.visibility); setBuildPostId(reader.strategy.buildPostId ?? "");
        setExpectedUpdatedAt(reader.strategy.updatedAt);
        setNotes(reader.strategy.stickyNotes.map((note) => ({ clientId: note.id, guideRowId: note.guideRowId, body: note.body, color: note.color })));
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

  function change<T>(setter: (value: T) => void, value: T) { setter(value); setDirty(true); }

  function addNote(guideRowId: string | null) {
    if (notes.length >= 20) { setError("付箋は20件まで追加できます"); return; }
    setNotes((current) => [...current, { clientId: crypto.randomUUID(), guideRowId, body: "", color: "yellow" }]);
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
    const invalid = notes.some((note) => !note.body.trim() || note.body.trim().length > 500);
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (invalid) { setError("付箋の本文を1～500文字で入力してください"); return; }
    setSaving(true); setError("");
    const value = {
      title: title.trim(), overview: overview.trim(), visibility, buildPostId: buildPostId || null,
      expectedUpdatedAt,
      stickyNotes: notes.map((note) => ({ guideRowId: note.guideRowId, body: note.body.trim(), color: note.color }))
    };
    try {
      if (strategyId) await api.updateRaidGuideStrategy(strategyId, value);
      else await api.createRaidGuideStrategy(guideId, value);
      setDirty(false); navigate(`/raid-guides/${guideId}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "対策メモを保存できませんでした"); }
    finally { setSaving(false); }
  }

  function StickyEditor({ note, group }: { note: EditableSticky; group: EditableSticky[] }) {
    const index = group.findIndex((item) => item.clientId === note.clientId);
    return <article className={`raid-sticky-editor is-${note.color}`}>
      <textarea aria-label="付箋本文" maxLength={500} onChange={(event) => updateNote(note.clientId, { body: event.target.value })} placeholder="この場所で確認すること" rows={3} value={note.body} />
      <div className="raid-sticky-controls"><label>色<select onChange={(event) => updateNote(note.clientId, { color: event.target.value as RaidGuideStickyNote["color"] })} value={note.color}>{colors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}</select></label>
        <button aria-label="付箋を上へ" disabled={index === 0} onClick={() => moveNote(note.clientId, -1)} title="上へ" type="button"><ArrowUp size={17} /></button>
        <button aria-label="付箋を下へ" disabled={index === group.length - 1} onClick={() => moveNote(note.clientId, 1)} title="下へ" type="button"><ArrowDown size={17} /></button>
        <button aria-label="付箋を削除" onClick={() => removeNote(note.clientId)} title="削除" type="button"><Trash2 size={17} /></button>
      </div>
    </article>;
  }

  if (loading) return <div className="page-stack compact-page"><div className="panel empty-state"><p>読み込み中です…</p></div></div>;
  if (!guide) return <div className="page-stack compact-page"><p className="form-error" role="alert">{error || "攻略メモが見つかりません"}</p></div>;

  return <div className="page-stack compact-page raid-strategy-editor-page">
    <section className="page-heading"><div><p className="eyebrow">{guide.questMaster.displayName ?? guide.questMaster.name}</p><h1>{strategyId ? "対策メモを編集" : "対策メモを作成"}</h1></div></section>
    <section className="panel simple-form"><label>タイトル<input maxLength={100} onChange={(event) => change(setTitle, event.target.value)} value={title} /></label><label>概要<textarea maxLength={500} onChange={(event) => change(setOverview, event.target.value)} rows={3} value={overview} /></label><label>公開範囲<select onChange={(event) => change(setVisibility, event.target.value as "crew" | "personal")} value={visibility}><option value="crew">団内公開</option><option value="personal">自分のみ</option></select></label><label>関連編成<select onChange={(event) => change(setBuildPostId, event.target.value)} value={buildPostId}><option value="">設定しない</option>{builds.map((build) => <option key={build.id} value={build.id}>{build.title}</option>)}</select></label></section>
    <section className="panel raid-sticky-location"><div className="section-heading"><div><h2>全体への付箋</h2><small>{grouped.get("overall")?.length ?? 0}件</small></div><button className="secondary-button" disabled={notes.length >= 20} onClick={() => addNote(null)} type="button"><Plus size={17} />追加</button></div>{grouped.get("overall")?.map((note) => <StickyEditor group={grouped.get("overall") ?? []} key={note.clientId} note={note} />)}</section>
    {guide.sections.map((section) => <section className="raid-editor-section" key={section.id}><h2>{section.title}</h2>{section.rows.map((row) => { const rowNotes = grouped.get(row.id) ?? []; return <article className="panel raid-sticky-location" key={row.id}><div className="raid-editor-row-summary"><span className={`raid-danger-label is-${row.dangerLevel}`}>{row.dangerLevel === "danger" ? "危険" : row.dangerLevel === "caution" ? "注意" : "通常"}</span><strong>{row.timingCondition}</strong><p>{row.enemyAction}</p></div><div className="section-heading"><div><h3>この行の付箋</h3><small>{rowNotes.length}件</small></div><button className="secondary-button" disabled={notes.length >= 20} onClick={() => addNote(row.id)} type="button"><Plus size={17} />追加</button></div>{rowNotes.map((note) => <StickyEditor group={rowNotes} key={note.clientId} note={note} />)}</article>; })}</section>)}
    {deleted ? <div className="raid-undo"><span>付箋を削除しました</span><button onClick={() => { setNotes((current) => { const copy = [...current]; copy.splice(deleted.index, 0, deleted.note); return copy; }); setDeleted(null); }} type="button"><RotateCcw size={16} />元に戻す</button></div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <div className="form-actions"><button className="secondary-button" disabled={saving} onClick={cancel} type="button">キャンセル</button><button className="primary-button" disabled={saving} onClick={() => void save()} type="button">{saving ? "保存中…" : "保存"}</button></div>
  </div>;
}
