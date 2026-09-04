import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { accessLevelValidator } from "./lib/access";

export default defineSchema({
  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
    accessLevel: v.optional(accessLevelValidator),
    canEdit: v.optional(v.boolean()),
    projects: v.optional(v.array(v.string())),
    version: v.optional(v.number()),
  }).index("by_token", ["token"]),
  reports: defineTable({
    externalId: v.string(),
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
    grade: v.optional(v.union(v.number(), v.null())),
    issue: v.optional(v.string()),
    improvement: v.string(),
    url: v.string(),
    evidence: v.array(v.id("_storage")),
    examples: v.array(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
    order: v.number(),
  }).index("by_external_id", ["externalId"]).index("by_project", ["project"]),
  websiteContentTypes: defineTable({
    project: v.string(),
    name: v.string(),
    normalizedName: v.string(),
    createdAt: v.number(),
  }).index("by_project", ["project"]).index("by_project_normalized_name", ["project", "normalizedName"]),
  swotPoints: defineTable({
    externalId: v.string(),
    project: v.optional(v.string()),
    title: v.string(),
    analysis: v.string(),
    quadrant: v.union(v.literal("strength"), v.literal("weakness"), v.literal("opportunity"), v.literal("threat")),
    reportIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_external_id", ["externalId"]).index("by_project", ["project"]).index("by_quadrant", ["quadrant"]),
});
