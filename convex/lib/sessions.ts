import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type SessionContext = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export async function requireSession(ctx: SessionContext, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (query) => query.eq("token", token))
    .unique();
  if (!session || session.expiresAt <= Date.now()) throw new ConvexError("Session expired");
  return session;
}
