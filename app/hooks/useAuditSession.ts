"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuditSession() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);
  const signInWithPasscode = useAction(api.auth.signIn);
  const signOutSession = useMutation(api.auth.signOut);
  const sessionValid = useQuery(api.auth.validateSession, typeof token === "string" ? { token } : "skip");
  const authenticated = token === undefined ? null : token === null ? false : sessionValid === undefined ? null : sessionValid;

  useEffect(() => {
    queueMicrotask(() => setToken(localStorage.getItem("audit-session")));
  }, []);
  useEffect(() => {
    if (token && sessionValid === false) localStorage.removeItem("audit-session");
  }, [token, sessionValid]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setAuthError(false);
    try {
      const result = await signInWithPasscode({ passcode });
      localStorage.setItem("audit-session", result.token);
      setToken(result.token);
      setPasscode("");
    } catch {
      setAuthError(true);
    }
  };

  const signOut = async () => {
    if (token) await signOutSession({ token });
    localStorage.removeItem("audit-session");
    setToken(null);
  };

  return { token, authenticated, passcode, authError, setPasscode, signIn, signOut };
}
