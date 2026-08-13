import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";
/* eslint-disable @typescript-eslint/no-explicit-any */

const reportFields = {
  id: v.string(),
  title: v.string(),
  project: v.string(),
  platform: v.string(),
  contentType: v.string(),
  issue: v.string(),
  improvement: v.string(),
  url: v.string(),
  evidence: v.array(v.id("_storage")),
  examples: v.array(v.id("_storage")),
  createdAt: v.number(),
  updatedAt: v.number(),
  order: v.number(),
};

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
      project: report.project,
      platform: report.platform,
      contentType: report.contentType,
      issue: report.issue,
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

export const save = mutationGeneric({
  args: { token: v.string(), report: v.object(reportFields) },
  handler: async (ctx, { token, report }) => {
    await requireSession(ctx, token);
    const existing = await ctx.db.query("reports").withIndex("by_external_id", (q) => q.eq("externalId", report.id)).unique();
    const value = {
      externalId: report.id,
      title: report.title.trim(), project: report.project, platform: report.platform, contentType: report.contentType,
      issue: report.issue.trim(), improvement: report.improvement.trim(), url: report.url.trim(),
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
