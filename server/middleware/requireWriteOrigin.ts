import type { RequestHandler } from "express";

const modifyingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAllowedWriteOrigin(originHeader: string | undefined, ownOrigin: string, clientOrigin?: string): boolean {
  if (!originHeader) return false;
  try {
    const origin = new URL(originHeader);
    if (!["http:", "https:"].includes(origin.protocol) || origin.origin !== originHeader || origin.username || origin.password) return false;
    const trusted = [ownOrigin, clientOrigin].filter((x): x is string => Boolean(x));
    return trusted.some((value) => {
      try { return new URL(value).origin === origin.origin; } catch { return false; }
    });
  } catch { return false; }
}

/** Reject browser cookie writes from untrusted origins, independently of CORS. */
export const requireWriteOrigin: RequestHandler = (req, res, next) => {
  if (!modifyingMethods.has(req.method.toUpperCase())) { next(); return; }
  const origin = req.get("origin");
  const host = req.get("host");
  // Both Origin and Host must be present: no acceptance based on missing headers.
  if (!host || !isAllowedWriteOrigin(origin, `${req.protocol}://${host}`, process.env.CLIENT_ORIGIN?.trim())) {
    res.status(403).json({ message: "この送信元からの変更操作は許可されていません" });
    return;
  }
  next();
};
