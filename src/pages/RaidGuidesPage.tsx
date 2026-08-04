import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api, type RaidGuideQuest } from "../lib/api";
import { loadRaidGuideRecents, type RaidGuideRecentEntry } from "../lib/raidGuideReaderState";

export function RaidGuidesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState<RaidGuideQuest[]>([]);
  const [recent, setRecent] = useState<RaidGuideRecentEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  useEffect(() => {
    if (user) setRecent(loadRaidGuideRecents(user.id));
    api.raidGuideQuests().then((data) => { setQuests(data.quests); setError(""); }).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "攻略メモを読み込めませんでした");
    }).finally(() => setLoading(false));
  }, [user]);

  return <div className="page-stack compact-page raid-guide-list-page">
    <section className="page-heading"><div><p className="eyebrow">Raid guide</p><h1>高難度攻略メモ</h1></div></section>
    {recent.length ? <section className="raid-recent-section"><h2>最近見たもの</h2><div className="raid-recent-list">
      {recent.map((item) => <Link className="panel raid-recent-card" key={`${item.guideId}-${item.strategyId ?? "base"}`} to={`/raid-guides/${item.guideId}/read${item.strategyId ? `?strategyId=${encodeURIComponent(item.strategyId)}` : ""}`}>
        <BookOpen size={20} /><strong>{item.questName}</strong><span>{item.strategyTitle}</span><small>{item.authorName}</small>
      </Link>)}
    </div></section> : null}
    <section><div className="section-heading"><h2>クエストを選ぶ</h2></div>
      {loading ? <div className="panel empty-state"><p>読み込み中です…</p></div> : error ? <div className="panel empty-state"><p className="form-error" role="alert">{error}</p></div> : quests.length ? <div className="simple-card-list">
        {quests.map((quest) => quest.guides.length === 1 ? <Link className="panel raid-quest-card" key={quest.id} to={`/raid-guides/${quest.guides[0].id}`}><strong>{quest.name}</strong><ChevronRight size={20} /></Link> : <div className="panel raid-quest-group" key={quest.id}><button aria-expanded={expandedQuestId === quest.id} className="raid-quest-card" onClick={() => setExpandedQuestId((current) => current === quest.id ? null : quest.id)} type="button"><strong>{quest.name}</strong><span>{quest.guides.length}件</span><ChevronRight size={20} /></button>{expandedQuestId === quest.id ? <div className="raid-guide-choice-list">{quest.guides.map((guide) => <Link key={guide.id} to={`/raid-guides/${guide.id}`}>{guide.title}<ChevronRight size={17} /></Link>)}</div> : null}</div>)}
      </div> : <div className="panel empty-state"><p>利用できる高難度攻略メモはありません。</p></div>}
    </section>
    <button aria-label="対策メモを作成" className="floating-action" disabled={!quests.length} onClick={() => setChoosing(true)} title="対策メモを作成" type="button"><Plus size={23} /></button>
    {choosing ? <div className="modal-backdrop" onMouseDown={() => setChoosing(false)}><div className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()}><h2>攻略メモを選ぶ</h2><div className="simple-card-list">{quests.flatMap((quest) => quest.guides.map((guide) => <button className="secondary-button raid-choice-button" key={guide.id} onClick={() => navigate(`/raid-guides/${guide.id}/strategies/new`)} type="button"><span>{quest.name}<small>{guide.title !== quest.name ? guide.title : ""}</small></span><ChevronRight size={18} /></button>))}</div><div className="dialog-actions"><button className="secondary-button" onClick={() => setChoosing(false)} type="button">閉じる</button></div></div></div> : null}
  </div>;
}
