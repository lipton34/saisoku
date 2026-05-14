import { FormEvent, useEffect, useMemo, useState } from "react";
import { CopyPlus, FilePlus2, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { api, type BuildPost, type BuildPostInput, type BuildPreset, type BuildReferenceUrl } from "../lib/api";

const emptyForm: BuildPostInput = {
  title: "",
  category: "高難度攻略用",
  questName: "",
  element: "",
  purpose: "参考メモ",
  operationType: "未指定",
  verificationStatus: "未検証",
  overview: "",
  protagonistJob: "",
  characters: [],
  summons: [],
  weapons: [],
  requiredParts: [],
  recommendedParts: [],
  substitutableParts: [],
  freeSlots: [],
  substituteNotes: "",
  cautions: "",
  role: "",
  omenNotes: "",
  actionNotes: "",
  failurePoints: "",
  farmingGoal: "",
  raidRole: "",
  blueChest: "",
  clearTime: "",
  stability: "",
  prerequisites: "",
  weaponTarget: "",
  rescueTiming: "",
  farmingCautions: "",
  referenceUrls: [],
  sourcePresetId: null,
  sourcePresetName: null,
  changeMemo: null
};

const categoryOptions = ["高難度攻略用", "周回・武器集め用"];
const elementOptions = ["火", "水", "土", "風", "光", "闇"];
const operationOptions = ["手動", "フルオート", "セミオート", "未指定"];
const verificationOptions = ["未検証", "投稿者クリア済", "団内クリア済", "要調整"];
const highDifficultyPurposeOptions = ["団内挑戦", "団内練習", "個人練習", "ソロ挑戦", "クリア編成", "参考メモ"];
const farmingPurposeOptions = ["周回向け", "自発向け", "救援向け", "青箱狙い", "参考メモ"];

function toLines(items: string[]) {
  return items.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function refsToText(refs: BuildReferenceUrl[]) {
  return refs.map((ref) => [ref.type, ref.title, ref.url, ref.memo].join(" | ")).join("\n");
}

function refsFromText(value: string): BuildReferenceUrl[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length === 1) {
        return { type: "その他", title: parts[0], url: parts[0], memo: "" };
      }

      return {
        type: parts[0] || "その他",
        title: parts[1] || parts[2] || "参考URL",
        url: parts[2] || parts[1] || "",
        memo: parts[3] || ""
      };
    })
    .filter((ref) => ref.url);
}

function presetToForm(preset: BuildPreset): BuildPostInput {
  return {
    ...emptyForm,
    title: preset.name,
    category: preset.category,
    questName: preset.questName,
    element: preset.element,
    purpose: preset.purpose,
    operationType: preset.operationType,
    verificationStatus: preset.verificationStatus,
    overview: preset.overview,
    protagonistJob: preset.protagonistJob,
    characters: preset.characters,
    summons: preset.summons,
    weapons: preset.weapons,
    requiredParts: preset.requiredParts,
    recommendedParts: preset.recommendedParts,
    substitutableParts: preset.substitutableParts,
    freeSlots: preset.freeSlots,
    substituteNotes: preset.substituteNotes,
    cautions: preset.cautions,
    role: preset.role ?? "",
    omenNotes: preset.omenNotes ?? "",
    actionNotes: preset.actionNotes ?? "",
    failurePoints: preset.failurePoints ?? "",
    farmingGoal: preset.farmingGoal ?? "",
    raidRole: preset.raidRole ?? "",
    blueChest: preset.blueChest ?? "",
    clearTime: preset.clearTime ?? "",
    stability: preset.stability ?? "",
    prerequisites: preset.prerequisites ?? "",
    weaponTarget: preset.weaponTarget ?? "",
    rescueTiming: preset.rescueTiming ?? "",
    farmingCautions: preset.farmingCautions ?? "",
    referenceUrls: preset.referenceUrls,
    sourcePresetId: preset.id,
    sourcePresetName: preset.name,
    changeMemo: ""
  };
}

function postToForm(post: BuildPost): BuildPostInput {
  return {
    ...post,
    title: `${post.title} コピー`,
    sourcePresetId: post.sourcePresetId,
    sourcePresetName: post.sourcePresetName ?? post.title,
    changeMemo: post.changeMemo ?? ""
  };
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="muted-text">未入力</span>;
  }

  return <span>{items.slice(0, 3).join(" / ")}</span>;
}

export function BuildsPage() {
  const [presets, setPresets] = useState<BuildPreset[]>([]);
  const [posts, setPosts] = useState<BuildPost[]>([]);
  const [form, setForm] = useState<BuildPostInput>(emptyForm);
  const [referencesText, setReferencesText] = useState("");
  const [error, setError] = useState("");

  const purposeOptions = form.category === "周回・武器集め用" ? farmingPurposeOptions : highDifficultyPurposeOptions;

  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      return (
        preset.category === form.category &&
        (!form.questName || preset.questName === form.questName) &&
        (!form.element || preset.element === form.element)
      );
    });
  }, [form.category, form.element, form.questName, presets]);

  async function load() {
    try {
      const [presetData, postData] = await Promise.all([api.buildPresets(), api.buildPosts()]);
      setPresets(presetData.presets);
      setPosts(postData.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "編成メモの取得に失敗しました");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update<K extends keyof BuildPostInput>(key: K, value: BuildPostInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateLines(key: keyof BuildPostInput, value: string) {
    setForm((current) => ({ ...current, [key]: fromLines(value) }));
  }

  function applyPreset(preset: BuildPreset) {
    const next = presetToForm(preset);
    setForm(next);
    setReferencesText(refsToText(next.referenceUrls));
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setReferencesText("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const data = await api.createBuildPost({ ...form, referenceUrls: refsFromText(referencesText) });
      setPosts((current) => [data.post, ...current]);
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "編成メモの保存に失敗しました");
    }
  }

  async function deletePost(post: BuildPost) {
    await api.deleteBuildPost(post.id);
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  function copyPost(post: BuildPost) {
    const next = postToForm(post);
    setForm(next);
    setReferencesText(refsToText(post.referenceUrls));
    setError("");
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Build Presets</p>
          <h2>編成プリセット</h2>
          <p>プリセットを初期値として反映し、手持ちや団内運用に合わせて変更してから投稿します。</p>
        </div>
        <button className="primary-button" onClick={resetForm} type="button">
          <FilePlus2 size={18} />
          空フォーム
        </button>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="content-grid build-page-grid">
        <form className="panel task-form build-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Post</p>
              <h2>投稿フォーム</h2>
            </div>
            {form.sourcePresetName && <span className="pill">元プリセット: {form.sourcePresetName}</span>}
          </div>

          <label>
            編成タイトル
            <input onChange={(event) => update("title", event.target.value)} required value={form.title} />
          </label>

          <div className="form-row">
            <label>
              クエスト分類
              <select onChange={(event) => update("category", event.target.value)} value={form.category}>
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              属性
              <select onChange={(event) => update("element", event.target.value)} required value={form.element}>
                <option value="">選択</option>
                {elementOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              クエスト名
              <input onChange={(event) => update("questName", event.target.value)} required value={form.questName} />
            </label>
            <label>
              目的
              <select onChange={(event) => update("purpose", event.target.value)} value={form.purpose}>
                {purposeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              操作タイプ
              <select onChange={(event) => update("operationType", event.target.value)} value={form.operationType}>
                {operationOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              検証状態
              <select onChange={(event) => update("verificationStatus", event.target.value)} value={form.verificationStatus}>
                {verificationOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            概要メモ
            <textarea onChange={(event) => update("overview", event.target.value)} rows={3} value={form.overview ?? ""} />
          </label>

          <div className="form-row">
            <label>
              主人公ジョブ
              <input onChange={(event) => update("protagonistJob", event.target.value)} value={form.protagonistJob ?? ""} />
            </label>
            <label>
              変更メモ
              <input onChange={(event) => update("changeMemo", event.target.value)} value={form.changeMemo ?? ""} />
            </label>
          </div>

          <div className="form-row">
            <label>
              キャラ
              <textarea onChange={(event) => updateLines("characters", event.target.value)} rows={4} value={toLines(form.characters)} />
            </label>
            <label>
              召喚石
              <textarea onChange={(event) => updateLines("summons", event.target.value)} rows={4} value={toLines(form.summons)} />
            </label>
          </div>

          <label>
            武器
            <textarea onChange={(event) => updateLines("weapons", event.target.value)} rows={3} value={toLines(form.weapons)} />
          </label>

          <div className="form-row">
            <label>
              必須パーツ
              <textarea onChange={(event) => updateLines("requiredParts", event.target.value)} rows={3} value={toLines(form.requiredParts)} />
            </label>
            <label>
              推奨パーツ
              <textarea
                onChange={(event) => updateLines("recommendedParts", event.target.value)}
                rows={3}
                value={toLines(form.recommendedParts)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              代用可パーツ
              <textarea
                onChange={(event) => updateLines("substitutableParts", event.target.value)}
                rows={3}
                value={toLines(form.substitutableParts)}
              />
            </label>
            <label>
              自由枠
              <textarea onChange={(event) => updateLines("freeSlots", event.target.value)} rows={3} value={toLines(form.freeSlots)} />
            </label>
          </div>

          <div className="form-row">
            <label>
              代用候補
              <textarea onChange={(event) => update("substituteNotes", event.target.value)} rows={3} value={form.substituteNotes ?? ""} />
            </label>
            <label>
              注意点
              <textarea onChange={(event) => update("cautions", event.target.value)} rows={3} value={form.cautions ?? ""} />
            </label>
          </div>

          {form.category === "高難度攻略用" ? (
            <div className="template-block">
              <h3>高難度メモ</h3>
              <div className="form-row">
                <label>
                  役割
                  <input onChange={(event) => update("role", event.target.value)} value={form.role ?? ""} />
                </label>
                <label>
                  失敗ポイント
                  <input onChange={(event) => update("failurePoints", event.target.value)} value={form.failurePoints ?? ""} />
                </label>
              </div>
              <label>
                予兆対応
                <textarea onChange={(event) => update("omenNotes", event.target.value)} rows={3} value={form.omenNotes ?? ""} />
              </label>
              <label>
                行動メモ
                <textarea onChange={(event) => update("actionNotes", event.target.value)} rows={3} value={form.actionNotes ?? ""} />
              </label>
            </div>
          ) : (
            <div className="template-block">
              <h3>周回メモ</h3>
              <div className="form-row">
                <label>
                  周回目的
                  <input onChange={(event) => update("farmingGoal", event.target.value)} value={form.farmingGoal ?? ""} />
                </label>
                <label>
                  自発 / 救援
                  <input onChange={(event) => update("raidRole", event.target.value)} value={form.raidRole ?? ""} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  青箱狙い
                  <input onChange={(event) => update("blueChest", event.target.value)} value={form.blueChest ?? ""} />
                </label>
                <label>
                  討伐時間目安
                  <input onChange={(event) => update("clearTime", event.target.value)} value={form.clearTime ?? ""} />
                </label>
              </div>
              <label>
                周回時の注意点
                <textarea
                  onChange={(event) => update("farmingCautions", event.target.value)}
                  rows={3}
                  value={form.farmingCautions ?? ""}
                />
              </label>
            </div>
          )}

          <label>
            参考URL
            <textarea
              onChange={(event) => setReferencesText(event.target.value)}
              placeholder="種別 | タイトル | URL | メモ"
              rows={4}
              value={referencesText}
            />
          </label>

          <button className="primary-button" type="submit">
            <Plus size={18} />
            編成メモを投稿
          </button>
        </form>

        <aside className="build-side-stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Presets</p>
                <h2>候補</h2>
              </div>
            </div>
            <div className="build-preset-list">
              {filteredPresets.map((preset) => (
                <button className="build-preset-card" key={preset.id} onClick={() => applyPreset(preset)} type="button">
                  <strong>{preset.name}</strong>
                  <span className="tag-row">
                    <span className="pill">{preset.element}</span>
                    <span className="pill muted">{preset.operationType}</span>
                    <span className="pill muted">{preset.purpose}</span>
                  </span>
                  <small>{preset.verificationStatus} / {preset.presetStatus}</small>
                  <small>主要パーツ: {preset.requiredParts.slice(0, 3).join(" / ")}</small>
                  <small>参考: {preset.referenceUrls.map((ref) => ref.type).join(" / ") || "なし"}</small>
                  <small>更新: {preset.updatedAt}</small>
                </button>
              ))}
              {filteredPresets.length === 0 && <div className="empty-state">条件に合うプリセットはまだありません。</div>}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Posts</p>
                <h2>投稿済み</h2>
              </div>
            </div>
            <div className="build-post-list">
              {posts.map((post) => (
                <article className="build-post-card" key={post.id}>
                  <div className="material-goal-header">
                    <div>
                      <h3>{post.title}</h3>
                      <div className="task-meta">
                        <span>{post.questName}</span>
                        <span>{post.element}</span>
                        <span>{post.operationType}</span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button aria-label="この編成をコピーして新規投稿" className="icon-button" onClick={() => copyPost(post)} type="button">
                        <CopyPlus size={16} />
                      </button>
                      <button aria-label="編成メモを削除" className="icon-button danger" onClick={() => deletePost(post)} type="button">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {post.sourcePresetName && <p className="material-note">元プリセット: {post.sourcePresetName}</p>}
                  {post.changeMemo && <p className="material-note">変更メモ: {post.changeMemo}</p>}
                  <p className="material-note">主要パーツ: <CompactList items={post.requiredParts} /></p>
                  {post.referenceUrls.length > 0 && (
                    <div className="reference-list">
                      {post.referenceUrls.map((ref) => (
                        <a href={ref.url} key={`${post.id}-${ref.url}`} rel="noreferrer" target="_blank">
                          <LinkIcon size={14} />
                          {ref.title}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
              {posts.length === 0 && <div className="empty-state">投稿済みの編成メモはまだありません。</div>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
