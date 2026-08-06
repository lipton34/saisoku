export { normalizeMasterAlias, type GbfMasterSeedItem } from "./types.js";
export { characterMasterSeeds } from "./characters.js";
export { jobMasterSeeds } from "./jobs.js";
export { materialMasterSeeds } from "./materials.js";
export { questMasterSeeds } from "./quests.js";
export { summonMasterSeeds } from "./summons.js";
export { weaponMasterSeeds } from "./weapons.js";
export { applySparkTargetMasterEnrichment, sparkTargetMasterSeeds } from "./sparkTargetMasters.js";
export { applySeasonalSparkTargetMasters, seasonalDefinitions } from "./seasonalSparkTargetMasters.js";

import { characterMasterSeeds } from "./characters.js";
import { jobMasterSeeds } from "./jobs.js";
import { materialMasterSeeds } from "./materials.js";
import { questMasterSeeds } from "./quests.js";
import { summonMasterSeeds } from "./summons.js";
import { weaponMasterSeeds } from "./weapons.js";
import { applySparkTargetMasterEnrichment, sparkTargetMasterSeeds } from "./sparkTargetMasters.js";
import { applySeasonalSparkTargetMasters } from "./seasonalSparkTargetMasters.js";
import type { GbfMasterSeedItem } from "./types.js";

export const gbfMasterSeedItems: GbfMasterSeedItem[] = applySeasonalSparkTargetMasters(applySparkTargetMasterEnrichment([
  ...jobMasterSeeds,
  ...characterMasterSeeds,
  ...summonMasterSeeds,
  ...weaponMasterSeeds,
  ...sparkTargetMasterSeeds,
  ...materialMasterSeeds,
  ...questMasterSeeds
]));
