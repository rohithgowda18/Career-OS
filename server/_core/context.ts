import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/db-types";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Default user used when auth is disabled
const DEFAULT_USER: User = {
  id: 1,
  openId: "default-user",
  name: "User",
  email: "user@localhost",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

async function ensureDefaultUser(): Promise<User> {
  try {
    const existing = await db.getUserByOpenId("default-user");
    if (existing) return existing;

    await db.upsertUser({
      openId: "default-user",
      name: "User",
      email: "user@localhost",
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const created = await db.getUserByOpenId("default-user");
    return created ?? DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Auth disabled — always use default user
  const user = await ensureDefaultUser();

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
