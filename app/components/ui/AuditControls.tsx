"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { PROJECT_LOGOS, type Language, type ProjectEntry, type ValueType } from "../../lib/domain";

export function ValueIcon({ type }: { type: ValueType }) {
  if (type === "brand") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 14.6 8.3 20.5 9.2 16.2 13.4 17.2 19.3 12 16.5 6.8 19.3 7.8 13.4 3.5 9.2 9.4 8.3Z" /></svg>;
  if (type === "sales") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19V8" /><path d="m4 8 6-5 5 3 5-4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5v9.2a3 3 0 1 1-2-2.82V7l10-2v7.7a3 3 0 1 1-2-2.82V3.5Z" /></svg>;
}

export function ValueCommentEditor({ type, label, placeholder, value, grade, gradeLabel, gradeSuffix, removeLabel, onValue, onGrade, onRemove }: { type: ValueType; label: string; placeholder: string; value: string; grade: number | null; gradeLabel: string; gradeSuffix: string; removeLabel: string; onValue: (value: string) => void; onGrade: (grade: number | null) => void; onRemove: () => void }) {
  return <div className={`value-comment-editor ${type}`}>
    <div className="value-comment-head"><span className="value-icon"><ValueIcon type={type} /></span><strong>{label}</strong><button type="button" aria-label={`${removeLabel}: ${label}`} onClick={onRemove}>×</button></div>
    <AutoGrowTextarea value={value} onChange={onValue} placeholder={placeholder} />
    <label className="value-grade"><span>{gradeLabel}</span><span><input required type="number" min="1" max="10" step="1" value={grade ?? ""} onChange={(event) => onGrade(event.target.value === "" ? null : Number(event.target.value))} /><b>{gradeSuffix}</b></span></label>
  </div>;
}

export function AutoGrowTextarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${textarea.current.scrollHeight}px`;
  }, [value]);
  return <textarea ref={textarea} rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

export function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="language-toggle" aria-label="Language / Limbă"><button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => onChange("en")}>EN</button><button className={language === "ro" ? "active" : ""} aria-pressed={language === "ro"} onClick={() => onChange("ro")}>RO</button></div>;
}

export function ProjectLogo({ project }: { project: ProjectEntry }) {
  const logo = PROJECT_LOGOS[project];
  const imageClass = project === "NordOne" ? "nord" : project === "Via Universitate" ? "via-universitate" : "";
  return <span className={`project-logo ${imageClass}`}><img src={logo} alt={`${project} logo`} /></span>;
}

export function FilterGroup({ title, values, active, toggle, formatValue = (value) => value }: { title: string; values: readonly string[]; active: readonly string[]; toggle: (value: string) => void; formatValue?: (value: string) => string }) {
  return <div className="filter-group"><strong>{title}</strong>{values.map((value) => <label key={value}><input type="checkbox" checked={active.includes(value)} onChange={() => toggle(value)} /><span>{formatValue(value)}</span></label>)}</div>;
}

export function Confirm({ title, body, confirm, cancel, danger, onCancel, onConfirm }: { title: string; body: string; confirm: string; cancel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="confirm-backdrop"><div className="confirm"><div className={danger ? "danger-icon" : "warn-icon"}>{danger ? "×" : "!"}</div><h2>{title}</h2><p>{body}</p><div><button className="secondary" onClick={onCancel}>{cancel}</button><button className={danger ? "danger-button" : "primary"} onClick={onConfirm}>{confirm}</button></div></div></div>;
}
