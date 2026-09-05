"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { AuditAccess } from "../lib/domain";

export function useAuditSession() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [showLoginIntro, setShowLoginIntro] = useState(false);
  const signInWithPasscode = useAction(api.auth.signIn);
  const signOutSession = useMutation(api.auth.signOut);
  const sessionAccess = useQuery(api.auth.validateSession, typeof token === "string" ? { token } : "skip");
  const authenticated = token === undefined ? null : token === null ? false : sessionAccess === undefined ? null : sessionAccess !== null;

  useEffect(() => {
    queueMicrotask(() => setToken(localStorage.getItem("audit-session")));
  }, []);
  useEffect(() => {
    if (token && sessionAccess === null) localStorage.removeItem("audit-session");
  }, [token, sessionAccess]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setAuthError(false);
    try {
      const result = await signInWithPasscode({ passcode });
      localStorage.setItem("audit-session", result.token);
      setShowLoginIntro(true);
      setToken(result.token);
      setPasscode("");
    } catch {
      setAuthError(true);
    }
  };

  const signOut = async () => {
    if (token) await signOutSession({ token });
    localStorage.removeItem("audit-session");
    setShowLoginIntro(false);
    setToken(null);
  };
  const completeLoginIntro = useCallback(() => setShowLoginIntro(false), []);

  return { token, authenticated, access: (sessionAccess ?? null) as AuditAccess | null, passcode, authError, showLoginIntro, setPasscode, signIn, signOut, completeLoginIntro };
}
