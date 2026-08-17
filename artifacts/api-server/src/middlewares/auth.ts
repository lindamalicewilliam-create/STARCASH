import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const configuredJwtSecret = process.env.SESSION_SECRET?.trim();
const SESSION_COOKIE_NAME = "starcash_session";

if (!configuredJwtSecret || configuredJwtSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET must be configured with at least 32 characters before the API can start.",
  );
}
const JWT_SECRET: string = configuredJwtSecret;

export interface AuthPayload {
  userId: number;
  role: "user" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function getToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.cookies?.[SESSION_COOKIE_NAME];
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (typeof verified !== "object" || verified === null) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    const payload = verified as unknown as AuthPayload;
    if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Always read authorization state from the database. This prevents a
    // previously-issued admin token from retaining access after a role or
    // account-status change.
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, status: usersTable.status })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Account no longer exists" });
      return;
    }
    if (user.status === "suspended") {
      res.status(403).json({ error: "Account is suspended" });
      return;
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    next(error);
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
