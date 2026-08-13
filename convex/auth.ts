import { actionGeneric, internalMutationGeneric, makeFunctionReference, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const SESSION_LENGTH = 30 * 24 * 60 * 60 * 1000;

const createSessionRef = makeFunctionReference<
  "mutation",
  { token: string; expiresAt: number },
  void
>("auth:createSession");

export const createSession = internalMutationGeneric({
  args: { token: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", args);
  },
});

export const signIn = actionGeneric({
  args: { passcode: v.string() },
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
    await ctx.runMutation(createSessionRef, { token, expiresAt: Date.now() + SESSION_LENGTH });
    return { token };
  },
});

export const validateSession = queryGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    return Boolean(session && session.expiresAt > Date.now());
  },
});

export const signOut = mutationGeneric({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});
