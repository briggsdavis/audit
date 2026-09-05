"use client";
/* eslint-disable @next/next/no-img-element */

import { PROJECT_ENTRIES, VIA_PROJECTS, type Language, type Project, type ProjectEntry } from "../../lib/domain";
import { LanguageToggle, ProjectLogo } from "../ui/AuditControls";

type ProjectGateCopy = {
  chooseProject: string;
  chooseProjectHint: string;
  chooseViaProject: string;
  chooseViaProjectHint: string;
  backToProjects: string;
};

export function ProjectGate({ language, copy, projects, choosingVia, intro = false, onLanguage, onSelect, onBack }: { language: Language; copy: ProjectGateCopy; projects: readonly Project[]; choosingVia: boolean; intro?: boolean; onLanguage: (language: Language) => void; onSelect: (project: ProjectEntry) => void; onBack: () => void }) {
  const entries: readonly ProjectEntry[] = choosingVia
    ? VIA_PROJECTS
    : PROJECT_ENTRIES;
  const canOpen = (project: ProjectEntry) => project === "Via Projects"
    ? VIA_PROJECTS.some((viaProject) => projects.includes(viaProject))
    : projects.includes(project);
  return <main className={`project-gate ${intro ? "awaiting-intro" : ""}`}><div className="auth-language"><LanguageToggle language={language} onChange={onLanguage} /></div><section className={`project-gate-card ${choosingVia ? "via-project-gate" : ""}`}>
    <img className="brand-mark logo-image" src="/alber.png" alt="Alber" /><p className="eyebrow">{choosingVia ? "Via Projects" : "Alber Audit"}</p><h1>{choosingVia ? copy.chooseViaProject : copy.chooseProject}</h1><p>{choosingVia ? copy.chooseViaProjectHint : copy.chooseProjectHint}</p>
    <div className="project-gate-options">{entries.map((project) => {
      const enabled = canOpen(project);
      return <button key={project} disabled={!enabled} aria-disabled={!enabled} onClick={() => enabled && onSelect(project)}><ProjectLogo project={project} /><span>{project}</span><b>{enabled ? "→" : "—"}</b></button>;
    })}</div>
    {!entries.length && <div className="access-empty"><strong>{language === "ro" ? "Nu există proiecte disponibile" : "No projects available"}</strong><span>{language === "ro" ? "Acest cont nu are încă acces la un proiect." : "This account has not been assigned to a project yet."}</span></div>}
    {choosingVia && <button className="back-to-projects" onClick={onBack}>← {copy.backToProjects}</button>}
  </section></main>;
}
