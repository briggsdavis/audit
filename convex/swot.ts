import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { projectValidator, publicProjectName, requireProject, sameProject, storedProjectNames } from "./lib/projects";
import { getSessionOrNull, requireSession } from "./lib/sessions";
import { requireProjectAccess } from "./lib/access";
import { quadrantValidator, swotPointResultValidator } from "./lib/validators";
import { enforceWriteRateLimit } from "./lib/rateLimits";

const MAX_PROJECT_RECORDS = 5_000;
const MAX_TITLE_LENGTH = 500;
const MAX_ANALYSIS_LENGTH = 10_000;

export const list = query({
  args: { token: v.string(), project: projectValidator },
  returns: v.array(swotPointResultValidator),
  handler: async (ctx, { token, project }) => {
    requireProject(project);
    const session = await getSessionOrNull(ctx, token);
    if (!session) return [];
    requireProjectAccess(session, project);
    const points = (await Promise.all(storedProjectNames(project).map((storedProject) => ctx.db
      .query("swotPoints")
      .withIndex("by_project", (index) => index.eq("project", storedProject))
      .take(MAX_PROJECT_RECORDS)))).flat();
    const legacyPoints = await ctx.db.query("swotPoints")
      .withIndex("by_project", (index) => index.eq("project", undefined))
      .take(MAX_PROJECT_RECORDS);
    for (const point of legacyPoints) {
        const linkedReports = await Promise.all(point.reportIds.map((reportId) => ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", reportId)).unique()));
        const inferredProject = linkedReports.find(Boolean)?.project ?? "City of Mara";
        if (sameProject(inferredProject, project) && linkedReports.every((report) => !report || sameProject(report.project, project))) points.push(point);
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
      translation: point.translation,
    }));
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    point: v.object({
      id: v.string(),
      project: projectValidator,
      title: v.string(),
      analysis: v.string(),
      quadrant: quadrantValidator,
      reportIds: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { token, point }) => {
    requireProject(point.project);
    await requireSession(ctx, token, { project: point.project, write: true });
    await enforceWriteRateLimit(ctx, token);
    const title = point.title.trim();
    const analysis = point.analysis.trim();
    if (!title || !analysis) throw new ConvexError("Title and analysis are required");
    if (title.length > MAX_TITLE_LENGTH || analysis.length > MAX_ANALYSIS_LENGTH) throw new ConvexError("Analysis text is too long");
    const reportIds = [...new Set(point.reportIds)];
    for (const reportId of reportIds) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", reportId)).unique();
      if (!report || !sameProject(report.project, point.project)) throw new ConvexError("Linked report must belong to this project");
    }
    const existing = await ctx.db.query("swotPoints").withIndex("by_external_id", (q) => q.eq("externalId", point.id)).unique();
    const value = { project: point.project, title, analysis, quadrant: point.quadrant, reportIds, createdAt: point.createdAt, updatedAt: point.updatedAt, translation: { sourceLanguage: existing?.translation?.sourceLanguage ?? "en" as const, sourceUpdatedAt: point.updatedAt, status: "pending" as const, attempts: 0 } };
    if (existing) {
      if (existing.project && !sameProject(existing.project, point.project)) throw new ConvexError("A SWOT point cannot be moved between projects");
      await ctx.db.patch(existing._id, value);
    }
    else await ctx.db.insert("swotPoints", { externalId: point.id, ...value });
    await ctx.scheduler.runAfter(0, internal.translations.translateSwot, { id: point.id, sourceUpdatedAt: point.updatedAt });
    return null;
  },
});

export const remove = mutation({
  args: { token: v.string(), project: projectValidator, ids: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { token, project, ids }) => {
    requireProject(project);
    await requireSession(ctx, token, { project, write: true });
    for (const id of [...new Set(ids)]) {
      const point = await ctx.db.query("swotPoints").withIndex("by_external_id", (q) => q.eq("externalId", id)).unique();
      if (!point) continue;
      if (point.project && !sameProject(point.project, project)) throw new ConvexError("A SWOT point can only be removed from its own project");
      await ctx.db.delete(point._id);
    }
    return null;
  },
});
