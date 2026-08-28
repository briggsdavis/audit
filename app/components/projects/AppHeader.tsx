"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { PROJECTS, type Language, type Project } from "../../lib/domain";
import { LanguageToggle, ProjectLogo } from "../ui/AuditControls";

type HeaderCopy = { project: string; switchProject: string; logOut: string };

export function AppHeader({ language, project, copy, onLanguage, onProject, onLogout }: { language: Language; project: Project; copy: HeaderCopy; onLanguage: (language: Language) => void; onProject: (project: Project) => void; onLogout: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <header><div><img className="brand-mark small logo-image" src="/alber.png" alt="Alber" /><span className="wordmark">Alber Audit</span><div className="project-menu" ref={menuRef} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button className="project-menu-trigger" aria-label={copy.switchProject} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><ProjectLogo project={project} /><span><small>{copy.project}</small><strong>{project}</strong></span><b>⌄</b></button>
    {open && <div className="project-menu-panel" role="listbox" aria-label={copy.switchProject}>{PROJECTS.map((option) => <button key={option} role="option" aria-selected={option === project} className={option === project ? "active" : ""} onClick={() => { setOpen(false); onProject(option); }}><ProjectLogo project={option} /><span><strong>{option}</strong><small>{option === project ? (language === "ro" ? "Proiect curent" : "Current project") : (language === "ro" ? "Deschide proiectul" : "Open project")}</small></span><b>↗</b></button>)}</div>}
  </div></div><div className="header-actions"><LanguageToggle language={language} onChange={onLanguage} /><button className="ghost" onClick={onLogout}>{copy.logOut}</button></div></header>;
}
