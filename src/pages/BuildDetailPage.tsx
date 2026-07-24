import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api, type SimpleBuildPost } from "../lib/api";

export function BuildDetailPage() {
  const { buildId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<SimpleBuildPost | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api.simpleBuildPost(buildId).then(({ post: value }) => setPost(value)).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "編成を読み込めませんでした"));
  }, [buildId]);

  async function remove() {
    if (!post || !window.confirm("この編成投稿と画像を削除しますか？")) return;
    try {
      await api.deleteSimpleBuildPost(post.id);
      navigate("/builds");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "削除できませんでした");
    }
  }

  if (error) return <div className="page-stack compact-page"><p className="form-error" role="alert">{error}</p></div>;
  if (!post) return <div className="page-stack compact-page"><p>読み込み中…</p></div>;
  return <div className="page-stack compact-page build-detail-page">
    <section className="page-heading"><div><p className="eyebrow">{post.questName || "Build"}</p><h1>{post.title}</h1><p>{post.authorName}</p></div></section>
    {post.images.length ? <section className="panel build-gallery">
      <img alt={`${post.title}の画像 ${activeImage + 1}`} src={post.images[activeImage].publicUrl ?? ""} />
      {post.images.length > 1 ? <div className="build-thumbnails">{post.images.map((image, index) => <button aria-label={`画像${index + 1}を表示`} className={index === activeImage ? "active" : ""} key={image.id} onClick={() => setActiveImage(index)} type="button"><img alt="" src={image.publicUrl ?? ""} /></button>)}</div> : null}
    </section> : null}
    <section className="panel build-copy">{post.overview ? <div><h2>概要</h2><p>{post.overview}</p></div> : null}{post.supplementalNotes ? <div><h2>補足</h2><p>{post.supplementalNotes}</p></div> : null}{post.referenceUrl ? <a className="text-link" href={post.referenceUrl} rel="noreferrer" target="_blank">参考URLを開く</a> : null}</section>
    {post.ownerId === user?.id ? <div className="form-actions"><Link className="primary-button" to={`/builds/${post.id}/edit`}>編集</Link><button className="secondary-button danger-text" onClick={() => void remove()} type="button">削除</button></div> : null}
  </div>;
}
