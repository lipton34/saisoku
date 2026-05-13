import jwt from "jsonwebtoken";
import type { AuthUser } from "./types.js";

const cookieName = "saisoku_session";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function signSession(user: AuthUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string): AuthUser {
  return jwt.verify(token, getJwtSecret()) as AuthUser;
}

export function sessionCookieName() {
  return cookieName;
}

export function cookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}
