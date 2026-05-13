import { CheckCircle2, FlaskConical, Group, ListChecks, Map, Swords } from "lucide-react";

const phases = [
  {
    title: "Phase 1: タスク管理の完成度向上",
    icon: ListChecks,
    items: [
      "新規登録を招待コード制にする。",
      "日課・週課のJST 5時リセットを実装する。",
      "日課テンプレート一括追加を追加する。",
      "カテゴリ別表示、期限順、日課/週課/単発の絞り込みを強化する。"
    ]
  },
  {
    title: "Phase 2: 素材メモ",
    icon: FlaskConical,
    items: [
      "目的、対象クエスト名、必要数、所持数、残り数、メモを登録できるようにする。",
      "例: アラナン上限解放、砂箱素材集めなど。",
      "ホームに優先素材や残り数を表示する。"
    ]
  },
  {
    title: "Phase 3: イベント進捗",
    icon: Map,
    items: [
      "開催中・次回イベントの表示枠を作る。",
      "イベント名、開始日時、終了日時、目標、進捗メモを保存する。",
      "まずはカレンダー本格実装ではなく、期間一覧と残り日数表示から始める。"
    ]
  },
  {
    title: "Phase 4: 編成メモ",
    icon: Swords,
    items: [
      "属性、用途、マグナ/神石、武器編成、キャラ構成、動画URL、自由メモを保存する。",
      "属性別・用途別に検索/絞り込みできる一覧を作る。",
      "YouTubeおすすめは編成メモ内の参考リンクとして扱う。"
    ]
  },
  {
    title: "Phase 5: 攻略・グループ機能",
    icon: Group,
    items: [
      "所持キャラ、高難易度攻略、行動表作成・確認を追加する。",
      "その後、グループ、担当者選択、他ユーザーのタスク確認、編集リクエストを設計する。",
      "期限付き承認などの権限モデルは、この段階で追加する。"
    ]
  }
];

const apiCandidates = [
  "/api/task-templates",
  "/api/material-goals",
  "/api/material-items",
  "/api/events",
  "/api/party-notes",
  "/api/groups",
  "/api/edit-requests"
];

export function RoadmapPage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Roadmap</p>
          <h2>Saisoku 拡張ロードマップ</h2>
          <p>個人管理強化を先行し、その後にグループ共有・攻略データ系へ拡張します。</p>
        </div>
      </section>

      <section className="panel roadmap-summary">
        <h2>概要</h2>
        <ul>
          <li>既存の個人タスク管理を軸に、日課・週課運用を実用レベルまで強化する。</li>
          <li>素材、イベント、編成メモを順番に独立機能化する。</li>
          <li>グループ共有、担当者、編集リクエスト、高難易度攻略・行動表は第2段階に回す。</li>
        </ul>
      </section>

      <section className="roadmap-grid" aria-label="実装フェーズ">
        {phases.map((phase) => {
          const Icon = phase.icon;
          return (
            <article className="roadmap-phase" key={phase.title}>
              <div className="phase-heading">
                <Icon size={20} />
                <h3>{phase.title}</h3>
              </div>
              <ul>
                {phase.items.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">API Candidates</p>
              <h2>追加API・型の候補</h2>
            </div>
          </div>
          <div className="code-list">
            {apiCandidates.map((candidate) => (
              <code key={candidate}>{candidate}</code>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Checks</p>
              <h2>テスト方針</h2>
            </div>
          </div>
          <ul className="compact-list">
            <li>各フェーズで npm run typecheck と npm run build を通す。</li>
            <li>DB変更時は Prisma migration を作成する。</li>
            <li>ログイン済みユーザーのデータだけ取得・変更できることを確認する。</li>
            <li>JST 5時リセット、素材残数、イベント残り日数、編成メモ絞り込みを重点確認する。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
