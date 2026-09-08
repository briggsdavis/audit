import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { ACCESS_PROFILES, ACCESS_VERSION, accessLevelValidator, type AccessLevel } from "./lib/access";

const SESSION_LENGTH = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

export const createSession = internalMutation({
  args: { token: v.string(), expiresAt: v.number(), accessLevel: accessLevelValidator, canEdit: v.boolean(), projects: v.array(v.string()), version: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", args);
    return null;
  },
});

export const checkLoginRateLimit = internalMutation({
  args: { key: v.string() }, returns: v.null(),
  handler: async (ctx, { key }) => {
    const attempt = await ctx.db.query("loginRateLimits").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (attempt && attempt.blockedUntil > Date.now()) throw new Error("Too many sign-in attempts");
    return null;
  },
});

export const recordFailedLogin = internalMutation({
  args: { key: v.string() }, returns: v.null(),
  handler: async (ctx, { key }) => {
    const now = Date.now();
    const existing = await ctx.db.query("loginRateLimits").withIndex("by_key", (q) => q.eq("key", key)).unique();
    const attempts = !existing || now - existing.windowStartedAt >= LOGIN_WINDOW_MS ? 1 : existing.attempts + 1;
    const value = { attempts, windowStartedAt: !existing || now - existing.windowStartedAt >= LOGIN_WINDOW_MS ? now : existing.windowStartedAt, blockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_BLOCK_MS : 0, updatedAt: now };
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("loginRateLimits", { key, ...value });
    return null;
  },
});

export const clearLoginRateLimit = internalMutation({
  args: { key: v.string() }, returns: v.null(),
  handler: async (ctx, { key }) => {
    const existing = await ctx.db.query("loginRateLimits").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (existing) await ctx.db.delete(existing._id);
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
    const metadata = await ctx.meta.getRequestMetadata();
    const rateLimitKey = metadata.ip ?? metadata.requestId;
    await ctx.runMutation(internal.auth.checkLoginRateLimit, { key: rateLimitKey });
    if (passcode.length < 1 || passcode.length > 256) {
      await ctx.runMutation(internal.auth.recordFailedLogin, { key: rateLimitKey });
      throw new Error("Invalid passcode");
    }
    const configured = PASSCODE_ENV.map(({ accessLevel, env, legacyEnv }) => ({
      accessLevel,
      passcode: process.env[env] ?? (legacyEnv ? process.env[legacyEnv] : undefined),
    })).filter((entry): entry is { accessLevel: AccessLevel; passcode: string } => Boolean(entry.passcode));
    if (!configured.length) throw new Error("Audit access passcodes are not configured in this Convex deployment.");
    const match = configured.find((entry) => matchesPasscode(passcode, entry.passcode));
    if (!match) {
      await ctx.runMutation(internal.auth.recordFailedLogin, { key: rateLimitKey });
      throw new Error("Invalid passcode");
    }
    const profile = ACCESS_PROFILES[match.accessLevel];
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await ctx.runMutation(internal.auth.createSession, { token, expiresAt: Date.now() + SESSION_LENGTH, ...profile, version: ACCESS_VERSION });
    await ctx.runMutation(internal.auth.clearLoginRateLimit, { key: rateLimitKey });
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
