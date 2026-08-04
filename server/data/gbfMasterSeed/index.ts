export { normalizeMasterAlias, type GbfMasterSeedItem } from "./types.js";
export { characterMasterSeeds } from "./characters.js";
export { jobMasterSeeds } from "./jobs.js";
export { materialMasterSeeds } from "./materials.js";
export { questMasterSeeds } from "./quests.js";
export { summonMasterSeeds } from "./summons.js";
export { weaponMasterSeeds } from "./weapons.js";

import { characterMasterSeeds } from "./characters.js";
import { jobMasterSeeds } from "./jobs.js";
import { materialMasterSeeds } from "./materials.js";
import { questMasterSeeds } from "./quests.js";
import { summonMasterSeeds } from "./summons.js";
import { weaponMasterSeeds } from "./weapons.js";
import type { GbfMasterSeedItem } from "./types.js";

export const gbfMasterSeedItems: GbfMasterSeedItem[] = [
  ...jobMasterSeeds,
  ...characterMasterSeeds,
  ...summonMasterSeeds,
  ...weaponMasterSeeds,
  ...materialMasterSeeds,
  ...questMasterSeeds
];
