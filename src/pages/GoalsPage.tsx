import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Inbox,
  MessageSquarePlus,
  Plus,
  RotateCcw,
  Save
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/AuthContext";
import {
  api,
  type GoalCategory,
  type GoalProposal,
  type GoalStatus,
  type ProposalStatus,
  type SharedGoal,
  type User
} from "../lib/api";

const goalCategories: GoalCategory[] = ["古戦場", "高難度", "周回", "育成", "その他"];
const goalStatuses: GoalStatus[] = ["未着手", "進行中", "達成", "中止"];
const proposalStatuses: ProposalStatus[] = ["提案中", "受け入れ済み", "見送り"];

const blankGoalForm = {
  title: "",
  category: "その他" as GoalCategory,
  description: "",
  targetValue: "",
  currentValue: "",
  unit: "",
  status: "未着手" as GoalStatus,
  dueDate: "",
  memo: ""
};

const blankProposalForm = {
  targetUserId: "",
  title: "",
  category: "その他" as GoalCategory,
  description: "",
  targetValue: "",
  unit: "",
  dueDate: "",
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

function toDateInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function progressLabel(goal: SharedGoal) {
  if (goal.progressRate !== null && goal.targetValue !== null && goal.currentValue !== null) {
    return `${goal.progressRate}% (${goal.currentValue}/${goal.targetValue}${goal.unit ?? ""})`;
  }

  return goal.memo || goal.status;
}

export function GoalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"goals" | "new" | "proposal" | "inbox">("goals");
  const [members, setMembers] = useState<User[]>([]);
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [proposals, setProposals] = useState<GoalProposal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null);
  const [goalForm, setGoalForm] = useState(blankGoalForm);
  const [proposalForm, setProposalForm] = useState(blankProposalForm);
  const [progressForm, setProgressForm] = useState({ currentValue: "", status: "進行中" as GoalStatus, memo: "" });
  const [filters, setFilters] = useState({
    userId: "",
    category: "",
    status: "",
    due: "",
    keyword: ""
  });
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | "all">("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadMembers() {
    const data = await api.users();
    setMembers(data.users);
    setProposalForm((current) => ({
      ...current,
      targetUserId: current.targetUserId || data.users.find((member) => member.id !== user?.id)?.id || ""
    }));
  }

  async function loadGoals() {
    const data = await api.sharedGoals(filters);
    setGoals(data.goals);
    setSelectedGoal((current) => {
      if (!current) {
        return data.goals[0] ?? null;
      }
      return data.goals.find((goal) => goal.id === current.id) ?? data.goals[0] ?? null;
    });
  }

  async function loadProposals() {
    const data = await api.goalProposalInbox(proposalStatus);
    setProposals(data.proposals);
  }

  useEffect(() => {
    void loadMembers().catch((caught) => setError(caught instanceof Error ? caught.message : "団員の取得に失敗しました"));
  }, []);

  useEffect(() => {
    void loadGoals().catch((caught) => setError(caught instanceof Error ? caught.message : "目標の取得に失敗しました"));
  }, [filters]);

  useEffect(() => {
    void loadProposals().catch((caught) => setError(caught instanceof Error ? caught.message : "提案の取得に失敗しました"));
  }, [proposalStatus]);

  useEffect(() => {
    if (!selectedGoal) {
      return;
    }

    setProgressForm({
      currentValue: selectedGoal.currentValue?.toString() ?? "",
      status: selectedGoal.status,
      memo: selectedGoal.memo ?? ""
    });
  }, [selectedGoal]);

  const openProposalCount = useMemo(() => proposals.filter((proposal) => proposal.status === "提案中").length, [proposals]);

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const data = await api.createSharedGoal(goalForm);
      setGoals((current) => [data.goal, ...current]);
      setSelectedGoal(data.goal);
      setGoalForm(blankGoalForm);
      setActiveTab("goals");
      setNotice("目標を登録しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "目標の登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGoal) {
      return;
    }

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const data = await api.updateSharedGoal(selectedGoal.id, progressForm);
      setSelectedGoal(data.goal);
      setGoals((current) => current.map((goal) => (goal.id === data.goal.id ? data.goal : goal)));
      setNotice("進捗を更新しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "進捗の更新に失敗しました");
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
      await api.createGoalProposal(proposalForm);
      setProposalForm({
        ...blankProposalForm,
        targetUserId: members.find((member) => member.id !== user?.id)?.id || ""
      });
      setNotice("目標を提案しました。相手が受け入れるまで個人目標にはなりません。");
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

  const canUpdateSelected = selectedGoal?.ownerId === user?.id;

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
          <button
            className={activeTab === "proposal" ? "active" : ""}
            onClick={() => setActiveTab("proposal")}
            type="button"
          >
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
          <GoalFields form={goalForm} onChange={setGoalForm} showCurrentValue />
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
          <label>
            提案先
            <select
              onChange={(event) => setProposalForm((current) => ({ ...current, targetUserId: event.target.value }))}
              required
              value={proposalForm.targetUserId}
            >
              <option value="">選択してください</option>
              {members
                .filter((member) => member.id !== user?.id)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {displayName(member)}
                  </option>
                ))}
            </select>
          </label>
          <GoalFields form={proposalForm} onChange={setProposalForm} />
          <label>
            提案メモ
            <textarea
              onChange={(event) =>
                setProposalForm((current) => ({ ...current, proposalMemo: event.target.value }))
              }
              rows={4}
              value={proposalForm.proposalMemo}
            />
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
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
                <article className="proposal-card" key={proposal.id}>
                  <div>
                    <div className="goal-card-title">
                      <h3>{proposal.title}</h3>
                      <span className="pill">{proposal.status}</span>
                      <span className="pill muted">{proposal.category}</span>
                    </div>
                    <p>{proposal.description || "目標内容は未入力です。"}</p>
                    <div className="goal-meta">
                      <span>提案者: {displayName(proposal.proposer)}</span>
                      <span>期限: {formatDate(proposal.dueDate)}</span>
                      {proposal.targetValue !== null && (
                        <span>
                          目標値: {proposal.targetValue}
                          {proposal.unit ?? ""}
                        </span>
                      )}
                    </div>
                    {proposal.proposalMemo && <p className="goal-note">{proposal.proposalMemo}</p>}
                  </div>
                  {proposal.status === "提案中" && (
                    <div className="proposal-actions">
                      <button className="primary-button" onClick={() => acceptProposal(proposal)} type="button">
                        <CheckCircle2 size={17} />
                        受け入れる
                      </button>
                      <button className="secondary-button" onClick={() => declineProposal(proposal)} type="button">
                        <RotateCcw size={17} />
                        見送る
                      </button>
                    </div>
                  )}
                </article>
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
            <div className="goal-filter-grid">
              <label>
                団員
                <select onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))} value={filters.userId}>
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
                <select onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} value={filters.category}>
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
                <select onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}>
                  <option value="">すべて</option>
                  {goalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                期限
                <select onChange={(event) => setFilters((current) => ({ ...current, due: event.target.value }))} value={filters.due}>
                  <option value="">すべて</option>
                  <option value="upcoming">期限あり</option>
                  <option value="overdue">確認したい期限</option>
                  <option value="none">期限なし</option>
                </select>
              </label>
              <label className="keyword-field">
                キーワード
                <input
                  onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                  placeholder="タイトル・内容・メモ・団員名"
                  value={filters.keyword}
                />
              </label>
            </div>
            <div className="goal-list">
              {goals.length === 0 ? (
                <div className="empty-state">条件に合う目標はまだありません。</div>
              ) : (
                goals.map((goal) => (
                  <button
                    className={selectedGoal?.id === goal.id ? "goal-row active" : "goal-row"}
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    type="button"
                  >
                    <span>{displayName(goal.owner)}</span>
                    <strong>{goal.title}</strong>
                    <span>{goal.category}</span>
                    <span>{formatDate(goal.dueDate)}</span>
                    <span>{progressLabel(goal)}</span>
                    <span>{goal.status}</span>
                    <span>{formatDateTime(goal.updatedAt)}</span>
                  </button>
                ))
              )}
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
              <div className="goal-detail">
                <div className="goal-card-title">
                  <h3>{selectedGoal.title}</h3>
                  <span className="pill">{selectedGoal.status}</span>
                  <span className="pill muted">{selectedGoal.category}</span>
                </div>
                <dl className="goal-detail-list">
                  <div>
                    <dt>団員</dt>
                    <dd>{displayName(selectedGoal.owner)}</dd>
                  </div>
                  <div>
                    <dt>期限</dt>
                    <dd>{formatDate(selectedGoal.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>進捗</dt>
                    <dd>{progressLabel(selectedGoal)}</dd>
                  </div>
                  <div>
                    <dt>最終更新</dt>
                    <dd>{formatDateTime(selectedGoal.updatedAt)}</dd>
                  </div>
                </dl>
                <p>{selectedGoal.description || "目標内容は未入力です。"}</p>
                {selectedGoal.memo && <p className="goal-note">{selectedGoal.memo}</p>}
                {selectedGoal.proposedByUser && (
                  <p className="goal-note">提案者: {displayName(selectedGoal.proposedByUser)}</p>
                )}

                {canUpdateSelected && (
                  <form className="progress-form" onSubmit={handleUpdateProgress}>
                    <div className="section-heading compact-heading">
                      <div>
                        <p className="eyebrow">Update</p>
                        <h2>進捗更新</h2>
                      </div>
                    </div>
                    <div className="form-row">
                      <label>
                        現在値
                        <input
                          min={0}
                          onChange={(event) =>
                            setProgressForm((current) => ({ ...current, currentValue: event.target.value }))
                          }
                          type="number"
                          value={progressForm.currentValue}
                        />
                      </label>
                      <label>
                        状態
                        <select
                          onChange={(event) =>
                            setProgressForm((current) => ({ ...current, status: event.target.value as GoalStatus }))
                          }
                          value={progressForm.status}
                        >
                          {goalStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      進捗メモ
                      <textarea
                        onChange={(event) => setProgressForm((current) => ({ ...current, memo: event.target.value }))}
                        rows={4}
                        value={progressForm.memo}
                      />
                    </label>
                    <button className="primary-button" disabled={isSubmitting} type="submit">
                      <Save size={18} />
                      進捗を保存
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="empty-state">一覧から目標を選んでください。</div>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}

type GoalFieldsForm = {
  title: string;
  category: GoalCategory;
  description: string;
  targetValue: string;
  unit: string;
  dueDate: string;
  currentValue?: string;
  status?: GoalStatus;
  memo?: string;
};

function GoalFields<T extends GoalFieldsForm>({
  form,
  onChange,
  showCurrentValue = false
}: {
  form: T;
  onChange: (value: T) => void;
  showCurrentValue?: boolean;
}) {
  function update<Key extends keyof GoalFieldsForm>(key: Key, value: GoalFieldsForm[Key]) {
    onChange({ ...form, [key]: value } as T);
  }

  return (
    <>
      <label>
        目標タイトル
        <input onChange={(event) => update("title", event.target.value)} required value={form.title} />
      </label>
      <div className="form-row">
        <label>
          カテゴリ
          <select
            onChange={(event) => update("category", event.target.value as GoalCategory)}
            value={form.category}
          >
            {goalCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          期限
          <input onChange={(event) => update("dueDate", event.target.value)} type="date" value={toDateInput(form.dueDate)} />
        </label>
      </div>
      <label>
        目標内容
        <textarea
          onChange={(event) => update("description", event.target.value)}
          rows={4}
          value={form.description}
        />
      </label>
      <div className="form-row">
        <label>
          目標値
          <input
            min={0}
            onChange={(event) => update("targetValue", event.target.value)}
            type="number"
            value={form.targetValue}
          />
        </label>
        <label>
          単位
          <input onChange={(event) => update("unit", event.target.value)} value={form.unit} />
        </label>
      </div>
      {showCurrentValue && (
        <div className="form-row">
          <label>
            現在値
            <input
              min={0}
              onChange={(event) => update("currentValue", event.target.value)}
              type="number"
              value={"currentValue" in form ? form.currentValue ?? "" : ""}
            />
          </label>
          <label>
            状態
            <select
              onChange={(event) => update("status", event.target.value as GoalStatus)}
              value={"status" in form ? form.status ?? "未着手" : "未着手"}
            >
              {goalStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {showCurrentValue && (
        <label>
          メモ
          <textarea
            onChange={(event) => update("memo", event.target.value)}
            rows={4}
            value={"memo" in form ? form.memo ?? "" : ""}
          />
        </label>
      )}
    </>
  );
}
