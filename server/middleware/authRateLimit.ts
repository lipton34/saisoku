import type { RequestHandler } from "express";

/**
 * Per-process, per-client-IP attempt limiter. This is suitable for one Render
 * instance; deployments with multiple instances require a shared store.
 */
export function createAuthRateLimiter(maxAttempts: number, windowMs: number): {
  middleware: RequestHandler;
  reset: (ip: string) => void;
} {
  const attempts = new Map<string, { count: number; expiresAt: number }>();

  const middleware: RequestHandler = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Opportunistically discard expired entries to avoid keeping old IPs forever.
    if (attempts.size > 1000) {
      for (const [key, entry] of attempts) {
        if (entry.expiresAt <= now) attempts.delete(key);
      }
    }

    let entry = attempts.get(ip);
    if (!entry || entry.expiresAt <= now) {
      entry = { count: 0, expiresAt: now + windowMs };
      attempts.set(ip, entry);
    }

    if (entry.count >= maxAttempts) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))));
      res.status(429).json({ message: "試行回数が多すぎます。しばらくしてからお試しください" });
      return;
    }

    // Count before awaiting bcrypt/DB so concurrent requests are bounded too.
    entry.count += 1;
    next();
  };

  return {
    middleware,
    reset(ip: string) {
      attempts.delete(ip);
    }
  };
}
