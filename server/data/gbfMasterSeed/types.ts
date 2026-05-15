import type { Prisma } from "@prisma/client";
import { GbfMasterKind } from "@prisma/client";

export { GbfMasterKind };

export type GbfMasterSeedItem = {
  id: string;
  kind: GbfMasterKind;
  name: string;
  element?: string;
  category?: string;
  rarity?: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  tags?: string[];
  metadata?: Prisma.InputJsonObject;
  note?: string;
  aliases?: string[];
};

export function normalizeMasterAlias(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}
