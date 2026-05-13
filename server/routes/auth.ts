import bcrypt from "bcrypt";
import { Router } from "express";
import { cookieOptions, sessionCookieName, signSession } from "../auth.js";
import { prisma } from "../prisma.js";

const router = Router();

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function publicUser(user: { id: string; username: string; displayName: string | null }) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const displayName = normalizeDisplayName(req.body.displayName);

    if (username.length < 3 || password.length < 8) {
      res.status(400).json({ message: "ユーザー名は3文字以上、パスワードは8文字以上で入力してください" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName },
      select: { id: true, username: true, displayName: true }
    });

    res.cookie(sessionCookieName(), signSession(user), cookieOptions());
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      res.status(409).json({ message: "そのユーザー名はすでに使われています" });
      return;
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: "ユーザー名またはパスワードが違います" });
      return;
    }

    const sessionUser = publicUser(user);
    res.cookie(sessionCookieName(), signSession(sessionUser), cookieOptions());
    res.json({ user: sessionUser });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(sessionCookieName());
  res.status(204).send();
});

router.get("/me", (req, res) => {
  res.json({ user: req.user ?? null });
});

export { router as authRouter };
