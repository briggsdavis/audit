import { ConvexError, v } from "convex/values";

export const projectValidator = v.union(
  v.literal("City of Mara"),
  v.literal("NordOne"),
  v.literal("Nord1"),
  v.literal("Vivalia"),
  v.literal("Via Project"),
  v.literal("Via Carmina"),
  v.literal("Via Universitate"),
);

const PROJECTS = new Set([
  "City of Mara",
  "NordOne",
  "Nord1",
  "Vivalia",
  "Via Project",
  "Via Carmina",
  "Via Universitate",
]);

export function requireProject(project: string) {
  if (!PROJECTS.has(project)) throw new ConvexError("Invalid project");
}

export function publicProjectName(project: string) {
  return project === "Nord1" ? "NordOne" : project;
}

export function storedProjectNames(project: string) {
  requireProject(project);
  return project === "NordOne" ? ["NordOne", "Nord1"] : [project];
}

export function sameProject(left: string, right: string) {
  return publicProjectName(left) === publicProjectName(right);
}
