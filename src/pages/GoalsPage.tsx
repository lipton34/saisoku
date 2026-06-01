import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Eye,
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
import { useLocation } from "react-router-dom";
import { BuildMasterCatalogProvider, useBuildMasterLookup } from "../lib/BuildMasterCatalogContext";
import {
  api,
  type BuildPost,
  type GoalCategory,
  type GoalFormationPart,
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
type GoalTab = "goals" | "new" | "proposal" | "inbox";

type GoalFormState = {
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
  memo: string;
  proposalMemo: string;
};

const goalCategories: GoalCategory[] = ["周回", "編成", "その他"];
const goalStatuses: GoalStatus[] = ["達成", "未達成"];
const proposalStatuses: ProposalStatus[] = ["提案中", "受け入れ済み", "見送り"];

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

function goalPayload(form: GoalFormState) {
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
  return tab === "new" || tab === "proposal" || tab === "inbox" || tab === "goals" ? tab : "goals";
}

export function GoalsPage() {
  const { catalog } = useBuildMasterCatalog();

  return (
    <BuildMasterCatalogProvider catalog={catalog}>
      <GoalsPageContent />
    </BuildMasterCatalogProvider>
  );
}

function GoalsPageContent() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<GoalTab>(() => tabFromSearch(location.search));
  const [members, setMembers] = useState<User[]>([]);
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [proposals, setProposals] = useState<GoalProposal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormState>(blankForm);
  const [proposalForm, setProposalForm] = useState<GoalFormState>(blankForm);
  const [materialGoals, setMaterialGoals] = useState<MaterialGoal[]>([]);
  const [buildPosts, setBuildPosts] = useState<BuildPost[]>([]);
  const [filters, setFilters] = useState({ userId: "", category: "", status: "", due: "" });
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
    const data = await api.sharedGoals(filters);
    setGoals(data.goals);
    setSelectedGoal((current) => {
      if (!current) return data.goals[0] ?? null;
      return data.goals.find((goal) => goal.id === current.id) ?? data.goals[0] ?? null;
    });
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
  }, [filters]);

  useEffect(() => {
    void loadProposals().catch((caught) => setError(caught instanceof Error ? caught.message : "提案の取得に失敗しました"));
  }, [proposalStatus]);

  const openProposalCount = useMemo(() => proposals.filter((proposal) => proposal.status === "提案中").length, [proposals]);
  const canUpdateSelected = selectedGoal?.ownerId === user?.id;

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
      setSelectedGoal(data.goal);
      resetGoalForm();
      setActiveTab("goals");
      setNotice("目標を登録しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateGoal(form: GoalFormState) {
    if (!selectedGoal) return false;
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const data = await api.updateSharedGoal(selectedGoal.id, goalPayload(form));
      setSelectedGoal(data.goal);
      setGoals((current) => current.map((goal) => (goal.id === data.goal.id ? data.goal : goal)));
      setNotice("目標を保存しました。");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の保存に失敗しました");
      return false;
    } finally {
      setIsSubmitting(false);
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
      setSelectedGoal(data.goal);
      setActiveTab("goals");
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

  async function deleteGoal(goal: SharedGoal) {
    if (!window.confirm(`「${goal.title}」を削除しますか？`)) {
      return;
    }

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await api.deleteSharedGoal(goal.id);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      setSelectedGoal((current) => (current?.id === goal.id ? null : current));
      setNotice("目標を削除しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Crew Goals</p>
          <h2>団内目標共有</h2>
          <p>団員それぞれの目標と手入力の進捗を、ゆるく確認できる場所です。</p>
        </div>
        <div className="segmented goal-tabs">
          <button className={activeTab === "goals" ? "active" : ""} onClick={() => setActiveTab("goals")} type="button">
            <ClipboardList size={16} />
            一覧
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

      {activeTab === "goals" && (
        <section className="content-grid goals-layout">
          <div className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">List</p>
                <h2>団員全体の目標</h2>
              </div>
            </div>
            <GoalFilters filters={filters} members={members} onChange={setFilters} />
            <div className="goals-table-wrapper">
              <div className="goal-list">
                {goals.length === 0 ? (
                  <div className="empty-state">条件に合う目標はまだありません。</div>
                ) : (
                  goals.map((goal) => (
                    <GoalRow
                      goal={goal}
                      isActive={selectedGoal?.id === goal.id}
                      key={goal.id}
                      onSelect={setSelectedGoal}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="panel goal-detail-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Detail</p>
                <h2>目標詳細</h2>
              </div>
              <Eye size={20} />
            </div>
            {selectedGoal ? (
              <GoalDetail
                buildPosts={buildPosts}
                canUpdate={canUpdateSelected}
                goal={selectedGoal}
                isSubmitting={isSubmitting}
                materialGoals={materialGoals}
                onDelete={deleteGoal}
                onUpdate={handleUpdateGoal}
              />
            ) : (
              <div className="empty-state">一覧から目標を選んでください。</div>
            )}
          </aside>
        </section>
      )}
    </div>
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
  onChange
}: {
  buildPosts: BuildPost[];
  form: GoalFormState;
  materialGoals: MaterialGoal[];
  mode: "goal" | "proposal";
  onChange: (form: GoalFormState) => void;
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

function GoalDetail({
  buildPosts,
  canUpdate,
  goal,
  isSubmitting,
  materialGoals,
  onDelete,
  onUpdate
}: {
  buildPosts: BuildPost[];
  canUpdate: boolean;
  goal: SharedGoal;
  isSubmitting: boolean;
  materialGoals: MaterialGoal[];
  onDelete: (goal: SharedGoal) => Promise<void>;
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
    dueDate: proposal.dueDate,
    memo: proposal.proposalMemo,
    sourceProposalId: null,
    proposedByUserId: proposal.proposerUserId,
    ownerId: proposal.targetUserId,
    owner: proposal.targetUser,
    proposedByUser: proposal.proposer,
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
