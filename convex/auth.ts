import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";

const SESSION_LENGTH = 30 * 24 * 60 * 60 * 1000;

export const createSession = internalMutation({
  args: { token: v.string(), expiresAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", args);
    return null;
  },
});

export const signIn = action({
  args: { passcode: v.string() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { passcode }): Promise<{ token: string }> => {
    const expected = process.env.AUDIT_PASSCODE;
    if (!expected) throw new Error("AUDIT_PASSCODE is not configured in this Convex deployment.");
    if (passcode.length !== expected.length || passcode !== expected) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      throw new Error("Invalid passcode");
    }
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await ctx.runMutation(internal.auth.createSession, { token, expiresAt: Date.now() + SESSION_LENGTH });
    return { token };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    return Boolean(session && session.expiresAt > Date.now());
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
