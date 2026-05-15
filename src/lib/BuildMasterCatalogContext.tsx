import { createContext, useContext, type ReactNode } from "react";
import {
  fallbackBuildMasterCatalog,
  type BuildMasterCatalog,
} from "./buildMasters";

const BuildMasterCatalogContext = createContext<BuildMasterCatalog>(
  fallbackBuildMasterCatalog,
);

export function BuildMasterCatalogProvider({
  catalog,
  children,
}: {
  catalog: BuildMasterCatalog;
  children: ReactNode;
}) {
  return (
    <BuildMasterCatalogContext.Provider value={catalog}>
      {children}
    </BuildMasterCatalogContext.Provider>
  );
}

export function useBuildMasterLookup() {
  return useContext(BuildMasterCatalogContext);
}
