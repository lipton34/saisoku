import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type BuildMastersQuery, type BuildMastersResponse } from "./api";
import { createBuildMasterCatalog } from "./buildMasters";

type BuildMasterCatalogStatus = "loading" | "ready" | "fallback";

type InitialBuildMasterScope = "all" | BuildMastersQuery | false;

function mergeBuildMastersResponse(
  previous: BuildMastersResponse | null,
  next: BuildMastersResponse,
): BuildMastersResponse {
  const itemsById = new Map(previous?.items.map((item) => [item.id, item]) ?? []);
  const aliasesById = new Map(previous?.aliases.map((alias) => [alias.id, alias]) ?? []);

  for (const item of next.items) {
    itemsById.set(item.id, item);
  }

  for (const alias of next.aliases) {
    aliasesById.set(alias.id, alias);
  }

  return {
    items: [...itemsById.values()],
    aliases: [...aliasesById.values()],
  };
}

export function useBuildMasterCatalog(initialScope: InitialBuildMasterScope = "all") {
  const [response, setResponse] = useState<BuildMastersResponse | null>(null);
  const [status, setStatus] = useState<BuildMasterCatalogStatus>(
    initialScope === false ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialScope === false) {
      setStatus("ready");
      return;
    }

    let isMounted = true;
    const params = initialScope === "all" ? undefined : initialScope;

    api
      .getBuildMasters(params)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setResponse((current) => mergeBuildMastersResponse(current, data));
        setStatus("ready");
        setError(null);
      })
      .catch((caught) => {
        if (!isMounted) {
          return;
        }
        setResponse(null);
        setStatus("fallback");
        setError(caught instanceof Error ? caught.message : "マスタ取得に失敗しました");
      });

    return () => {
      isMounted = false;
    };
  }, [initialScope]);

  const loadBuildMasters = useCallback(async (params?: BuildMastersQuery) => {
    const data = await api.getBuildMasters(params);
    setResponse((current) => mergeBuildMastersResponse(current, data));
    setStatus("ready");
    setError(null);
    return data;
  }, []);

  const catalog = useMemo(
    () => createBuildMasterCatalog(response?.items, response?.aliases),
    [response],
  );

  return {
    catalog,
    error,
    isFallback: status === "fallback",
    isLoading: status === "loading",
    loadBuildMasters,
    status,
  };
}
