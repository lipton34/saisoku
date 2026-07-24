import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type SimpleBuildFields, type SimpleBuildImage } from "../lib/api";

const imageLabels = ["1 キャラ編成", "2 武器編成", "3 召喚石編成", "補足1", "補足2"];

export function BuildEditorPage({ mode }: { mode: "post" | "draft" | "edit" }) {
  const { draftId = "", buildId = "" } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questName, setQuestName] = useState("");
  const [overview, setOverview] = useState("");
  const [supplementalNotes, setSupplementalNotes] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [images, setImages] = useState<SimpleBuildImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdDraftId, setCreatedDraftId] = useState("");
  const [createdPostId, setCreatedPostId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  function fields(): SimpleBuildFields {
    return { title, questName, overview, supplementalNotes, referenceUrl };
  }

  async function uploadFiles(kind: "posts" | "drafts", id: string) {
    const failures: string[] = [];
    for (const file of pendingFiles) {
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
    setSaving(true);
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
    }
  }

  async function publish() {
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
        const postIdForPublish = createdPostId || (await api.createSimpleBuildPost(fields())).post.id;
        setCreatedPostId(postIdForPublish);
        if (createdPostId) await api.updateSimpleBuildPost(postIdForPublish, fields());
        await uploadFiles("posts", postIdForPublish);
        navigate(`/builds/${postIdForPublish}`);
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
    <form className="panel simple-form" onSubmit={(event) => { event.preventDefault(); void publish(); }}>
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
      {error ? <p className="form-error preserve-lines" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button className="secondary-button" onClick={() => navigate(mode === "draft" ? "/builds/drafts" : "/builds")} type="button">キャンセル</button>
        {mode !== "edit" ? <button className="secondary-button" disabled={saving} onClick={() => void saveDraft()} type="button">保存</button> : null}
        <button className="primary-button" disabled={saving} type="submit">{mode === "edit" ? "保存" : "投稿"}</button>
      </div>
    </form>
  </div>;
}
