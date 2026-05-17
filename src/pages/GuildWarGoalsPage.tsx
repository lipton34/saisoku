import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calculator, RotateCcw, Save, Trophy } from "lucide-react";
import {
  api,
  type GuildWarBossMaster,
  type GuildWarBossSpeed,
  type GuildWarGoalDay,
  type GuildWarGoalPlan
} from "../lib/api";

type DayDraft = {
  dayLabel: string;
  targetContribution: string;
  currentContribution: string;
  sortOrder: number;
  memo: string;
};

type SpeedDraft = {
  bossLevel: number;
  minutes: string;
  seconds: string;
  playStyle: string;
  memo: string;
};

const playStyles = ["未指定", "手動", "フルオート", "セミオート"];

const allowedBossLevelsByDay: Record<string, number[]> = {
  "予選1日目": [90, 95],
  "予選2日目": [90, 95],
  インターバル: [90, 95],
  "本戦1日目": [90, 95, 100, 150],
  "本戦2日目": [90, 95, 100, 150, 200],
  "本戦3日目": [90, 95, 100, 150, 200, 250],
  "本戦4日目": [90, 95, 100, 150, 200, 250]
};

function sanitizeContribution(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized.replace(/^0+(?=\d)/, "");
}

function contributionToBigInt(value: string) {
  const normalized = sanitizeContribution(value);
  return normalized ? BigInt(normalized) : 0n;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("ja-JP");
}

function formatBigInt(value: bigint) {
  return value.toLocaleString("ja-JP");
}

function formatSeconds(value: number) {
  if (value <= 0 || !Number.isFinite(value)) {
    return "未計算";
  }

  const seconds = Math.floor(value % 60);
  const minutes = Math.floor(value / 60);
  return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
}

function formatDuration(seconds: bigint) {
  if (seconds <= 0n) {
    return "未計算";
  }

  const hours = seconds / 3600n;
  const minutes = (seconds % 3600n) / 60n;
  const restSeconds = seconds % 60n;

  if (hours > 0n) {
    return `${hours.toString()}時間${minutes.toString().padStart(2, "0")}分`;
  }

  return `${minutes.toString()}分${restSeconds.toString().padStart(2, "0")}秒`;
}

function requiredRuns(targetContribution: bigint, bossContribution: bigint) {
  if (targetContribution <= 0n || bossContribution <= 0n) {
    return 0n;
  }

  return (targetContribution + bossContribution - 1n) / bossContribution;
}

function remainingContribution(day: DayDraft) {
  const target = contributionToBigInt(day.targetContribution);
  const current = contributionToBigInt(day.currentContribution);
  return target > current ? target - current : 0n;
}

function speedSeconds(speed?: SpeedDraft) {
  if (!speed) {
    return null;
  }

  const minutes = Number(speed.minutes || 0);
  const seconds = Number(speed.seconds || 0);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }

  const total = Math.max(0, Math.floor(minutes)) * 60 + Math.max(0, Math.floor(seconds));
  return total > 0 ? total : null;
}

function speedDraftFromApi(boss: GuildWarBossMaster, speeds: GuildWarBossSpeed[]): SpeedDraft {
  const saved = speeds.find((speed) => speed.bossLevel === boss.bossLevel);
  const clearTimeSeconds = saved?.clearTimeSeconds ?? null;

  return {
    bossLevel: boss.bossLevel,
    minutes: clearTimeSeconds ? String(Math.floor(clearTimeSeconds / 60)) : "",
    seconds: clearTimeSeconds ? String(clearTimeSeconds % 60).padStart(2, "0") : "",
    playStyle: saved?.playStyle || "未指定",
    memo: saved?.memo ?? ""
  };
}

function dayDraftFromApi(day: GuildWarGoalDay): DayDraft {
  return {
    dayLabel: day.dayLabel,
    targetContribution: day.targetContribution === "0" ? "" : day.targetContribution,
    currentContribution: day.currentContribution === "0" ? "" : day.currentContribution,
    sortOrder: day.sortOrder,
    memo: day.memo ?? ""
  };
}

export function GuildWarGoalsPage() {
  const [planId, setPlanId] = useState("");
  const [title, setTitle] = useState("古戦場目標");
  const [targetContribution, setTargetContribution] = useState("");
  const [memo, setMemo] = useState("");
  const [days, setDays] = useState<DayDraft[]>([]);
  const [bosses, setBosses] = useState<GuildWarBossMaster[]>([]);
  const [speeds, setSpeeds] = useState<Record<number, SpeedDraft>>({});
  const [activeDaySortOrder, setActiveDaySortOrder] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function applyPlan(data: { plan: GuildWarGoalPlan; bossMasters: GuildWarBossMaster[] }) {
    setPlanId(data.plan.id);
    setTitle(data.plan.title);
    setTargetContribution(data.plan.targetContribution === "0" ? "" : data.plan.targetContribution);
    setMemo(data.plan.memo ?? "");
    setDays(data.plan.days.map(dayDraftFromApi));
    setActiveDaySortOrder((current) =>
      data.plan.days.some((day) => day.sortOrder === current) ? current : data.plan.days[0]?.sortOrder ?? 1
    );
    setBosses(data.bossMasters);
    setSpeeds(
      Object.fromEntries(
        data.bossMasters.map((boss) => [boss.bossLevel, speedDraftFromApi(boss, data.plan.speeds)])
      ) as Record<number, SpeedDraft>
    );
  }

  async function loadPlan() {
    try {
      const data = await api.guildWarGoalPlan();
      applyPlan(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "古戦場目標の取得に失敗しました");
    }
  }

  useEffect(() => {
    void loadPlan();
  }, []);

  const bossByLevel = useMemo(() => new Map(bosses.map((boss) => [boss.bossLevel, boss])), [bosses]);

  const dayTargetTotal = useMemo(() => {
    return days.reduce((sum, day) => sum + contributionToBigInt(day.targetContribution), 0n);
  }, [days]);

  const totalTarget = contributionToBigInt(targetContribution);
  const targetDifference = totalTarget - dayTargetTotal;
  const activeDay = days.find((day) => day.sortOrder === activeDaySortOrder) ?? days[0] ?? null;
  const activeDayTarget = activeDay ? contributionToBigInt(activeDay.targetContribution) : 0n;
  const activeDayCurrent = activeDay ? contributionToBigInt(activeDay.currentContribution) : 0n;
  const activeDayRemaining = activeDay ? remainingContribution(activeDay) : 0n;
  const activeAllowedBossLevels = activeDay
    ? (allowedBossLevelsByDay[activeDay.dayLabel] ?? bosses.map((boss) => boss.bossLevel))
    : [];
  const activeBosses = bosses.filter((boss) => activeAllowedBossLevels.includes(boss.bossLevel));

  const efficiencyRows = useMemo(() => {
    return bosses
      .map((boss) => {
        const seconds = speedSeconds(speeds[boss.bossLevel]);
        if (!seconds) {
          return null;
        }

        const contribution = Number(boss.contribution);
        const contributionPerMinute = (contribution / seconds) * 60;
        return {
          boss,
          speed: speeds[boss.bossLevel],
          seconds,
          contributionPerMinute,
          contributionPerHour: contributionPerMinute * 60
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.contributionPerMinute - a.contributionPerMinute);
  }, [bosses, speeds]);

  const breakEvenRows = [
    { base: 150, compare: 200 },
    { base: 150, compare: 250 },
    { base: 200, compare: 250 }
  ].map((row) => {
    const baseBoss = bossByLevel.get(row.base);
    const compareBoss = bossByLevel.get(row.compare);
    const baseSeconds = speedSeconds(speeds[row.base]);
    if (!baseBoss || !compareBoss || !baseSeconds) {
      return { ...row, baseBoss, compareBoss, breakEvenSeconds: null };
    }

    return {
      ...row,
      baseBoss,
      compareBoss,
      breakEvenSeconds: Math.floor((baseSeconds * Number(compareBoss.contribution)) / Number(baseBoss.contribution))
    };
  });

  async function savePlan(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const data = await api.saveGuildWarGoalPlan({
        title,
        targetContribution: sanitizeContribution(targetContribution),
        memo,
        days: days.map((day) => ({
          dayLabel: day.dayLabel,
          targetContribution: sanitizeContribution(day.targetContribution),
          currentContribution: sanitizeContribution(day.currentContribution),
          sortOrder: day.sortOrder,
          memo: day.memo
        })),
        speeds: bosses.map((boss) => ({
          bossLevel: boss.bossLevel,
          clearTimeSeconds: speedSeconds(speeds[boss.bossLevel]),
          playStyle: speeds[boss.bossLevel]?.playStyle || "未指定",
          memo: speeds[boss.bossLevel]?.memo || ""
        }))
      });
      applyPlan(data);
      setNotice("古戦場目標を保存しました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "古戦場目標の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetPlan() {
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const data = await api.resetGuildWarGoalPlan();
      applyPlan(data);
      setNotice("全体目標貢献度、メモ、日程別の現在貢献度をリセットしました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "古戦場目標の初期化に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  function updateSpeed(bossLevel: number, patch: Partial<SpeedDraft>) {
    setSpeeds((current) => ({
      ...current,
      [bossLevel]: {
        ...(current[bossLevel] ?? { bossLevel, minutes: "", seconds: "", playStyle: "未指定", memo: "" }),
        ...patch
      }
    }));
  }

  return (
    <div className="page-stack guild-war-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Guild War</p>
          <h2>古戦場目標計算</h2>
          <p>日程別の貢献度目標から、必要討伐数・肉数・250専用素材・討伐時間を見積もります。</p>
        </div>
      </section>

      <section className="stat-grid guild-war-stat-grid">
        <div className="stat-tile">
          <span>全体目標</span>
          <strong>{formatBigInt(totalTarget)}</strong>
        </div>
        <div className="stat-tile">
          <span>日程別合計</span>
          <strong>{formatBigInt(dayTargetTotal)}</strong>
        </div>
        <div className={targetDifference === 0n ? "stat-tile" : "stat-tile warning-tile"}>
          <span>差分</span>
          <strong>{targetDifference < 0n ? "-" : ""}{formatBigInt(targetDifference < 0n ? -targetDifference : targetDifference)}</strong>
        </div>
        <div className="stat-tile">
          <span>入力済み速度</span>
          <strong>{efficiencyRows.length}</strong>
        </div>
      </section>

      {(error || notice) && (
        <section>
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}
        </section>
      )}

      <form className="guild-war-form" onSubmit={savePlan}>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Plan</p>
              <h2>全体目標</h2>
            </div>
            <Calculator size={22} />
          </div>
          <div className="form-row">
            <label>
              タイトル
              <input onChange={(event) => setTitle(event.target.value)} value={title} />
            </label>
            <label>
              全体目標貢献度
              <input
                inputMode="numeric"
                onChange={(event) => setTargetContribution(sanitizeContribution(event.target.value))}
                placeholder="15000000000"
                value={targetContribution}
              />
            </label>
          </div>
          <label>
            メモ
            <textarea onChange={(event) => setMemo(event.target.value)} rows={3} value={memo} />
          </label>
          <div className="button-row">
            <button className="primary-button" disabled={isSaving} type="submit">
              <Save size={18} />
              保存
            </button>
            <button className="secondary-button" disabled={isSaving || !planId} onClick={resetPlan} type="button">
              <RotateCcw size={18} />
              リセット
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily Targets</p>
              <h2>日程別目標</h2>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table guild-war-day-table">
              <thead>
                <tr>
                  <th>日程</th>
                  <th>目標貢献度</th>
                  <th>現在貢献度</th>
                  <th>日別メモ</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, index) => (
                  <tr key={day.sortOrder}>
                    <td>{day.dayLabel}</td>
                    <td>
                      <input
                        inputMode="numeric"
                        onChange={(event) =>
                          setDays((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, targetContribution: sanitizeContribution(event.target.value) }
                                : item
                            )
                          )
                        }
                        value={day.targetContribution}
                      />
                    </td>
                    <td>
                      <input
                        inputMode="numeric"
                        onChange={(event) =>
                          setDays((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, currentContribution: sanitizeContribution(event.target.value) }
                                : item
                            )
                          )
                        }
                        value={day.currentContribution}
                      />
                    </td>
                    <td>
                      <input
                        onChange={(event) =>
                          setDays((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, memo: event.target.value } : item
                            )
                          )
                        }
                        value={day.memo}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={targetDifference === 0n ? "guild-war-diff" : "guild-war-diff warning"}>
            日別合計 {formatBigInt(dayTargetTotal)} / 全体目標との差分{" "}
            {targetDifference < 0n ? "-" : ""}{formatBigInt(targetDifference < 0n ? -targetDifference : targetDifference)}
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Clear Speed</p>
              <h2>討伐速度</h2>
            </div>
          </div>
          <div className="speed-grid">
            {bosses.map((boss) => {
              const draft = speeds[boss.bossLevel] ?? {
                bossLevel: boss.bossLevel,
                minutes: "",
                seconds: "",
                playStyle: "未指定",
                memo: ""
              };
              return (
                <div className="speed-card" key={boss.bossLevel}>
                  <div>
                    <strong>{boss.name}</strong>
                    <span>
                      {Number(boss.contribution).toLocaleString("ja-JP")}貢献度 / 通常肉{boss.meatCost} / 専用素材
                      {boss.specialMeatCost}
                    </span>
                  </div>
                  <div className="time-input-row">
                    <label>
                      分
                      <input
                        min={0}
                        onChange={(event) => updateSpeed(boss.bossLevel, { minutes: event.target.value })}
                        type="number"
                        value={draft.minutes}
                      />
                    </label>
                    <label>
                      秒
                      <input
                        min={0}
                        max={59}
                        onChange={(event) => updateSpeed(boss.bossLevel, { seconds: event.target.value })}
                        type="number"
                        value={draft.seconds}
                      />
                    </label>
                  </div>
                  <label>
                    操作タイプ
                    <select
                      onChange={(event) => updateSpeed(boss.bossLevel, { playStyle: event.target.value })}
                      value={draft.playStyle}
                    >
                      {playStyles.map((playStyle) => (
                        <option key={playStyle} value={playStyle}>
                          {playStyle}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    メモ
                    <input onChange={(event) => updateSpeed(boss.bossLevel, { memo: event.target.value })} value={draft.memo} />
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      </form>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Result</p>
            <h2>日程別の計算結果</h2>
          </div>
        </div>
        <div className="guild-war-tabs" role="tablist" aria-label="日程を選択">
          {days.map((day) => (
            <button
              aria-selected={day.sortOrder === activeDaySortOrder}
              className={day.sortOrder === activeDaySortOrder ? "active" : ""}
              key={day.sortOrder}
              onClick={() => setActiveDaySortOrder(day.sortOrder)}
              role="tab"
              type="button"
            >
              {day.dayLabel}
            </button>
          ))}
        </div>
        {activeDay && (
          <>
            <div className="active-day-summary">
              <div>
                <span>日程</span>
                <strong>{activeDay.dayLabel}</strong>
              </div>
              <div>
                <span>日程別目標貢献度</span>
                <strong>{formatBigInt(activeDayTarget)}</strong>
              </div>
              <div>
                <span>現在貢献度</span>
                <strong>{formatBigInt(activeDayCurrent)}</strong>
              </div>
              <div>
                <span>残り目標貢献度</span>
                <strong>{formatBigInt(activeDayRemaining)}</strong>
              </div>
              <div>
                <span>使用可能HELL</span>
                <strong>{activeBosses.map((boss) => boss.name).join(" / ") || "未設定"}</strong>
              </div>
            </div>
            {activeAllowedBossLevels.includes(250) && (
              <p className="form-notice">
                250HELLは本戦3日目以降の想定で表示しています。実際の解禁には団内での200HELL討伐数などの条件があります。
              </p>
            )}
          </>
        )}
        <div className="table-scroll">
          <table className="data-table guild-war-result-table">
            <thead>
              <tr>
                <th>日程</th>
                <th>目標貢献度</th>
                <th>現在貢献度</th>
                <th>残り目標貢献度</th>
                <th>使用可能HELL</th>
                <th>難易度</th>
                <th>必要討伐数</th>
                <th>必要通常肉数</th>
                <th>必要250専用素材数</th>
                <th>入力済み討伐時間</th>
                <th>必要総討伐時間</th>
                <th>貢献度/分</th>
                <th>貢献度/時</th>
              </tr>
            </thead>
            <tbody>
              {activeDay ? (
                activeBosses.map((boss) => {
                  const bossContribution = BigInt(boss.contribution);
                  const runs = requiredRuns(activeDayRemaining, bossContribution);
                  const seconds = speedSeconds(speeds[boss.bossLevel]);
                  const contributionPerMinute = seconds ? (Number(boss.contribution) / seconds) * 60 : null;
                  return (
                    <tr key={`${activeDay.sortOrder}-${boss.bossLevel}`}>
                      <td>{activeDay.dayLabel}</td>
                      <td>{formatBigInt(activeDayTarget)}</td>
                      <td>{formatBigInt(activeDayCurrent)}</td>
                      <td>{formatBigInt(activeDayRemaining)}</td>
                      <td>{activeBosses.map((allowedBoss) => allowedBoss.name).join(" / ")}</td>
                      <td>{boss.name}</td>
                      <td>{formatBigInt(runs)}</td>
                      <td>{formatBigInt(runs * BigInt(boss.meatCost))}</td>
                      <td>{formatBigInt(runs * BigInt(boss.specialMeatCost))}</td>
                      <td>{seconds ? formatSeconds(seconds) : "未入力"}</td>
                      <td>{seconds ? formatDuration(runs * BigInt(seconds)) : "未計算"}</td>
                      <td>{contributionPerMinute ? formatNumber(contributionPerMinute) : "未計算"}</td>
                      <td>{contributionPerMinute ? formatNumber(contributionPerMinute * 60) : "未計算"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13}>日程データを読み込み中です。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-grid guild-war-analysis-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ranking</p>
              <h2>時間効率ランキング</h2>
            </div>
            <Trophy size={22} />
          </div>
          {efficiencyRows.length === 0 ? (
            <div className="empty-state">討伐時間が入力されているHELLはまだありません。</div>
          ) : (
            <div className="ranking-list">
              {efficiencyRows.map((row, index) => (
                <div className={index === 0 ? "ranking-row top" : "ranking-row"} key={row.boss.bossLevel}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{row.boss.name}</strong>
                    <small>
                      {formatSeconds(row.seconds)} / {row.speed.playStyle}
                      {row.speed.memo ? ` / ${row.speed.memo}` : ""}
                    </small>
                  </div>
                  <div>
                    <strong>{formatNumber(row.contributionPerMinute)}</strong>
                    <small>貢献度/分</small>
                  </div>
                  <div>
                    <strong>{formatNumber(row.contributionPerHour)}</strong>
                    <small>貢献度/時</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Break-even</p>
              <h2>損益分岐</h2>
            </div>
          </div>
          <div className="break-even-list">
            {breakEvenRows.map((row) => (
              <div className="break-even-row" key={`${row.base}-${row.compare}`}>
                <strong>
                  {row.baseBoss?.name ?? `${row.base}HELL`} → {row.compareBoss?.name ?? `${row.compare}HELL`}
                </strong>
                <span>
                  {row.breakEvenSeconds === null
                    ? "未計算"
                    : `${row.baseBoss?.name}が${formatSeconds(speedSeconds(speeds[row.base]) ?? 0)}の場合、${row.compareBoss?.name}は${formatSeconds(row.breakEvenSeconds)}以内なら上回ります。`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel guild-war-notes">
        <p>計算結果は「残り目標貢献度」を基準にしています。</p>
        <p>現在貢献度が目標を超えている場合、残り目標は0として扱います。</p>
        <p>時間効率は入力された討伐時間のみで計算しています。</p>
        <p>肉集め時間、救援待ち時間、リザルト操作時間、失敗率は含みません。</p>
        <p>250HELLは本戦3日目以降の想定で表示しています。</p>
        <p>250HELLは通常肉ではなく専用素材で計算しています。</p>
        <p>250HELLの実際の解禁には、団内での200HELL討伐数などの条件があります。</p>
      </section>
    </div>
  );
}
