import { Router, type Request } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import { parseOptionalText } from "../lib/sparkSavings.js";

const router = Router();
router.use(requireAuth);
const include = { availabilityPeriod: true, goalLinks: { include: { goal: { select: { id: true, title: true, visibility: true } } }, orderBy: { sortOrder: "asc" as const } }, buildLinks: { include: { buildPost: { select: { id: true, title: true } } }, orderBy: { sortOrder: "asc" as const } } };

function userId(req: Request) { return req.user?.id ?? ""; }
function integer(value: unknown, min: number, max: number, label: string) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${label}は${min}～${max}で入力してください`);
  return parsed;
}
function ids(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))] : []; }
async function parse(req: Request) {
  const body = req.body as Record<string, unknown>;
  const itemType = String(body.itemType ?? "");
  if (!['character', 'summon', 'weapon'].includes(itemType)) throw new Error("種類を確認してください");
  const name = parseOptionalText(body.name, "名前", 100); if (!name) throw new Error("名前を入力してください");
  const desiredCount = integer(body.desiredCount, 1, 999, "設定数"); const ownedCount = integer(body.ownedCount, 0, 999, "所持数");
  const masterItemId = typeof body.masterItemId === "string" && body.masterItemId ? body.masterItemId : null;
  if (masterItemId) { const master = await prisma.gbfMasterItem.findUnique({ where: { id: masterItemId }, select: { kind: true } }); if (!master || master.kind !== itemType) throw new Error("選択したマスターが種類と一致しません"); }
  const availabilityPeriodId = typeof body.availabilityPeriodId === "string" && body.availabilityPeriodId ? body.availabilityPeriodId : null;
  if (availabilityPeriodId && !(await prisma.sparkAvailabilityPeriod.findUnique({ where: { id: availabilityPeriodId } }))) throw new Error("排出時期を確認してください");
  const goalIds = ids(body.goalIds); const buildPostIds = ids(body.buildPostIds); const ownerId = userId(req);
  const visibleGoals = await prisma.goal.findMany({ where: { id: { in: goalIds }, sourceRoundGoalId: null, sourceProgressGoalId: null, OR: [{ ownerId }, { visibility: "crew" }] }, select: { id: true } });
  if (visibleGoals.length !== goalIds.length) throw new Error("参照できない目標が含まれています");
  const builds = await prisma.buildPost.count({ where: { id: { in: buildPostIds } } }); if (builds !== buildPostIds.length) throw new Error("参照できない編成が含まれています");
  return { data: { itemType, name, desiredCount, ownedCount, masterItemId, availabilityPeriodId, note: parseOptionalText(body.note, "メモ", 500), sortOrder: integer(body.sortOrder ?? 0, 0, 999999, "並び順") }, goalIds, buildPostIds };
}

router.get("/", async (req, res, next) => { try { const showCompleted = req.query.showCompleted === "true"; const allTargets = await prisma.sparkTarget.findMany({ where: { ownerId: userId(req) }, include, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }); const targets = showCompleted ? allTargets : allTargets.filter((target) => target.ownedCount < target.desiredCount); res.json({ targets }); } catch (error) { next(error); } });
router.get("/options", async (req, res, next) => { try { const ownerId = userId(req); const [periods, goals, builds] = await Promise.all([prisma.sparkAvailabilityPeriod.findMany({ where: { isActive: true }, orderBy: { displayLabel: "asc" } }), prisma.goal.findMany({ where: { sourceRoundGoalId: null, sourceProgressGoalId: null, OR: [{ ownerId }, { visibility: "crew" }] }, select: { id: true, title: true, visibility: true }, orderBy: { updatedAt: "desc" } }), prisma.buildPost.findMany({ select: { id: true, title: true }, orderBy: { updatedAt: "desc" } })]); res.json({ periods, goals, builds }); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { const parsed = await parse(req); const target = await prisma.sparkTarget.create({ data: { ...parsed.data, ownerId: userId(req), goalLinks: { create: parsed.goalIds.map((goalId, sortOrder) => ({ goalId, sortOrder })) }, buildLinks: { create: parsed.buildPostIds.map((buildPostId, sortOrder) => ({ buildPostId, sortOrder })) } }, include }); res.status(201).json({ target, message: "狙い目を登録しました。" }); } catch (error) { if (error instanceof Error) { res.status(400).json({ message: error.message }); return; } next(error); } });
router.put("/:id", async (req, res, next) => { try { const existing = await prisma.sparkTarget.findFirst({ where: { id: req.params.id, ownerId: userId(req) } }); if (!existing) { res.status(404).json({ message: "狙い目が見つかりません" }); return; } const parsed = await parse(req); const target = await prisma.$transaction(async (tx) => { await tx.sparkTargetGoalLink.deleteMany({ where: { targetId: existing.id } }); await tx.sparkTargetBuildLink.deleteMany({ where: { targetId: existing.id } }); return tx.sparkTarget.update({ where: { id: existing.id }, data: { ...parsed.data, goalLinks: { create: parsed.goalIds.map((goalId, sortOrder) => ({ goalId, sortOrder })) }, buildLinks: { create: parsed.buildPostIds.map((buildPostId, sortOrder) => ({ buildPostId, sortOrder })) } }, include }); }); res.json({ target, message: "狙い目を更新しました。" }); } catch (error) { if (error instanceof Error) { res.status(400).json({ message: error.message }); return; } next(error); } });
router.delete("/:id", async (req, res, next) => { try { const result = await prisma.sparkTarget.deleteMany({ where: { id: req.params.id, ownerId: userId(req) } }); if (!result.count) { res.status(404).json({ message: "狙い目が見つかりません" }); return; } res.json({ message: "狙い目を削除しました。" }); } catch (error) { next(error); } });

export { router as sparkTargetsRouter };
