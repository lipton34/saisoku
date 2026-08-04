import { BookOpen, ChevronRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";

export function UtilitiesPage() {
  return <div className="page-stack compact-page">
    <section className="page-heading"><p className="eyebrow">Utilities</p><h1>便利機能</h1></section>
    <div className="archive-grid">
      <Link className="panel archive-card" to="/raid-guides"><BookOpen size={24} /><span><strong>高難度攻略メモ</strong><small>予兆と対策を読む</small></span><ChevronRight size={20} /></Link>
      <Link className="panel archive-card" to="/guild-war-goals"><Flame size={24} /><span><strong>古戦場</strong><small>目標と討伐速度を計算</small></span><ChevronRight size={20} /></Link>
    </div>
  </div>;
}
