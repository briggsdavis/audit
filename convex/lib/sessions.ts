import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { assertCurrentSession, requireProjectAccess } from "./access";

type SessionContext = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export async function getSessionOrNull(ctx: SessionContext, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (query) => query.eq("token", token))
    .unique();
  if (!session || session.expiresAt <= Date.now()) return null;
  try {
    assertCurrentSession(session);
    return session;
  } catch {
    return null;
  }
}

export async function requireSession(ctx: SessionContext, token: string, options: { project?: string; write?: boolean } = {}) {
  const session = await getSessionOrNull(ctx, token);
  if (!session) throw new ConvexError("Session expired");
  if (options.write && !session.canEdit) throw new ConvexError("This account has view-only access");
  if (options.project) requireProjectAccess(session, options.project);
  return session;
}
