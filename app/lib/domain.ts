import type { Id } from "../../convex/_generated/dataModel";

export const PLATFORMS = ["Instagram", "TikTok", "Advertisement", "Website"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PROJECTS = ["City of Mara", "NordOne", "Vivalia", "Via Carmina", "Via Universitate"] as const;
export type Project = (typeof PROJECTS)[number];
export type ProjectEntry = Project | "Via Project";

export const PROJECT_ENTRIES: readonly ProjectEntry[] = ["City of Mara", "NordOne", "Vivalia", "Via Project"];
export const VIA_PROJECTS: readonly Project[] = ["Via Carmina", "Via Universitate"];

export const PROJECT_LOGOS: Record<ProjectEntry, string> = {
  "City of Mara": "/cityofmara.png",
  NordOne: "/nordone.png",
  Vivalia: "/vivalia1.png",
  "Via Project": "/viaprojects.png",
  "Via Carmina": "/varmina.png",
  "Via Universitate": "/universitate%20.png",
};

export const CONTENT_TYPES_BY_PLATFORM: Record<Platform, readonly string[]> = {
  Instagram: ["Carousel", "Post", "Reel"],
  TikTok: ["Carousel", "Video"],
  Advertisement: ["Carousel", "Image", "Text"],
  Website: [],
};

export const CONTENT_TYPES = ["Carousel", "Post", "Reel", "Video", "Image", "Text", "Website"] as const;
export const VALUE_TYPES = ["brand", "sales", "entertainment"] as const;
export type ValueType = (typeof VALUE_TYPES)[number];
export type Language = "en" | "ro";
export type Quadrant = "strength" | "weakness" | "opportunity" | "threat";
export type ReportSort = "newest" | "oldest" | "platform" | "content";

export type ImageAsset = { storageId: Id<"_storage">; url: string };

export type Report = {
  id: string;
  title: string;
  project: Project;
  platform: Platform;
  contentType: string;
  brandValue: string;
  brandGrade: number | null;
  salesValue: string;
  salesGrade: number | null;
  entertainmentValue: string;
  entertainmentGrade: number | null;
  improvement: string;
  url: string;
  evidence: ImageAsset[];
  examples: ImageAsset[];
  createdAt: number;
  updatedAt: number;
  order: number;
};

export type SwotPoint = {
  id: string;
  project: Project;
  title: string;
  analysis: string;
  quadrant: Quadrant;
  reportIds: string[];
  createdAt: number;
  updatedAt: number;
};

export const EMPTY_REPORT: Omit<Report, "id" | "createdAt" | "updatedAt" | "order"> = {
  title: "",
  project: "City of Mara",
  platform: "Instagram",
  contentType: "Carousel",
  brandValue: "",
  brandGrade: null,
  salesValue: "",
  salesGrade: null,
  entertainmentValue: "",
  entertainmentGrade: null,
  improvement: "",
  url: "",
  evidence: [],
  examples: [],
};

export const PLATFORM_LABELS: Record<Language, Record<Platform, string>> = {
  en: { Instagram: "Instagram", TikTok: "TikTok", Advertisement: "Advertisement", Website: "Website" },
  ro: { Instagram: "Instagram", TikTok: "TikTok", Advertisement: "Publicitate", Website: "Site web" },
};

export const CONTENT_TYPE_LABELS: Record<Language, Record<string, string>> = {
  en: { Carousel: "Carousel", Post: "Post", Reel: "Reel", Video: "Video", Image: "Image", Text: "Text", Website: "Website" },
  ro: { Carousel: "Carusel", Post: "Postare", Reel: "Reel", Video: "Videoclip", Image: "Imagine", Text: "Text", Website: "Site web" },
};

export function valueTypesFor(report: Report) {
  return VALUE_TYPES.filter((type) => {
    if (type === "brand") return Boolean(report.brandValue) || report.brandGrade !== null;
    if (type === "sales") return Boolean(report.salesValue) || report.salesGrade !== null;
    return Boolean(report.entertainmentValue) || report.entertainmentGrade !== null;
  });
}

export type ReportFilters = {
  query: string;
  platform: Platform | null;
  contentTypes: readonly string[];
  valueTypes: readonly ValueType[];
  sort: ReportSort;
};

export function reportsForProject(reports: readonly Report[], project: Project) {
  return reports.filter((report) => report.project === project);
}

export function filterAndSortReports(reports: readonly Report[], filters: ReportFilters) {
  const query = filters.query.toLocaleLowerCase();
  return reports
    .filter((report) => report.title.toLocaleLowerCase().includes(query)
      && (!filters.platform || report.platform === filters.platform)
      && (!filters.contentTypes.length || filters.contentTypes.includes(report.contentType))
      && (!filters.valueTypes.length || filters.valueTypes.every((type) => valueTypesFor(report).includes(type))))
    .sort((left, right) => {
      if (filters.sort === "oldest") return left.createdAt - right.createdAt;
      if (filters.sort === "platform") return left.platform.localeCompare(right.platform);
      if (filters.sort === "content") return left.contentType.localeCompare(right.contentType);
      return right.createdAt - left.createdAt;
    });
}
