import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type BuildDraft } from "../lib/api";

export function BuildDraftsPage() {
  const [drafts, setDrafts] = useState<BuildDraft[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.buildDrafts().then((data) => setDrafts(data.drafts)).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "下書きを読み込めませんでした"));
  }, []);
  return <div className="page-stack compact-page"><section className="page-heading"><div><p className="eyebrow">Drafts</p><h1>下書き</h1></div></section>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {drafts.length === 0 ? <section className="panel empty-state"><p>保存した下書きはありません。</p></section> : <section className="simple-card-list">{drafts.map((draft) => <Link className="panel draft-card" key={draft.id} to={`/builds/drafts/${draft.id}`}><FileText size={22} /><span><strong>{draft.title || "無題の下書き"}</strong><small>{new Date(draft.updatedAt).toLocaleString("ja-JP")}</small></span></Link>)}</section>}
    <Link aria-label="新しい編成を作成" className="floating-action" to="/builds/new"><Plus size={23} /></Link>
  </div>;
}
