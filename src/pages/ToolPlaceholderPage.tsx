import { ArrowLeft, Hammer } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const labels: Record<string, string> = {
  materials: "素材メモ",
  "party-notes": "編成メモ",
  events: "イベント進捗",
  raids: "マルチ救援メモ"
};

export function ToolPlaceholderPage() {
  const { toolId = "" } = useParams();
  const label = labels[toolId] ?? "追加予定の機能";

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Coming Soon</p>
        <h2>{label}</h2>
        <p>ここは今後の拡張枠です。手持ち素材や管理したい項目を後から追加できる前提で空けています。</p>
      </section>

      <div className="panel placeholder-panel">
        <Hammer size={34} />
        <h3>{label}を準備中</h3>
        <p>まずは日課・週課タスク管理を完成済みの入口として使えます。</p>
        <Link className="text-link" to="/">
          <ArrowLeft size={16} />
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
