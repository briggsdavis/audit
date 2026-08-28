"use client";
/* eslint-disable @next/next/no-img-element */

import { PROJECT_ENTRIES, VIA_PROJECTS, type Language, type ProjectEntry } from "../../lib/domain";
import { LanguageToggle, ProjectLogo } from "../ui/AuditControls";

type ProjectGateCopy = {
  chooseProject: string;
  chooseProjectHint: string;
  chooseViaProject: string;
  chooseViaProjectHint: string;
  backToProjects: string;
};

export function ProjectGate({ language, copy, choosingVia, onLanguage, onSelect, onBack }: { language: Language; copy: ProjectGateCopy; choosingVia: boolean; onLanguage: (language: Language) => void; onSelect: (project: ProjectEntry) => void; onBack: () => void }) {
  const entries = choosingVia ? VIA_PROJECTS : PROJECT_ENTRIES;
  return <main className="project-gate"><div className="auth-language"><LanguageToggle language={language} onChange={onLanguage} /></div><section className={`project-gate-card ${choosingVia ? "via-project-gate" : ""}`}>
    <img className="brand-mark logo-image" src="/alber.png" alt="Alber" /><p className="eyebrow">{choosingVia ? "Via Project" : "Alber Audit"}</p><h1>{choosingVia ? copy.chooseViaProject : copy.chooseProject}</h1><p>{choosingVia ? copy.chooseViaProjectHint : copy.chooseProjectHint}</p>
    <div className="project-gate-options">{entries.map((project) => <button key={project} onClick={() => onSelect(project)}><ProjectLogo project={project} /><span>{project}</span><b>→</b></button>)}</div>
    {choosingVia && <button className="back-to-projects" onClick={onBack}>← {copy.backToProjects}</button>}
  </section></main>;
}
