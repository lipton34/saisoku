import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gem, Pencil, RotateCcw, Save, Ticket } from "lucide-react";
import { api, type SparkSavings, type SparkSavingsInput } from "../lib/api";
import { calculateSparkSavings } from "../lib/sparkSavings";

type Draft = {
  crystalCount: string;
  singleTicketCount: string;
  tenPullTicketCount: string;
  targetName: string;
  plannedAt: string;
  memo: string;
};

const emptyDraft: Draft = {
  crystalCount: "0",
  singleTicketCount: "0",
  tenPullTicketCount: "0",
  targetName: "",
  plannedAt: "",
  memo: ""
};

const limits = {
  crystalCount: 999_999_999,
  singleTicketCount: 999_999,
  tenPullTicketCount: 99_999
} as const;

function draftFromSavings(savings: SparkSavings): Draft {
  return {
    crystalCount: String(savings.crystalCount),
    singleTicketCount: String(savings.singleTicketCount),
    tenPullTicketCount: String(savings.tenPullTicketCount),
    targetName: savings.targetName ?? "",
    plannedAt: savings.plannedAt ?? "",
    memo: savings.memo ?? ""
  };
}

function countError(value: string, maximum: number) {
  if (!/^\d+$/.test(value)) return "0以上の整数で入力してください";
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    return `${maximum.toLocaleString("ja-JP")}以下で入力してください`;
  }
  return "";
}

function characterCount(value: string) {
  return Array.from(value.trim()).length;
}

function formatNumber(value: number) {
  return value.toLocaleString("ja-JP");
}

export function SparkSavingsPage() {
  const [savings, setSavings] = useState<SparkSavings | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const savedDraft = useMemo(() => savings ? draftFromSavings(savings) : emptyDraft, [savings]);
  const isDirty = isEditing && JSON.stringify(draft) !== JSON.stringify(savedDraft);

  const errors = useMemo(() => ({
    crystalCount: countError(draft.crystalCount, limits.crystalCount),
    singleTicketCount: countError(draft.singleTicketCount, limits.singleTicketCount),
    tenPullTicketCount: countError(draft.tenPullTicketCount, limits.tenPullTicketCount),
    targetName: characterCount(draft.targetName) > 100 ? "100文字以内で入力してください" : "",
    memo: characterCount(draft.memo) > 2_000 ? "2,000文字以内で入力してください" : ""
  }), [draft]);
  const isValid = Object.values(errors).every((value) => !value);
  const calculation = useMemo(() => {
    if (!isValid) return null;
    return calculateSparkSavings({
      crystalCount: Number(draft.crystalCount),
      singleTicketCount: Number(draft.singleTicketCount),
      tenPullTicketCount: Number(draft.tenPullTicketCount)
    });
  }, [draft, isValid]);

  async function loadSavings() {
    setIsLoading(true);
    setError("");
    try {
      const result = await api.sparkSavings();
      setSavings(result.sparkSavings);
      setDraft(result.sparkSavings ? draftFromSavings(result.sparkSavings) : emptyDraft);
      setIsEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "天井貯金の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSavings();
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    function confirmLinkNavigation(event: MouseEvent) {
      if (!isDirty || event.defaultPrevented || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target || window.confirm("入力内容が保存されていません。変更を破棄しますか？")) return;
      event.preventDefault();
      event.stopPropagation();
    }
    document.addEventListener("click", confirmLinkNavigation, true);
    return () => document.removeEventListener("click", confirmLinkNavigation, true);
  }, [isDirty]);

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
    setNotice("");
  }

  function cancelEditing() {
    if (isDirty && !window.confirm("入力内容が保存されていません。変更を破棄しますか？")) return;
    setDraft(savedDraft);
    setIsEditing(false);
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    const payload: SparkSavingsInput = {
      crystalCount: draft.crystalCount,
      singleTicketCount: draft.singleTicketCount,
      tenPullTicketCount: draft.tenPullTicketCount,
      targetName: draft.targetName,
      plannedAt: draft.plannedAt || null,
      memo: draft.memo
    };
    try {
      const result = await api.saveSparkSavings(payload);
      setSavings(result.sparkSavings);
      setDraft(draftFromSavings(result.sparkSavings));
      setIsEditing(false);
      setNotice(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "天井貯金を保存できませんでした");
    } finally {
      setIsSaving(false);
    }
  }

  async function reset() {
    if (!window.confirm("天井貯金をリセットしますか？\n\n宝晶石、チケット、目的、使用予定日、メモが初期値に戻ります。この操作は元に戻せません。")) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.resetSparkSavings();
      setSavings(result.sparkSavings);
      setDraft(result.sparkSavings ? draftFromSavings(result.sparkSavings) : emptyDraft);
      setIsEditing(false);
      setNotice(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "天井貯金をリセットできませんでした");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="page-stack compact-page spark-savings-page"><section className="panel empty-state"><p>天井貯金を読み込んでいます…</p></section></div>;
  }

  if (error && !savings && !isEditing) {
    return <div className="page-stack compact-page spark-savings-page"><section className="panel empty-state"><p className="form-error" role="alert">{error}</p><button className="secondary-button" onClick={() => void loadSavings()} type="button">再読み込み</button></section></div>;
  }

  if (!savings && !isEditing) {
    return <div className="page-stack compact-page spark-savings-page">
      <section className="page-heading"><div><p className="eyebrow">Spark Savings</p><h1>天井貯金</h1></div></section>
      {notice ? <p className="form-notice" role="status">{notice}</p> : null}
      <section className="panel empty-state spark-empty-state">
        <Gem aria-hidden="true" size={32} />
        <h2>天井貯金はまだ登録されていません</h2>
        <p>宝晶石とガチャチケットから、現在引ける回数と天井までの不足分を確認できます。</p>
        <button className="primary-button" onClick={() => setIsEditing(true)} type="button">天井貯金を登録</button>
      </section>
    </div>;
  }

  return <div className="page-stack compact-page spark-savings-page">
    <section className="page-heading"><div><p className="eyebrow">Spark Savings</p><h1>天井貯金</h1></div></section>

    {(error || notice) ? <section aria-live="polite">{error ? <p className="form-error" role="alert">{error}</p> : null}{notice ? <p className="form-notice" role="status">{notice}</p> : null}</section> : null}

    <section className={`panel spark-summary${calculation?.isTargetReached ? " is-reached" : ""}`}>
      <div className="spark-current"><span>現在</span><strong>{calculation ? formatNumber(calculation.currentDrawCount) : "—"}<small>連分</small></strong></div>
      <div className="spark-needed">
        {calculation?.isTargetReached ? <p className="spark-reached"><CheckCircle2 aria-hidden="true" size={22} />天井分を確保済み{calculation.excessDrawCount > 0 ? `（${formatNumber(calculation.excessDrawCount)}連分超過）` : ""}</p> : null}
        <span>追加で必要な宝晶石</span>
        <strong>{calculation ? formatNumber(calculation.additionalCrystalCount) : "—"}<small>個</small></strong>
        {calculation && !calculation.isTargetReached ? <small>（あと{formatNumber(calculation.remainingDrawCount)}連）</small> : null}
      </div>
    </section>

    {isEditing ? <form className="panel spark-form" onSubmit={save}>
      <div className="section-heading"><div><p className="eyebrow">Edit</p><h2>{savings ? "天井貯金を編集" : "天井貯金を登録"}</h2></div></div>
      <div className="spark-count-form">
        <label>宝晶石数
          <input aria-describedby={errors.crystalCount ? "crystal-count-error" : undefined} inputMode="numeric" onChange={(event) => updateDraft("crystalCount", event.target.value)} type="text" value={draft.crystalCount} />
          {errors.crystalCount ? <small className="field-error" id="crystal-count-error">{errors.crystalCount}</small> : null}
        </label>
        <label>単発チケット数
          <input aria-describedby={errors.singleTicketCount ? "single-ticket-error" : undefined} inputMode="numeric" onChange={(event) => updateDraft("singleTicketCount", event.target.value)} type="text" value={draft.singleTicketCount} />
          {errors.singleTicketCount ? <small className="field-error" id="single-ticket-error">{errors.singleTicketCount}</small> : null}
        </label>
        <label>10連チケット数
          <input aria-describedby={errors.tenPullTicketCount ? "ten-ticket-error" : undefined} inputMode="numeric" onChange={(event) => updateDraft("tenPullTicketCount", event.target.value)} type="text" value={draft.tenPullTicketCount} />
          {errors.tenPullTicketCount ? <small className="field-error" id="ten-ticket-error">{errors.tenPullTicketCount}</small> : null}
        </label>
      </div>
      <label>目的（任意）
        <input aria-describedby={errors.targetName ? "target-name-error" : undefined} maxLength={101} onChange={(event) => updateDraft("targetName", event.target.value)} value={draft.targetName} />
        {errors.targetName ? <small className="field-error" id="target-name-error">{errors.targetName}</small> : null}
      </label>
      <label>使用予定日（任意）<input onChange={(event) => updateDraft("plannedAt", event.target.value)} type="date" value={draft.plannedAt} /></label>
      <label>メモ（任意）
        <textarea aria-describedby={errors.memo ? "spark-memo-error" : undefined} maxLength={2001} onChange={(event) => updateDraft("memo", event.target.value)} rows={5} value={draft.memo} />
        {errors.memo ? <small className="field-error" id="spark-memo-error">{errors.memo}</small> : null}
      </label>
      <div className="button-row spark-form-actions">
        <button className="primary-button" disabled={!isValid || isSaving} type="submit"><Save aria-hidden="true" size={18} />{isSaving ? "保存中…" : "保存"}</button>
        <button className="secondary-button" disabled={isSaving} onClick={cancelEditing} type="button">キャンセル</button>
      </div>
    </form> : <>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Breakdown</p><h2>内訳</h2></div><Ticket aria-hidden="true" size={22} /></div>
        <dl className="spark-breakdown">
          <div><dt>宝晶石</dt><dd>{formatNumber(savings!.crystalCount)}個 <small>／ {formatNumber(calculation!.crystalDrawCount)}連分</small></dd></div>
          <div><dt>単発チケット</dt><dd>{formatNumber(savings!.singleTicketCount)}枚</dd></div>
          <div><dt>10連チケット</dt><dd>{formatNumber(savings!.tenPullTicketCount)}枚 <small>／ {formatNumber(savings!.tenPullTicketCount * 10)}連分</small></dd></div>
          <div><dt>チケット合計</dt><dd>{formatNumber(calculation!.ticketDrawCount)}連分</dd></div>
        </dl>
      </section>
      <section className="panel spark-details">
        <div className="section-heading"><div><p className="eyebrow">Plan</p><h2>任意情報</h2></div></div>
        <dl><div><dt>目的</dt><dd>{savings!.targetName || "未設定"}</dd></div><div><dt>使用予定日</dt><dd>{savings!.plannedAt?.replace(/-/g, "/") || "未設定"}</dd></div>{savings!.memo ? <div><dt>メモ</dt><dd>{savings!.memo}</dd></div> : null}</dl>
      </section>
      <section className="spark-actions">
        <button className="primary-button" disabled={isSaving} onClick={() => { setDraft(savedDraft); setIsEditing(true); setNotice(""); }} type="button"><Pencil aria-hidden="true" size={18} />編集</button>
        <button className="secondary-button danger-button" disabled={isSaving} onClick={() => void reset()} type="button"><RotateCcw aria-hidden="true" size={18} />{isSaving ? "リセット中…" : "リセット"}</button>
      </section>
    </>}
  </div>;
}
