import { v } from "convex/values";

export const imageAssetValidator = v.object({
  storageId: v.id("_storage"),
  url: v.string(),
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
});
