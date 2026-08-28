"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, valueTypesFor, type Language, type Report, type ValueType } from "../../lib/domain";
import { ProjectLogo, ValueIcon } from "../ui/AuditControls";

type CollectionCopy = {
  brandValue: string; salesValue: string; entertainmentValue: string; updated: string; open: string;
  noReportsFound: string; noReportsYet: string; noReportsFiltered: string; noReportsEmpty: string; createAReport: string;
};

export function ReportCollection({ reports, totalReports, language, copy, view, transitionKey, selected, selectMode, onSelect, onOpen, onCreate }: {
  reports: Report[]; totalReports: number; language: Language; copy: CollectionCopy; view: "list" | "grid"; transitionKey: string;
  selected: string[]; selectMode: boolean; onSelect: (reportId: string) => void; onOpen: (report: Report) => void; onCreate: () => void;
}) {
  const collectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = collectionRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>("article"));
    container.classList.add("motion-ready");
    if (!("IntersectionObserver" in window)) { items.forEach((item) => item.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { root: container.closest(".reports-pane"), threshold: .12, rootMargin: "0px 0px -3% 0px" });
    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 38}ms`);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [reports, view]);

  const valueLabel = (type: ValueType) => type === "brand" ? copy.brandValue : type === "sales" ? copy.salesValue : copy.entertainmentValue;
  return <div ref={collectionRef} key={transitionKey} className={`report-collection ${view} results-transition`}>
    {reports.map((report, index) => {
      const reportValueTypes = valueTypesFor(report);
      return <article key={report.id} onClick={() => selectMode ? onSelect(report.id) : onOpen(report)} className={`${selected.includes(report.id) ? "selected" : ""} ${reportValueTypes.map((type) => `has-${type}`).join(" ")}`}>
        {!!reportValueTypes.length && <span className="report-value-hues" aria-hidden="true">{reportValueTypes.map((type) => <i key={type} className={type} />)}</span>}
        {selectMode && <span className="select-dot">{selected.includes(report.id) ? "✓" : ""}</span>}
        <div className={`thumb ${report.platform.toLowerCase()}`}>{report.evidence[0] ? <img src={report.evidence[0].url} alt="" /> : <span>{report.platform.slice(0, 2).toUpperCase()}</span>}</div>
        <div className="report-main"><div className="meta"><span className={`platform ${report.platform.toLowerCase()}`}>{PLATFORM_LABELS[language][report.platform]}</span><i /> <span>{CONTENT_TYPE_LABELS[language][report.contentType] ?? report.contentType}</span></div><h2>{report.title}</h2>{!!reportValueTypes.length && <div className="report-value-badges">{reportValueTypes.map((type) => { const grade = type === "brand" ? report.brandGrade : type === "sales" ? report.salesGrade : report.entertainmentGrade; return <span key={type} className={type}><ValueIcon type={type} />{valueLabel(type)}{grade !== null && <b>{grade}/10</b>}</span>; })}</div>}<p>{report.brandValue || report.salesValue || report.entertainmentValue || report.improvement}</p></div>
        <div className="project"><div className="project-identity"><ProjectLogo project={report.project} /><span>{report.project}</span></div><small>{copy.updated} {new Date(report.updatedAt).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" })}</small></div><button className="expand" aria-label={`${copy.open} ${report.title}`}>↗</button><span className="number">{String(index + 1).padStart(2, "0")}</span>
      </article>;
    })}
    {!reports.length && <div className="empty"><span>⌕</span><h2>{totalReports ? copy.noReportsFound : copy.noReportsYet}</h2><p>{totalReports ? copy.noReportsFiltered : copy.noReportsEmpty}</p>{!totalReports && <button className="secondary" onClick={onCreate}>{copy.createAReport}</button>}</div>}
  </div>;
}
