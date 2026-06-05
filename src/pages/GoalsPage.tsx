import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Inbox,
  MessageSquarePlus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BuildMasterCatalogProvider, useBuildMasterLookup } from "../lib/BuildMasterCatalogContext";
import {
  api,
  type BuildPost,
  type GoalBoardStatus,
  type GoalCategory,
  type GoalEffort,
  type GoalFormationPart,
  type GoalPriority,
  type GoalProposal,
  type GoalStatus,
  type MaterialGoal,
  type ProposalStatus,
  type SharedGoal,
  type SharedGoalDetails,
  type User
} from "../lib/api";
import {
  findBuildMasterInCatalog,
  resolveBuildMasterThumbnailUrl,
  type BuildMasterItem,
  type BuildMasterKind
} from "../lib/buildMasters";
import { useBuildMasterCatalog } from "../lib/useBuildMasterCatalog";
import { useAuth } from "../components/AuthContext";

type PartKind = "character" | "weapon" | "summon";
type GoalTab = "board" | "new" | "proposal" | "inbox";

export type GoalFormState = {
  targetUserId: string;
  targetUserIds: string[];
  title: string;
  category: GoalCategory;
  itemName: string;
  requiredCount: string;
  currentCount: string;
  questName: string;
  questUrl: string;
  content: string;
  sourceBuildPostId: string;
  sourceBuildPostTitle: string;
  characters: GoalFormationPart[];
  weapons: GoalFormationPart[];
  summons: GoalFormationPart[];
  dueDate: string;
  status: GoalStatus;
  boardStatus: GoalBoardStatus;
  priority: GoalPriority;
  effort: GoalEffort;
  beginnerRecommended: boolean;
  sortOrder: string;
  memo: string;
  proposalMemo: string;
};

type GoalBoardFilters = {
  category: string;
  priority: string;
  effort: string;
  beginnerOnly: boolean;
  includeDone: boolean;
};

const goalCategories: GoalCategory[] = ["周回", "編成", "その他"];
const goalStatuses: GoalStatus[] = ["達成", "未達成"];
const goalBoardStatuses: GoalBoardStatus[] = ["now", "next", "later", "paused", "done"];
const goalPriorityOptions: GoalPriority[] = ["high", "medium", "low"];
const goalEffortOptions: GoalEffort[] = ["light", "normal", "heavy"];
const proposalStatuses: ProposalStatus[] = ["提案中", "受け入れ済み", "見送り"];

const goalBoardLabels: Record<GoalBoardStatus, string> = {
  now: "今やる",
  next: "次にやる",
  later: "後でやる",
  paused: "保留",
  done: "完了"
};

const goalPriorityLabels: Record<GoalPriority, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

const goalEffortLabels: Record<GoalEffort, string> = {
  light: "軽い",
  normal: "普通",
  heavy: "重い"
};

const blankBoardFilters: GoalBoardFilters = {
  category: "",
  priority: "",
  effort: "",
  beginnerOnly: false,
  includeDone: false
};

const blankForm: GoalFormState = {
  targetUserId: "",
  targetUserIds: [],
  title: "",
  category: "周回",
  itemName: "",
  requiredCount: "",
  currentCount: "",
  questName: "",
  questUrl: "",
  content: "",
  sourceBuildPostId: "",
  sourceBuildPostTitle: "",
  characters: [],
  weapons: [],
  summons: [],
  dueDate: "",
  status: "未達成",
  boardStatus: "later",
  priority: "medium",
  effort: "normal",
  beginnerRecommended: false,
  sortOrder: "0",
  memo: "",
  proposalMemo: ""
};

function displayName(user: User | null | undefined) {
  return user?.displayName || user?.username || "不明";
}

function formatDate(value: string | null) {
  if (!value) {
    return "期限なし";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "期限なし";
  }

  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function numberText(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function validUrl(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function details(goal: Pick<SharedGoal, "details">): SharedGoalDetails {
  return goal.details ?? {};
}

function proposalDetails(proposal: Pick<GoalProposal, "details">): SharedGoalDetails {
  return proposal.details ?? {};
}

function statusForCategory(status: GoalStatus, category: GoalCategory) {
  return goalStatuses.includes(status) ? status : "未達成";
}

function progressLabel(goal: SharedGoal) {
  if (goal.category === "周回" && goal.progressRate !== null && goal.targetValue !== null && goal.currentValue !== null) {
    return `${goal.progressRate}% (${goal.currentValue}/${goal.targetValue})`;
  }

  if (goal.category === "編成") {
    const count = missingPartCount(goal);
    return count > 0 ? `未所持 ${count}件` : "準備OK";
  }

  return goal.status;
}

function missingPartCount(goal: Pick<SharedGoal, "details">) {
  const goalDetails = details(goal);
  return [...(goalDetails.characters ?? []), ...(goalDetails.weapons ?? []), ...(goalDetails.summons ?? [])].filter(
    (part) => !part.owned
  ).length;
}

function hasParts(goal: Pick<SharedGoal, "details">, key: "characters" | "weapons" | "summons") {
  return (details(goal)[key] ?? []).length > 0 ? "あり" : "なし";
}

export function goalPayload(form: GoalFormState) {
  const detailPayload: SharedGoalDetails =
    form.category === "周回"
      ? {
          itemName: form.itemName,
          questName: form.questName,
          questUrl: form.questUrl,
          requiredCount: form.requiredCount ? Number(form.requiredCount) : null,
          currentCount: form.currentCount ? Number(form.currentCount) : null
        }
      : form.category === "編成"
        ? {
            sourceBuildPostId: form.sourceBuildPostId || null,
            sourceBuildPostTitle: form.sourceBuildPostTitle || null,
            characters: form.characters,
            weapons: form.weapons,
            summons: form.summons
          }
        : { content: form.content };

  return {
    title: form.title,
    category: form.category,
    description: form.category === "その他" ? form.content : undefined,
    targetValue: form.category === "周回" ? form.requiredCount : null,
    currentValue: form.category === "周回" ? form.currentCount : null,
    details: detailPayload,
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : "",
    status: statusForCategory(form.status, form.category),
    boardStatus: form.boardStatus,
    priority: form.priority,
    effort: form.effort,
    beginnerRecommended: form.beginnerRecommended,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
    memo: form.memo
  };
}

function partKindLabel(kind: PartKind) {
  if (kind === "character") return "キャラ";
  if (kind === "weapon") return "武器";
  return "召喚石";
}

function partsKey(kind: PartKind): "characters" | "weapons" | "summons" {
  if (kind === "character") return "characters";
  if (kind === "weapon") return "weapons";
  return "summons";
}

function partOptions(kind: PartKind, options: ReturnType<typeof useBuildMasterLookup>["options"]) {
  if (kind === "character") return options.characters;
  if (kind === "weapon") return options.weapons;
  return options.summons;
}

function masterMeta(master: BuildMasterItem | undefined) {
  if (!master) {
    return "自由入力";
  }

  return [master.element, master.rarity, master.weaponType, master.series, ...(master.tags ?? [])].filter(Boolean).join(" / ");
}

function postParts(post: BuildPost) {
  return {
    characters: post.characterDetails
      .filter((item) => item.name.trim())
      .map((item) => ({
        kind: "character" as const,
        name: item.name,
        masterId: item.masterId ?? null,
        owned: false,
        position: item.position
      })),
    weapons: post.weaponDetails
      .filter((item) => item.name.trim())
      .map((item) => ({
        kind: "weapon" as const,
        name: item.name,
        masterId: item.masterId ?? null,
        owned: false,
        position: item.count || item.importance
      })),
    summons: post.summonDetails
      .filter((item) => item.name.trim())
      .map((item) => ({
        kind: "summon" as const,
        name: item.name,
        masterId: item.masterId ?? null,
        owned: false,
        position: item.position
      }))
  };
}

function tabFromSearch(search: string): GoalTab {
  const tab = new URLSearchParams(search).get("tab");
  return tab === "new" || tab === "proposal" || tab === "inbox" || tab === "board" ? tab : "board";
}

export function GoalsPage() {
  const { catalog } = useBuildMasterCatalog(false);

  return (
    <BuildMasterCatalogProvider catalog={catalog}>
      <GoalsPageContent />
    </BuildMasterCatalogProvider>
  );
}

function GoalsPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<GoalTab>(() => tabFromSearch(location.search));
  const [members, setMembers] = useState<User[]>([]);
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [proposals, setProposals] = useState<GoalProposal[]>([]);
  const [goalForm, setGoalForm] = useState<GoalFormState>(blankForm);
  const [proposalForm, setProposalForm] = useState<GoalFormState>(blankForm);
  const [materialGoals, setMaterialGoals] = useState<MaterialGoal[]>([]);
  const [buildPosts, setBuildPosts] = useState<BuildPost[]>([]);
  const [boardFilters, setBoardFilters] = useState<GoalBoardFilters>(blankBoardFilters);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | "all">("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(tabFromSearch(location.search));
  }, [location.search]);

  async function loadMembers() {
    const data = await api.users();
    setMembers(data.users);
    const firstOtherUserId = data.users.find((member) => member.id !== user?.id)?.id || "";
    setProposalForm((current) => ({
      ...current,
      targetUserId: current.targetUserId || firstOtherUserId,
      targetUserIds: current.targetUserIds.length > 0 ? current.targetUserIds : firstOtherUserId ? [firstOtherUserId] : []
    }));
  }

  async function loadGoals() {
    const data = await api.sharedGoals();
    setGoals(data.goals);
  }

  async function loadProposals() {
    const data = await api.goalProposalInbox(proposalStatus);
    setProposals(data.proposals);
  }

  useEffect(() => {
    void loadMembers().catch((caught) => setError(caught instanceof Error ? caught.message : "団員の取得に失敗しました"));
    void api.materialGoals().then((data) => setMaterialGoals(data.goals)).catch(() => setMaterialGoals([]));
    void api.buildPosts().then((data) => setBuildPosts(data.posts)).catch(() => setBuildPosts([]));
  }, []);

  useEffect(() => {
    void loadGoals().catch((caught) => setError(caught instanceof Error ? caught.message : "目標の取得に失敗しました"));
  }, []);

  useEffect(() => {
    void loadProposals().catch((caught) => setError(caught instanceof Error ? caught.message : "提案の取得に失敗しました"));
  }, [proposalStatus]);

  const openProposalCount = useMemo(() => proposals.filter((proposal) => proposal.status === "提案中").length, [proposals]);
  const boardGoals = useMemo(() => {
    return goals.filter((goal) => {
      return (
        (!boardFilters.category || goal.category === boardFilters.category) &&
        (!boardFilters.priority || goal.priority === boardFilters.priority) &&
        (!boardFilters.effort || goal.effort === boardFilters.effort) &&
        (!boardFilters.beginnerOnly || goal.beginnerRecommended) &&
        (boardFilters.includeDone || goal.boardStatus !== "done")
      );
    });
  }, [boardFilters, goals]);

  function resetGoalForm(category: GoalCategory = goalForm.category) {
    setGoalForm({ ...blankForm, category, status: "未達成" });
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const data = await api.createSharedGoal(goalPayload(goalForm));
      setGoals((current) => [data.goal, ...current]);
      resetGoalForm();
      setActiveTab("board");
      setNotice("目標を登録しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateGoalBoardStatus(goal: SharedGoal, boardStatus: GoalBoardStatus) {
    setError("");
    setNotice("");
    try {
      const data = await api.updateSharedGoal(goal.id, {
        boardStatus,
        status: boardStatus === "done" ? "達成" : "未達成"
      });
      setGoals((current) => current.map((item) => (item.id === data.goal.id ? data.goal : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ボード状態の更新に失敗しました");
    }
  }

  async function handleCreateProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const targetUserIds =
        proposalForm.targetUserIds.length > 0
          ? proposalForm.targetUserIds
          : proposalForm.targetUserId
            ? [proposalForm.targetUserId]
            : [];
      const data = await api.createGoalProposal({
        ...goalPayload(proposalForm),
        targetUserIds,
        proposalMemo: proposalForm.proposalMemo
      });
      const createdCount = data.proposals?.length ?? 1;
      const firstOtherUserId = members.find((member) => member.id !== user?.id)?.id || "";
      setProposalForm({
        ...blankForm,
        targetUserId: firstOtherUserId,
        targetUserIds: firstOtherUserId ? [firstOtherUserId] : [],
        category: proposalForm.category,
        status: "未達成"
      });
      setNotice(`${createdCount}人に目標を提案しました。相手が受け入れるまで個人目標にはなりません。`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標提案の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function acceptProposal(proposal: GoalProposal) {
    setError("");
    setNotice("");

    try {
      const data = await api.acceptGoalProposal(proposal.id);
      setProposals((current) => current.map((item) => (item.id === data.proposal.id ? data.proposal : item)));
      setGoals((current) => [data.goal, ...current]);
      setActiveTab("board");
      setNotice("提案を受け入れて、自分の目標として登録しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提案の受け入れに失敗しました");
    }
  }

  async function declineProposal(proposal: GoalProposal) {
    setError("");
    setNotice("");

    try {
      const data = await api.declineGoalProposal(proposal.id);
      setProposals((current) => current.map((item) => (item.id === data.proposal.id ? data.proposal : item)));
      setNotice("提案を見送りにしました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提案の見送りに失敗しました");
    }
  }

  return (
    <div className="page-stack goals-page-wide">
      <section className="page-heading goals-compact-heading">
        <div>
          <p className="eyebrow">Crew Goals</p>
          <h2>目標ボード</h2>
          <p>今やることを状態ごとに整理し、詳細はカードから確認します。</p>
        </div>
        <div className="segmented goal-tabs">
          <button className={activeTab === "board" ? "active" : ""} onClick={() => setActiveTab("board")} type="button">
            <ClipboardList size={16} />
            目標ボード
          </button>
          <button className={activeTab === "new" ? "active" : ""} onClick={() => setActiveTab("new")} type="button">
            <Plus size={16} />
            作成
          </button>
          <button className={activeTab === "proposal" ? "active" : ""} onClick={() => setActiveTab("proposal")} type="button">
            <MessageSquarePlus size={16} />
            提案
          </button>
          <button className={activeTab === "inbox" ? "active" : ""} onClick={() => setActiveTab("inbox")} type="button">
            <Inbox size={16} />
            届いた提案
            {openProposalCount > 0 && <span className="tab-count">{openProposalCount}</span>}
          </button>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      {activeTab === "new" && (
        <form className="panel goal-form" onSubmit={handleCreateGoal}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">New Goal</p>
              <h2>自分の目標を作成</h2>
            </div>
          </div>
          <GoalEditor
            buildPosts={buildPosts}
            form={goalForm}
            materialGoals={materialGoals}
            onChange={setGoalForm}
            mode="goal"
          />
          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Save size={18} />
            目標を保存
          </button>
        </form>
      )}

      {activeTab === "proposal" && (
        <form className="panel goal-form" onSubmit={handleCreateProposal}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Suggest</p>
              <h2>他団員に目標を提案</h2>
            </div>
          </div>
          <ProposalTargets
            members={members.filter((member) => member.id !== user?.id)}
            onChange={(targetUserIds) =>
              setProposalForm((current) => ({ ...current, targetUserIds, targetUserId: targetUserIds[0] ?? "" }))
            }
            selectedUserIds={proposalForm.targetUserIds}
          />
          <GoalEditor
            buildPosts={buildPosts}
            form={proposalForm}
            materialGoals={materialGoals}
            mode="proposal"
            onChange={setProposalForm}
          />
          <label>
            提案メモ
            <textarea
              onChange={(event) => setProposalForm((current) => ({ ...current, proposalMemo: event.target.value }))}
              rows={4}
              value={proposalForm.proposalMemo}
            />
          </label>
          <button className="primary-button" disabled={isSubmitting || proposalForm.targetUserIds.length === 0} type="submit">
            <MessageSquarePlus size={18} />
            提案を送る
          </button>
        </form>
      )}

      {activeTab === "inbox" && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2>自分に届いた提案</h2>
            </div>
            <select onChange={(event) => setProposalStatus(event.target.value as ProposalStatus | "all")} value={proposalStatus}>
              <option value="all">すべて</option>
              {proposalStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="proposal-list">
            {proposals.length === 0 ? (
              <div className="empty-state">届いている提案はありません。</div>
            ) : (
              proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  onAccept={acceptProposal}
                  onDecline={declineProposal}
                  proposal={proposal}
                />
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "board" && (
        <section className="goals-board-layout">
          <div className="panel wide goals-board-panel">
            <div className="section-heading goals-board-heading">
              <div>
                <p className="eyebrow">Board</p>
                <h2>目標ボード</h2>
              </div>
              <button className="secondary-button" onClick={() => setBoardFilters(blankBoardFilters)} type="button">
                <RotateCcw size={16} />
                リセット
              </button>
            </div>
            <GoalBoardFilters filters={boardFilters} onChange={setBoardFilters} />
            <GoalBoard
              canUpdateGoal={(goal) => goal.ownerId === user?.id}
              goals={boardGoals}
              onOpenGoal={(goal) => navigate(`/goals/${goal.id}`)}
              onUpdateBoardStatus={(goal, boardStatus) => void updateGoalBoardStatus(goal, boardStatus)}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function GoalBoardFilters({
  filters,
  onChange
}: {
  filters: GoalBoardFilters;
  onChange: (filters: GoalBoardFilters) => void;
}) {
  return (
    <div className="goal-filter-grid goal-board-filter-grid">
      <label>
        カテゴリ
        <select onChange={(event) => onChange({ ...filters, category: event.target.value })} value={filters.category}>
          <option value="">すべて</option>
          {goalCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label>
        優先度
        <select onChange={(event) => onChange({ ...filters, priority: event.target.value })} value={filters.priority}>
          <option value="">すべて</option>
          {goalPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {goalPriorityLabels[priority]}
            </option>
          ))}
        </select>
      </label>
      <label>
        負荷
        <select onChange={(event) => onChange({ ...filters, effort: event.target.value })} value={filters.effort}>
          <option value="">すべて</option>
          {goalEffortOptions.map((effort) => (
            <option key={effort} value={effort}>
              {goalEffortLabels[effort]}
            </option>
          ))}
        </select>
      </label>
      <label className="checkbox-field">
        <input
          checked={filters.beginnerOnly}
          onChange={(event) => onChange({ ...filters, beginnerOnly: event.target.checked })}
          type="checkbox"
        />
        初心者向けのみ
      </label>
      <label className="checkbox-field">
        <input
          checked={filters.includeDone}
          onChange={(event) => onChange({ ...filters, includeDone: event.target.checked })}
          type="checkbox"
        />
        完了を表示
      </label>
    </div>
  );
}

function GoalBoard({
  canUpdateGoal,
  goals,
  onOpenGoal,
  onUpdateBoardStatus
}: {
  canUpdateGoal: (goal: SharedGoal) => boolean;
  goals: SharedGoal[];
  onOpenGoal: (goal: SharedGoal) => void;
  onUpdateBoardStatus: (goal: SharedGoal, boardStatus: GoalBoardStatus) => void;
}) {
  return (
    <div className="goal-board">
      {goalBoardStatuses.map((status) => {
        const columnGoals = goals
          .filter((goal) => goal.boardStatus === status)
          .sort((first, second) => first.sortOrder - second.sortOrder || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());

        return (
          <section className="goal-board-column" key={status}>
            <div className="goal-board-column-header">
              <h3>{goalBoardLabels[status]}</h3>
              <span className="pill muted">{columnGoals.length}</span>
            </div>
            <div className="goal-board-card-list">
              {columnGoals.length === 0 ? (
                <div className="empty-state compact">目標はありません。</div>
              ) : (
                columnGoals.map((goal) => (
                  <GoalBoardCard
                    canUpdate={canUpdateGoal(goal)}
                    goal={goal}
                    key={goal.id}
                    onOpen={onOpenGoal}
                    onUpdateBoardStatus={onUpdateBoardStatus}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GoalBoardCard({
  canUpdate,
  goal,
  onOpen,
  onUpdateBoardStatus
}: {
  canUpdate: boolean;
  goal: SharedGoal;
  onOpen: (goal: SharedGoal) => void;
  onUpdateBoardStatus: (goal: SharedGoal, boardStatus: GoalBoardStatus) => void;
}) {
  const goalDetails = details(goal);
  const requiredWeaponCount = goal.category === "編成" ? goalDetails.weapons?.length ?? 0 : 0;
  function openGoal() {
    onOpen(goal);
  }

  return (
    <article
      className="goal-board-card"
      onClick={openGoal}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openGoal();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="goal-board-card-main">
        <strong>{goal.title}</strong>
        <div className="tag-row">
          <span className="pill muted">{goal.category}</span>
          <span className="pill">優先度: {goalPriorityLabels[goal.priority]}</span>
          <span className="pill muted">負荷: {goalEffortLabels[goal.effort]}</span>
          {goal.beginnerRecommended && <span className="pill">初心者向け</span>}
        </div>
        <div className="goal-board-card-meta">
          <span>期限: {formatDate(goal.dueDate)}</span>
          <span>{progressLabel(goal)}</span>
          {requiredWeaponCount > 0 && <span>必要武器 {requiredWeaponCount}</span>}
        </div>
      </div>
      {canUpdate && (
        <label
          className="goal-board-status-select"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          状態
          <select
            onChange={(event) => {
              event.stopPropagation();
              onUpdateBoardStatus(goal, event.target.value as GoalBoardStatus);
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            value={goal.boardStatus}
          >
            {goalBoardStatuses.map((status) => (
              <option key={status} value={status}>
                {goalBoardLabels[status]}
              </option>
            ))}
          </select>
        </label>
      )}
    </article>
  );
}

function GoalFilters({
  filters,
  members,
  onChange
}: {
  filters: { userId: string; category: string; status: string; due: string };
  members: User[];
  onChange: (filters: { userId: string; category: string; status: string; due: string }) => void;
}) {
  return (
    <div className="goal-filter-grid">
      <label>
        団員
        <select onChange={(event) => onChange({ ...filters, userId: event.target.value })} value={filters.userId}>
          <option value="">すべて</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {displayName(member)}
            </option>
          ))}
        </select>
      </label>
      <label>
        カテゴリ
        <select onChange={(event) => onChange({ ...filters, category: event.target.value })} value={filters.category}>
          <option value="">すべて</option>
          {goalCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label>
        状態
        <select onChange={(event) => onChange({ ...filters, status: event.target.value })} value={filters.status}>
          <option value="">すべて</option>
          {goalStatuses.map((status, index) => (
            <option key={`${status}-${index}`} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        期限
        <select onChange={(event) => onChange({ ...filters, due: event.target.value })} value={filters.due}>
          <option value="">すべて</option>
          <option value="upcoming">期限あり</option>
          <option value="overdue">確認したい期限</option>
          <option value="none">期限なし</option>
        </select>
      </label>
    </div>
  );
}

function ProposalTargets({
  members,
  onChange,
  selectedUserIds
}: {
  members: User[];
  onChange: (targetUserIds: string[]) => void;
  selectedUserIds: string[];
}) {
  function toggleMember(memberId: string) {
    onChange(
      selectedUserIds.includes(memberId)
        ? selectedUserIds.filter((id) => id !== memberId)
        : [...selectedUserIds, memberId]
    );
  }

  return (
    <fieldset className="proposal-targets">
      <legend>提案先</legend>
      {members.length === 0 ? (
        <div className="empty-state compact">提案できる団員がまだいません。</div>
      ) : (
        <div className="proposal-target-grid">
          {members.map((member) => (
            <label key={member.id}>
              <input
                checked={selectedUserIds.includes(member.id)}
                onChange={() => toggleMember(member.id)}
                type="checkbox"
              />
              <span>{displayName(member)}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function GoalEditor({
  buildPosts,
  form,
  materialGoals,
  mode,
  onChange,
  showDetailMetadata = true
}: {
  buildPosts: BuildPost[];
  form: GoalFormState;
  materialGoals: MaterialGoal[];
  mode: "goal" | "proposal";
  onChange: (form: GoalFormState) => void;
  showDetailMetadata?: boolean;
}) {
  function update<K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  function updateCategory(category: GoalCategory) {
    onChange({
      ...blankForm,
      targetUserId: form.targetUserId,
      targetUserIds: form.targetUserIds,
      category,
      status: "未達成",
      boardStatus: form.boardStatus,
      priority: form.priority,
      effort: form.effort,
      beginnerRecommended: form.beginnerRecommended,
      sortOrder: form.sortOrder,
      proposalMemo: form.proposalMemo
    });
  }

  function applyMaterialGoal(goalId: string) {
    const materialGoal = materialGoals.find((goal) => goal.id === goalId);
    if (!materialGoal) return;
    const firstItem = materialGoal.items[0];
    onChange({
      ...form,
      title: form.title || materialGoal.title,
      itemName: firstItem?.name ?? form.itemName,
      requiredCount: firstItem ? String(firstItem.requiredCount) : form.requiredCount,
      currentCount: firstItem ? String(firstItem.ownedCount) : form.currentCount,
      questName: materialGoal.questName ?? form.questName,
      memo: form.memo || materialGoal.note || ""
    });
  }

  function applyBuildPost(postId: string) {
    const post = buildPosts.find((item) => item.id === postId);
    if (!post) return;
    const parts = postParts(post);
    onChange({
      ...form,
      title: form.title || post.title,
      sourceBuildPostId: post.id,
      sourceBuildPostTitle: post.title,
      characters: parts.characters,
      weapons: parts.weapons,
      summons: parts.summons,
      memo: form.memo || post.overview || ""
    });
  }

  return (
    <>
      <div className="form-row">
        <label>
          カテゴリ
          <select onChange={(event) => updateCategory(event.target.value as GoalCategory)} value={form.category}>
            {goalCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          状態
          <select onChange={(event) => update("status", event.target.value as GoalStatus)} value={statusForCategory(form.status, form.category)}>
            {goalStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          ボード状態
          <select onChange={(event) => update("boardStatus", event.target.value as GoalBoardStatus)} value={form.boardStatus}>
            {goalBoardStatuses.map((status) => (
              <option key={status} value={status}>
                {goalBoardLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          優先度
          <select onChange={(event) => update("priority", event.target.value as GoalPriority)} value={form.priority}>
            {goalPriorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {goalPriorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>
        {showDetailMetadata && (
          <label>
            負荷
            <select onChange={(event) => update("effort", event.target.value as GoalEffort)} value={form.effort}>
              {goalEffortOptions.map((effort) => (
                <option key={effort} value={effort}>
                  {goalEffortLabels[effort]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label>
        目標タイトル
        <input onChange={(event) => update("title", event.target.value)} required value={form.title} />
      </label>

      {form.category === "周回" && (
        <FarmingGoalFields
          form={form}
          materialGoals={materialGoals}
          mode={mode}
          onApplyMaterialGoal={applyMaterialGoal}
          onChange={onChange}
        />
      )}
      {form.category === "編成" && (
        <FormationGoalFields buildPosts={buildPosts} form={form} onApplyBuildPost={applyBuildPost} onChange={onChange} />
      )}
      {form.category === "その他" && (
        <label>
          目標内容
          <textarea onChange={(event) => update("content", event.target.value)} rows={5} value={form.content} />
        </label>
      )}

      <div className="form-row">
        <label>
          期限
          <input onChange={(event) => update("dueDate", event.target.value)} type="date" value={form.dueDate} />
        </label>
        {showDetailMetadata && (
          <label>
            並び順
            <input min={0} onChange={(event) => update("sortOrder", event.target.value)} type="number" value={form.sortOrder} />
          </label>
        )}
      </div>

      {showDetailMetadata && (
        <label className="checkbox-field">
          <input
            checked={form.beginnerRecommended}
            onChange={(event) => update("beginnerRecommended", event.target.checked)}
            type="checkbox"
          />
          初心者・復帰者におすすめ
        </label>
      )}

      <div className="form-row">
        <label>
          メモ
          <textarea onChange={(event) => update("memo", event.target.value)} rows={3} value={form.memo} />
        </label>
      </div>
    </>
  );
}

function FarmingGoalFields({
  form,
  materialGoals,
  mode,
  onApplyMaterialGoal,
  onChange
}: {
  form: GoalFormState;
  materialGoals: MaterialGoal[];
  mode: "goal" | "proposal";
  onApplyMaterialGoal: (goalId: string) => void;
  onChange: (form: GoalFormState) => void;
}) {
  function update<K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <>
      {mode === "goal" && materialGoals.length > 0 && (
        <label>
          素材メモから反映
          <select onChange={(event) => onApplyMaterialGoal(event.target.value)} value="">
            <option value="">選択してください</option>
            {materialGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form-row">
        <label>
          素材名またはドロップ武器名
          <input onChange={(event) => update("itemName", event.target.value)} value={form.itemName} />
        </label>
        <label>
          周回クエスト名
          <input onChange={(event) => update("questName", event.target.value)} value={form.questName} />
        </label>
      </div>
      <div className="form-row">
        <label>
          必要数
          <input min={0} onChange={(event) => update("requiredCount", event.target.value)} type="number" value={form.requiredCount} />
        </label>
        <label>
          現在数
          <input min={0} onChange={(event) => update("currentCount", event.target.value)} type="number" value={form.currentCount} />
        </label>
      </div>
      <label>
        周回クエストURL
        <input onChange={(event) => update("questUrl", event.target.value)} placeholder="https://example.com" value={form.questUrl} />
      </label>
    </>
  );
}

function FormationGoalFields({
  buildPosts,
  form,
  onApplyBuildPost,
  onChange
}: {
  buildPosts: BuildPost[];
  form: GoalFormState;
  onApplyBuildPost: (postId: string) => void;
  onChange: (form: GoalFormState) => void;
}) {
  return (
    <div className="formation-goal-editor">
      {buildPosts.length > 0 && (
        <label>
          既存編成から反映
          <select onChange={(event) => onApplyBuildPost(event.target.value)} value={form.sourceBuildPostId}>
            <option value="">選択してください</option>
            {buildPosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <PartSection form={form} kind="character" onChange={onChange} />
      <PartSection form={form} kind="weapon" onChange={onChange} />
      <PartSection form={form} kind="summon" onChange={onChange} />
    </div>
  );
}

function PartSection({
  form,
  kind,
  onChange
}: {
  form: GoalFormState;
  kind: PartKind;
  onChange: (form: GoalFormState) => void;
}) {
  const [manualName, setManualName] = useState("");
  const [query, setQuery] = useState("");
  const catalog = useBuildMasterLookup();
  const key = partsKey(kind);
  const parts = form[key] ?? [];
  const candidates = partOptions(kind, catalog.options)
    .filter((item) => {
      const normalized = query.trim().toLowerCase();
      return !normalized || [item.name, item.displayName, ...(item.aliases ?? [])].filter(Boolean).some((value) => value?.toLowerCase().includes(normalized));
    })
    .slice(0, 8);

  function setParts(nextParts: GoalFormationPart[]) {
    onChange({ ...form, [key]: nextParts });
  }

  function addPart(part: GoalFormationPart) {
    if (parts.some((item) => item.kind === part.kind && item.name === part.name)) {
      return;
    }
    setParts([...parts, part]);
  }

  function addManualPart() {
    const name = manualName.trim();
    if (!name) return;
    addPart({ kind, name, masterId: null, owned: false });
    setManualName("");
  }

  return (
    <section className="goal-part-section">
      <div className="inline-section-heading">
        <div>
          <p className="eyebrow">{partKindLabel(kind)}</p>
          <h3>{partKindLabel(kind)}編成</h3>
        </div>
      </div>
      <label className="part-search-field">
        検索
        <Search size={16} />
        <input onChange={(event) => setQuery(event.target.value)} placeholder={`${partKindLabel(kind)}名で検索`} type="search" value={query} />
      </label>
      <div className="part-candidate-grid goal-candidate-grid">
        {candidates.map((item) => (
          <button className="part-candidate-card" key={item.id} onClick={() => addPart({ kind, name: item.name, masterId: item.id, owned: false })} type="button">
            <PartThumbnail kind={kind} masterId={item.id} name={item.name} />
            <span>
              <strong>{item.name}</strong>
              <small>{masterMeta(item)}</small>
            </span>
            <Plus size={16} />
          </button>
        ))}
      </div>
      <div className="form-row">
        <label>
          候補外を追加
          <input onChange={(event) => setManualName(event.target.value)} value={manualName} />
        </label>
        <button className="secondary-button goal-manual-add" onClick={addManualPart} type="button">
          <Plus size={16} />
          追加
        </button>
      </div>
      <div className="goal-part-list">
        {parts.length === 0 ? (
          <div className="empty-state compact">未設定です。</div>
        ) : (
          parts.map((part, index) => (
            <div className="goal-part-row" key={`${part.kind}-${part.name}-${index}`}>
              <PartThumbnail kind={kind} masterId={part.masterId} name={part.name} />
              <span>
                <strong>{part.name}</strong>
                {part.position && <small>{part.position}</small>}
              </span>
              <select
                onChange={(event) =>
                  setParts(parts.map((item, itemIndex) => (itemIndex === index ? { ...item, owned: event.target.value === "owned" } : item)))
                }
                value={part.owned ? "owned" : "missing"}
              >
                <option value="owned">所持</option>
                <option value="missing">未所持</option>
              </select>
              <button className="secondary-button" onClick={() => setParts(parts.filter((_, itemIndex) => itemIndex !== index))} type="button">
                削除
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PartThumbnail({ kind, masterId, name }: { kind: BuildMasterKind; masterId?: string | null; name: string }) {
  const masterCatalog = useBuildMasterLookup();
  const master =
    kind === "weapon"
      ? findBuildMasterInCatalog(masterCatalog, kind, name, masterId)
      : undefined;
  const thumbnailUrl = master ? resolveBuildMasterThumbnailUrl(master) : "";
  const [hasImageError, setHasImageError] = useState(false);
  const label = name.trim().slice(0, 2) || "?";

  useEffect(() => {
    setHasImageError(false);
  }, [thumbnailUrl]);

  if (thumbnailUrl && !hasImageError) {
    return (
      <img
        alt={name}
        className="part-thumbnail"
        height={42}
        loading="lazy"
        onError={() => setHasImageError(true)}
        src={thumbnailUrl}
        width={42}
      />
    );
  }

  return <span className={`part-thumbnail fallback ${kind}`}>{label}</span>;
}

function GoalRow({ goal, isActive, onSelect }: { goal: SharedGoal; isActive: boolean; onSelect: (goal: SharedGoal) => void }) {
  const goalDetails = details(goal);

  return (
    <button className={isActive ? "goal-row active" : "goal-row"} onClick={() => onSelect(goal)} type="button">
      <span>{displayName(goal.owner)}</span>
      <strong>{goal.title}</strong>
      <span>{goal.category}</span>
      <span>{formatDate(goal.dueDate)}</span>
      {goal.category === "周回" && (
        <>
          <span>{goalDetails.itemName || "対象未設定"}</span>
          <span>{progressLabel(goal)}</span>
          <span>{goalDetails.questName || "クエスト未設定"}</span>
        </>
      )}
      {goal.category === "編成" && (
        <>
          <span>キャラ {hasParts(goal, "characters")}</span>
          <span>武器 {hasParts(goal, "weapons")}</span>
          <span>召喚石 {hasParts(goal, "summons")} / {progressLabel(goal)}</span>
        </>
      )}
      {goal.category === "その他" && (
        <>
          <span>{goal.description || goalDetails.content || "内容未入力"}</span>
          <span>{goal.status}</span>
          <span>{formatDateTime(goal.updatedAt)}</span>
        </>
      )}
      {goal.category !== "その他" && <span>{goal.status}</span>}
    </button>
  );
}

export function GoalDetail({
  buildPosts,
  canUpdate,
  goal,
  isSubmitting,
  materialGoals,
  onDelete,
  onRefresh,
  onUpdate
}: {
  buildPosts: BuildPost[];
  canUpdate: boolean;
  goal: SharedGoal;
  isSubmitting: boolean;
  materialGoals: MaterialGoal[];
  onDelete: (goal: SharedGoal) => Promise<void>;
  onRefresh: (goalId: string) => Promise<void>;
  onUpdate: (form: GoalFormState) => Promise<boolean>;
}) {
  const goalDetails = details(goal);
  const [form, setForm] = useState<GoalFormState>(() => formFromGoal(goal));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setForm(formFromGoal(goal));
    setIsEditing(false);
  }, [goal]);

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onUpdate(form);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const didSave = await onUpdate(form);
    if (didSave) {
      setIsEditing(false);
    }
  }

  function cancelEdit() {
    setForm(formFromGoal(goal));
    setIsEditing(false);
  }

  return (
    <div className="goal-detail">
      <div className="goal-card-title">
        <h3>{goal.title}</h3>
        <span className="pill">{goal.status}</span>
        <span className="pill muted">{goal.category}</span>
      </div>
      {canUpdate && !isEditing && (
        <div className="goal-detail-actions">
          <button className="secondary-button" onClick={() => setIsEditing(true)} type="button">
            <Pencil size={17} />
            編集
          </button>
          <button className="secondary-button danger-button" disabled={isSubmitting} onClick={() => void onDelete(goal)} type="button">
            <Trash2 size={17} />
            目標を削除
          </button>
        </div>
      )}
      <dl className="goal-detail-list">
        <div>
          <dt>団員</dt>
          <dd>{displayName(goal.owner)}</dd>
        </div>
        <div>
          <dt>期限</dt>
          <dd>{formatDate(goal.dueDate)}</dd>
        </div>
        <div>
          <dt>ボード状態</dt>
          <dd>{goalBoardLabels[goal.boardStatus]}</dd>
        </div>
        <div>
          <dt>優先度</dt>
          <dd>{goalPriorityLabels[goal.priority]}</dd>
        </div>
        <div>
          <dt>進捗</dt>
          <dd>{progressLabel(goal)}</dd>
        </div>
        <div>
          <dt>最終更新</dt>
          <dd>{formatDateTime(goal.updatedAt)}</dd>
        </div>
      </dl>

      {goal.category === "周回" && <FarmingDetail goal={goal} />}
      {goal.category === "編成" && <FormationDetail details={goalDetails} />}
      {goal.category === "その他" && <p className="goal-note">{goal.description || goalDetails.content || "目標内容は未入力です。"}</p>}

      {goal.memo && <p className="goal-note">{goal.memo}</p>}
      {goal.proposedByUser && <p className="goal-note">提案者: {displayName(goal.proposedByUser)}</p>}

      <GoalResourceSections
        buildPosts={buildPosts}
        canUpdate={canUpdate}
        goal={goal}
        onRefresh={onRefresh}
      />

      {canUpdate && isEditing && (
        <form className="progress-form goal-edit-form" onSubmit={submitEdit}>
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Edit</p>
              <h2>目標を編集</h2>
            </div>
          </div>
          <GoalEditor
            buildPosts={buildPosts}
            form={form}
            materialGoals={materialGoals}
            mode="goal"
            onChange={setForm}
            showDetailMetadata={false}
          />
          <div className="goal-detail-actions">
            <button className="primary-button" disabled={isSubmitting} type="submit">
              <Save size={18} />
              保存
            </button>
            <button className="secondary-button" disabled={isSubmitting} onClick={cancelEdit} type="button">
              <X size={18} />
              キャンセル
            </button>
          </div>
        </form>
      )}

      {canUpdate && !isEditing && (
        <form className="progress-form" onSubmit={submitProgress}>
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Update</p>
              <h2>進捗更新</h2>
            </div>
          </div>
          {goal.category === "周回" && (
            <div className="form-row">
              <label>
                現在数
                <input min={0} onChange={(event) => setForm((current) => ({ ...current, currentCount: event.target.value }))} type="number" value={form.currentCount} />
              </label>
              <label>
                状態
                <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as GoalStatus }))} value={form.status}>
                  {goalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {goal.category === "編成" && (
            <div className="goal-part-list">
              {[...(form.characters ?? []), ...(form.weapons ?? []), ...(form.summons ?? [])].length === 0 ? (
                <div className="empty-state compact">編成パーツは未設定です。編集から追加できます。</div>
              ) : (
                <>
                  {[...(form.characters ?? []), ...(form.weapons ?? []), ...(form.summons ?? [])].map((part, index) => (
                    <div className="goal-part-row compact" key={`${part.kind}-${part.name}-${index}`}>
                      <PartThumbnail kind={part.kind} masterId={part.masterId} name={part.name} />
                      <span>
                        <strong>{part.name}</strong>
                        <small>{partKindLabel(part.kind)}</small>
                      </span>
                      <select
                        onChange={(event) => {
                          const key = partsKey(part.kind);
                          let seen = -1;
                          setForm((current) => ({
                            ...current,
                            [key]: (current[key] ?? []).map((item) => {
                              seen += 1;
                              return seen === indexInKind(form, part, index) ? { ...item, owned: event.target.value === "owned" } : item;
                            })
                          }));
                        }}
                        value={part.owned ? "owned" : "missing"}
                      >
                        <option value="owned">所持</option>
                        <option value="missing">未所持</option>
                      </select>
                    </div>
                  ))}
                </>
              )}
              <label>
                状態
                <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as GoalStatus }))} value={form.status}>
                  {goalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {goal.category === "その他" && (
            <label>
              状態
              <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as GoalStatus }))} value={form.status}>
                {goalStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            メモ
            <textarea onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} rows={4} value={form.memo} />
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Save size={18} />
            進捗を保存
          </button>
        </form>
      )}
    </div>
  );
}

function GoalResourceSections({
  buildPosts,
  canUpdate,
  goal,
  onRefresh
}: {
  buildPosts: BuildPost[];
  canUpdate: boolean;
  goal: SharedGoal;
  onRefresh: (goalId: string) => Promise<void>;
}) {
  const catalog = useBuildMasterLookup();
  const [buildId, setBuildId] = useState("");
  const [buildNote, setBuildNote] = useState("");
  const [requiredItem, setRequiredItem] = useState({
    masterItemId: "",
    name: "",
    requiredCount: "1",
    currentCount: "0",
    importance: "必須",
    note: ""
  });
  const [raidTarget, setRaidTarget] = useState({
    questName: "",
    runType: "other",
    targetCount: "0",
    currentCount: "0",
    note: ""
  });
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [localError, setLocalError] = useState("");

  async function run(action: () => Promise<unknown>) {
    setLocalError("");
    try {
      await action();
      await onRefresh(goal.id);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "目標関連情報の更新に失敗しました");
    }
  }

  return (
    <section className="goal-resource-sections">
      {localError && <p className="form-error">{localError}</p>}

      <section className="goal-resource-section">
        <div className="inline-section-heading">
          <div>
            <p className="eyebrow">Build Links</p>
            <h3>関連編成</h3>
          </div>
        </div>
        <div className="goal-resource-list">
          {goal.buildLinks.length === 0 ? (
            <div className="empty-state compact">関連編成は未設定です。</div>
          ) : (
            goal.buildLinks.map((link) => (
              <div className="goal-resource-row" key={link.id}>
                <span>
                  <a className="text-link" href={`/builds/post/${link.build.id}`}>
                    <strong>{link.build.title}</strong>
                  </a>
                  <small>{link.build.questName} / {link.build.element} / {link.note || "メモなし"}</small>
                </span>
                {canUpdate && (
                  <button className="secondary-button" onClick={() => void run(() => api.deleteGoalBuildLink(goal.id, link.id))} type="button">
                    削除
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {canUpdate && (
          <div className="goal-resource-form">
            <select onChange={(event) => setBuildId(event.target.value)} value={buildId}>
              <option value="">編成を選択</option>
              {buildPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
            <input onChange={(event) => setBuildNote(event.target.value)} placeholder="関連メモ" value={buildNote} />
            <button
              className="secondary-button"
              disabled={!buildId}
              onClick={() =>
                void run(async () => {
                  await api.addGoalBuildLink(goal.id, { buildId, note: buildNote });
                  setBuildId("");
                  setBuildNote("");
                })
              }
              type="button"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        )}
      </section>

      <section className="goal-resource-section">
        <div className="inline-section-heading">
          <div>
            <p className="eyebrow">Required Weapons</p>
            <h3>必要武器</h3>
          </div>
        </div>
        <div className="goal-resource-list">
          {goal.requiredItems.length === 0 ? (
            <div className="empty-state compact">必要武器は未設定です。</div>
          ) : (
            goal.requiredItems.map((item) => (
              <div className="goal-resource-row" key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.currentCount} / {item.requiredCount} / {item.importance}{item.note ? ` / ${item.note}` : ""}</small>
                </span>
                {canUpdate && (
                  <div className="goal-resource-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void run(() => api.updateGoalRequiredItem(goal.id, item.id, { currentCount: item.currentCount + 1 }))}
                      type="button"
                    >
                      +1
                    </button>
                    <button className="secondary-button" onClick={() => void run(() => api.deleteGoalRequiredItem(goal.id, item.id))} type="button">
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {canUpdate && (
          <div className="goal-resource-form goal-resource-form--wide">
            <select
              onChange={(event) => {
                const master = catalog.options.weapons.find((item) => item.id === event.target.value);
                setRequiredItem((current) => ({
                  ...current,
                  masterItemId: master?.id ?? "",
                  name: master?.name ?? current.name
                }));
              }}
              value={requiredItem.masterItemId}
            >
              <option value="">武器マスタから選択</option>
              {catalog.options.weapons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input onChange={(event) => setRequiredItem((current) => ({ ...current, name: event.target.value }))} placeholder="武器名" value={requiredItem.name} />
            <input min={0} onChange={(event) => setRequiredItem((current) => ({ ...current, requiredCount: event.target.value }))} type="number" value={requiredItem.requiredCount} />
            <input min={0} onChange={(event) => setRequiredItem((current) => ({ ...current, currentCount: event.target.value }))} type="number" value={requiredItem.currentCount} />
            <select onChange={(event) => setRequiredItem((current) => ({ ...current, importance: event.target.value }))} value={requiredItem.importance}>
              {["必須", "推奨", "代用可", "自由枠"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <input onChange={(event) => setRequiredItem((current) => ({ ...current, note: event.target.value }))} placeholder="メモ" value={requiredItem.note} />
            <button
              className="secondary-button"
              disabled={!requiredItem.name.trim()}
              onClick={() =>
                void run(async () => {
                  await api.addGoalRequiredItem(goal.id, {
                    masterItemId: requiredItem.masterItemId || null,
                    name: requiredItem.name,
                    requiredCount: Number(requiredItem.requiredCount) || 1,
                    currentCount: Number(requiredItem.currentCount) || 0,
                    importance: requiredItem.importance,
                    note: requiredItem.note
                  });
                  setRequiredItem({ masterItemId: "", name: "", requiredCount: "1", currentCount: "0", importance: "必須", note: "" });
                })
              }
              type="button"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        )}
      </section>

      <section className="goal-resource-section">
        <div className="inline-section-heading">
          <div>
            <p className="eyebrow">Raid Targets</p>
            <h3>討伐目標</h3>
          </div>
        </div>
        <div className="goal-resource-list">
          {goal.raidTargets.length === 0 ? (
            <div className="empty-state compact">討伐目標は未設定です。</div>
          ) : (
            goal.raidTargets.map((target) => (
              <div className="goal-resource-row" key={target.id}>
                <span>
                  <strong>{target.questName}</strong>
                  <small>{runTypeLabel(target.runType)} {target.currentCount} / {target.targetCount}{target.note ? ` / ${target.note}` : ""}</small>
                </span>
                {canUpdate && (
                  <div className="goal-resource-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void run(() => api.updateGoalRaidTarget(goal.id, target.id, { currentCount: target.currentCount + 1 }))}
                      type="button"
                    >
                      +1
                    </button>
                    <button className="secondary-button" onClick={() => void run(() => api.deleteGoalRaidTarget(goal.id, target.id))} type="button">
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {canUpdate && (
          <div className="goal-resource-form goal-resource-form--wide">
            <input onChange={(event) => setRaidTarget((current) => ({ ...current, questName: event.target.value }))} placeholder="クエスト名" value={raidTarget.questName} />
            <select onChange={(event) => setRaidTarget((current) => ({ ...current, runType: event.target.value }))} value={raidTarget.runType}>
              <option value="host">自発</option>
              <option value="raid">救援</option>
              <option value="other">その他</option>
            </select>
            <input min={0} onChange={(event) => setRaidTarget((current) => ({ ...current, targetCount: event.target.value }))} type="number" value={raidTarget.targetCount} />
            <input min={0} onChange={(event) => setRaidTarget((current) => ({ ...current, currentCount: event.target.value }))} type="number" value={raidTarget.currentCount} />
            <input onChange={(event) => setRaidTarget((current) => ({ ...current, note: event.target.value }))} placeholder="メモ" value={raidTarget.note} />
            <button
              className="secondary-button"
              disabled={!raidTarget.questName.trim()}
              onClick={() =>
                void run(async () => {
                  await api.addGoalRaidTarget(goal.id, {
                    questName: raidTarget.questName,
                    runType: raidTarget.runType,
                    targetCount: Number(raidTarget.targetCount) || 0,
                    currentCount: Number(raidTarget.currentCount) || 0,
                    note: raidTarget.note
                  });
                  setRaidTarget({ questName: "", runType: "other", targetCount: "0", currentCount: "0", note: "" });
                })
              }
              type="button"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        )}
      </section>

      <section className="goal-resource-section">
        <div className="inline-section-heading">
          <div>
            <p className="eyebrow">Sub Tasks</p>
            <h3>サブタスク</h3>
          </div>
        </div>
        <div className="goal-resource-list">
          {goal.subTasks.length === 0 ? (
            <div className="empty-state compact">サブタスクは未設定です。</div>
          ) : (
            goal.subTasks.map((task) => (
              <div className="goal-resource-row" key={task.id}>
                <label className="checkbox-field">
                  <input
                    checked={task.isDone}
                    disabled={!canUpdate}
                    onChange={(event) => void run(() => api.updateGoalSubTask(goal.id, task.id, { isDone: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>{task.title}</span>
                </label>
                {canUpdate && (
                  <button className="secondary-button" onClick={() => void run(() => api.deleteGoalSubTask(goal.id, task.id))} type="button">
                    削除
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {canUpdate && (
          <div className="goal-resource-form">
            <input onChange={(event) => setSubTaskTitle(event.target.value)} placeholder="サブタスク名" value={subTaskTitle} />
            <button
              className="secondary-button"
              disabled={!subTaskTitle.trim()}
              onClick={() =>
                void run(async () => {
                  await api.addGoalSubTask(goal.id, { title: subTaskTitle, sortOrder: goal.subTasks.length });
                  setSubTaskTitle("");
                })
              }
              type="button"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

function runTypeLabel(value: string) {
  if (value === "host") return "自発";
  if (value === "raid") return "救援";
  return "その他";
}

function indexInKind(form: GoalFormState, part: GoalFormationPart, flatIndex: number) {
  const sameKindBefore = [...(form.characters ?? []), ...(form.weapons ?? []), ...(form.summons ?? [])]
    .slice(0, flatIndex)
    .filter((item) => item.kind === part.kind).length;
  return sameKindBefore;
}

function formFromGoal(goal: SharedGoal): GoalFormState {
  const goalDetails = details(goal);

  return {
    ...blankForm,
    title: goal.title,
    category: goal.category,
    itemName: goalDetails.itemName ?? "",
    requiredCount: numberText(goal.targetValue ?? goalDetails.requiredCount),
    currentCount: numberText(goal.currentValue ?? goalDetails.currentCount),
    questName: goalDetails.questName ?? "",
    questUrl: goalDetails.questUrl ?? "",
    content: goal.description ?? goalDetails.content ?? "",
    sourceBuildPostId: goalDetails.sourceBuildPostId ?? "",
    sourceBuildPostTitle: goalDetails.sourceBuildPostTitle ?? "",
    characters: goalDetails.characters ?? [],
    weapons: goalDetails.weapons ?? [],
    summons: goalDetails.summons ?? [],
    dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().slice(0, 10) : "",
    status: statusForCategory(goal.status, goal.category),
    boardStatus: goal.boardStatus,
    priority: goal.priority,
    effort: goal.effort,
    beginnerRecommended: goal.beginnerRecommended,
    sortOrder: String(goal.sortOrder ?? 0),
    memo: goal.memo ?? ""
  };
}

function FarmingDetail({ goal }: { goal: SharedGoal }) {
  const goalDetails = details(goal);
  const questUrl = validUrl(goalDetails.questUrl);

  return (
    <dl className="goal-detail-list">
      <div>
        <dt>対象</dt>
        <dd>{goalDetails.itemName || "未設定"}</dd>
      </div>
      <div>
        <dt>必要数 / 現在数</dt>
        <dd>
          {goal.targetValue ?? "-"} / {goal.currentValue ?? 0}
        </dd>
      </div>
      <div>
        <dt>クエスト</dt>
        <dd>{goalDetails.questName || "未設定"}</dd>
      </div>
      <div>
        <dt>クエストURL</dt>
        <dd>
          {questUrl ? (
            <a className="text-link break-link" href={questUrl} rel="noopener noreferrer" target="_blank">
              開く
              <ExternalLink size={14} />
            </a>
          ) : (
            "未設定"
          )}
        </dd>
      </div>
    </dl>
  );
}

function FormationDetail({ details: goalDetails }: { details: SharedGoalDetails }) {
  return (
    <div className="formation-detail-blocks">
      {goalDetails.sourceBuildPostTitle && <p className="goal-note">取り込み元: {goalDetails.sourceBuildPostTitle}</p>}
      <PartDetailSection parts={goalDetails.characters ?? []} title="キャラ編成" />
      <PartDetailSection parts={goalDetails.weapons ?? []} title="武器編成" />
      <PartDetailSection parts={goalDetails.summons ?? []} title="召喚石編成" />
    </div>
  );
}

function PartDetailSection({ parts, title }: { parts: GoalFormationPart[]; title: string }) {
  return (
    <section className="goal-part-section">
      <h3>{title}</h3>
      {parts.length === 0 ? (
        <div className="empty-state compact">未設定です。</div>
      ) : (
        <div className="goal-part-list">
          {parts.map((part, index) => (
            <div className="goal-part-row" key={`${part.kind}-${part.name}-${index}`}>
              <PartThumbnail kind={part.kind} masterId={part.masterId} name={part.name} />
              <span>
                <strong>{part.name}</strong>
                {part.position && <small>{part.position}</small>}
              </span>
              <span className={part.owned ? "pill" : "pill muted"}>{part.owned ? "所持" : "未所持"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProposalCard({
  onAccept,
  onDecline,
  proposal
}: {
  onAccept: (proposal: GoalProposal) => void;
  onDecline: (proposal: GoalProposal) => void;
  proposal: GoalProposal;
}) {
  const proposalGoal = {
    id: proposal.id,
    title: proposal.title,
    category: proposal.category,
    description: proposal.description,
    targetValue: proposal.targetValue,
    currentValue: proposal.category === "周回" ? 0 : null,
    unit: proposal.unit,
    details: proposal.details,
    progressRate: proposal.category === "周回" ? 0 : null,
    status: "未達成",
    boardStatus: "later",
    priority: "medium",
    effort: "normal",
    dueDate: proposal.dueDate,
    beginnerRecommended: false,
    sortOrder: 0,
    memo: proposal.proposalMemo,
    sourceProposalId: null,
    proposedByUserId: proposal.proposerUserId,
    ownerId: proposal.targetUserId,
    owner: proposal.targetUser,
    proposedByUser: proposal.proposer,
    buildLinks: [],
    requiredItems: [],
    raidTargets: [],
    subTasks: [],
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt
  } as SharedGoal;

  return (
    <article className="proposal-card">
      <div>
        <div className="goal-card-title">
          <h3>{proposal.title}</h3>
          <span className="pill">{proposal.status}</span>
          <span className="pill muted">{proposal.category}</span>
        </div>
        <div className="goal-meta">
          <span>提案者: {displayName(proposal.proposer)}</span>
          <span>期限: {formatDate(proposal.dueDate)}</span>
          <span>{progressLabel(proposalGoal)}</span>
        </div>
        {proposal.category === "周回" && <FarmingDetail goal={proposalGoal} />}
        {proposal.category === "編成" && <FormationDetail details={proposalDetails(proposal)} />}
        {proposal.category === "その他" && <p className="goal-note">{proposal.description || proposalDetails(proposal).content || "目標内容は未入力です。"}</p>}
        {proposal.proposalMemo && <p className="goal-note">{proposal.proposalMemo}</p>}
      </div>
      {proposal.status === "提案中" && (
        <div className="proposal-actions">
          <button className="primary-button" onClick={() => onAccept(proposal)} type="button">
            <CheckCircle2 size={17} />
            受け入れる
          </button>
          <button className="secondary-button" onClick={() => onDecline(proposal)} type="button">
            <RotateCcw size={17} />
            見送る
          </button>
        </div>
      )}
    </article>
  );
}
