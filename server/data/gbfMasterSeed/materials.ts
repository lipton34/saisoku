import { progressMaterialNames } from "../progressMaterials.js";
import type { GbfMasterSeedItem } from "./types.js";

export const materialMasterSeeds: GbfMasterSeedItem[] = Object.entries(progressMaterialNames).map(([id, name]) => ({
  id,
  kind: "material",
  name,
  category: "進捗素材",
  tags: ["進捗プリセット"]
}));
