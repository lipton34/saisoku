import type { NextFunction, Request, Response } from "express";
import { sessionCookieName, verifySession } from "../auth.js";

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[sessionCookieName()];
  if (!token) {
    next();
    return;
  }

  try {
    req.user = verifySession(token);
  } catch {
    req.user = undefined;
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "ログインが必要です" });
    return;
  }

  next();
}
