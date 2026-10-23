import type { Prisma } from "../../generated/prisma/client.js";
import { GbfMasterKind } from "../../generated/prisma/client.js";

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
  isActive?: boolean;
};

export function normalizeMasterAlias(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}
