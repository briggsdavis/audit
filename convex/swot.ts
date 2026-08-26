import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";
/* eslint-disable @typescript-eslint/no-explicit-any */

const quadrant = v.union(v.literal("strength"), v.literal("weakness"), v.literal("opportunity"), v.literal("threat"));
const projects = new Set(["City of Mara", "NordOne", "Nord1", "Vivalia", "Via Project"]);
const publicProjectName = (project: string) => project === "Nord1" ? "NordOne" : project;

async function requireSession(ctx: any, token: string) {
  const session = await ctx.db.query("sessions").withIndex("by_token", (q: any) => q.eq("token", token)).unique();
  if (!session || session.expiresAt <= Date.now()) throw new ConvexError("Session expired");
}

export const list = queryGeneric({
  args: { token: v.string(), project: v.string() },
  handler: async (ctx, { token, project }) => {
    await requireSession(ctx, token);
    if (!projects.has(project)) throw new ConvexError("Invalid project");
    const allPoints = await ctx.db.query("swotPoints").collect();
    const points = [];
    for (const point of allPoints) {
      if (publicProjectName(point.project ?? "") === publicProjectName(project)) points.push(point);
      else if (!point.project) {
        const linkedReports = await Promise.all(point.reportIds.map((reportId: string) => ctx.db.query("reports").withIndex("by_external_id", (q: any) => q.eq("externalId", reportId)).unique()));
        const inferredProject = linkedReports.find(Boolean)?.project ?? "City of Mara";
        if (publicProjectName(inferredProject) === publicProjectName(project) && linkedReports.every((report: any) => !report || publicProjectName(report.project) === publicProjectName(project))) points.push(point);
      }
    }
    return points.map((point) => ({
      id: point.externalId,
      project: publicProjectName(project),
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
      project: v.string(),
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
    if (!projects.has(point.project)) throw new ConvexError("Invalid project");
    const title = point.title.trim();
    const analysis = point.analysis.trim();
    if (!title || !analysis) throw new ConvexError("Title and analysis are required");
    const reportIds = [...new Set(point.reportIds)];
    for (const reportId of reportIds) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", reportId)).unique();
      if (!report || publicProjectName(report.project) !== publicProjectName(point.project)) throw new ConvexError("Linked report must belong to this project");
    }
    const value = { project: point.project, title, analysis, quadrant: point.quadrant, reportIds, createdAt: point.createdAt, updatedAt: point.updatedAt };
    const existing = await ctx.db.query("swotPoints").withIndex("by_external_id", (q) => q.eq("externalId", point.id)).unique();
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("swotPoints", { externalId: point.id, ...value });
  },
});

export const remove = mutationGeneric({
  args: { token: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, { token, ids }) => {
    await requireSession(ctx, token);
    for (const id of [...new Set(ids)]) {
      const point = await ctx.db.query("swotPoints").withIndex("by_external_id", (q) => q.eq("externalId", id)).unique();
      if (point) await ctx.db.delete(point._id);
    }
  },
});
