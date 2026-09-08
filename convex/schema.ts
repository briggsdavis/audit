import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { accessLevelValidator } from "./lib/access";

const translatedReportFields = v.object({
  title: v.string(),
  contentType: v.string(),
  brandValue: v.string(),
  salesValue: v.string(),
  entertainmentValue: v.string(),
  improvement: v.string(),
});

const fieldTranslationValidator = v.object({
  sourceLanguage: v.union(v.literal("en"), v.literal("ro")),
  translated: v.string(),
});

const reportFieldTranslations = v.object({
  title: fieldTranslationValidator,
  contentType: fieldTranslationValidator,
  brandValue: fieldTranslationValidator,
  salesValue: fieldTranslationValidator,
  entertainmentValue: fieldTranslationValidator,
  improvement: fieldTranslationValidator,
});

const reportTranslationValidator = v.object({
  sourceLanguage: v.union(v.literal("en"), v.literal("ro")),
  sourceUpdatedAt: v.number(),
  status: v.union(v.literal("pending"), v.literal("complete"), v.literal("failed")),
  translated: v.optional(translatedReportFields),
  fields: v.optional(reportFieldTranslations),
  localized: v.optional(v.object({ en: translatedReportFields, ro: translatedReportFields })),
  attempts: v.number(),
  lastError: v.optional(v.string()),
});

const swotTranslationValidator = v.object({
  sourceLanguage: v.union(v.literal("en"), v.literal("ro")),
  sourceUpdatedAt: v.number(),
  status: v.union(v.literal("pending"), v.literal("complete"), v.literal("failed")),
  translated: v.optional(v.object({ title: v.string(), analysis: v.string() })),
  fields: v.optional(v.object({ title: fieldTranslationValidator, analysis: fieldTranslationValidator })),
  localized: v.optional(v.object({
    en: v.object({ title: v.string(), analysis: v.string() }),
    ro: v.object({ title: v.string(), analysis: v.string() }),
  })),
  attempts: v.number(),
  lastError: v.optional(v.string()),
});

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
    translation: v.optional(reportTranslationValidator),
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
    translation: v.optional(swotTranslationValidator),
  }).index("by_external_id", ["externalId"]).index("by_project", ["project"]).index("by_quadrant", ["quadrant"]),
  loginRateLimits: defineTable({
    key: v.string(),
    attempts: v.number(),
    windowStartedAt: v.number(),
    blockedUntil: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  uploadRateLimits: defineTable({
    sessionToken: v.string(),
    windowStartedAt: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_session_token", ["sessionToken"]),
  writeRateLimits: defineTable({
    sessionToken: v.string(),
    windowStartedAt: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_session_token", ["sessionToken"]),
});
