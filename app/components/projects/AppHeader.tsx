"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { Language, Project } from "../../lib/domain";
import { LanguageToggle, ProjectLogo } from "../ui/AuditControls";

type HeaderCopy = { project: string; switchProject: string; logOut: string; viewOnly: string; editAccess: string };

export function AppHeader({ language, project, projects, canEdit, copy, onLanguage, onProject, onLogout }: { language: Language; project: Project; projects: readonly Project[]; canEdit: boolean; copy: HeaderCopy; onLanguage: (language: Language) => void; onProject: (project: Project) => void; onLogout: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const switchable = projects.length > 1;
  return <header><div><img className="brand-mark small logo-image" src="/alber.png" alt="Alber" /><span className="wordmark">Alber Audit</span><div className={`project-menu ${switchable ? "" : "static"}`} ref={menuRef} onMouseEnter={() => switchable && setOpen(true)} onMouseLeave={() => setOpen(false)}>
    {switchable ? <button className="project-menu-trigger" aria-label={copy.switchProject} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><ProjectLogo project={project} /><span><small>{copy.project}</small><strong>{project}</strong></span><b>⌄</b></button> : <div className="project-menu-trigger project-menu-current"><ProjectLogo project={project} /><span><small>{copy.project}</small><strong>{project}</strong></span></div>}
    {switchable && open && <div className="project-menu-panel" role="listbox" aria-label={copy.switchProject}>{projects.map((option) => <button key={option} role="option" aria-selected={option === project} className={option === project ? "active" : ""} onClick={() => { setOpen(false); onProject(option); }}><ProjectLogo project={option} /><span><strong>{option}</strong><small>{option === project ? (language === "ro" ? "Proiect curent" : "Current project") : (language === "ro" ? "Deschide proiectul" : "Open project")}</small></span><b>↗</b></button>)}</div>}
  </div></div><div className="header-actions"><span className={`access-badge ${canEdit ? "editor" : "viewer"}`}><i />{canEdit ? copy.editAccess : copy.viewOnly}</span><LanguageToggle language={language} onChange={onLanguage} /><button className="ghost" onClick={onLogout}>{copy.logOut}</button></div></header>;
}
