import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, type SimpleBuildFields, type SimpleBuildImage } from "../lib/api";

const publishStateKey = "saisoku:build-new-publish";
const publishFormKey = "saisoku:build-new-form";
function readPublishForm(): Partial<SimpleBuildFields> {
  try { return JSON.parse(sessionStorage.getItem(publishFormKey) || "{}") as Partial<SimpleBuildFields>; } catch { return {}; }
}
type PersistedPublish = { postId?: string; phase: "creating" | "uploading" | "checking"; imageCount: number };
function readPublishState(): PersistedPublish | null {
  try {
    const raw = sessionStorage.getItem(publishStateKey);
    return raw ? JSON.parse(raw) as PersistedPublish : null;
  } catch { return null; }
}
function storePublishState(state: PersistedPublish | null) {
  try { if (state) sessionStorage.setItem(publishStateKey, JSON.stringify(state)); else sessionStorage.removeItem(publishStateKey); } catch { /* storage unavailable */ }
}

const imageLabels = ["1 キャラ編成", "2 武器編成", "3 召喚石編成", "補足1", "補足2"];

export function BuildEditorPage({ mode }: { mode: "post" | "draft" | "edit" }) {
  const { draftId = "", buildId = "" } = useParams();
  const navigate = useNavigate();
  const leftWhileSavingRef = useRef(false);
  const location = useLocation();
  const incomingUploadError = (location.state as { uploadError?: unknown } | null)?.uploadError;
  const [title, setTitle] = useState(() => mode === "post" ? readPublishForm().title ?? "" : "");
  const [questName, setQuestName] = useState(() => mode === "post" ? readPublishForm().questName ?? "" : "");
  const [overview, setOverview] = useState(() => mode === "post" ? readPublishForm().overview ?? "" : "");
  const [supplementalNotes, setSupplementalNotes] = useState(() => mode === "post" ? readPublishForm().supplementalNotes ?? "" : "");
  const [referenceUrl, setReferenceUrl] = useState(() => mode === "post" ? readPublishForm().referenceUrl ?? "" : "");
  const [images, setImages] = useState<SimpleBuildImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdDraftId, setCreatedDraftId] = useState("");
  const [recoveredPublish, setRecoveredPublish] = useState<PersistedPublish | null>(() => mode === "post" ? readPublishState() : null);
  const [createdPostId, setCreatedPostId] = useState(() => mode === "post" ? readPublishState()?.postId ?? "" : "");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [error, setError] = useState(typeof incomingUploadError === "string" ? incomingUploadError : "");
  const [savingStatus, setSavingStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "publish" | null>(null);

  const recordId = mode === "draft" ? draftId : buildId;
  const imageKind = mode === "draft" ? "drafts" : "posts";

  useEffect(() => {
    if (mode === "post") return;
    const loader = mode === "draft" ? api.buildDraft(draftId) : api.simpleBuildPost(buildId);
    loader.then((data) => {
      const record = "draft" in data ? data.draft : data.post;
      setTitle(record.title ?? "");
      setQuestName(record.questName ?? "");
      setOverview(record.overview ?? "");
      setSupplementalNotes(record.supplementalNotes ?? "");
      setReferenceUrl(record.referenceUrl ?? "");
      setImages(record.images);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "編成を読み込めませんでした"));
  }, [buildId, draftId, mode]);

  useEffect(() => {
    if (mode !== "post" || !recoveredPublish) return;
    if (!recoveredPublish.postId) {
      setRecoveryMessage("前回の投稿作成中に再読み込みされました。作成結果が不明のため、一覧で重複がないか確認してください。");
      return;
    }
    api.simpleBuildPost(recoveredPublish.postId).then(({ post }) => {
      setRecoveryMessage(`前回の投稿「${post.title}」を確認しました。保存済み画像: ${post.images.length}件 / 選択した画像: ${recoveredPublish.imageCount}件。続きは編集画面から確認できます。`);
    }).catch(() => setRecoveryMessage("前回の投稿状況を取得できませんでした。再投稿せず一覧から確認してください。"));
  }, [mode, recoveredPublish]);

  useEffect(() => {
    if (mode !== "post") return;
    try { sessionStorage.setItem(publishFormKey, JSON.stringify({ title, questName, overview, supplementalNotes, referenceUrl })); } catch { /* storage unavailable */ }
  }, [mode, title, questName, overview, supplementalNotes, referenceUrl]);

  function fields(): SimpleBuildFields {
    return { title, questName, overview, supplementalNotes, referenceUrl };
  }

  async function uploadFiles(kind: "posts" | "drafts", id: string) {
    const failures: string[] = [];
    for (const [index, file] of pendingFiles.entries()) {
      setSavingStatus(`画像をアップロード中（${index + 1}/${pendingFiles.length}）`);
      try {
        await api.uploadSimpleBuildImage(kind, id, file);
        setPendingFiles((current) => current.filter((candidate) => candidate !== file));
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : "アップロード失敗"}`);
      }
    }
    if (failures.length) throw new Error(`一部の画像を保存できませんでした。\n${failures.join("\n")}`);
  }

  async function saveDraft() {
    setConfirmAction(null);
    setSaving(true);
    setSavingStatus("保存処理を開始しています…");
    setError("");
    try {
      if (mode === "draft") {
        await api.updateBuildDraft(draftId, fields());
        await uploadFiles("drafts", draftId);
        navigate(`/builds/drafts/${draftId}`);
      } else {
        const draftIdForSave = createdDraftId || (await api.createBuildDraft(fields())).draft.id;
        setCreatedDraftId(draftIdForSave);
        if (createdDraftId) await api.updateBuildDraft(draftIdForSave, fields());
        await uploadFiles("drafts", draftIdForSave);
        navigate(`/builds/drafts/${draftIdForSave}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "下書きを保存できませんでした");
    } finally {
      setSaving(false);
      setSavingStatus("");
    }
  }

  async function publish() {
    setConfirmAction(null);
    leftWhileSavingRef.current = false;
    setSaving(true);
    setError("");
    try {
      if (mode === "draft") {
        await api.updateBuildDraft(draftId, fields());
        await uploadFiles("drafts", draftId);
        const { post } = await api.publishBuildDraft(draftId);
        navigate(`/builds/${post.id}`);
      } else if (mode === "edit") {
        const { post } = await api.updateSimpleBuildPost(buildId, fields());
        await uploadFiles("posts", buildId);
        navigate(`/builds/${post.id}`);
      } else {
        if (createdDraftId) {
          await api.updateBuildDraft(createdDraftId, fields());
          await uploadFiles("drafts", createdDraftId);
          const { post } = await api.publishBuildDraft(createdDraftId);
          navigate(`/builds/${post.id}`);
          return;
        }
        // Validate selected files before creating a persistent post.
        for (const file of pendingFiles) {
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            throw new Error(`${file.name}: JPEG・PNG・WebP形式、5MB以下の画像を選択してください`);
          }
        }
        setSavingStatus("投稿を作成中…");
        const snapshot: PersistedPublish = { postId: createdPostId || undefined, phase: "creating", imageCount: pendingFiles.length };
        storePublishState(snapshot);
        const postIdForPublish = createdPostId || (await api.createSimpleBuildPost(fields())).post.id;
        setCreatedPostId(postIdForPublish);
        storePublishState({ ...snapshot, postId: postIdForPublish, phase: "uploading" });
        if (createdPostId) await api.updateSimpleBuildPost(postIdForPublish, fields());
        try {
          await uploadFiles("posts", postIdForPublish);
        } catch (uploadError) {
          // The post already exists. Move to its editor so retries cannot create duplicates.
          // Successfully uploaded images can be reviewed there before reselecting failed files.
          const detail = uploadError instanceof Error ? uploadError.message : "画像をアップロードできませんでした";
          storePublishState(null);
          if (!leftWhileSavingRef.current) navigate(`/builds/${postIdForPublish}/edit`, {
            replace: true,
            state: { uploadError: `投稿自体は作成されましたが、画像の保存に失敗しました。成功した画像を確認し、失敗した画像を再選択して保存してください。\n${detail}` }
          });
          return;
        }
        storePublishState(null);
        try { sessionStorage.removeItem(publishFormKey); } catch { /* storage unavailable */ }
        if (!leftWhileSavingRef.current) navigate(`/builds/${postIdForPublish}`);
      }
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "投稿できませんでした");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(image: SimpleBuildImage) {
    if (!recordId || !window.confirm("この画像を削除しますか？")) return;
    try {
      await api.deleteSimpleBuildImage(imageKind, recordId, image.id);
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "画像を削除できませんでした");
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (!recordId || destination < 0 || destination >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setImages(reordered);
    try {
      await api.reorderSimpleBuildImages(imageKind, recordId, reordered.map((image) => image.id));
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "画像を並び替えられませんでした");
    }
  }

  const totalImages = images.length + pendingFiles.length;
  return <div className="page-stack compact-page"><section className="page-heading"><h1>{mode === "edit" ? "編成を編集" : mode === "draft" ? "下書きを編集" : "編成を作成"}</h1></section>
    <form className="panel simple-form" onSubmit={(event) => { event.preventDefault(); if (!saving) { if (pendingFiles.length) setConfirmAction("publish"); else void publish(); } }}>
      <label>タイトル{mode === "draft" ? <small>下書きでは未入力でも保存できます</small> : null}<input onChange={(event) => setTitle(event.target.value)} required={mode !== "draft"} value={title} /></label>
      <label>クエスト名<input onChange={(event) => setQuestName(event.target.value)} value={questName} /></label>
      <label>概要<textarea onChange={(event) => setOverview(event.target.value)} rows={5} value={overview} /></label>
      <label>補足<textarea onChange={(event) => setSupplementalNotes(event.target.value)} rows={6} value={supplementalNotes} /></label>
      <label>参考URL<input inputMode="url" onChange={(event) => setReferenceUrl(event.target.value)} type="url" value={referenceUrl} /></label>
      <section className="build-image-editor">
        <div className="section-heading"><div><h2>画像</h2><p>最大5枚・各5MB。JPEG、PNG、WebP</p></div></div>
        <ol className="image-order-guide">{imageLabels.map((label) => <li key={label}>{label}</li>)}</ol>
        {images.map((image, index) => <article className="build-image-row" key={image.id}><img alt="" src={image.publicUrl ?? ""} /><span>{imageLabels[index] ?? `画像${index + 1}`}</span><button aria-label="上へ移動" disabled={index === 0} onClick={() => void moveImage(index, -1)} type="button"><ArrowUp size={17} /></button><button aria-label="下へ移動" disabled={index === images.length - 1} onClick={() => void moveImage(index, 1)} type="button"><ArrowDown size={17} /></button><button aria-label="画像を削除" onClick={() => void removeImage(image)} type="button"><Trash2 size={17} /></button></article>)}
        {pendingFiles.map((file, index) => <article className="build-image-row pending" key={`${file.name}-${index}`}><ImagePlus size={28} /><span>{file.name}</span><button aria-label="選択を解除" onClick={() => setPendingFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 size={17} /></button></article>)}
        <label className={totalImages >= 5 ? "secondary-button disabled" : "secondary-button"}><ImagePlus size={18} />画像を選択<input accept="image/jpeg,image/png,image/webp" disabled={totalImages >= 5} multiple onChange={(event) => {
          const files = Array.from(event.target.files ?? []).slice(0, 5 - totalImages);
          setPendingFiles((current) => [...current, ...files]);
          event.target.value = "";
        }} type="file" /></label>
      </section>
      {confirmAction ? <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmAction(null); }}><section className="panel compact-dialog" role="dialog" aria-modal="true" aria-labelledby="build-upload-confirm-title"><h2 id="build-upload-confirm-title">画像をアップロードします</h2><p>選択した画像{pendingFiles.length}枚を保存します。処理が完了するまで、ページのリロード、タブを閉じる操作、別のページへの移動は行わないでください。</p><p>通信が中断されると、投稿データだけが保存されたり、画像が一部しか保存されなかったりする場合があります。</p><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setConfirmAction(null)}>戻る</button><button type="button" className="primary-button" onClick={() => { if (confirmAction === "save") void saveDraft(); else void publish(); }}>理解して{confirmAction === "save" ? "保存" : "投稿"}する</button></div></section></div> : null}
      {saving ? <div className="build-publish-progress" role="status" aria-live="polite"><LoaderCircle className="build-publish-spinner" size={20} aria-hidden="true" /><div><strong>処理中</strong><p>{savingStatus || "処理を実行しています…"}</p><small>ページを閉じると通信が中断されることがあります。</small></div></div> : null}
      {mode === "post" && recoveredPublish && !saving ? <div className="build-publish-recovery" role="status"><p>{recoveryMessage || "前回の投稿処理を確認しています…"}</p><button type="button" className="secondary-button" onClick={() => { if (recoveredPublish.postId) navigate(`/builds/${recoveredPublish.postId}/edit`); else navigate("/builds"); }}> {recoveredPublish.postId ? "作成済み投稿を確認" : "一覧で確認"} </button><button type="button" onClick={() => { storePublishState(null); setRecoveredPublish(null); setCreatedPostId(""); setRecoveryMessage(""); }}>確認済み</button></div> : null}
      {error ? <p className="form-error preserve-lines" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button className="secondary-button" onClick={() => { if (saving) leftWhileSavingRef.current = true; navigate(mode === "draft" ? "/builds/drafts" : "/builds"); }} type="button">{saving ? "一覧へ戻る" : "キャンセル"}</button>
        {mode !== "edit" ? <button className="secondary-button" disabled={saving} onClick={() => { if (pendingFiles.length) setConfirmAction("save"); else void saveDraft(); }} type="button">保存</button> : null}
        <button className="primary-button" disabled={saving || (mode === "post" && Boolean(recoveredPublish))} type="submit">{mode === "edit" ? "保存" : "投稿"}</button>
      </div>
    </form>
  </div>;
}
