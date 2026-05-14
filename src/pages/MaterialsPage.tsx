import { FormEvent, useEffect, useMemo, useState } from "react";
import { Boxes, CopyPlus, Plus, Save, Trash2 } from "lucide-react";
import { api, type MaterialGoal, type MaterialItem, type MaterialPreset } from "../lib/api";

function goalProgress(goal: MaterialGoal) {
  const required = goal.items.reduce((sum, item) => sum + item.requiredCount, 0);
  const owned = goal.items.reduce((sum, item) => sum + Math.min(item.ownedCount, item.requiredCount), 0);
  const percent = required > 0 ? Math.round((owned / required) * 100) : 0;
  return { owned, percent, required };
}

export function MaterialsPage() {
  const [goals, setGoals] = useState<MaterialGoal[]>([]);
  const [presets, setPresets] = useState<MaterialPreset[]>([]);
  const [title, setTitle] = useState("");
  const [questName, setQuestName] = useState("");
  const [note, setNote] = useState("");
  const [firstItemName, setFirstItemName] = useState("");
  const [firstRequiredCount, setFirstRequiredCount] = useState(1);
  const [firstOwnedCount, setFirstOwnedCount] = useState(0);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [newItems, setNewItems] = useState<Record<string, { name: string; requiredCount: number; ownedCount: number }>>({});
  const [error, setError] = useState("");

  async function loadGoals() {
    try {
      const data = await api.materialGoals();
      setGoals(data.goals);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "素材メモの取得に失敗しました");
    }
  }

  async function loadPresets() {
    try {
      const data = await api.materialPresets();
      setPresets(data.presets);
      setSelectedPresetId((current) => current || data.presets[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "プリセットの取得に失敗しました");
    }
  }

  useEffect(() => {
    void loadGoals();
    void loadPresets();
  }, []);

  const summary = useMemo(() => {
    return goals.reduce(
      (total, goal) => {
        const progress = goalProgress(goal);
        return {
          goals: total.goals + 1,
          required: total.required + progress.required,
          owned: total.owned + progress.owned
        };
      },
      { goals: 0, owned: 0, required: 0 }
    );
  }, [goals]);

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const data = await api.createMaterialGoal({
        title,
        questName,
        note,
        firstItemName,
        firstRequiredCount,
        firstOwnedCount
      });
      setGoals((current) => [data.goal, ...current]);
      setTitle("");
      setQuestName("");
      setNote("");
      setFirstItemName("");
      setFirstRequiredCount(1);
      setFirstOwnedCount(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "素材メモの登録に失敗しました");
    }
  }

  async function deleteGoal(goal: MaterialGoal) {
    await api.deleteMaterialGoal(goal.id);
    setGoals((current) => current.filter((item) => item.id !== goal.id));
  }

  async function applyPreset() {
    setError("");

    try {
      const data = await api.applyMaterialPreset(selectedPresetId, { title, questName, note });
      setGoals((current) => [data.goal, ...current]);
      setTitle("");
      setQuestName("");
      setNote("");
      setFirstItemName("");
      setFirstRequiredCount(1);
      setFirstOwnedCount(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "プリセットの適用に失敗しました");
    }
  }

  async function savePreset(goal: MaterialGoal) {
    setError("");

    try {
      const data = await api.createMaterialPresetFromGoal(goal.id);
      setPresets((current) => [data.preset, ...current]);
      setSelectedPresetId(data.preset.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "プリセットの保存に失敗しました");
    }
  }

  async function deletePreset(preset: MaterialPreset) {
    await api.deleteMaterialPreset(preset.id);
    setPresets((current) => current.filter((item) => item.id !== preset.id));
    setSelectedPresetId((current) => (current === preset.id ? "" : current));
  }

  async function addItem(goal: MaterialGoal) {
    const draft = newItems[goal.id] ?? { name: "", ownedCount: 0, requiredCount: 1 };
    setError("");

    try {
      const data = await api.createMaterialItem(goal.id, draft);
      setGoals((current) =>
        current.map((item) => (item.id === goal.id ? { ...item, items: [...item.items, data.item] } : item))
      );
      setNewItems((current) => ({ ...current, [goal.id]: { name: "", ownedCount: 0, requiredCount: 1 } }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "素材の追加に失敗しました");
    }
  }

  async function updateOwnedCount(goal: MaterialGoal, item: MaterialItem, ownedCount: number) {
    const data = await api.updateMaterialItem(goal.id, item.id, { ownedCount });
    setGoals((current) =>
      current.map((goalItem) =>
        goalItem.id === goal.id
          ? {
              ...goalItem,
              items: goalItem.items.map((material) => (material.id === item.id ? data.item : material))
            }
          : goalItem
      )
    );
  }

  async function deleteItem(goal: MaterialGoal, item: MaterialItem) {
    await api.deleteMaterialItem(goal.id, item.id);
    setGoals((current) =>
      current.map((goalItem) =>
        goalItem.id === goal.id
          ? { ...goalItem, items: goalItem.items.filter((material) => material.id !== item.id) }
          : goalItem
      )
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Materials</p>
          <h2>素材メモ</h2>
          <p>上限解放やイベント準備など、目的ごとに必要素材と残り数を追跡します。</p>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-tile">
          <span>目的</span>
          <strong>{summary.goals}</strong>
        </div>
        <div className="stat-tile">
          <span>所持合計</span>
          <strong>{summary.owned}</strong>
        </div>
        <div className="stat-tile">
          <span>必要合計</span>
          <strong>{summary.required}</strong>
        </div>
        <div className="stat-tile">
          <span>残り</span>
          <strong>{Math.max(summary.required - summary.owned, 0)}</strong>
        </div>
      </section>

      <section className="content-grid task-page-grid">
        <form className="panel task-form" onSubmit={handleCreateGoal}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">New Goal</p>
              <h2>登録</h2>
            </div>
            <Boxes size={22} />
          </div>

          <label>
            目的名
            <input onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>

          <div className="preset-panel">
            <div>
              <p className="eyebrow">Preset</p>
              <h3>プリセットから作成</h3>
            </div>
            <div className="preset-apply-row">
              <select onChange={(event) => setSelectedPresetId(event.target.value)} value={selectedPresetId}>
                <option value="">プリセットを選択</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <button className="primary-button" disabled={!selectedPresetId} onClick={applyPreset} type="button">
                <CopyPlus size={16} />
                作成
              </button>
            </div>
          </div>

          <label>
            素材名
            <input onChange={(event) => setFirstItemName(event.target.value)} required value={firstItemName} />
          </label>

          <div className="form-row">
            <label>
              必要数
              <input
                min={1}
                onChange={(event) => setFirstRequiredCount(Number(event.target.value))}
                type="number"
                value={firstRequiredCount}
              />
            </label>
            <label>
              所持数
              <input
                min={0}
                onChange={(event) => setFirstOwnedCount(Number(event.target.value))}
                type="number"
                value={firstOwnedCount}
              />
            </label>
          </div>

          <label>
            対象クエスト名
            <input onChange={(event) => setQuestName(event.target.value)} value={questName} />
          </label>
          <label>
            メモ
            <textarea onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit">
            <Plus size={18} />
            素材メモ追加
          </button>
        </form>

        <div className="panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Goals</p>
              <h2>確認</h2>
            </div>
          </div>

          <div className="preset-list">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Presets</p>
                <h3>素材集めプリセット</h3>
              </div>
            </div>
            {presets.length === 0 ? (
              <div className="empty-state">保存済みプリセットはまだありません。</div>
            ) : (
              <div className="preset-chip-list">
                {presets.map((preset) => (
                  <div className="preset-chip" key={preset.id}>
                    <button onClick={() => setSelectedPresetId(preset.id)} type="button">
                      <strong>{preset.name}</strong>
                      <span>{preset.items.length}素材</span>
                    </button>
                    <button aria-label="プリセットを削除" className="icon-button danger" onClick={() => deletePreset(preset)} type="button">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="material-goal-list">
            {goals.length === 0 ? (
              <div className="empty-state">素材メモはまだありません。</div>
            ) : (
              goals.map((goal) => {
                const progress = goalProgress(goal);
                const draft = newItems[goal.id] ?? { name: "", ownedCount: 0, requiredCount: 1 };

                return (
                  <article className="material-goal" key={goal.id}>
                    <div className="material-goal-header">
                      <div>
                        <div className="task-title-line">
                          <h3>{goal.title}</h3>
                          <span className="pill">{progress.percent}%</span>
                        </div>
                        <div className="task-meta">
                          {goal.questName && <span>対象: {goal.questName}</span>}
                          <span>
                            {progress.owned}/{progress.required}
                          </span>
                          <span>残り {Math.max(progress.required - progress.owned, 0)}</span>
                        </div>
                      </div>
                      <div className="task-actions">
                        <button aria-label="プリセットとして保存" className="icon-button" onClick={() => savePreset(goal)} type="button">
                          <Save size={16} />
                        </button>
                        <button aria-label="素材メモを削除" className="icon-button danger" onClick={() => deleteGoal(goal)} type="button">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="progress-bar" aria-label={`進捗 ${progress.percent}%`}>
                      <span style={{ width: `${progress.percent}%` }} />
                    </div>

                    {goal.note && <p className="material-note">{goal.note}</p>}

                    <div className="material-item-list">
                      {goal.items.map((item) => (
                        <div className="material-item" key={item.id}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {item.ownedCount}/{item.requiredCount}
                            </span>
                          </div>
                          <input
                            aria-label={`${item.name} の所持数`}
                            min={0}
                            onBlur={(event) => updateOwnedCount(goal, item, Number(event.target.value))}
                            type="number"
                            defaultValue={item.ownedCount}
                          />
                          <button aria-label="素材を削除" className="icon-button danger" onClick={() => deleteItem(goal, item)} type="button">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="material-add-row">
                      <input
                        aria-label="追加する素材名"
                        onChange={(event) =>
                          setNewItems((current) => ({ ...current, [goal.id]: { ...draft, name: event.target.value } }))
                        }
                        placeholder="素材名"
                        value={draft.name}
                      />
                      <input
                        aria-label="追加する素材の必要数"
                        min={1}
                        onChange={(event) =>
                          setNewItems((current) => ({
                            ...current,
                            [goal.id]: { ...draft, requiredCount: Number(event.target.value) }
                          }))
                        }
                        type="number"
                        value={draft.requiredCount}
                      />
                      <button className="primary-button" onClick={() => addItem(goal)} type="button">
                        <Plus size={16} />
                        追加
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
