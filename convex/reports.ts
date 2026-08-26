import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";
/* eslint-disable @typescript-eslint/no-explicit-any */

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

const projects = new Set(["City of Mara", "NordOne", "Nord1", "Vivalia", "Via Project"]);
const publicProjectName = (project: string) => project === "Nord1" ? "NordOne" : project;
const contentTypes: Record<string, Set<string>> = {
  Instagram: new Set(["Carousel", "Post", "Reel"]),
  TikTok: new Set(["Carousel", "Video"]),
  Advertisement: new Set(["Carousel", "Image", "Text"]),
};

function normalizeWebsiteContentType(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

async function requireSession(ctx: any, token: string) {
  const session = await ctx.db.query("sessions").withIndex("by_token", (q: any) => q.eq("token", token)).unique();
  if (!session || session.expiresAt <= Date.now()) throw new ConvexError("Session expired");
}

export const list = queryGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSession(ctx, token);
    const reports = await ctx.db.query("reports").collect();
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
      evidence: await Promise.all(report.evidence.map(async (storageId: any) => ({ storageId, url: await ctx.storage.getUrl(storageId) ?? "" }))),
      examples: await Promise.all(report.examples.map(async (storageId: any) => ({ storageId, url: await ctx.storage.getUrl(storageId) ?? "" }))),
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      order: report.order,
    })));
  },
});

export const listWebsiteContentTypes = queryGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSession(ctx, token);
    const savedTypes = await ctx.db.query("websiteContentTypes").collect();
    const byProject = new Map<string, { project: string; name: string }>();
    for (const item of savedTypes) byProject.set(`${publicProjectName(item.project)}:${item.normalizedName}`, { project: publicProjectName(item.project), name: item.name });
    return [...byProject.values()].sort((a, b) => a.project.localeCompare(b.project) || a.name.localeCompare(b.name));
  },
});

export const removeWebsiteContentType = mutationGeneric({
  args: { token: v.string(), project: v.string(), name: v.string() },
  handler: async (ctx, { token, project, name }) => {
    await requireSession(ctx, token);
    const normalizedName = normalizeWebsiteContentType(name);
    const items = await ctx.db.query("websiteContentTypes").collect();
    for (const item of items) {
      if (publicProjectName(item.project) === publicProjectName(project) && item.normalizedName === normalizedName) await ctx.db.delete(item._id);
    }
  },
});

export const save = mutationGeneric({
  args: { token: v.string(), report: v.object(reportFields) },
  handler: async (ctx, { token, report }) => {
    await requireSession(ctx, token);
    if (!report.title.trim() || !report.improvement.trim()) throw new ConvexError("Required fields are missing");
    for (const grade of [report.brandGrade, report.salesGrade, report.entertainmentGrade]) {
      if (grade !== undefined && grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 10)) throw new ConvexError("Grades must be whole numbers from 1 to 10");
    }
    if (!projects.has(report.project)) throw new ConvexError("Invalid project");
    let contentType = report.contentType.trim();
    if (report.platform === "Website") {
      if (!contentType || contentType.length > 80) throw new ConvexError("A valid website content type is required");
      const normalizedName = normalizeWebsiteContentType(contentType);
      const savedTypes = await ctx.db.query("websiteContentTypes").collect();
      const savedType = savedTypes.find((item) => publicProjectName(item.project) === publicProjectName(report.project) && item.normalizedName === normalizedName);
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
      const retained = new Set([...report.evidence, ...report.examples]);
      for (const storageId of [...existing.evidence, ...existing.examples]) if (!retained.has(storageId)) await ctx.storage.delete(storageId);
      await ctx.db.patch(existing._id, value);
    } else {
      await ctx.db.insert("reports", value);
    }
  },
});

export const remove = mutationGeneric({
  args: { token: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, { token, ids }) => {
    await requireSession(ctx, token);
    for (const id of ids) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", id)).unique();
      if (!report) continue;
      for (const storageId of [...report.evidence, ...report.examples]) await ctx.storage.delete(storageId);
      await ctx.db.delete(report._id);
    }
  },
});

export const reorder = mutationGeneric({
  args: { token: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, { token, ids }) => {
    await requireSession(ctx, token);
    for (let order = 0; order < ids.length; order += 1) {
      const report = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", ids[order])).unique();
      if (report) await ctx.db.patch(report._id, { order, updatedAt: Date.now() });
    }
  },
});

export const generateUploadUrl = mutationGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSession(ctx, token);
    return await ctx.storage.generateUploadUrl();
  },
});
