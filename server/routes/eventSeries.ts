import { Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { prisma } from "../prisma.js";
import { ensureDefaultEventSeries } from "../services/eventSeriesDefaults.js";

const router = Router();

router.use(requireAuth);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const parsed = text(value);
  return parsed || null;
}

function seriesPayload(body: Record<string, unknown>) {
  return {
    eventKey: text(body.eventKey),
    name: text(body.name),
    eventType: text(body.eventType) || "other",
    description: optionalText(body.description),
    defaultMemoTemplate: optionalText(body.defaultMemoTemplate),
  };
}

router.get("/", async (_req, res, next) => {
  try {
    await ensureDefaultEventSeries();
    const series = await prisma.eventSeries.findMany({
      orderBy: [{ eventType: "asc" }, { name: "asc" }],
    });
    res.json({ series });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = seriesPayload(req.body as Record<string, unknown>);
    if (!data.eventKey || !data.name) {
      res.status(400).json({ message: "eventKey と name が必要です" });
      return;
    }

    const series = await prisma.eventSeries.create({ data });
    res.status(201).json({ series });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "同じ eventKey のイベントシリーズが既にあります" });
      return;
    }
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.eventSeries.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: "イベントシリーズが見つかりません" });
      return;
    }

    const payload = seriesPayload(req.body as Record<string, unknown>);
    const series = await prisma.eventSeries.update({
      where: { id: existing.id },
      data: {
        eventKey: payload.eventKey || existing.eventKey,
        name: payload.name || existing.name,
        eventType: payload.eventType || existing.eventType,
        description: "description" in req.body ? payload.description : existing.description,
        defaultMemoTemplate:
          "defaultMemoTemplate" in req.body ? payload.defaultMemoTemplate : existing.defaultMemoTemplate,
      },
    });
    res.json({ series });
  } catch (error) {
    next(error);
  }
});

export { router as eventSeriesRouter };
