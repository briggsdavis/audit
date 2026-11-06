"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { REPORT_PHASES, PHASE_LABELS, type Language, type Project, type ReportPhase } from "../../lib/domain";
import { LanguageToggle, ProjectLogo } from "../ui/AuditControls";

type HeaderCopy = { project: string; phase: string; switchProject: string; logOut: string; viewOnly: string; editAccess: string };

export function AppHeader({ language, project, phase, projects, canEdit, copy, onLanguage, onProject, onPhase, onLogout }: { language: Language; project: Project; phase: ReportPhase; projects: readonly Project[]; canEdit: boolean; copy: HeaderCopy; onLanguage: (language: Language) => void; onProject: (project: Project) => void; onPhase: (phase: ReportPhase) => void; onLogout: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const switchable = projects.length > 0;
  return <header className="max-lg:!h-auto max-lg:flex-wrap max-lg:gap-3 max-lg:py-3"><div><img className="brand-mark small logo-image" src="/alber.png" alt="Alber" /><span className="wordmark">Alber Audit</span><div className={`project-menu ${switchable ? "" : "static"}`} ref={menuRef} onMouseEnter={() => switchable && setOpen(true)} onMouseLeave={() => setOpen(false)}>
    {switchable ? <button className="project-menu-trigger" aria-label={copy.switchProject} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><ProjectLogo project={project} /><span><small>{PHASE_LABELS[language][phase]}</small><strong>{project}</strong></span><b>⌄</b></button> : <div className="project-menu-trigger project-menu-current"><ProjectLogo project={project} /><span><small>{copy.phase} {REPORT_PHASES.indexOf(phase) + 1}</small><strong>{project}</strong></span></div>}
    {switchable && open && <div className="project-menu-panel" role="listbox" aria-label={copy.switchProject}>{projects.map((option) => <button key={option} role="option" aria-selected={option === project} className={option === project ? "active" : ""} onClick={() => { setOpen(false); onProject(option); }}><ProjectLogo project={option} /><span><strong>{option}</strong><small>{language === "ro" ? "Alege faza" : "Choose phase"}</small></span><b>↗</b></button>)}</div>}
  </div></div><div className="header-actions max-sm:!ml-0 max-sm:w-full max-sm:flex-wrap"><div role="group" aria-label={copy.phase} className="flex shrink-0 items-center rounded-lg border border-stone-300 bg-white p-1">{REPORT_PHASES.map((option) => <button key={option} type="button" aria-pressed={phase === option} onClick={() => onPhase(option)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${phase === option ? "bg-[var(--purple)] text-white hover:bg-[var(--purple-dark)]" : "text-stone-600 hover:bg-[var(--purple-soft)]"}`}>{PHASE_LABELS[language][option]}</button>)}</div><span className={`access-badge ${canEdit ? "editor" : "viewer"}`}><i />{canEdit ? copy.editAccess : copy.viewOnly}</span><LanguageToggle language={language} onChange={onLanguage} /><button className="ghost" onClick={onLogout}>{copy.logOut}</button></div></header>;
}
