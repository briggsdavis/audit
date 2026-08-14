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
});
