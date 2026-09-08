import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";

const WRITE_WINDOW_MS = 60 * 60 * 1000;
const MAX_WRITES_PER_WINDOW = 120;

export async function enforceWriteRateLimit(ctx: MutationCtx, sessionToken: string) {
  const now = Date.now();
  const existing = await ctx.db.query("writeRateLimits").withIndex("by_session_token", (q) => q.eq("sessionToken", sessionToken)).unique();
  if (existing && now - existing.windowStartedAt < WRITE_WINDOW_MS && existing.count >= MAX_WRITES_PER_WINDOW) throw new ConvexError("Too many changes in a short period. Please try again later.");
  if (existing && now - existing.windowStartedAt < WRITE_WINDOW_MS) await ctx.db.patch(existing._id, { count: existing.count + 1, updatedAt: now });
  else if (existing) await ctx.db.patch(existing._id, { count: 1, windowStartedAt: now, updatedAt: now });
  else await ctx.db.insert("writeRateLimits", { sessionToken, count: 1, windowStartedAt: now, updatedAt: now });
}
