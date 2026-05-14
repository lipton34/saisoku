import { FormEvent, useEffect, useMemo, useState } from "react";
import { CopyPlus, FilePlus2, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import {
  api,
  type BuildCharacterDetail,
  type BuildPost,
  type BuildPostInput,
  type BuildPreset,
  type BuildReferenceUrl,
  type BuildSummonDetail,
  type BuildWeaponDetail
} from "../lib/api";

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
  characterDetails: [],
  summonDetails: [],
  weaponDetails: [],
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
const questOptions = ["ルシゼロ", "天元HL", "天元HLフリークエスト", "ルシゼロ系フリークエスト", "ムゲンHL", "ディアスポラHL", "ジークフリートHL", "シエテHL", "コスモスHL", "アガスティアHL"];
const characterOptions = ["ハーゼリーラ", "ガブリエル", "ワムデュス", "サテュロス", "オクトー", "カイム", "パーシヴァル", "ミカエル", "ウィルナス"];
const summonOptions = ["ヴァルナ", "ティターン", "アグニス", "ベルゼバブ", "ヤチマ", "ルシフェル", "ゴッドガード・ブローディア", "サン"];
const weaponOptions = ["終末武器", "オメガ刀", "オメガ武器", "水属性の奥義寄せ武器", "火リミ武器", "極星器", "HPを確保できる武器"];
const importanceOptions = ["必須", "推奨", "代用可", "自由枠"];
const characterPositionOptions = ["フロント", "サブ", "任意"];
const summonPositionOptions = ["メイン", "フレンド", "サブ", "任意"];
const blueChestOptions = ["あり", "なし", "未指定"];
const stabilityOptions = ["安定", "たまに失敗", "要手動確認", "未指定"];
const prerequisiteOptions = ["マグナ", "神石", "どちらでも", "未指定"];
const referenceTypeOptions = ["攻略記事", "YouTube", "X", "note / ブログ", "その他"];

const emptyCharacterDetail: BuildCharacterDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  roleMemo: "",
  substituteMemo: ""
};

const emptySummonDetail: BuildSummonDetail = {
  position: "任意",
  name: "",
  importance: "自由枠",
  usageMemo: "",
  substituteMemo: ""
};

const emptyWeaponDetail: BuildWeaponDetail = {
  name: "",
  importance: "自由枠",
  count: "",
  usageMemo: "",
  substituteMemo: ""
};

const emptyReferenceUrl: BuildReferenceUrl = {
  type: "その他",
  title: "",
  url: "",
  memo: ""
};

function namesFromCharacters(items: BuildCharacterDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function namesFromSummons(items: BuildSummonDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function namesFromWeapons(items: BuildWeaponDetail[]) {
  return items.map((item) => item.name.trim()).filter(Boolean);
}

function toLines(items: string[]) {
  return items.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
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
    characterDetails: preset.characterDetails,
    summonDetails: preset.summonDetails,
    weaponDetails: preset.weaponDetails,
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

  function updateCharacter(index: number, value: Partial<BuildCharacterDetail>) {
    setForm((current) => {
      const characterDetails = current.characterDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...value } : item
      );
      return { ...current, characterDetails, characters: namesFromCharacters(characterDetails) };
    });
  }

  function updateSummon(index: number, value: Partial<BuildSummonDetail>) {
    setForm((current) => {
      const summonDetails = current.summonDetails.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item));
      return { ...current, summonDetails, summons: namesFromSummons(summonDetails) };
    });
  }

  function updateWeapon(index: number, value: Partial<BuildWeaponDetail>) {
    setForm((current) => {
      const weaponDetails = current.weaponDetails.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item));
      return { ...current, weaponDetails, weapons: namesFromWeapons(weaponDetails) };
    });
  }

  function updateReference(index: number, value: Partial<BuildReferenceUrl>) {
    setForm((current) => ({
      ...current,
      referenceUrls: current.referenceUrls.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item))
    }));
  }

  function addCharacter() {
    setForm((current) => ({ ...current, characterDetails: [...current.characterDetails, emptyCharacterDetail] }));
  }

  function addSummon() {
    setForm((current) => ({ ...current, summonDetails: [...current.summonDetails, emptySummonDetail] }));
  }

  function addWeapon() {
    setForm((current) => ({ ...current, weaponDetails: [...current.weaponDetails, emptyWeaponDetail] }));
  }

  function addReference() {
    setForm((current) => ({ ...current, referenceUrls: [...current.referenceUrls, emptyReferenceUrl] }));
  }

  function removeCharacter(index: number) {
    setForm((current) => {
      const characterDetails = current.characterDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, characterDetails, characters: namesFromCharacters(characterDetails) };
    });
  }

  function removeSummon(index: number) {
    setForm((current) => {
      const summonDetails = current.summonDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, summonDetails, summons: namesFromSummons(summonDetails) };
    });
  }

  function removeWeapon(index: number) {
    setForm((current) => {
      const weaponDetails = current.weaponDetails.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, weaponDetails, weapons: namesFromWeapons(weaponDetails) };
    });
  }

  function removeReference(index: number) {
    setForm((current) => ({
      ...current,
      referenceUrls: current.referenceUrls.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function applyPreset(preset: BuildPreset) {
    const next = presetToForm(preset);
    setForm(next);
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const data = await api.createBuildPost({
        ...form,
        characters: namesFromCharacters(form.characterDetails),
        summons: namesFromSummons(form.summonDetails),
        weapons: namesFromWeapons(form.weaponDetails),
        referenceUrls: form.referenceUrls.filter((ref) => ref.url.trim())
      });
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

      <datalist id="build-quest-options">
        {questOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-character-options">
        {characterOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-summon-options">
        {summonOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="build-weapon-options">
        {weaponOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

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
              <select
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                    purpose: event.target.value === "周回・武器集め用" ? "周回向け" : "参考メモ"
                  }))
                }
                value={form.category}
              >
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
              <input list="build-quest-options" onChange={(event) => update("questName", event.target.value)} required value={form.questName} />
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

          <div className="template-block">
            <div className="inline-section-heading">
              <h3>キャラ</h3>
              <button className="secondary-button" onClick={addCharacter} type="button">
                <Plus size={16} />
                追加
              </button>
            </div>
            <div className="build-detail-list">
              {form.characterDetails.map((character, index) => (
                <div className="build-detail-row character-row" key={`character-${index}`}>
                  <select
                    aria-label="配置"
                    onChange={(event) => updateCharacter(index, { position: event.target.value })}
                    value={character.position}
                  >
                    {characterPositionOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="キャラ名"
                    list="build-character-options"
                    onChange={(event) => updateCharacter(index, { name: event.target.value })}
                    placeholder="キャラ名"
                    value={character.name}
                  />
                  <select
                    aria-label="重要度"
                    onChange={(event) => updateCharacter(index, { importance: event.target.value })}
                    value={character.importance}
                  >
                    {importanceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="役割メモ"
                    onChange={(event) => updateCharacter(index, { roleMemo: event.target.value })}
                    placeholder="役割メモ"
                    value={character.roleMemo}
                  />
                  <input
                    aria-label="代用メモ"
                    onChange={(event) => updateCharacter(index, { substituteMemo: event.target.value })}
                    placeholder="代用メモ"
                    value={character.substituteMemo}
                  />
                  <button aria-label="キャラ行を削除" className="icon-button danger" onClick={() => removeCharacter(index)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.characterDetails.length === 0 && <div className="empty-state compact">候補から選ぶか、そのまま自由入力できます。</div>}
            </div>
          </div>

          <div className="template-block">
            <div className="inline-section-heading">
              <h3>召喚石</h3>
              <button className="secondary-button" onClick={addSummon} type="button">
                <Plus size={16} />
                追加
              </button>
            </div>
            <div className="build-detail-list">
              {form.summonDetails.map((summon, index) => (
                <div className="build-detail-row summon-row" key={`summon-${index}`}>
                  <select aria-label="配置" onChange={(event) => updateSummon(index, { position: event.target.value })} value={summon.position}>
                    {summonPositionOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="召喚石名"
                    list="build-summon-options"
                    onChange={(event) => updateSummon(index, { name: event.target.value })}
                    placeholder="召喚石名"
                    value={summon.name}
                  />
                  <select
                    aria-label="重要度"
                    onChange={(event) => updateSummon(index, { importance: event.target.value })}
                    value={summon.importance}
                  >
                    {importanceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="用途メモ"
                    onChange={(event) => updateSummon(index, { usageMemo: event.target.value })}
                    placeholder="用途メモ"
                    value={summon.usageMemo}
                  />
                  <input
                    aria-label="代用メモ"
                    onChange={(event) => updateSummon(index, { substituteMemo: event.target.value })}
                    placeholder="代用メモ"
                    value={summon.substituteMemo}
                  />
                  <button aria-label="召喚石行を削除" className="icon-button danger" onClick={() => removeSummon(index)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.summonDetails.length === 0 && <div className="empty-state compact">メイン、フレンド、サブなど必要な石だけ登録できます。</div>}
            </div>
          </div>

          <div className="template-block">
            <div className="inline-section-heading">
              <h3>武器</h3>
              <button className="secondary-button" onClick={addWeapon} type="button">
                <Plus size={16} />
                追加
              </button>
            </div>
            <div className="build-detail-list">
              {form.weaponDetails.map((weapon, index) => (
                <div className="build-detail-row weapon-row" key={`weapon-${index}`}>
                  <input
                    aria-label="武器名"
                    list="build-weapon-options"
                    onChange={(event) => updateWeapon(index, { name: event.target.value })}
                    placeholder="武器名"
                    value={weapon.name}
                  />
                  <select
                    aria-label="重要度"
                    onChange={(event) => updateWeapon(index, { importance: event.target.value })}
                    value={weapon.importance}
                  >
                    {importanceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="本数"
                    onChange={(event) => updateWeapon(index, { count: event.target.value })}
                    placeholder="本数"
                    value={weapon.count}
                  />
                  <input
                    aria-label="用途メモ"
                    onChange={(event) => updateWeapon(index, { usageMemo: event.target.value })}
                    placeholder="用途メモ"
                    value={weapon.usageMemo}
                  />
                  <input
                    aria-label="代用メモ"
                    onChange={(event) => updateWeapon(index, { substituteMemo: event.target.value })}
                    placeholder="代用メモ"
                    value={weapon.substituteMemo}
                  />
                  <button aria-label="武器行を削除" className="icon-button danger" onClick={() => removeWeapon(index)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.weaponDetails.length === 0 && <div className="empty-state compact">10枠すべてではなく、重要武器だけ登録できます。</div>}
            </div>
          </div>

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
                  <textarea onChange={(event) => update("failurePoints", event.target.value)} rows={2} value={form.failurePoints ?? ""} />
                </label>
              </div>
              <label>
                予兆対応
                <textarea onChange={(event) => update("omenNotes", event.target.value)} rows={3} value={form.omenNotes ?? ""} />
              </label>
              <label>
                行動メモ
                <textarea
                  onChange={(event) => update("actionNotes", event.target.value)}
                  placeholder={"開幕\n100〜80%\n80〜60%\n60〜20%\n20〜0%\n予兆対応\n失敗ポイント\nその他メモ"}
                  rows={7}
                  value={form.actionNotes ?? ""}
                />
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
                  <select onChange={(event) => update("raidRole", event.target.value)} value={form.raidRole ?? ""}>
                    <option value="">未指定</option>
                    <option>自発</option>
                    <option>救援</option>
                    <option>どちらでも</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  青箱狙い
                  <select onChange={(event) => update("blueChest", event.target.value)} value={form.blueChest ?? ""}>
                    <option value="">未指定</option>
                    {blueChestOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  討伐時間目安
                  <input onChange={(event) => update("clearTime", event.target.value)} value={form.clearTime ?? ""} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  安定度
                  <select onChange={(event) => update("stability", event.target.value)} value={form.stability ?? ""}>
                    <option value="">未指定</option>
                    {stabilityOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  編成前提
                  <select onChange={(event) => update("prerequisites", event.target.value)} value={form.prerequisites ?? ""}>
                    <option value="">未指定</option>
                    {prerequisiteOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  武器集め対象
                  <input onChange={(event) => update("weaponTarget", event.target.value)} value={form.weaponTarget ?? ""} />
                </label>
                <label>
                  救援タイミングメモ
                  <input onChange={(event) => update("rescueTiming", event.target.value)} value={form.rescueTiming ?? ""} />
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

          <div className="template-block">
            <div className="inline-section-heading">
              <h3>参考URL</h3>
              <button className="secondary-button" onClick={addReference} type="button">
                <Plus size={16} />
                追加
              </button>
            </div>
            <div className="build-detail-list">
              {form.referenceUrls.map((ref, index) => (
                <div className="build-detail-row reference-row" key={`reference-${index}`}>
                  <select aria-label="URL種別" onChange={(event) => updateReference(index, { type: event.target.value })} value={ref.type}>
                    {referenceTypeOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    aria-label="URLタイトル"
                    onChange={(event) => updateReference(index, { title: event.target.value })}
                    placeholder="タイトル"
                    value={ref.title}
                  />
                  <input
                    aria-label="URL"
                    onChange={(event) => updateReference(index, { url: event.target.value })}
                    placeholder="https://..."
                    type="url"
                    value={ref.url}
                  />
                  <input
                    aria-label="URLメモ"
                    onChange={(event) => updateReference(index, { memo: event.target.value })}
                    placeholder="見る場所や要点"
                    value={ref.memo}
                  />
                  <button aria-label="参考URL行を削除" className="icon-button danger" onClick={() => removeReference(index)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.referenceUrls.length === 0 && <div className="empty-state compact">外部本文は保存せず、URLと団内向けメモだけ登録します。</div>}
            </div>
          </div>

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
