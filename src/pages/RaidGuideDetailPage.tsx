import { BookOpen, Edit3, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type RaidGuideDetail, type RaidGuideStrategy } from "../lib/api";

export function RaidGuideDetailPage() {
  const { guideId = "" } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<RaidGuideDetail | null>(null);
  const [own, setOwn] = useState<RaidGuideStrategy[]>([]);
  const [crew, setCrew] = useState<RaidGuideStrategy[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api.raidGuide(guideId);
      setGuide(data.guide); setOwn(data.ownStrategies); setCrew(data.crewStrategies); setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "攻略メモを読み込めませんでした");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [guideId]);

  async function remove(strategy: RaidGuideStrategy) {
    if (!window.confirm(`対策メモ「${strategy.title}」と付箋を削除しますか？`)) return;
    try { await api.deleteRaidGuideStrategy(strategy.id); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "対策メモを削除できませんでした"); }
  }

  if (loading) return <div className="page-stack compact-page"><div className="panel empty-state"><p>読み込み中です…</p></div></div>;
  if (!guide) return <div className="page-stack compact-page"><p className="form-error" role="alert">{error || "攻略メモが見つかりません"}</p></div>;

  const StrategyCard = ({ strategy, editable }: { strategy: RaidGuideStrategy; editable: boolean }) => <article className="panel raid-strategy-card">
    <div className="raid-strategy-main"><div><strong>{strategy.title}</strong><span>{strategy.authorName}・付箋{strategy.stickyNoteCount}件{strategy.visibility === "personal" ? "・自分のみ" : ""}</span>{strategy.overview ? <p>{strategy.overview}</p> : null}</div>
      {strategy.buildPost ? <Link className="raid-related-build" to={`/builds/${strategy.buildPost.id}`}><span>関連編成</span><strong>{strategy.buildPost.title}</strong><ExternalLink size={16} /></Link> : null}
    </div>
    <div className="raid-strategy-actions"><Link className="primary-button" to={`/raid-guides/${guideId}/read?strategyId=${encodeURIComponent(strategy.id)}`}><BookOpen size={17} />読む</Link>{editable ? <><Link aria-label="対策メモを編集" className="icon-button" title="編集" to={`/raid-guides/${guideId}/strategies/${strategy.id}/edit`}><Edit3 size={18} /></Link><button aria-label="対策メモを削除" className="icon-button danger-text" onClick={() => void remove(strategy)} title="削除" type="button"><Trash2 size={18} /></button></> : null}</div>
  </article>;

  return <div className="page-stack compact-page raid-guide-detail-page">
    <section className="page-heading"><div><p className="eyebrow">{guide.questMaster.displayName ?? guide.questMaster.name}</p><h1>{guide.title}</h1></div></section>
    {guide.overview ? <section className="panel raid-guide-overview"><p>{guide.overview}</p>{guide.references.length ? <div className="raid-reference-list">{guide.references.map((reference) => <a href={reference.url} key={reference.id} rel="noreferrer" target="_blank">{reference.label}<ExternalLink size={15} /></a>)}</div> : null}</section> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <section className="raid-strategy-section"><h2>書き込みなし</h2><article className="panel raid-strategy-card"><div className="raid-strategy-main"><strong>共通の攻略メモ</strong><span>付箋なし</span></div><div className="raid-strategy-actions"><Link className="primary-button" to={`/raid-guides/${guideId}/read`}><BookOpen size={17} />読む</Link></div></article></section>
    <section className="raid-strategy-section"><h2>自分の対策メモ</h2>{own.length ? <div className="simple-card-list">{own.map((strategy) => <StrategyCard editable key={strategy.id} strategy={strategy} />)}</div> : <div className="panel empty-state compact"><p>対策メモはありません。</p></div>}</section>
    <section className="raid-strategy-section"><h2>みんなの対策メモ</h2>{crew.length ? <div className="simple-card-list">{crew.map((strategy) => <StrategyCard editable={false} key={strategy.id} strategy={strategy} />)}</div> : <div className="panel empty-state compact"><p>団内公開された対策メモはありません。</p></div>}</section>
    <button aria-label="対策メモを作成" className="floating-action" disabled={!guide.isActive || own.length >= 10} onClick={() => navigate(`/raid-guides/${guideId}/strategies/new`)} title={own.length >= 10 ? "対策メモは10件までです" : "対策メモを作成"} type="button"><Plus size={23} /></button>
  </div>;
}
