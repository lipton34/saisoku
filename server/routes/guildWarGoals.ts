import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.use(requireAuth);

const eventKey = "default";

const defaultDays = [
  "予選1日目",
  "予選2日目",
  "インターバル",
  "本戦1日目",
  "本戦2日目",
  "本戦3日目",
  "本戦4日目"
];

const defaultBossMasters = [
  { bossLevel: 90, name: "90HELL", contribution: 305000n, meatCost: 5, specialMeatCost: 0 },
  { bossLevel: 95, name: "95HELL", contribution: 910000n, meatCost: 10, specialMeatCost: 0 },
  { bossLevel: 100, name: "100HELL", contribution: 2680000n, meatCost: 20, specialMeatCost: 0 },
  { bossLevel: 150, name: "150HELL", contribution: 4100000n, meatCost: 20, specialMeatCost: 0 },
  { bossLevel: 200, name: "200HELL", contribution: 20000000n, meatCost: 20, specialMeatCost: 0 },
  { bossLevel: 250, name: "250HELL", contribution: 75000000n, meatCost: 0, specialMeatCost: 20 }
];

function currentUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return req.user?.id ?? "";
}

function parseText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalText(value: unknown) {
  const text = parseText(value);
  return text.length > 0 ? text : null;
}

function parseContribution(value: unknown) {
  if (typeof value === "bigint") {
    return value >= 0n ? value : 0n;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? BigInt(Math.floor(value)) : 0n;
  }

  if (typeof value !== "string") {
    return 0n;
  }

  const normalized = value.replaceAll(",", "").trim();
  if (!/^\d+$/.test(normalized)) {
    return 0n;
  }

  return BigInt(normalized);
}

function parseBossLevel(value: unknown) {
  const bossLevel = Number(value);
  return defaultBossMasters.some((boss) => boss.bossLevel === bossLevel) ? bossLevel : null;
}

function parseClearTimeSeconds(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds <= 0) {
    return null;
  }

  return seconds;
}

function serializePlan(plan: {
  id: string;
  title: string;
  targetContribution: bigint;
  memo: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  days: { id: string; dayLabel: string; targetContribution: bigint; sortOrder: number; memo: string | null }[];
  speeds: {
    id: string;
    bossLevel: number;
    clearTimeSeconds: number | null;
    playStyle: string;
    memo: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}) {
  return {
    id: plan.id,
    title: plan.title,
    targetContribution: plan.targetContribution.toString(),
    memo: plan.memo,
    ownerId: plan.ownerId,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    days: plan.days.map((day) => ({
      id: day.id,
      dayLabel: day.dayLabel,
      targetContribution: day.targetContribution.toString(),
      sortOrder: day.sortOrder,
      memo: day.memo
    })),
    speeds: plan.speeds.map((speed) => ({
      id: speed.id,
      bossLevel: speed.bossLevel,
      clearTimeSeconds: speed.clearTimeSeconds,
      playStyle: speed.playStyle,
      memo: speed.memo,
      createdAt: speed.createdAt.toISOString(),
      updatedAt: speed.updatedAt.toISOString()
    }))
  };
}

function serializeBossMasters(
  bosses: {
    id: string;
    eventKey: string;
    bossLevel: number;
    name: string;
    contribution: bigint;
    meatCost: number;
    specialMeatCost: number;
    isEnabled: boolean;
  }[]
) {
  return bosses.map((boss) => ({
    id: boss.id,
    eventKey: boss.eventKey,
    bossLevel: boss.bossLevel,
    name: boss.name,
    contribution: boss.contribution.toString(),
    meatCost: boss.meatCost,
    specialMeatCost: boss.specialMeatCost,
    isEnabled: boss.isEnabled
  }));
}

async function ensureBossMasters() {
  await prisma.$transaction(
    defaultBossMasters.map((boss) =>
      prisma.guildWarBossMaster.upsert({
        where: { eventKey_bossLevel: { eventKey, bossLevel: boss.bossLevel } },
        update: {
          name: boss.name,
          contribution: boss.contribution,
          meatCost: boss.meatCost,
          specialMeatCost: boss.specialMeatCost,
          isEnabled: true
        },
        create: {
          eventKey,
          bossLevel: boss.bossLevel,
          name: boss.name,
          contribution: boss.contribution,
          meatCost: boss.meatCost,
          specialMeatCost: boss.specialMeatCost
        }
      })
    )
  );
}

async function bossMasters() {
  await ensureBossMasters();
  return prisma.guildWarBossMaster.findMany({
    where: { eventKey, isEnabled: true },
    orderBy: { bossLevel: "asc" }
  });
}

async function planWithDetails(planId: string) {
  return prisma.guildWarGoalPlan.findUniqueOrThrow({
    where: { id: planId },
    include: {
      days: { orderBy: { sortOrder: "asc" } },
      speeds: { orderBy: { bossLevel: "asc" } }
    }
  });
}

async function ensurePlan(ownerId: string) {
  const existing = await prisma.guildWarGoalPlan.findFirst({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      days: { orderBy: { sortOrder: "asc" } },
      speeds: { orderBy: { bossLevel: "asc" } }
    }
  });

  if (existing) {
    if (existing.days.length === defaultDays.length) {
      return existing;
    }

    await prisma.$transaction([
      prisma.guildWarGoalDay.deleteMany({ where: { planId: existing.id } }),
      prisma.guildWarGoalDay.createMany({
        data: defaultDays.map((dayLabel, index) => ({
          planId: existing.id,
          dayLabel,
          sortOrder: index + 1,
          targetContribution: 0n
        }))
      })
    ]);

    return planWithDetails(existing.id);
  }

  return prisma.guildWarGoalPlan.create({
    data: {
      title: "古戦場目標",
      ownerId,
      days: {
        create: defaultDays.map((dayLabel, index) => ({
          dayLabel,
          sortOrder: index + 1,
          targetContribution: 0n
        }))
      }
    },
    include: {
      days: { orderBy: { sortOrder: "asc" } },
      speeds: { orderBy: { bossLevel: "asc" } }
    }
  });
}

router.get("/current", async (req, res, next) => {
  try {
    const [plan, bosses] = await Promise.all([ensurePlan(currentUserId(req)), bossMasters()]);
    res.json({ plan: serializePlan(plan), bossMasters: serializeBossMasters(bosses) });
  } catch (error) {
    next(error);
  }
});

router.put("/current", async (req, res, next) => {
  try {
    const ownerId = currentUserId(req);
    const existing = await ensurePlan(ownerId);
    const title = parseText(req.body.title) || "古戦場目標";
    const bodyDays: unknown[] = Array.isArray(req.body.days) ? req.body.days : [];
    const bodySpeeds: unknown[] = Array.isArray(req.body.speeds) ? req.body.speeds : [];
    const days = defaultDays.map((dayLabel, index) => {
      const source = bodyDays.find((item) => Number((item as { sortOrder?: unknown }).sortOrder) === index + 1) as
        | Record<string, unknown>
        | undefined;

      return {
        dayLabel,
        sortOrder: index + 1,
        targetContribution: parseContribution(source?.targetContribution),
        memo: parseOptionalText(source?.memo)
      };
    });
    const speeds = bodySpeeds
      .map((item) => {
        const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        const bossLevel = parseBossLevel(record.bossLevel);
        if (!bossLevel) {
          return null;
        }

        return {
          planId: existing.id,
          bossLevel,
          clearTimeSeconds: parseClearTimeSeconds(record.clearTimeSeconds),
          playStyle: parseText(record.playStyle) || "未指定",
          memo: parseOptionalText(record.memo)
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    await prisma.$transaction([
      prisma.guildWarGoalPlan.update({
        where: { id: existing.id },
        data: {
          title,
          targetContribution: parseContribution(req.body.targetContribution),
          memo: parseOptionalText(req.body.memo)
        }
      }),
      prisma.guildWarGoalDay.deleteMany({ where: { planId: existing.id } }),
      prisma.guildWarGoalDay.createMany({
        data: days.map((day) => ({ ...day, planId: existing.id }))
      }),
      prisma.guildWarBossSpeed.deleteMany({ where: { planId: existing.id } }),
      ...(speeds.length > 0 ? [prisma.guildWarBossSpeed.createMany({ data: speeds })] : [])
    ]);

    const [plan, bosses] = await Promise.all([planWithDetails(existing.id), bossMasters()]);
    res.json({ plan: serializePlan(plan), bossMasters: serializeBossMasters(bosses) });
  } catch (error) {
    next(error);
  }
});

router.post("/current/reset", async (req, res, next) => {
  try {
    const ownerId = currentUserId(req);
    const existing = await ensurePlan(ownerId);

    await prisma.$transaction([
      prisma.guildWarGoalPlan.update({
        where: { id: existing.id },
        data: {
          targetContribution: 0n,
          memo: null
        }
      })
    ]);

    const [plan, bosses] = await Promise.all([planWithDetails(existing.id), bossMasters()]);
    res.json({ plan: serializePlan(plan), bossMasters: serializeBossMasters(bosses) });
  } catch (error) {
    next(error);
  }
});

export { router as guildWarGoalsRouter };
