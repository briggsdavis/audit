import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";
/* eslint-disable @typescript-eslint/no-explicit-any */

const quadrant = v.union(v.literal("strength"), v.literal("weakness"), v.literal("opportunity"), v.literal("threat"));

async function requireSession(ctx: any, token: string) {
  const session = await ctx.db.query("sessions").withIndex("by_token", (q: any) => q.eq("token", token)).unique();
  if (!session || session.expiresAt <= Date.now()) throw new ConvexError("Session expired");
}

export const list = queryGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSession(ctx, token);
    const points = await ctx.db.query("swotPoints").collect();
    return points.map((point) => ({
      id: point.externalId,
      title: point.title,
      analysis: point.analysis,
      quadrant: point.quadrant,
      reportIds: point.reportIds,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt,
    }));
  },
});

export const save = mutationGeneric({
  args: {
    token: v.string(),
    point: v.object({
      id: v.string(),
      title: v.string(),
      analysis: v.string(),
      quadrant,
      reportIds: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, { token, point }) => {
    await requireSession(ctx, token);
    const title = point.title.trim();
    const analysis = point.analysis.trim();
    if (!title || !analysis) throw new ConvexError("Title and analysis are required");
    const reportIds = [...new Set(point.reportIds)];
    for (const reportId of reportIds) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", reportId)).unique();
      if (!report) throw new ConvexError("Linked report not found");
    }
    const value = { title, analysis, quadrant: point.quadrant, reportIds, createdAt: point.createdAt, updatedAt: point.updatedAt };
    const existing = await ctx.db.query("swotPoints").withIndex("by_external_id", (q) => q.eq("externalId", point.id)).unique();
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("swotPoints", { externalId: point.id, ...value });
  },
});
