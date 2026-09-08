import { v } from "convex/values";

export const imageAssetValidator = v.object({
  storageId: v.id("_storage"),
  url: v.string(),
});

const translationStatusValidator = v.union(v.literal("pending"), v.literal("complete"), v.literal("failed"));
const languageValidator = v.union(v.literal("en"), v.literal("ro"));

export const reportTranslationValidator = v.object({
  sourceLanguage: languageValidator,
  sourceUpdatedAt: v.number(),
  status: translationStatusValidator,
  translated: v.optional(v.object({
    title: v.string(),
    contentType: v.string(),
    brandValue: v.string(),
    salesValue: v.string(),
    entertainmentValue: v.string(),
    improvement: v.string(),
  })),
  attempts: v.number(),
  lastError: v.optional(v.string()),
});

export const swotTranslationValidator = v.object({
  sourceLanguage: languageValidator,
  sourceUpdatedAt: v.number(),
  status: translationStatusValidator,
  translated: v.optional(v.object({ title: v.string(), analysis: v.string() })),
  attempts: v.number(),
  lastError: v.optional(v.string()),
});

export const reportResultValidator = v.object({
  id: v.string(),
  title: v.string(),
  project: v.string(),
  platform: v.string(),
  contentType: v.string(),
  brandValue: v.string(),
  brandGrade: v.union(v.number(), v.null()),
  salesValue: v.string(),
  salesGrade: v.union(v.number(), v.null()),
  entertainmentValue: v.string(),
  entertainmentGrade: v.union(v.number(), v.null()),
  improvement: v.string(),
  url: v.string(),
  evidence: v.array(imageAssetValidator),
  examples: v.array(imageAssetValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
  order: v.number(),
  translation: v.optional(reportTranslationValidator),
});

export const quadrantValidator = v.union(
  v.literal("strength"),
  v.literal("weakness"),
  v.literal("opportunity"),
  v.literal("threat"),
);

export const swotPointResultValidator = v.object({
  id: v.string(),
  project: v.string(),
  title: v.string(),
  analysis: v.string(),
  quadrant: quadrantValidator,
  reportIds: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  translation: v.optional(swotTranslationValidator),
});
