import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Demo user - always returned when no OAuth configured (no database needed)
const DEMO_USER: User = {
  id: 1,
  openId: "local-dev-demo",
  name: "Demo User",
  email: "demo@local",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // No OAuth configured = demo mode: use demo user directly (no DB calls)
  if (!ENV.oAuthServerUrl) {
    return {
      req: opts.req,
      res: opts.res,
      user: DEMO_USER,
    };
  }

  // OAuth configured: authenticate via SDK
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
