import type { RequestHandler } from "express";

/** Explicit allowlist: unset means nobody can start an expensive news import. */
export function canRunOfficialNewsFetch(userId: string | undefined, allowlist: string | undefined): boolean {
  if (!userId || !allowlist) return false;
  return allowlist.split(",").map((id) => id.trim()).filter(Boolean).includes(userId);
}

export const requireOfficialNewsOperator: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ ok: false, message: "ログインが必要です" });
    return;
  }
  if (!canRunOfficialNewsFetch(req.user.id, process.env.OFFICIAL_NEWS_FETCH_OPERATOR_IDS)) {
    res.status(403).json({ ok: false, message: "NEWS取得・再解析の実行権限がありません" });
    return;
  }
  next();
};
