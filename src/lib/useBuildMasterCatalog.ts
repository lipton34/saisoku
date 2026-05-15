import { useEffect, useMemo, useState } from "react";
import { api, type BuildMastersResponse } from "./api";
import { createBuildMasterCatalog } from "./buildMasters";

type BuildMasterCatalogStatus = "loading" | "ready" | "fallback";

export function useBuildMasterCatalog() {
  const [response, setResponse] = useState<BuildMastersResponse | null>(null);
  const [status, setStatus] = useState<BuildMasterCatalogStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    api
      .getBuildMasters()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setResponse(data);
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
    status,
  };
}
