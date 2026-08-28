"use client";
/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import type { Language } from "../../lib/domain";
import { LanguageToggle } from "../ui/AuditControls";

type LoginCopy = {
  contentAudit: string;
  enterWorkspace: string;
  loginCopy: string;
  passcode: string;
  continue: string;
  secureNote: string;
  authError: string;
};

export function LoginScreen({ language, copy, passcode, hasError, onLanguage, onPasscode, onSubmit }: { language: Language; copy: LoginCopy; passcode: string; hasError: boolean; onLanguage: (language: Language) => void; onPasscode: (passcode: string) => void; onSubmit: (event: FormEvent) => void }) {
  return <main className="auth-shell"><div className="auth-language"><LanguageToggle language={language} onChange={onLanguage} /></div><section className="login-card">
    <img className="brand-mark logo-image" src="/alber.png" alt="Alber" /><p className="eyebrow">{copy.contentAudit}</p><h1>{copy.enterWorkspace}</h1><p className="login-copy">{copy.loginCopy}</p>
    <form onSubmit={onSubmit}><label className="field-label" htmlFor="passcode">{copy.passcode}</label><input id="passcode" autoFocus type="password" value={passcode} onChange={(event) => onPasscode(event.target.value)} placeholder="••••••••" />
      {hasError && <p className="form-error">{copy.authError}</p>}<button className="primary full" type="submit">{copy.continue} <span>→</span></button></form>
    <p className="secure-note"><i /> {copy.secureNote}</p>
  </section></main>;
}
