import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page-stack compact-page not-found-page">
      <section className="panel empty-state">
        <p className="eyebrow">404</p>
        <h1>ページが見つかりません</h1>
        <p>URLを確認するか、ホームへ戻ってください。</p>
        <Link className="primary-button" to="/">ホームへ戻る</Link>
      </section>
    </main>
  );
}
