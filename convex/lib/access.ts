import { ConvexError, v } from "convex/values";
import { publicProjectName } from "./projects";

export const ACCESS_VERSION = 2;

export const accessLevelValidator = v.union(
  v.literal("editor"),
  v.literal("general_view"),
  v.literal("com_view"),
  v.literal("nordone_view"),
  v.literal("via_view"),
  v.literal("vivalia_view"),
);

export type AccessLevel =
  | "editor"
  | "general_view"
  | "com_view"
  | "nordone_view"
  | "via_view"
  | "vivalia_view";

export type AccessProfile = {
  accessLevel: AccessLevel;
  canEdit: boolean;
  projects: string[];
};

export const ACCESS_PROFILES: Record<AccessLevel, AccessProfile> = {
  editor: { accessLevel: "editor", canEdit: true, projects: ["City of Mara", "NordOne", "Vivalia", "Via Carmina", "Via Universitate"] },
  general_view: { accessLevel: "general_view", canEdit: false, projects: ["City of Mara", "NordOne", "Vivalia", "Via Carmina", "Via Universitate"] },
  com_view: { accessLevel: "com_view", canEdit: false, projects: ["City of Mara"] },
  nordone_view: { accessLevel: "nordone_view", canEdit: false, projects: ["NordOne"] },
  via_view: { accessLevel: "via_view", canEdit: false, projects: ["Via Carmina", "Via Universitate"] },
  vivalia_view: { accessLevel: "vivalia_view", canEdit: false, projects: ["Vivalia"] },
};

type CurrentSession = {
  accessLevel?: AccessLevel;
  canEdit?: boolean;
  projects?: string[];
  version?: number;
};

export function assertCurrentSession(session: CurrentSession): asserts session is CurrentSession & Required<CurrentSession> {
  if (session.version !== ACCESS_VERSION || !session.accessLevel || session.canEdit === undefined || !session.projects) {
    throw new ConvexError("Session expired");
  }
}

export function requireProjectAccess(session: CurrentSession & { projects: string[] }, project: string) {
  const normalizedProject = publicProjectName(project);
  if (!session.projects.some((allowed) => publicProjectName(allowed) === normalizedProject)) {
    throw new ConvexError("You do not have access to this project");
  }
}
