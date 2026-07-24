import { FileText, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type SimpleBuildPost } from "../lib/api";

export function BuildsPage() {
  const [posts, setPosts] = useState<SimpleBuildPost[]>([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState("");

  async function load(search = query) {
    try {
      const data = await api.simpleBuildPosts(search);
      setPosts(data.posts);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "編成を読み込めませんでした");
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  return (
    <div className="page-stack compact-page">
      <section className="page-heading build-list-heading">
        <div><p className="eyebrow">Builds</p><h1>編成</h1></div>
        <div className="heading-actions">
          <Link className="secondary-button" to="/builds/drafts"><FileText size={17} />下書き</Link>
          <button aria-label="編成を検索" className="icon-button" onClick={() => setSearchOpen(true)} title="検索" type="button"><Search size={19} /></button>
        </div>
      </section>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {posts.length === 0 ? <section className="panel empty-state"><p>公開されている編成はありません。</p></section> : <section className="build-card-grid">
        {posts.map((post) => <Link className="panel simple-build-card" key={post.id} to={`/builds/${post.id}`}>
          {post.images[0]?.publicUrl ? <img alt="" loading="lazy" src={post.images[0].publicUrl} /> : <div className="build-image-placeholder"><FileText size={28} /></div>}
          <div><strong>{post.title}</strong>{post.questName ? <span>{post.questName}</span> : null}<small>{post.authorName}</small></div>
        </Link>)}
      </section>}
      <Link aria-label="編成を投稿" className="floating-action" to="/builds/new"><Plus size={23} /></Link>
      {searchOpen ? <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}><form className="panel compact-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); void load(); setSearchOpen(false); }}>
        <h2>編成を検索</h2><label>キーワード<input autoFocus onChange={(event) => setQuery(event.target.value)} value={query} /></label>
        <div className="dialog-actions"><button className="secondary-button" onClick={() => { setQuery(""); void load(""); setSearchOpen(false); }} type="button">解除</button><button className="primary-button" type="submit">検索</button></div>
      </form></div> : null}
    </div>
  );
}
