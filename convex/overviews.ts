import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { enforceWriteRateLimit } from "./lib/rateLimits";
import { publicProjectName, requireProject, storedProjectNames } from "./lib/projects";
import { getSessionOrNull, requireSession } from "./lib/sessions";
import { requireProjectAccess } from "./lib/access";

const languageValidator = v.union(v.literal("en"), v.literal("ro"));
const overviewTextValidator = v.object({ overview: v.string() });
const overviewTranslationValidator = v.object({
  sourceLanguage: languageValidator,
  sourceUpdatedAt: v.number(),
  status: v.union(v.literal("pending"), v.literal("complete"), v.literal("failed")),
  localized: v.optional(v.object({ en: overviewTextValidator, ro: overviewTextValidator })),
  attempts: v.number(),
  lastError: v.optional(v.string()),
});
const overviewResultValidator = v.object({
  project: v.string(),
  phase: v.literal("phase2"),
  overview: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  translation: v.optional(overviewTranslationValidator),
});
const MAX_OVERVIEW_LENGTH = 10_000;

export const get = query({
  args: { token: v.string(), project: v.string(), phase: v.literal("phase2") },
  returns: v.union(v.null(), overviewResultValidator),
  handler: async (ctx, { token, project, phase }) => {
    requireProject(project);
    const session = await getSessionOrNull(ctx, token);
    if (!session) return null;
    requireProjectAccess(session, project);
    for (const storedProject of storedProjectNames(project)) {
      const overview = await ctx.db.query("projectOverviews")
        .withIndex("by_project_phase", (index) => index.eq("project", storedProject).eq("phase", phase))
        .unique();
      if (overview) return {
        project: publicProjectName(overview.project),
        phase: "phase2" as const,
        overview: overview.overview,
        createdAt: overview.createdAt,
        updatedAt: overview.updatedAt,
        translation: overview.translation,
      };
    }
    return null;
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    project: v.string(),
    phase: v.literal("phase2"),
    overview: v.string(),
    sourceLanguage: languageValidator,
  },
  returns: v.null(),
  handler: async (ctx, { token, project, phase, overview, sourceLanguage }) => {
    requireProject(project);
    await requireSession(ctx, token, { project, write: true });
    await enforceWriteRateLimit(ctx, token);
    const text = overview.trim();
    if (!text) throw new ConvexError("Executive overview is required");
    if (text.length > MAX_OVERVIEW_LENGTH) throw new ConvexError("Executive overview is too long");
    let existing = null;
    for (const storedProject of storedProjectNames(project)) {
      existing = await ctx.db.query("projectOverviews")
        .withIndex("by_project_phase", (index) => index.eq("project", storedProject).eq("phase", phase))
        .unique();
      if (existing) break;
    }
    const updatedAt = Date.now();
    const translation = { sourceLanguage, sourceUpdatedAt: updatedAt, status: "pending" as const, attempts: 0 };
    let id;
    if (existing) {
      await ctx.db.patch(existing._id, { overview: text, updatedAt, translation });
      id = existing._id;
    } else {
      id = await ctx.db.insert("projectOverviews", { project, phase, overview: text, createdAt: updatedAt, updatedAt, translation });
    }
    await ctx.scheduler.runAfter(0, internal.translations.translateOverview, { id, sourceUpdatedAt: updatedAt });
    return null;
  },
});
