import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { publicProjectName, requireProject, sameProject, storedProjectNames } from "./lib/projects";
import { requireSession } from "./lib/sessions";
import { reportResultValidator } from "./lib/validators";

const reportFields = {
  id: v.string(),
  title: v.string(),
  project: v.string(),
  platform: v.string(),
  contentType: v.string(),
  brandValue: v.optional(v.string()),
  brandGrade: v.optional(v.union(v.number(), v.null())),
  salesValue: v.optional(v.string()),
  salesGrade: v.optional(v.union(v.number(), v.null())),
  entertainmentValue: v.optional(v.string()),
  entertainmentGrade: v.optional(v.union(v.number(), v.null())),
  improvement: v.string(),
  url: v.string(),
  evidence: v.array(v.id("_storage")),
  examples: v.array(v.id("_storage")),
  createdAt: v.number(),
  updatedAt: v.number(),
  order: v.number(),
};

const MAX_PROJECT_RECORDS = 5_000;
const contentTypes: Record<string, Set<string>> = {
  Instagram: new Set(["Carousel", "Post", "Reel"]),
  TikTok: new Set(["Carousel", "Video"]),
  Advertisement: new Set(["Carousel", "Image", "Text"]),
};

function normalizeWebsiteContentType(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export const list = query({
  args: { token: v.string(), project: v.string() },
  returns: v.array(reportResultValidator),
  handler: async (ctx, { token, project }) => {
    await requireSession(ctx, token);
    requireProject(project);
    const reports = (await Promise.all(storedProjectNames(project).map((storedProject) => ctx.db
      .query("reports")
      .withIndex("by_project", (index) => index.eq("project", storedProject))
      .take(MAX_PROJECT_RECORDS)))).flat();
    return Promise.all(reports.map(async (report) => ({
      id: report.externalId,
      title: report.title,
      project: publicProjectName(report.project),
      platform: report.platform,
      contentType: report.contentType,
      brandValue: report.brandValue ?? "",
      brandGrade: report.brandGrade ?? null,
      salesValue: report.salesValue ?? "",
      salesGrade: report.salesGrade ?? null,
      entertainmentValue: report.entertainmentValue ?? "",
      entertainmentGrade: report.entertainmentGrade ?? null,
      improvement: report.improvement,
      url: report.url,
      evidence: await Promise.all(report.evidence.map(async (storageId) => ({ storageId, url: await ctx.storage.getUrl(storageId) ?? "" }))),
      examples: await Promise.all(report.examples.map(async (storageId) => ({ storageId, url: await ctx.storage.getUrl(storageId) ?? "" }))),
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      order: report.order,
    })));
  },
});

export const listWebsiteContentTypes = query({
  args: { token: v.string(), project: v.string() },
  returns: v.array(v.object({ project: v.string(), name: v.string() })),
  handler: async (ctx, { token, project }) => {
    await requireSession(ctx, token);
    requireProject(project);
    const savedTypes = (await Promise.all(storedProjectNames(project).map((storedProject) => ctx.db
      .query("websiteContentTypes")
      .withIndex("by_project", (index) => index.eq("project", storedProject))
      .take(MAX_PROJECT_RECORDS)))).flat();
    const byProject = new Map<string, { project: string; name: string }>();
    for (const item of savedTypes) byProject.set(`${publicProjectName(item.project)}:${item.normalizedName}`, { project: publicProjectName(item.project), name: item.name });
    return [...byProject.values()].sort((a, b) => a.project.localeCompare(b.project) || a.name.localeCompare(b.name));
  },
});

export const removeWebsiteContentType = mutation({
  args: { token: v.string(), project: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { token, project, name }) => {
    await requireSession(ctx, token);
    requireProject(project);
    const normalizedName = normalizeWebsiteContentType(name);
    for (const storedProject of storedProjectNames(project)) {
      const item = await ctx.db.query("websiteContentTypes")
        .withIndex("by_project_normalized_name", (index) => index.eq("project", storedProject).eq("normalizedName", normalizedName))
        .unique();
      if (item) await ctx.db.delete(item._id);
    }
    return null;
  },
});

export const save = mutation({
  args: { token: v.string(), report: v.object(reportFields) },
  returns: v.null(),
  handler: async (ctx, { token, report }) => {
    await requireSession(ctx, token);
    if (!report.title.trim() || !report.improvement.trim()) throw new ConvexError("Required fields are missing");
    for (const grade of [report.brandGrade, report.salesGrade, report.entertainmentGrade]) {
      if (grade !== undefined && grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 10)) throw new ConvexError("Grades must be whole numbers from 1 to 10");
    }
    requireProject(report.project);
    let contentType = report.contentType.trim();
    if (report.platform === "Website") {
      if (!contentType || contentType.length > 80) throw new ConvexError("A valid website content type is required");
      const normalizedName = normalizeWebsiteContentType(contentType);
      let savedType = null;
      for (const storedProject of storedProjectNames(report.project)) {
        savedType = await ctx.db.query("websiteContentTypes")
          .withIndex("by_project_normalized_name", (index) => index.eq("project", storedProject).eq("normalizedName", normalizedName))
          .unique();
        if (savedType) break;
      }
      if (savedType) contentType = savedType.name;
      else await ctx.db.insert("websiteContentTypes", { project: report.project, name: contentType, normalizedName, createdAt: Date.now() });
    } else if (!contentTypes[report.platform]?.has(contentType)) {
      throw new ConvexError("Invalid report classification");
    }
    const existing = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", report.id)).unique();
    const value = {
      externalId: report.id,
      title: report.title.trim(), project: report.project, platform: report.platform, contentType,
      brandValue: (report.brandValue ?? "").trim(), brandGrade: report.brandGrade ?? null,
      salesValue: (report.salesValue ?? "").trim(), salesGrade: report.salesGrade ?? null,
      entertainmentValue: (report.entertainmentValue ?? "").trim(), entertainmentGrade: report.entertainmentGrade ?? null,
      improvement: report.improvement.trim(), url: report.url.trim(),
      evidence: report.evidence, examples: report.examples, createdAt: report.createdAt, updatedAt: report.updatedAt, order: report.order,
    };
    if (existing) {
      if (!sameProject(existing.project, report.project)) throw new ConvexError("A report cannot be moved between projects");
      const retained = new Set([...report.evidence, ...report.examples]);
      for (const storageId of [...existing.evidence, ...existing.examples]) if (!retained.has(storageId)) await ctx.storage.delete(storageId);
      await ctx.db.patch(existing._id, value);
    } else {
      await ctx.db.insert("reports", value);
    }
    return null;
  },
});

export const remove = mutation({
  args: { token: v.string(), project: v.string(), ids: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { token, project, ids }) => {
    await requireSession(ctx, token);
    requireProject(project);
    for (const id of ids) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", id)).unique();
      if (!report) continue;
      if (!sameProject(report.project, project)) throw new ConvexError("A report can only be removed from its own project");
      for (const storageId of [...report.evidence, ...report.examples]) await ctx.storage.delete(storageId);
      await ctx.db.delete(report._id);
    }
    return null;
  },
});

export const reorder = mutation({
  args: { token: v.string(), ids: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { token, ids }) => {
    await requireSession(ctx, token);
    for (let order = 0; order < ids.length; order += 1) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", ids[order])).unique();
      if (report) await ctx.db.patch(report._id, { order, updatedAt: Date.now() });
    }
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  returns: v.string(),
  handler: async (ctx, { token }) => {
    await requireSession(ctx, token);
    return await ctx.storage.generateUploadUrl();
  },
});
