import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
  reports: defineTable({
    externalId: v.string(),
    title: v.string(),
    project: v.string(),
    platform: v.string(),
    contentType: v.string(),
    brandValue: v.optional(v.string()),
    salesValue: v.optional(v.string()),
    entertainmentValue: v.optional(v.string()),
    grade: v.optional(v.union(v.number(), v.null())),
    issue: v.string(),
    improvement: v.string(),
    url: v.string(),
    evidence: v.array(v.id("_storage")),
    examples: v.array(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
    order: v.number(),
  }).index("by_external_id", ["externalId"]),
  websiteContentTypes: defineTable({
    project: v.string(),
    name: v.string(),
    normalizedName: v.string(),
    createdAt: v.number(),
  }).index("by_project_normalized_name", ["project", "normalizedName"]),
  swotPoints: defineTable({
    externalId: v.string(),
    title: v.string(),
    analysis: v.string(),
    quadrant: v.union(v.literal("strength"), v.literal("weakness"), v.literal("opportunity"), v.literal("threat")),
    reportIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_external_id", ["externalId"]).index("by_quadrant", ["quadrant"]),
});
