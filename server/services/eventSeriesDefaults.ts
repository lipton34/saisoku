import type { PrismaClient } from "@prisma/client";
import { prisma } from "../prisma.js";

export const defaultEventSeries = [
  { eventKey: "guild_war", name: "決戦！星の古戦場", eventType: "guild_war" },
  { eventKey: "dread_barrage", name: "ドレッドバラージュ", eventType: "dread_barrage" },
  { eventKey: "rotb", name: "四象降臨", eventType: "rotb" },
  { eventKey: "tenju_senki", name: "十天衆戦記", eventType: "special_event" },
  { eventKey: "arcarum_event", name: "アーカルムの転世外伝", eventType: "arcarum_event" },
  { eventKey: "scenario_event", name: "シナリオイベント", eventType: "scenario_event" },
  { eventKey: "collaboration_event", name: "コラボイベント", eventType: "collaboration_event" },
  { eventKey: "proving_grounds", name: "ブレイブグラウンド", eventType: "proving_grounds" },
  { eventKey: "xeno_clash", name: "ゼノ撃滅戦", eventType: "xeno_clash" },
  { eventKey: "tower_of_babyl", name: "バブ・イールの塔", eventType: "tower_of_babyl" },
  { eventKey: "other", name: "その他", eventType: "other" },
];

export async function ensureDefaultEventSeries(client: PrismaClient = prisma) {
  for (const item of defaultEventSeries) {
    await client.eventSeries.upsert({
      where: { eventKey: item.eventKey },
      create: item,
      update: {
        name: item.name,
        eventType: item.eventType,
      },
    });
  }
}
