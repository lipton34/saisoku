import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gem, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type SparkHistoryEntry, type SparkSavings, type SparkSavingsInput, type SparkTarget, type SparkTargetInput, type SparkTargetMasterOption, type SparkRewardMonthSummary } from "../lib/api";
import { calculateSparkSavings } from "../lib/sparkSavings";

type Tab = "savings" | "targets" | "rewards" | "history";
const tabs: { id: Tab; label: string }[] = [{ id: "savings", label: "貯金" }, { id: "targets", label: "狙い目" }, { id: "rewards", label: "獲得目安" }, { id: "history", label: "履歴" }];
const emptyBalance = { crystalCount: "0", singleTicketCount: "0", tenPullTicketCount: "0" };
const fmt = (value: number) => value.toLocaleString("ja-JP");
const balance = (savings: SparkSavings | null): SparkSavingsInput => savings ? { crystalCount: String(savings.crystalCount), singleTicketCount: String(savings.singleTicketCount), tenPullTicketCount: String(savings.tenPullTicketCount) } : emptyBalance;

export function SparkSavingsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab"); const activeTab: Tab = tabs.some((tab) => tab.id === requested) ? requested as Tab : "savings";
  const [savings, setSavings] = useState<SparkSavings | null>(null); const [loading, setLoading] = useState(true); const [message, setMessage] = useState("");
  useEffect(() => { api.sparkSavings().then((result) => setSavings(result.sparkSavings)).catch((error) => setMessage(error instanceof Error ? error.message : "読み込みに失敗しました")).finally(() => setLoading(false)); }, []);
  const calc = calculateSparkSavings({ crystalCount: savings?.crystalCount ?? 0, singleTicketCount: savings?.singleTicketCount ?? 0, tenPullTicketCount: savings?.tenPullTicketCount ?? 0 });
  return <div className="page-stack compact-page spark-savings-page">
    <section className="page-heading"><div><p className="eyebrow">Spark Savings</p><h1>天井貯金</h1></div>{activeTab === "rewards" ? <Link className="secondary-button" to="/spark-savings/reference-data">共有データを管理</Link> : null}</section>
    {message ? <p className="form-notice" role="status">{message}</p> : null}
    <section className={`panel spark-summary${calc.isTargetReached ? " is-reached" : ""}`}><div className="spark-current"><span>現在</span><strong>{fmt(calc.currentDrawCount)}<small>連分</small></strong></div><div className="spark-needed">{calc.isTargetReached ? <p className="spark-reached"><CheckCircle2 size={22} />天井分を確保済み{calc.excessDrawCount ? `（${fmt(calc.excessDrawCount)}連分超過）` : ""}</p> : null}<span>追加で必要な宝晶石</span><strong>{fmt(calc.additionalCrystalCount)}<small>個</small></strong></div></section>
    <nav aria-label="天井貯金メニュー" className="spark-tabs">{tabs.map((tab) => <button aria-current={tab.id === activeTab ? "page" : undefined} className={tab.id === activeTab ? "is-active" : ""} key={tab.id} onClick={() => setParams({ tab: tab.id })} type="button">{tab.label}</button>)}</nav>
    {loading ? <section className="panel empty-state"><p>読み込んでいます…</p></section> : null}
    {!loading && activeTab === "savings" ? <SavingsTab savings={savings} onChange={setSavings} notify={setMessage} /> : null}
    {!loading && activeTab === "targets" ? <TargetsTab /> : null}
    {!loading && activeTab === "rewards" ? <RewardsTab /> : null}
    {!loading && activeTab === "history" ? <HistoryTab savings={savings} onChange={setSavings} notify={setMessage} /> : null}
  </div>;
}

function SavingsTab({ savings, onChange, notify }: { savings: SparkSavings | null; onChange: (value: SparkSavings | null) => void; notify: (value: string) => void }) {
  const [editing, setEditing] = useState(!savings); const [draft, setDraft] = useState(balance(savings)); const [saving, setSaving] = useState(false);
  async function save(event: FormEvent) { event.preventDefault(); setSaving(true); try { const result = await api.saveSparkSavings(draft); onChange(result.sparkSavings); setDraft(balance(result.sparkSavings)); setEditing(false); notify(result.message); } catch (e) { notify(e instanceof Error ? e.message : "保存できませんでした"); } finally { setSaving(false); } }
  async function reset() { if (!window.confirm("宝晶石とチケットの残高を0にリセットしますか？")) return; setSaving(true); try { const result = await api.resetSparkSavings(); onChange(result.sparkSavings); setDraft(balance(result.sparkSavings)); setEditing(false); notify(result.message); } catch (e) { notify(e instanceof Error ? e.message : "リセットできませんでした"); } finally { setSaving(false); } }
  if (editing) return <form className="panel spark-form" onSubmit={save}><div className="section-heading"><h2>残高を編集</h2></div><div className="spark-count-form"><BalanceFields value={draft} onChange={setDraft} /></div><div className="button-row"><button className="primary-button" disabled={saving} type="submit"><Save size={18} />保存</button>{savings ? <button className="secondary-button" onClick={() => { setDraft(balance(savings)); setEditing(false); }} type="button">キャンセル</button> : null}</div></form>;
  const crystalDraws = Math.floor((savings?.crystalCount ?? 0) / 300);
  return <><section className="panel"><div className="section-heading"><h2>内訳</h2></div><dl className="spark-breakdown"><div><dt>宝晶石</dt><dd>{fmt(savings?.crystalCount ?? 0)}個 <small>（{fmt(crystalDraws)}連分）</small></dd></div><div><dt>単発チケット</dt><dd>{fmt(savings?.singleTicketCount ?? 0)}枚</dd></div><div><dt>10連チケット</dt><dd>{fmt(savings?.tenPullTicketCount ?? 0)}枚</dd></div></dl></section><section className="spark-actions"><button className="primary-button" onClick={() => setEditing(true)} type="button"><Pencil size={18} />編集</button><button className="secondary-button danger-button" disabled={saving} onClick={() => void reset()} type="button"><RotateCcw size={18} />リセット</button></section></>;
}

function BalanceFields({ value, onChange }: { value: SparkSavingsInput; onChange: (value: SparkSavingsInput) => void }) { return <><label>宝晶石数<input inputMode="numeric" min="0" onChange={(e) => onChange({ ...value, crystalCount: e.target.value })} required type="number" value={value.crystalCount} /></label><label>単発チケット数<input inputMode="numeric" min="0" onChange={(e) => onChange({ ...value, singleTicketCount: e.target.value })} required type="number" value={value.singleTicketCount} /></label><label>10連チケット数<input inputMode="numeric" min="0" onChange={(e) => onChange({ ...value, tenPullTicketCount: e.target.value })} required type="number" value={value.tenPullTicketCount} /></label></>; }

const blankTarget: SparkTargetInput = { itemType: "character", name: "", masterItemId: null, desiredCount: 1, ownedCount: 0, availabilityPeriodIds: [], note: null, sortOrder: 0, goalIds: [], buildPostIds: [] };
function TargetsTab() {
  const [targets, setTargets] = useState<SparkTarget[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [draft, setDraft] = useState<SparkTargetInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<{ id: string; displayLabel: string }[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<{ id: string; title: string }[]>([]);
  const [selectedBuilds, setSelectedBuilds] = useState<{ id: string; title: string }[]>([]);
  const [message, setMessage] = useState("");
  const loadTargets = () => api.sparkTargets(showCompleted).then((result) => setTargets(result.targets)).catch((e) => setMessage(e instanceof Error ? e.message : "読み込めませんでした"));
  useEffect(() => { void loadTargets(); }, [showCompleted]);
  useEffect(() => { void api.sparkTargetOptions().then((result) => setPeriods(result.periods)).catch((e) => setMessage(e instanceof Error ? e.message : "排出時期を読み込めませんでした")); }, []);
  function openNew() { setEditingId(null); setSelectedGoals([]); setSelectedBuilds([]); setDraft({ ...blankTarget }); }
  function edit(target: SparkTarget) {
    setEditingId(target.id);
    setSelectedGoals(target.goalLinks.map((link) => link.goal));
    setSelectedBuilds(target.buildLinks.map((link) => link.buildPost));
    setDraft({ itemType: target.itemType, name: target.name, masterItemId: target.masterItemId, desiredCount: target.desiredCount, ownedCount: target.ownedCount, availabilityPeriodIds: target.availabilityLinks.map((link) => link.availabilityPeriod.id), note: target.note, sortOrder: target.sortOrder, goalIds: target.goalLinks.map((link) => link.goal.id), buildPostIds: target.buildLinks.map((link) => link.buildPost.id) });
  }
  async function save(event: FormEvent) { event.preventDefault(); if (!draft) return; try { const normalized = draft.itemType === "character" ? { ...draft, desiredCount: 1, ownedCount: draft.ownedCount > 0 ? 1 : 0 } : draft; const result = editingId ? await api.updateSparkTarget(editingId, normalized) : await api.createSparkTarget(normalized); setMessage(result.message); setDraft(null); setEditingId(null); await loadTargets(); } catch (error) { setMessage(error instanceof Error ? error.message : "保存できませんでした"); } }
  async function remove(id: string) { if (!window.confirm("この狙い目を削除しますか？")) return; try { const result = await api.deleteSparkTarget(id); setMessage(result.message); await loadTargets(); } catch (e) { setMessage(e instanceof Error ? e.message : "削除できませんでした"); } }
  return <section className="page-stack">
    <div className="spark-toolbar"><label><input checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} type="checkbox" /> 達成済みも表示</label><button className="primary-button" onClick={openNew} type="button"><Plus size={18} />登録</button></div>
    {message ? <p className="form-notice">{message}</p> : null}
    <div className="spark-target-list">{targets.map((target) => <article className={`panel spark-target-card${target.ownedCount >= target.desiredCount ? " is-complete" : ""}`} key={target.id}><div><span className="pill">{{ character: "キャラ", summon: "召喚石", weapon: "武器" }[target.itemType]}</span><h2>{target.name}</h2><p>{target.itemType === "character" ? (target.ownedCount ? "取得済み" : "未取得") : `${target.ownedCount} / ${target.desiredCount}`}{target.availabilityLinks.length ? ` ・ ${target.availabilityLinks.map((link) => link.availabilityPeriod.displayLabel).join(" / ")}` : ""}</p>{target.note ? <p>{target.note}</p> : null}{target.goalLinks.length ? <p>目標: {target.goalLinks.map((link) => link.goal.title).join("、")}</p> : null}{target.buildLinks.length ? <p>編成: {target.buildLinks.map((link) => link.buildPost.title).join("、")}</p> : null}</div><div className="button-row"><button className="secondary-button" onClick={() => edit(target)} type="button">編集</button><button aria-label={`${target.name}を削除`} className="icon-button danger-button" onClick={() => void remove(target.id)} title="削除" type="button"><Trash2 size={18} /></button></div></article>)}{!targets.length ? <div className="panel empty-state">表示する狙い目はありません。</div> : null}</div>
    {draft ? <div className="modal-backdrop" onMouseDown={() => setDraft(null)}><form aria-labelledby="spark-target-dialog-title" aria-modal="true" className="panel spark-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={save} role="dialog"><header className="spark-dialog-header"><h2 id="spark-target-dialog-title">{editingId ? "狙い目を編集" : "狙い目を登録"}</h2><button aria-label="閉じる" className="icon-button" onClick={() => setDraft(null)} title="閉じる" type="button"><X size={19} /></button></header><div className="spark-dialog-body"><div className="spark-target-core-fields"><MasterItemSelect kind={draft.itemType} selectedId={draft.masterItemId} selectedName={draft.name} onSelect={(item, itemType) => setDraft({ ...draft, itemType, masterItemId: item?.id ?? null, name: item ? item.displayName ?? item.name : itemType === draft.itemType ? draft.name : "", ...(itemType === "character" ? { desiredCount: 1, ownedCount: draft.ownedCount > 0 ? 1 : 0 } : {}) })} /><label className="spark-target-name-field">名前<input maxLength={100} required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>{draft.itemType === "character" ? <label className="spark-target-owned-check"><input checked={draft.ownedCount > 0} onChange={(event) => setDraft({ ...draft, ownedCount: event.target.checked ? 1 : 0 })} type="checkbox" />取得済み</label> : <><label>設定数<input min={1} max={999} type="number" value={draft.desiredCount} onChange={(event) => setDraft({ ...draft, desiredCount: Number(event.target.value) })} /></label><label>所持数<input min={0} max={999} type="number" value={draft.ownedCount} onChange={(event) => setDraft({ ...draft, ownedCount: Number(event.target.value) })} /></label></>}<AvailabilitySelect periods={periods} selectedIds={draft.availabilityPeriodIds} onChange={(availabilityPeriodIds) => setDraft({ ...draft, availabilityPeriodIds })} /></div><AsyncLinkSelect label="目標との連携" selected={selectedGoals} type="goal" onChange={(items) => { setSelectedGoals(items); setDraft({ ...draft, goalIds: items.map((item) => item.id) }); }} /><AsyncLinkSelect label="編成との連携" selected={selectedBuilds} type="build" onChange={(items) => { setSelectedBuilds(items); setDraft({ ...draft, buildPostIds: items.map((item) => item.id) }); }} /><label>メモ<textarea maxLength={500} rows={3} value={draft.note ?? ""} onChange={(event) => setDraft({ ...draft, note: event.target.value || null })} /></label></div><footer className="spark-dialog-footer"><button className="secondary-button" onClick={() => setDraft(null)} type="button">キャンセル</button><button className="primary-button" type="submit"><Save size={18} />保存</button></footer></form></div> : null}
  </section>;
}

const masterElements = ["火", "水", "土", "風", "光", "闇"];
const masterCategories = ["リミテッド", "十二神将", "水着", "浴衣", "バレンタイン", "ハロウィン", "クリスマス", "ドレスアップ"];
const summonSeries = [{ value: "optimus", label: "オプティマス" }, { value: "archangel", label: "天司" }, { value: "six-dragons", label: "六竜" }, { value: "providence", label: "プロヴィデンス" }, { value: "genesis", label: "ジェネシス" }];

function MasterItemSelect({ kind, selectedId, selectedName, onSelect }: { kind: string; selectedId: string | null; selectedName: string; onSelect: (item: SparkTargetMasterOption | null, itemType: string) => void }) {
  const [open, setOpen] = useState(false);
  const [searchKind, setSearchKind] = useState(kind);
  const [query, setQuery] = useState("");
  const [element, setElement] = useState("");
  const [category, setCategory] = useState("");
  const [series, setSeries] = useState("");
  const [items, setItems] = useState<SparkTargetMasterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  useEffect(() => { setSearchKind(kind); }, [kind]);
  useEffect(() => { setItems([]); setElement(""); setCategory(""); setSeries(""); setSearched(false); }, [searchKind]);
  const hasSearchCondition = Boolean(query.trim() || element || (searchKind === "summon" ? series : category));
  async function search() {
    const normalizedQuery = query.trim();
    if (!hasSearchCondition) return;
    setLoading(true);
    setSearched(true);
    try { const result = await api.sparkTargetMasterOptions(searchKind, normalizedQuery, { element, category: searchKind === "summon" ? undefined : category, series: searchKind === "summon" ? series : undefined }); setItems(result.items); }
    catch { setItems([]); }
    finally { setLoading(false); }
  }
  return <div className="spark-master-setting"><span>対象</span><button className="secondary-button" onClick={() => setOpen(true)} type="button">対象設定</button><small>{selectedId ? `選択中：${selectedName}` : "未選択（名前の直接入力も可能）"}</small>{selectedId ? <button className="spark-master-clear" onClick={() => onSelect(null, kind)} type="button">マスター選択を解除</button> : null}
    {open ? <div className="modal-backdrop spark-master-modal-backdrop" onMouseDown={() => setOpen(false)}><section aria-labelledby="spark-master-dialog-title" aria-modal="true" className="panel spark-dialog spark-master-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog"><header className="spark-dialog-header"><h2 id="spark-master-dialog-title">狙い目の対象を選択</h2><button aria-label="閉じる" className="icon-button" onClick={() => setOpen(false)} title="閉じる" type="button"><X size={19} /></button></header><div className="spark-dialog-body"><div className="spark-master-search"><label>種類<select autoFocus onChange={(event) => { setSearchKind(event.target.value); onSelect(null, event.target.value); }} value={searchKind}><option value="character">キャラ</option><option value="summon">召喚石</option><option value="weapon">武器</option></select></label><label>テキスト検索（任意）<input maxLength={100} onChange={(event) => { setQuery(event.target.value); setSearched(false); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} placeholder="名前・別名を入力" type="search" value={query} /></label><label>属性<select onChange={(event) => setElement(event.target.value)} value={element}><option value="">すべて</option>{masterElements.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{searchKind === "summon" ? <label>シリーズ<select onChange={(event) => setSeries(event.target.value)} value={series}><option value="">すべて</option>{summonSeries.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}</select></label> : <label>区分<select onChange={(event) => setCategory(event.target.value)} value={category}><option value="">すべて</option>{masterCategories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}<button className="primary-button" disabled={loading || !hasSearchCondition} onClick={() => void search()} type="button">{loading ? "検索中…" : "検索"}</button></div><small>テキスト、属性、区分・シリーズのいずれかを指定してください。</small><div aria-live="polite" className="spark-master-results">{items.map((item) => <button key={item.id} onClick={() => { onSelect(item, searchKind); setOpen(false); }} type="button"><strong>{item.displayName ?? item.name}</strong><span>{[item.element, item.category].filter(Boolean).join("・")}</span></button>)}{!loading && !items.length ? <p className="empty-state">{searched ? "該当する対象はありません。" : "検索条件を指定して検索してください。"}</p> : null}</div></div></section></div> : null}
  </div>;
}

function AvailabilitySelect({ periods, selectedIds, onChange }: { periods: { id: string; displayLabel: string }[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const selected = periods.filter((period) => selectedIds.includes(period.id));
  const available = periods.filter((period) => !selectedIds.includes(period.id));
  return <fieldset className="spark-availability-select"><legend>排出時期（2件まで）</legend><select disabled={selectedIds.length >= 2 || !available.length} onChange={(event) => { if (event.target.value) onChange([...selectedIds, event.target.value]); event.target.value = ""; }} value=""><option value="">{selectedIds.length >= 2 ? "2件選択済み" : available.length ? "排出時期を選択" : "候補なし"}</option>{available.map((period) => <option key={period.id} value={period.id}>{period.displayLabel}</option>)}</select>{selected.length ? <div className="spark-selected-links">{selected.map((period) => <span key={period.id}>{period.displayLabel}<button aria-label={`${period.displayLabel}を外す`} onClick={() => onChange(selectedIds.filter((id) => id !== period.id))} title="排出時期を外す" type="button"><X size={14} /></button></span>)}</div> : <small>未設定</small>}</fieldset>;
}

function AsyncLinkSelect({ label, type, selected, onChange }: { label: string; type: "goal" | "build"; selected: { id: string; title: string }[]; onChange: (items: { id: string; title: string }[]) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { let active = true; const timer = window.setTimeout(() => { setLoading(true); void api.sparkTargetLinkOptions(type, query).then((result) => { if (active) setItems(result.items); }).catch(() => { if (active) setItems([]); }).finally(() => { if (active) setLoading(false); }); }, 250); return () => { active = false; window.clearTimeout(timer); }; }, [query, type]);
  const available = items.filter((item) => !selected.some((current) => current.id === item.id));
  return <fieldset className="spark-link-select"><legend>{label}</legend><input aria-label={`${label}を検索`} onChange={(event) => setQuery(event.target.value)} placeholder="名前で検索" type="search" value={query} /><select aria-label={`${label}の候補`} disabled={loading || !available.length} onChange={(event) => { const item = available.find((candidate) => candidate.id === event.target.value); if (item) onChange([...selected, item]); event.target.value = ""; }} value=""><option value="">{loading ? "検索中…" : available.length ? "候補を選択" : "候補なし"}</option>{available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{selected.length ? <div className="spark-selected-links">{selected.map((item) => <span key={item.id}>{item.title}<button aria-label={`${item.title}の連携を外す`} onClick={() => onChange(selected.filter((current) => current.id !== item.id))} title="連携を外す" type="button"><X size={14} /></button></span>)}</div> : <small>未選択</small>}</fieldset>;
}

function RewardsTab() { const [months, setMonths] = useState<SparkRewardMonthSummary[]>([]); const [error, setError] = useState(""); useEffect(() => { api.sparkRewardSummary().then((r) => setMonths(r.months)).catch((e) => setError(e instanceof Error ? e.message : "読み込めませんでした")); }, []); if (error) return <section className="panel empty-state"><p className="form-error">{error}</p></section>; return <div className="spark-reward-months">{months.map((month, index) => <section className={`panel${index ? " is-compact" : ""}`} key={`${month.year}-${month.month}`}><p className="eyebrow">{index ? "過去3年の範囲" : "当月の内訳"}</p><h2>{month.year}年{month.month}月</h2><strong className="spark-range">{month.min == null ? "集計データなし" : `${fmt(month.min)} ～ ${fmt(month.max ?? month.min)} 個相当`}</strong>{month.schedules.length ? <ul>{month.schedules.map((s) => <li key={s.id}>{s.name}（{s.startedOn.replace(/-/g, "/")}～{s.endedOn?.replace(/-/g, "/") ?? ""}）</li>)}</ul> : <p>確定した開催予定はありません。</p>}{index === 0 && month.records.length ? <dl className="spark-reward-records">{month.records.map((r) => <div key={r.id}><dt>{r.name}</dt><dd>{r.min == null ? "実績なし" : `${fmt(r.min)} ～ ${fmt(r.max ?? r.min)}個相当`}</dd></div>)}</dl> : null}</section>)}</div>; }

function HistoryTab({ savings, onChange, notify }: { savings: SparkSavings | null; onChange: (s: SparkSavings) => void; notify: (m: string) => void }) {
  const [entries, setEntries] = useState<SparkHistoryEntry[]>([]);
  const [months, setMonths] = useState<{ month: string; earnedEquivalent: number; spentEquivalent: number; adjustmentEquivalent: number; entryCount: number }[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...emptyBalance, entryType: "earn", memo: "" });
  const [isAdding, setIsAdding] = useState(false);
  const load = (next?: string) => Promise.all([api.sparkHistory(next), api.sparkHistorySummary()]).then(([result, summary]) => { setEntries((old) => next ? [...old, ...result.entries] : result.entries); setCursor(result.nextCursor); setMonths(summary.months); });
  useEffect(() => { if (savings?.historyStartedAt) void load(); }, [savings?.historyStartedAt]);
  if (!savings?.historyStartedAt) return <section className="panel empty-state"><Gem size={32} /><h2>獲得履歴は任意です</h2><p>開始すると現在の残高を起点として、獲得・使用・調整を記録できます。</p><button className="primary-button" onClick={() => void api.activateSparkHistory().then((result) => { onChange(result.sparkSavings); notify(result.message); })} type="button">履歴を開始</button></section>;
  async function add(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await api.addSparkHistory({ crystalCount: draft.crystalCount, singleTicketCount: draft.singleTicketCount, tenPullTicketCount: draft.tenPullTicketCount, entryType: draft.entryType, title: "", memo: draft.memo || null });
      onChange(result.sparkSavings); notify(result.message); setDraft({ ...emptyBalance, entryType: "earn", memo: "" }); setIsAdding(false); await load();
    } catch (error) { notify(error instanceof Error ? error.message : "記録できませんでした"); }
  }
  return <div className="page-stack">
    <section className="panel"><div className="section-heading spark-history-heading"><div><p className="eyebrow">History</p><h2>記録</h2></div><button className="primary-button" onClick={() => setIsAdding(true)} type="button"><Plus size={18} />履歴を追加</button></div><div className="spark-history-list">{entries.map((entry) => <article key={entry.id}><div><strong>{entry.title}</strong><small>{new Date(entry.createdAt).toLocaleString("ja-JP")}</small></div><p>宝晶石 {entry.crystalDelta >= 0 ? "+" : ""}{fmt(entry.crystalDelta)} / 単発 {entry.singleTicketDelta >= 0 ? "+" : ""}{entry.singleTicketDelta} / 10連 {entry.tenPullTicketDelta >= 0 ? "+" : ""}{entry.tenPullTicketDelta}</p>{entry.memo ? <p>{entry.memo}</p> : null}</article>)}</div>{cursor ? <button className="secondary-button" onClick={() => void load(cursor)} type="button">さらに表示</button> : null}</section>
    <section className="panel"><div className="spark-monthly-header"><div><p className="eyebrow">Monthly summary</p><h2>月ごとの集計</h2></div><label><span>集計開始月</span><input min={savings.historyStartedAt.slice(0, 7)} max={new Date().toISOString().slice(0, 7)} type="month" value={savings.historySummaryStartMonth ?? savings.historyStartedAt.slice(0, 7)} onChange={(event) => void api.updateSparkHistoryStart(event.target.value).then(async (result) => { onChange(result.sparkSavings); notify(result.message); await load(); })} /></label></div><div className="spark-monthly-grid">{months.map((month) => <article className="spark-monthly-card" key={month.month}><h3>{month.month.replace("-", "年")}月</h3><dl><div><dt>獲得</dt><dd>{fmt(month.earnedEquivalent)}個相当</dd></div><div><dt>使用</dt><dd>{fmt(month.spentEquivalent)}個相当</dd></div>{month.adjustmentEquivalent ? <div><dt>調整</dt><dd>{month.adjustmentEquivalent >= 0 ? "+" : ""}{fmt(month.adjustmentEquivalent)}個相当</dd></div> : null}</dl></article>)}{!months.length ? <p className="empty-state">入力のある月はまだありません。</p> : null}</div></section>
    <button className="secondary-button danger-button" onClick={() => { if (window.confirm("履歴をすべて削除しますか？ 残高は維持されます。")) void api.deleteSparkHistory().then((result) => { onChange(result.sparkSavings); notify(result.message); }); }} type="button">履歴をすべて削除</button>
    {isAdding ? <div className="modal-backdrop spark-modal-backdrop" onMouseDown={() => setIsAdding(false)}><form aria-labelledby="spark-history-dialog-title" aria-modal="true" className="panel spark-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={add} role="dialog"><header className="spark-dialog-header"><h2 id="spark-history-dialog-title">履歴を追加</h2><button aria-label="閉じる" className="icon-button" onClick={() => setIsAdding(false)} title="閉じる" type="button"><X size={19} /></button></header><div className="spark-dialog-body spark-form"><label>操作<select value={draft.entryType} onChange={(event) => setDraft({ ...draft, entryType: event.target.value })}><option value="earn">獲得</option><option value="spend">使用</option><option value="adjustment">残高調整（実数）</option></select></label><div className="spark-count-form"><BalanceFields value={draft} onChange={(value) => setDraft({ ...draft, ...value })} /></div><label>メモ<textarea maxLength={500} rows={3} value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} /></label></div><footer className="spark-dialog-footer"><button className="secondary-button" onClick={() => setIsAdding(false)} type="button">キャンセル</button><button className="primary-button" type="submit"><Save size={18} />記録</button></footer></form></div> : null}
  </div>;
}
