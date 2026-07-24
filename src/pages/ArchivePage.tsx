import { CalendarDays, ChevronRight, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

export function ArchivePage() {
  return (
    <div className="page-stack compact-page">
      <section className="page-heading">
        <p className="eyebrow">Archive</p>
        <h1>保管庫</h1>
      </section>
      <div className="archive-grid">
        <Link className="panel archive-card" to="/event-schedule">
          <CalendarDays size={24} />
          <span>
            <strong>イベント予定</strong>
            <small>開催情報とメモ</small>
          </span>
          <ChevronRight size={20} />
        </Link>
        <Link className="panel archive-card" to="/official-news">
          <Newspaper size={24} />
          <span>
            <strong>公式NEWS</strong>
            <small>公式お知らせと取得情報</small>
          </span>
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
}
