"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Confirm, ProjectLogo, ValueCommentEditor, ValueIcon } from "./components/ui/AuditControls";
import { ImageDropZone } from "./components/reports/ImageDropZone";
import { ReportCollection } from "./components/reports/ReportCollection";
import { ReportToolbar } from "./components/reports/ReportToolbar";
import { LoginScreen } from "./components/auth/LoginScreen";
import { AppHeader } from "./components/projects/AppHeader";
import { ProjectGate } from "./components/projects/ProjectGate";
import { useAuditSession } from "./hooks/useAuditSession";
import {
  CONTENT_TYPES,
  CONTENT_TYPES_BY_PLATFORM,
  CONTENT_TYPE_LABELS,
  EMPTY_REPORT,
  filterAndSortReports,
  PLATFORMS,
  PLATFORM_LABELS,
  reportsForProject,
  VALUE_TYPES,
  valueTypesFor,
  type Language,
  type Platform,
  type Project,
  type ProjectEntry,
  type Report,
  type ReportSort,
  type ValueType,
} from "./lib/domain";
import { SwotWorkspace } from "./SwotWorkspace";
const COPY = {
  en: {
    contentAudit: "Content audit", enterWorkspace: "Welcome back", loginCopy: "A focused place to review, refine and strengthen every project.", passcode: "Passcode", continue: "Continue", secureNote: "Access stays active for 30 days on this device", authError: "That passcode isn’t correct, or the workspace is not configured yet.",
    logOut: "Log out", reports: "Reports", newReport: "New report", searchReports: "Search reports…", sortReports: "Sort reports", filter: "Filter", project: "Project", chooseProject: "Choose a project", chooseProjectHint: "Select the project workspace you want to open. Each project has its own reports and SWOT analysis.", chooseViaProject: "Choose a Via project", chooseViaProjectHint: "Select the Via project workspace you want to open.", backToProjects: "Back to all projects", switchProject: "Switch project", platform: "Platform", allPlatforms: "All", contentType: "Content type", valueComment: "Value comment", newestFirst: "Newest first", oldestFirst: "Oldest first", done: "Done", select: "Select", listView: "List view", gridView: "Grid view", clearAll: "Clear all", selected: "selected", delete: "Delete", updated: "Updated", open: "Open", noReportsFound: "No reports found", noReportsYet: "No reports yet", noReportsFiltered: "Try removing a filter or using a different search.", noReportsEmpty: "Create your first content audit report to get started.", createAReport: "Create a report",
    reportDetail: "Report detail", editReport: "Edit report", edit: "Edit", cancel: "Cancel", close: "Close", reportTitle: "Report title", titlePlaceholder: "A clear, concise description", sourceUrl: "Source URL", optional: "Optional", commentTopics: "Value comments", commentTopicsHint: "Add only the value categories that apply to this report.", addComment: "Add a value comment", removeComment: "Remove comment", grade: "Grade", gradeOutOfTen: "out of 10", brandValue: "Brand value", brandValuePlaceholder: "How does this content affect or express the brand?", salesValue: "Sales value", salesValuePlaceholder: "How does this content support sales or conversion?", entertainmentValue: "Entertainment value", entertainmentValuePlaceholder: "How engaging or entertaining is this content?", screenshots: "Screenshots", improvementLabel: "How to do this better", improvementPlaceholder: "Explain the recommended improvement…", exampleScreenshots: "Example screenshots", requiredFields: "Required fields", saving: "Saving…", saveChanges: "Save changes", createReport: "Create report", lastUpdated: "Last updated", openSource: "Open source", discardTitle: "Discard unsaved changes?", discardBody: "Your edits won’t be saved.", discardConfirm: "Discard changes", deleteBody: "This will remove the selected reports from the audit.", deleteReports: "Delete reports", saveError: "This report could not be saved. Please try again.", websiteTypePlaceholder: "e.g. Home, About, Contact", savedForProject: "Saved for this project", websiteTypeHint: "Enter a page or section name. It will be saved for this project when the report is saved.",
    optionalMultiple: "Optional · multiple allowed", uploading: "Uploading…", dropImages: "Drop images here", browseImages: "or click to browse · JPEG, PNG, WebP", uploadError: "One or more images could not be uploaded. Please try again.", removeImage: "Remove image",
  },
  ro: {
    contentAudit: "Audit de conținut", enterWorkspace: "Bine ai revenit", loginCopy: "Un spațiu dedicat pentru a analiza și îmbunătăți fiecare proiect.", passcode: "Cod de acces", continue: "Continuă", secureNote: "Accesul rămâne activ timp de 30 de zile pe acest dispozitiv", authError: "Codul de acces este incorect sau spațiul de lucru nu este încă configurat.",
    logOut: "Deconectare", reports: "Rapoarte", newReport: "Raport nou", searchReports: "Caută în rapoarte…", sortReports: "Sortează rapoartele", filter: "Filtre", project: "Proiect", chooseProject: "Alege un proiect", chooseProjectHint: "Selectează spațiul de lucru al proiectului pe care vrei să-l deschizi. Fiecare proiect are propriile rapoarte și propria analiză SWOT.", chooseViaProject: "Alege un proiect Via", chooseViaProjectHint: "Selectează spațiul de lucru Via pe care vrei să-l deschizi.", backToProjects: "Înapoi la toate proiectele", switchProject: "Schimbă proiectul", platform: "Platformă", allPlatforms: "Toate", contentType: "Tip de conținut", valueComment: "Comentariu de valoare", newestFirst: "Cele mai noi", oldestFirst: "Cele mai vechi", done: "Gata", select: "Selectează", listView: "Vizualizare listă", gridView: "Vizualizare grilă", clearAll: "Elimină toate filtrele", selected: "selectate", delete: "Șterge", updated: "Actualizat", open: "Deschide", noReportsFound: "Niciun raport găsit", noReportsYet: "Nu există încă rapoarte", noReportsFiltered: "Încearcă să elimini un filtru sau să folosești altă căutare.", noReportsEmpty: "Creează primul raport de audit de conținut pentru a începe.", createAReport: "Creează un raport",
    reportDetail: "Detalii raport", editReport: "Editează raportul", edit: "Editează", cancel: "Anulează", close: "Închide", reportTitle: "Titlul raportului", titlePlaceholder: "O descriere clară și concisă", sourceUrl: "Adresa URL sursă", optional: "Opțional", commentTopics: "Comentarii de valoare", commentTopicsHint: "Adaugă doar categoriile de valoare relevante pentru acest raport.", addComment: "Adaugă un comentariu de valoare", removeComment: "Elimină comentariul", grade: "Notă", gradeOutOfTen: "din 10", brandValue: "Valoare de brand", brandValuePlaceholder: "Cum influențează sau exprimă acest conținut brandul?", salesValue: "Valoare de vânzări", salesValuePlaceholder: "Cum susține acest conținut vânzările sau conversia?", entertainmentValue: "Valoare de divertisment", entertainmentValuePlaceholder: "Cât de captivant sau distractiv este acest conținut?", screenshots: "Capturi de ecran", improvementLabel: "Cum poate fi îmbunătățit", improvementPlaceholder: "Descrie îmbunătățirea recomandată…", exampleScreenshots: "Capturi de ecran de referință", requiredFields: "Câmpuri obligatorii", saving: "Se salvează…", saveChanges: "Salvează modificările", createReport: "Creează raportul", lastUpdated: "Ultima actualizare", openSource: "Deschide sursa", discardTitle: "Renunți la modificările nesalvate?", discardBody: "Modificările efectuate nu vor fi salvate.", discardConfirm: "Renunță la modificări", deleteBody: "Rapoartele selectate vor fi eliminate din audit.", deleteReports: "Șterge rapoartele", saveError: "Raportul nu a putut fi salvat. Încearcă din nou.", websiteTypePlaceholder: "de ex. Acasă, Despre noi, Contact", savedForProject: "Salvate pentru acest proiect", websiteTypeHint: "Introdu numele unei pagini sau secțiuni. Acesta va fi salvat pentru proiect atunci când salvezi raportul.",
    optionalMultiple: "Opțional · poți adăuga mai multe", uploading: "Se încarcă…", dropImages: "Trage imaginile aici", browseImages: "sau fă clic pentru a le selecta · JPEG, PNG, WebP", uploadError: "Una sau mai multe imagini nu au putut fi încărcate. Încearcă din nou.", removeImage: "Elimină imaginea",
  },
} as const;
export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [choosingViaProject, setChoosingViaProject] = useState(false);
  const { token: sessionToken, authenticated, passcode, authError, setPasscode, signIn, signOut } = useAuditSession();
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<ReportSort>("newest");
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | null>(null);
  const [filters, setFilters] = useState<{ contentType: string[]; valueType: ValueType[] }>({ contentType: [], valueType: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [active, setActive] = useState<Report | null>(null);
  const [draft, setDraft] = useState<Report | null>(null);
  const [activeValueTypes, setActiveValueTypes] = useState<ValueType[]>([]);
  const [editing, setEditing] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [projectTransitioning, setProjectTransitioning] = useState(false);
  const projectTransitionTimer = useRef<number | null>(null);
  const saveReport = useMutation(api.reports.save);
  const removeReports = useMutation(api.reports.remove);
  const removeWebsiteContentType = useMutation(api.reports.removeWebsiteContentType);
  const projectQuery = typeof sessionToken === "string" && authenticated && activeProject ? { token: sessionToken, project: activeProject } : "skip";
  const remoteReports = useQuery(api.reports.list, projectQuery);
  const remoteWebsiteContentTypes = useQuery(api.reports.listWebsiteContentTypes, projectQuery);
  const reports = useMemo(() => (remoteReports ?? []) as Report[], [remoteReports]);
  const projectReports = useMemo(() => activeProject ? reportsForProject(reports, activeProject) : [], [activeProject, reports]);
  const t = COPY[language];

  useEffect(() => {
    queueMicrotask(() => {
      setView((localStorage.getItem("audit-view") as "list" | "grid") || "list");
      setLanguage(localStorage.getItem("audit-language") === "ro" ? "ro" : "en");
    });
  }, []);
  useEffect(() => { localStorage.setItem("audit-view", view); }, [view]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => () => {
    if (projectTransitionTimer.current !== null) window.clearTimeout(projectTransitionTimer.current);
  }, []);

  const visible = useMemo(() => filterAndSortReports(projectReports, {
    query,
    platform: platformFilter,
    contentTypes: filters.contentType,
    valueTypes: filters.valueType,
    sort,
  }), [projectReports, query, platformFilter, filters, sort]);
  const websiteTypesForDraft = useMemo(() => {
    if (!draft) return [];
    return (remoteWebsiteContentTypes ?? []).filter((item) => item.project === draft.project).map((item) => item.name);
  }, [draft, remoteWebsiteContentTypes]);
  const availableContentTypes = useMemo(() => Array.from(new Set([
    ...CONTENT_TYPES,
    ...projectReports.map((report) => report.contentType),
    ...(remoteWebsiteContentTypes ?? []).filter((item) => item.project === activeProject).map((item) => item.name),
  ])), [activeProject, projectReports, remoteWebsiteContentTypes]);

  function openNew() {
    if (!activeProject) return;
    const now = Date.now(); const report: Report = { ...EMPTY_REPORT, project: activeProject, id: crypto.randomUUID(), createdAt: now, updatedAt: now, order: projectReports.length };
    setModalClosing(false); setSaveSuccess(false);
    setActive(report); setDraft(report); setActiveValueTypes([]); setEditing(true);
  }
  function openReport(report: Report) { setModalClosing(false); setSaveSuccess(false); setActive(report); setDraft({ ...report }); setActiveValueTypes(valueTypesFor(report)); setEditing(false); }
  async function save() {
    if (!draft || !sessionToken || !draft.title.trim() || !draft.contentType.trim() || !draft.improvement.trim()) return;
    setSaving(true); setSaveError(false);
    try {
      const next = { ...draft, updatedAt: Date.now() };
      await saveReport({ token: sessionToken, report: { ...next, evidence: next.evidence.map((image) => image.storageId), examples: next.examples.map((image) => image.storageId) } });
      setActive(next); setDraft(next); setSaving(false); setSaveSuccess(true);
      window.setTimeout(() => { setEditing(false); setSaveSuccess(false); }, 620);
    } catch { setSaveError(true); }
    finally { setSaving(false); }
  }
  function removeValueType(type: ValueType) {
    if (!draft) return;
    if (type === "brand") setDraft({ ...draft, brandValue: "", brandGrade: null });
    if (type === "sales") setDraft({ ...draft, salesValue: "", salesGrade: null });
    if (type === "entertainment") setDraft({ ...draft, entertainmentValue: "", entertainmentGrade: null });
    setActiveValueTypes((current) => current.filter((item) => item !== type));
  }
  function dismissModal() {
    if (modalClosing) return;
    setModalClosing(true);
    window.setTimeout(() => {
      setActive(null); setDraft(null); setEditing(false); setModalClosing(false);
    }, 220);
  }
  function closeModal() {
    if (editing && JSON.stringify(draft) !== JSON.stringify(active)) setConfirmClose(true);
    else dismissModal();
  }
  function toggleFilter(group: keyof typeof filters, value: string) {
    setFilters((old) => ({ ...old, [group]: old[group].includes(value as never) ? old[group].filter((item) => item !== value) : [...old[group], value] } as typeof filters));
  }
  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem("audit-language", next);
  }
  function chooseProject(project: Project) {
    const applyProject = () => {
      setActiveProject(project);
      setChoosingViaProject(false);
      setPlatformFilter(null);
      setFilters({ contentType: [], valueType: [] });
      setQuery(""); setSelected([]); setSelectMode(false); setActive(null); setDraft(null);
    };
    if (!activeProject || activeProject === project) { applyProject(); return; }
    setProjectTransitioning(true);
    if (projectTransitionTimer.current !== null) window.clearTimeout(projectTransitionTimer.current);
    projectTransitionTimer.current = window.setTimeout(() => {
      applyProject();
      requestAnimationFrame(() => requestAnimationFrame(() => setProjectTransitioning(false)));
    }, 170);
  }
  function openProjectEntry(project: ProjectEntry) {
    if (project === "Via Project") setChoosingViaProject(true);
    else chooseProject(project);
  }

  if (authenticated === null) return <main className="auth-shell"><div className="loader" /></main>;
  if (!authenticated) return <LoginScreen language={language} copy={t} passcode={passcode} hasError={authError} onLanguage={changeLanguage} onPasscode={setPasscode} onSubmit={signIn} />;

  if (!activeProject) return <ProjectGate language={language} copy={t} choosingVia={choosingViaProject} onLanguage={changeLanguage} onSelect={openProjectEntry} onBack={() => setChoosingViaProject(false)} />;

  return <main className="app-shell">
    <AppHeader language={language} project={activeProject} copy={t} onLanguage={changeLanguage} onProject={chooseProject} onLogout={async () => { await signOut(); setActiveProject(null); }} />
    <div className={`workspace-split ${projectTransitioning ? "project-exit" : ""}`} key={activeProject}>
    <section className="workspace reports-pane">
      <div className="title-row"><div><p className="eyebrow">{activeProject}</p><h1>{t.reports} <span>{projectReports.length}</span></h1></div><button className="primary add" onClick={openNew}><b>＋</b> {t.newReport}</button></div>
      <ReportToolbar language={language} copy={t} query={query} platform={platformFilter} contentTypes={filters.contentType} valueTypes={filters.valueType} availableContentTypes={availableContentTypes} sort={sort} selectMode={selectMode} view={view} onQuery={setQuery} onPlatform={setPlatformFilter} onToggleFilter={toggleFilter} onSort={setSort} onSelectMode={() => { setSelectMode(!selectMode); setSelected([]); }} onView={setView} />
      {Object.values(filters).flat().length > 0 && <div className="chips">{(Object.entries(filters) as [keyof typeof filters, string[]][]).flatMap(([group, values]) => values.map((value) => <button key={group + value} className={`chip ${group}`} onClick={() => toggleFilter(group, value)}>{group === "contentType" ? CONTENT_TYPE_LABELS[language][value] ?? value : value === "brand" ? t.brandValue : value === "sales" ? t.salesValue : t.entertainmentValue} ×</button>))}<button className="clear" onClick={() => setFilters({ contentType: [], valueType: [] })}>{t.clearAll}</button></div>}
      {selectMode && <div className="selection-bar"><span><b key={selected.length}>{selected.length}</b> {language === "ro" ? (selected.length === 1 ? "selectat" : "selectate") : t.selected}</span><button disabled={!selected.length} onClick={() => setConfirmDelete(true)}>{t.delete}</button></div>}
      <ReportCollection reports={visible} totalReports={projectReports.length} language={language} copy={t} view={view} transitionKey={`${view}-${sort}-${query}-${platformFilter ?? "all"}-${JSON.stringify(filters)}`} selected={selected} selectMode={selectMode} onSelect={(reportId) => setSelected((current) => current.includes(reportId) ? current.filter((id) => id !== reportId) : [...current, reportId])} onOpen={openReport} onCreate={openNew} />
    </section>
    {sessionToken && <SwotWorkspace key={activeProject} token={sessionToken} language={language} project={activeProject} reports={projectReports} onOpenReport={(reportId) => { const report = projectReports.find((item) => item.id === reportId); if (report) openReport(report); }} />}
    </div>

    {active && draft && <div className={`modal-backdrop ${modalClosing ? "closing" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && closeModal()}><section className="modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">{reports.some((r) => r.id === active.id) ? t.reportDetail : t.newReport}</p><h2>{editing ? (reports.some((r) => r.id === active.id) ? t.editReport : t.createAReport) : active.title}</h2></div><div>{!editing && <button className="secondary" onClick={() => { setActiveValueTypes(valueTypesFor(active)); setEditing(true); }}>{t.edit}</button>}{editing && reports.some((r) => r.id === active.id) && <button className="secondary" onClick={() => { setDraft({ ...active }); setActiveValueTypes(valueTypesFor(active)); setEditing(false); }}>{t.cancel}</button>}<button className="close" aria-label={t.close} onClick={closeModal}>×</button></div></div>
      {editing ? <form className="report-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="form-grid"><div className="wide"><label className="field-label">{t.reportTitle} *</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t.titlePlaceholder} required /></div>
          <div className="wide"><label className="field-label">{t.project}</label><div className="form-project-context"><ProjectLogo project={draft.project} /><strong>{draft.project}</strong></div></div>
          <div><label className="field-label">{t.sourceUrl} <span>{t.optional}</span></label><input type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" /></div></div>
        <fieldset><legend>{t.platform} *</legend><div className="choice-row">{PLATFORMS.map((p) => <button key={p} type="button" className={draft.platform === p ? "selected" : ""} onClick={() => { if (draft.platform !== p) setDraft({ ...draft, platform: p, contentType: p === "Website" ? "" : CONTENT_TYPES_BY_PLATFORM[p][0] }); }}>{PLATFORM_LABELS[language][p]}</button>)}</div></fieldset>
        <fieldset><legend>{t.contentType} *</legend>{draft.platform === "Website" ? <div className="website-type-editor">
          <input maxLength={80} required value={draft.contentType} onChange={(e) => setDraft({ ...draft, contentType: e.target.value })} placeholder={t.websiteTypePlaceholder} />
          <p>{t.websiteTypeHint}</p>
          {websiteTypesForDraft.length > 0 && <div className="saved-website-types"><span>{t.savedForProject} · {draft.project}</span><div className="website-type-options">{websiteTypesForDraft.map((type) => <div key={type} className={`website-type-option ${draft.contentType.toLocaleLowerCase() === type.toLocaleLowerCase() ? "selected" : ""}`}><button type="button" onClick={() => setDraft({ ...draft, contentType: type })}>{type}</button><button type="button" aria-label={`${t.delete}: ${type}`} onClick={() => sessionToken && removeWebsiteContentType({ token: sessionToken, project: draft.project, name: type })}>×</button></div>)}</div></div>}
        </div> : <div className="choice-row compact">{CONTENT_TYPES_BY_PLATFORM[draft.platform].map((type) => <button key={type} type="button" className={draft.contentType === type ? "selected" : ""} onClick={() => setDraft({ ...draft, contentType: type })}>{CONTENT_TYPE_LABELS[language][type]}</button>)}</div>}</fieldset>
        <fieldset className="value-comments"><div className="value-comments-head"><div><legend>{t.commentTopics} <span>{t.optional}</span></legend><p>{t.commentTopicsHint}</p></div></div>
          <div className="value-add-buttons">{VALUE_TYPES.filter((type) => !activeValueTypes.includes(type)).map((type) => { const label = type === "brand" ? t.brandValue : type === "sales" ? t.salesValue : t.entertainmentValue; return <button type="button" key={type} className={type} onClick={() => setActiveValueTypes((current) => [...current, type])}><span className="value-icon"><ValueIcon type={type} /></span><span>＋ {label}</span></button>; })}</div>
          <div className="value-comment-list">{activeValueTypes.map((type) => type === "brand" ? <ValueCommentEditor key={type} type={type} label={t.brandValue} placeholder={t.brandValuePlaceholder} value={draft.brandValue} grade={draft.brandGrade} gradeLabel={t.grade} gradeSuffix={t.gradeOutOfTen} removeLabel={t.removeComment} onValue={(brandValue) => setDraft({ ...draft, brandValue })} onGrade={(brandGrade) => setDraft({ ...draft, brandGrade })} onRemove={() => removeValueType(type)} /> : type === "sales" ? <ValueCommentEditor key={type} type={type} label={t.salesValue} placeholder={t.salesValuePlaceholder} value={draft.salesValue} grade={draft.salesGrade} gradeLabel={t.grade} gradeSuffix={t.gradeOutOfTen} removeLabel={t.removeComment} onValue={(salesValue) => setDraft({ ...draft, salesValue })} onGrade={(salesGrade) => setDraft({ ...draft, salesGrade })} onRemove={() => removeValueType(type)} /> : <ValueCommentEditor key={type} type={type} label={t.entertainmentValue} placeholder={t.entertainmentValuePlaceholder} value={draft.entertainmentValue} grade={draft.entertainmentGrade} gradeLabel={t.grade} gradeSuffix={t.gradeOutOfTen} removeLabel={t.removeComment} onValue={(entertainmentValue) => setDraft({ ...draft, entertainmentValue })} onGrade={(entertainmentGrade) => setDraft({ ...draft, entertainmentGrade })} onRemove={() => removeValueType(type)} />)}</div>
        </fieldset>
        <ImageDropZone label={t.screenshots} images={draft.evidence} token={sessionToken!} copy={t} onChange={(evidence) => setDraft({ ...draft, evidence })} />
        <div><label className="field-label">{t.improvementLabel} *</label><textarea rows={5} value={draft.improvement} onChange={(e) => setDraft({ ...draft, improvement: e.target.value })} placeholder={t.improvementPlaceholder} required /></div>
        <ImageDropZone label={t.exampleScreenshots} images={draft.examples} token={sessionToken!} copy={t} onChange={(examples) => setDraft({ ...draft, examples })} />
        {saveError && <p className="form-error">{t.saveError}</p>}<div className="form-footer"><span>* {t.requiredFields}</span><button type="button" className="secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className={`primary save-button ${saveSuccess ? "success" : ""}`} disabled={saving || saveSuccess}>{saving ? t.saving : saveSuccess ? (language === "ro" ? "✓ Salvat" : "✓ Saved") : reports.some((r) => r.id === draft.id) ? t.saveChanges : t.createReport}</button></div>
      </form> : <div className="report-detail"><div className="detail-meta"><div><label>{t.project}</label><strong className="detail-project"><ProjectLogo project={active.project} /><span>{active.project}</span></strong></div><div><label>{t.platform}</label><strong>{PLATFORM_LABELS[language][active.platform]}</strong></div><div><label>{t.contentType}</label><strong>{CONTENT_TYPE_LABELS[language][active.contentType] ?? active.contentType}</strong></div><div><label>{t.lastUpdated}</label><strong>{new Date(active.updatedAt).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB")}</strong></div></div>
        {(active.brandValue || active.salesValue || active.entertainmentValue) && <div className="value-comment-detail"><p className="detail-section-label">{t.commentTopics}</p><div>{active.brandValue && <div className="brand"><div><span className="value-icon"><ValueIcon type="brand" /></span><label>{t.brandValue}</label>{active.brandGrade !== null && <strong>{active.brandGrade}<small>/10</small></strong>}</div><p>{active.brandValue}</p></div>}{active.salesValue && <div className="sales"><div><span className="value-icon"><ValueIcon type="sales" /></span><label>{t.salesValue}</label>{active.salesGrade !== null && <strong>{active.salesGrade}<small>/10</small></strong>}</div><p>{active.salesValue}</p></div>}{active.entertainmentValue && <div className="entertainment"><div><span className="value-icon"><ValueIcon type="entertainment" /></span><label>{t.entertainmentValue}</label>{active.entertainmentGrade !== null && <strong>{active.entertainmentGrade}<small>/10</small></strong>}</div><p>{active.entertainmentValue}</p></div>}</div></div>}
        {active.evidence.length > 0 && <div className="detail-images">{active.evidence.map((img, i) => <img key={img.storageId} src={img.url} alt={`${t.screenshots} ${i + 1}`} />)}</div>}
        <div className="detail-block improvement"><label>{t.improvementLabel}</label><p>{active.improvement}</p></div>{active.examples.length > 0 && <><p className="detail-section-label">{t.exampleScreenshots}</p><div className="detail-images">{active.examples.map((img, i) => <img key={img.storageId} src={img.url} alt={`${t.exampleScreenshots} ${i + 1}`} />)}</div></>}{active.url && <a className="source-link" href={active.url} target="_blank" rel="noreferrer">{t.openSource} ↗</a>}
      </div>}
    </section></div>}
    {confirmClose && <Confirm title={t.discardTitle} body={t.discardBody} confirm={t.discardConfirm} cancel={t.cancel} onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); dismissModal(); }} />}
    {confirmDelete && <Confirm danger title={language === "ro" ? `Ștergi ${selected.length} ${selected.length === 1 ? "raport" : "rapoarte"}?` : `Delete ${selected.length} report${selected.length === 1 ? "" : "s"}?`} body={t.deleteBody} confirm={t.deleteReports} cancel={t.cancel} onCancel={() => setConfirmDelete(false)} onConfirm={async () => { if (sessionToken && activeProject) await removeReports({ token: sessionToken, project: activeProject, ids: selected }); setSelected([]); setConfirmDelete(false); }} />}
  </main>;
}
