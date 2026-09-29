"use client";
/* eslint-disable @next/next/no-img-element */

import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, type Language, type Report, type ReportPhase } from "../../lib/domain";
import { ProjectLogo, ValueIcon } from "../ui/AuditControls";

type DetailCopy = {
  reportTitle: string;
  project: string;
  platform: string;
  contentType: string;
  lastUpdated: string;
  commentTopics: string;
  brandValue: string;
  salesValue: string;
  entertainmentValue: string;
  screenshots: string;
  improvementLabel: string;
  exampleScreenshots: string;
  openSource: string;
  problemAnalysis: string;
  recommendedSolution: string;
};

function Meta({ report, language, copy }: { report: Report; language: Language; copy: DetailCopy }) {
  return <div className="detail-meta"><div><label>{copy.project}</label><strong className="detail-project"><ProjectLogo project={report.project} /><span>{report.project}</span></strong></div><div><label>{copy.platform}</label><strong>{PLATFORM_LABELS[language][report.platform]}</strong></div><div><label>{copy.contentType}</label><strong>{CONTENT_TYPE_LABELS[language][report.contentType] ?? report.contentType}</strong></div><div><label>{copy.lastUpdated}</label><strong>{new Date(report.updatedAt).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB")}</strong></div></div>;
}

function Analysis({ report, copy }: { report: Report; copy: DetailCopy }) {
  if (!report.brandValue && !report.salesValue && !report.entertainmentValue) return null;
  return <div className="value-comment-detail"><p className="detail-section-label">{copy.commentTopics}</p><div>
    {report.brandValue && <div className="brand"><div><span className="value-icon"><ValueIcon type="brand" /></span><label>{copy.brandValue}</label>{report.brandGrade !== null && <strong>{report.brandGrade}<small>/10</small></strong>}</div><p>{report.brandValue}</p></div>}
    {report.salesValue && <div className="sales"><div><span className="value-icon"><ValueIcon type="sales" /></span><label>{copy.salesValue}</label>{report.salesGrade !== null && <strong>{report.salesGrade}<small>/10</small></strong>}</div><p>{report.salesValue}</p></div>}
    {report.entertainmentValue && <div className="entertainment"><div><span className="value-icon"><ValueIcon type="entertainment" /></span><label>{copy.entertainmentValue}</label>{report.entertainmentGrade !== null && <strong>{report.entertainmentGrade}<small>/10</small></strong>}</div><p>{report.entertainmentValue}</p></div>}
  </div></div>;
}

function Evidence({ report, copy }: { report: Report; copy: DetailCopy }) {
  return report.evidence.length > 0 ? <div className="detail-images">{report.evidence.map((image, index) => <img key={image.storageId} src={image.url} alt={`${copy.screenshots} ${index + 1}`} />)}</div> : null;
}

function Solution({ report, copy }: { report: Report; copy: DetailCopy }) {
  return <><div className="detail-block improvement"><label>{copy.improvementLabel}</label><p>{report.improvement}</p></div>{report.examples.length > 0 && <><p className="detail-section-label">{copy.exampleScreenshots}</p><div className="detail-images">{report.examples.map((image, index) => <img key={image.storageId} src={image.url} alt={`${copy.exampleScreenshots} ${index + 1}`} />)}</div></>}{report.url && <a className="source-link" href={report.url} target="_blank" rel="noreferrer">{copy.openSource} ↗</a>}</>;
}

export function ReportDetail({ report, phase, language, copy }: { report: Report; phase: ReportPhase; language: Language; copy: DetailCopy }) {
  if (phase === "phase2") return <div className="report-detail report-detail-split">
    <section className="report-detail-column problem-column"><div className="detail-column-heading"><span>01</span><div><small>{language === "ro" ? "Problema" : "The problem"}</small><h3>{copy.problemAnalysis}</h3></div></div><div className="detail-report-title"><label>{copy.reportTitle}</label><h4>{report.title}</h4></div><Meta report={report} language={language} copy={copy} /><Analysis report={report} copy={copy} /><Evidence report={report} copy={copy} /></section>
    <section className="report-detail-column solution-column"><div className="detail-column-heading"><span>02</span><div><small>{language === "ro" ? "Soluția" : "The solution"}</small><h3>{copy.recommendedSolution}</h3></div></div><Solution report={report} copy={copy} /></section>
  </div>;
  return <div className="report-detail"><Meta report={report} language={language} copy={copy} /><Analysis report={report} copy={copy} /><Evidence report={report} copy={copy} /><Solution report={report} copy={copy} /></div>;
}
