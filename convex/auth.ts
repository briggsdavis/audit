import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { ACCESS_PROFILES, ACCESS_VERSION, accessLevelValidator, type AccessLevel } from "./lib/access";

const SESSION_LENGTH = 30 * 24 * 60 * 60 * 1000;

export const createSession = internalMutation({
  args: { token: v.string(), expiresAt: v.number(), accessLevel: accessLevelValidator, canEdit: v.boolean(), projects: v.array(v.string()), version: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", args);
    return null;
  },
});

const PASSCODE_ENV: { accessLevel: AccessLevel; env: string; legacyEnv?: string }[] = [
  { accessLevel: "editor", env: "AUDIT_EDITOR_PASSCODE", legacyEnv: "AUDIT_PASSCODE" },
  { accessLevel: "general_view", env: "AUDIT_GENERAL_VIEW_PASSCODE" },
  { accessLevel: "com_view", env: "AUDIT_COM_VIEW_PASSCODE" },
  { accessLevel: "nordone_view", env: "AUDIT_NORDONE_VIEW_PASSCODE" },
  { accessLevel: "via_view", env: "AUDIT_VIA_VIEW_PASSCODE" },
  { accessLevel: "vivalia_view", env: "AUDIT_VIVALIA_VIEW_PASSCODE" },
];

function matchesPasscode(input: string, expected: string) {
  if (input.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < input.length; index += 1) difference |= input.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

export const signIn = action({
  args: { passcode: v.string() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { passcode }): Promise<{ token: string }> => {
    const configured = PASSCODE_ENV.map(({ accessLevel, env, legacyEnv }) => ({
      accessLevel,
      passcode: process.env[env] ?? (legacyEnv ? process.env[legacyEnv] : undefined),
    })).filter((entry): entry is { accessLevel: AccessLevel; passcode: string } => Boolean(entry.passcode));
    if (!configured.length) throw new Error("Audit access passcodes are not configured in this Convex deployment.");
    const match = configured.find((entry) => matchesPasscode(passcode, entry.passcode));
    if (!match) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      throw new Error("Invalid passcode");
    }
    const profile = ACCESS_PROFILES[match.accessLevel];
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await ctx.runMutation(internal.auth.createSession, { token, expiresAt: Date.now() + SESSION_LENGTH, ...profile, version: ACCESS_VERSION });
    return { token };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({ accessLevel: accessLevelValidator, canEdit: v.boolean(), projects: v.array(v.string()) })),
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!session || session.expiresAt <= Date.now() || session.version !== ACCESS_VERSION || !session.accessLevel || session.canEdit === undefined || !session.projects) return null;
    return { accessLevel: session.accessLevel, canEdit: session.canEdit, projects: session.projects };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});
