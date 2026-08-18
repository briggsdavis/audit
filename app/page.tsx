"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { SwotWorkspace } from "./SwotWorkspace";

type Platform = "Instagram" | "TikTok" | "Advertisement" | "Website";
type Project = "City of Mara" | "Nord1" | "Vivalia" | "Via Project";
type Language = "en" | "ro";
type ImageAsset = { storageId: string; url: string };
type Report = {
  id: string;
  title: string;
  project: Project;
  platform: Platform;
  contentType: string;
  brandValue: string;
  salesValue: string;
  entertainmentValue: string;
  issue: string;
  improvement: string;
  url: string;
  evidence: ImageAsset[];
  examples: ImageAsset[];
  createdAt: number;
  updatedAt: number;
  order: number;
};

const SIGN_IN = makeFunctionReference<"action", { passcode: string }, { token: string }>("auth:signIn");
const VALIDATE_SESSION = makeFunctionReference<"query", { token: string }, boolean>("auth:validateSession");
const SIGN_OUT = makeFunctionReference<"mutation", { token: string }, void>("auth:signOut");
const LIST_REPORTS = makeFunctionReference<"query", { token: string }, Report[]>("reports:list");
const SAVE_REPORT = makeFunctionReference<"mutation", { token: string; report: Omit<Report, "evidence" | "examples"> & { evidence: string[]; examples: string[] } }, void>("reports:save");
const REMOVE_REPORTS = makeFunctionReference<"mutation", { token: string; ids: string[] }, void>("reports:remove");
const REORDER_REPORTS = makeFunctionReference<"mutation", { token: string; ids: string[] }, void>("reports:reorder");
const GENERATE_UPLOAD_URL = makeFunctionReference<"mutation", { token: string }, string>("reports:generateUploadUrl");
const LIST_WEBSITE_CONTENT_TYPES = makeFunctionReference<"query", { token: string }, { project: string; name: string }[]>("reports:listWebsiteContentTypes");

const PROJECTS: Project[] = ["City of Mara", "Nord1", "Vivalia", "Via Project"];
const TYPES: Record<Platform, string[]> = {
  Instagram: ["Carousel", "Post", "Reel"],
  TikTok: ["Carousel", "Video"],
  Advertisement: ["Carousel", "Image", "Text"],
  Website: [],
};
const PLATFORMS = Object.keys(TYPES) as Platform[];
const CONTENT_TYPES = ["Carousel", "Post", "Reel", "Video", "Image", "Text", "Website"];
const COPY = {
  en: {
    contentAudit: "Content audit", enterWorkspace: "Enter the workspace", loginCopy: "Use the shared passcode to review and organise your team’s content reports.", passcode: "Passcode", continue: "Continue", secureNote: "Access stays active for 30 days on this device", authError: "That passcode isn’t correct, or the workspace is not configured yet.",
    logOut: "Log out", reports: "Reports", newReport: "New report", searchReports: "Search reports…", sortReports: "Sort reports", filter: "Filter", project: "Project", platform: "Platform", contentType: "Content type", manualOrder: "Manual order", newestFirst: "Newest first", oldestFirst: "Oldest first", done: "Done", select: "Select", listView: "List view", gridView: "Grid view", clearAll: "Clear all", selected: "selected", delete: "Delete", reorderNote: "Clear search and filters to reorder reports.", updated: "Updated", open: "Open", noReportsFound: "No reports found", noReportsYet: "No reports yet", noReportsFiltered: "Try removing a filter or using a different search.", noReportsEmpty: "Create your first content audit report to get started.", createAReport: "Create a report",
    reportDetail: "Report detail", editReport: "Edit report", edit: "Edit", cancel: "Cancel", close: "Close", reportTitle: "Report title", titlePlaceholder: "A clear, concise description", sourceUrl: "Source URL", optional: "Optional", commentTopics: "Comment topics", commentTopicsHint: "Add observations for any of the topics that apply to this report.", brandValue: "Brand value", brandValuePlaceholder: "How does this content affect or express the brand?", salesValue: "Sales value", salesValuePlaceholder: "How does this content support sales or conversion?", entertainmentValue: "Entertainment value", entertainmentValuePlaceholder: "How engaging or entertaining is this content?", issueLabel: "What is wrong and why?", issuePlaceholder: "Describe the problem, its impact, and any relevant context…", screenshots: "Screenshots", improvementLabel: "How to do this better", improvementPlaceholder: "Explain the recommended improvement…", exampleScreenshots: "Example screenshots", requiredFields: "Required fields", saving: "Saving…", saveChanges: "Save changes", createReport: "Create report", lastUpdated: "Last updated", openSource: "Open source", discardTitle: "Discard unsaved changes?", discardBody: "Your edits won’t be saved.", discardConfirm: "Discard changes", deleteBody: "This will remove the selected reports from the audit.", deleteReports: "Delete reports", saveError: "This report could not be saved. Please try again.", websiteTypePlaceholder: "e.g. Home, About, Contact", savedForProject: "Saved for this project", websiteTypeHint: "Enter a page or section name. It will be saved for this project when the report is saved.",
    optionalMultiple: "Optional · multiple allowed", uploading: "Uploading…", dropImages: "Drop images here", browseImages: "or click to browse · JPEG, PNG, WebP", uploadError: "One or more images could not be uploaded. Please try again.", removeImage: "Remove image",
  },
  ro: {
    contentAudit: "Audit de conținut", enterWorkspace: "Accesează spațiul de lucru", loginCopy: "Folosește codul de acces comun pentru a consulta și organiza rapoartele de conținut ale echipei.", passcode: "Cod de acces", continue: "Continuă", secureNote: "Accesul rămâne activ timp de 30 de zile pe acest dispozitiv", authError: "Codul de acces este incorect sau spațiul de lucru nu este încă configurat.",
    logOut: "Deconectare", reports: "Rapoarte", newReport: "Raport nou", searchReports: "Caută în rapoarte…", sortReports: "Sortează rapoartele", filter: "Filtre", project: "Proiect", platform: "Platformă", contentType: "Tip de conținut", manualOrder: "Ordine manuală", newestFirst: "Cele mai noi", oldestFirst: "Cele mai vechi", done: "Gata", select: "Selectează", listView: "Vizualizare listă", gridView: "Vizualizare grilă", clearAll: "Elimină toate filtrele", selected: "selectate", delete: "Șterge", reorderNote: "Elimină căutarea și filtrele pentru a reordona rapoartele.", updated: "Actualizat", open: "Deschide", noReportsFound: "Niciun raport găsit", noReportsYet: "Nu există încă rapoarte", noReportsFiltered: "Încearcă să elimini un filtru sau să folosești altă căutare.", noReportsEmpty: "Creează primul raport de audit de conținut pentru a începe.", createAReport: "Creează un raport",
    reportDetail: "Detalii raport", editReport: "Editează raportul", edit: "Editează", cancel: "Anulează", close: "Închide", reportTitle: "Titlul raportului", titlePlaceholder: "O descriere clară și concisă", sourceUrl: "Adresa URL sursă", optional: "Opțional", commentTopics: "Temele comentariilor", commentTopicsHint: "Adaugă observații pentru oricare dintre temele relevante acestui raport.", brandValue: "Valoare de brand", brandValuePlaceholder: "Cum influențează sau exprimă acest conținut brandul?", salesValue: "Valoare de vânzări", salesValuePlaceholder: "Cum susține acest conținut vânzările sau conversia?", entertainmentValue: "Valoare de divertisment", entertainmentValuePlaceholder: "Cât de captivant sau distractiv este acest conținut?", issueLabel: "Ce nu funcționează și de ce?", issuePlaceholder: "Descrie problema, impactul acesteia și orice context relevant…", screenshots: "Capturi de ecran", improvementLabel: "Cum poate fi îmbunătățit", improvementPlaceholder: "Descrie îmbunătățirea recomandată…", exampleScreenshots: "Capturi de ecran de referință", requiredFields: "Câmpuri obligatorii", saving: "Se salvează…", saveChanges: "Salvează modificările", createReport: "Creează raportul", lastUpdated: "Ultima actualizare", openSource: "Deschide sursa", discardTitle: "Renunți la modificările nesalvate?", discardBody: "Modificările efectuate nu vor fi salvate.", discardConfirm: "Renunță la modificări", deleteBody: "Rapoartele selectate vor fi eliminate din audit.", deleteReports: "Șterge rapoartele", saveError: "Raportul nu a putut fi salvat. Încearcă din nou.", websiteTypePlaceholder: "de ex. Acasă, Despre noi, Contact", savedForProject: "Salvate pentru acest proiect", websiteTypeHint: "Introdu numele unei pagini sau secțiuni. Acesta va fi salvat pentru proiect atunci când salvezi raportul.",
    optionalMultiple: "Opțional · poți adăuga mai multe", uploading: "Se încarcă…", dropImages: "Trage imaginile aici", browseImages: "sau fă clic pentru a le selecta · JPEG, PNG, WebP", uploadError: "Una sau mai multe imagini nu au putut fi încărcate. Încearcă din nou.", removeImage: "Elimină imaginea",
  },
} as const;
const PLATFORM_LABELS: Record<Language, Record<Platform, string>> = {
  en: { Instagram: "Instagram", TikTok: "TikTok", Advertisement: "Advertisement", Website: "Website" },
  ro: { Instagram: "Instagram", TikTok: "TikTok", Advertisement: "Publicitate", Website: "Site web" },
};
const CONTENT_TYPE_LABELS: Record<Language, Record<string, string>> = {
  en: { Carousel: "Carousel", Post: "Post", Reel: "Reel", Video: "Video", Image: "Image", Text: "Text", Website: "Website" },
  ro: { Carousel: "Carusel", Post: "Postare", Reel: "Reel", Video: "Videoclip", Image: "Imagine", Text: "Text", Website: "Site web" },
};
const EMPTY: Omit<Report, "id" | "createdAt" | "updatedAt" | "order"> = {
  title: "",
  project: "City of Mara",
  platform: "Instagram",
  contentType: "Carousel",
  brandValue: "",
  salesValue: "",
  entertainmentValue: "",
  issue: "",
  improvement: "",
  url: "",
  evidence: [],
  examples: [],
};

function DropZone({ label, images, token, language, onChange }: { label: string; images: ImageAsset[]; token: string; language: Language; onChange: (next: ImageAsset[]) => void }) {
  const t = COPY[language];
  const input = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(GENERATE_UPLOAD_URL);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const add = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (!valid.length) return;
    setUploading(true); setUploadError(false);
    try {
      const incoming = await Promise.all(valid.map(async (file) => {
        const uploadUrl = await generateUploadUrl({ token });
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json() as { storageId: string };
        return { storageId, url: URL.createObjectURL(file) };
      }));
      onChange([...images, ...incoming]);
    } catch { setUploadError(true); }
    finally { setUploading(false); }
  };
  return <div>
    <label className="field-label">{label} <span>{t.optionalMultiple}</span></label>
    <div className="dropzone" tabIndex={0} role="button" onClick={() => input.current?.click()}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      onPaste={(e) => add(e.clipboardData.files)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }}>
      <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && add(e.target.files)} />
      <span className="upload-icon">↑</span><strong>{uploading ? t.uploading : t.dropImages}</strong><small>{t.browseImages}</small>
    </div>
    {uploadError && <p className="form-error">{t.uploadError}</p>}
    {images.length > 0 && <div className="image-strip">{images.map((image, index) => <div className="image-chip" key={image.storageId}>
      <img src={image.url} alt={`${label} ${index + 1}`} />
      <button type="button" aria-label={t.removeImage} onClick={() => onChange(images.filter((_, i) => i !== index))}>×</button>
    </div>)}</div>}
  </div>;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [section, setSection] = useState<"reports" | "swot">("reports");
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState("manual");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{ project: Project[]; platform: Platform[]; contentType: string[] }>({ project: [], platform: [], contentType: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [active, setActive] = useState<Report | null>(null);
  const [draft, setDraft] = useState<Report | null>(null);
  const [editing, setEditing] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const dragId = useRef<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const signInWithPasscode = useAction(SIGN_IN);
  const signOutSession = useMutation(SIGN_OUT);
  const saveReport = useMutation(SAVE_REPORT);
  const removeReports = useMutation(REMOVE_REPORTS);
  const reorderReports = useMutation(REORDER_REPORTS);
  const sessionValid = useQuery(VALIDATE_SESSION, typeof sessionToken === "string" ? { token: sessionToken } : "skip");
  const remoteReports = useQuery(LIST_REPORTS, typeof sessionToken === "string" && sessionValid ? { token: sessionToken } : "skip");
  const remoteWebsiteContentTypes = useQuery(LIST_WEBSITE_CONTENT_TYPES, typeof sessionToken === "string" && sessionValid ? { token: sessionToken } : "skip");
  const reports = useMemo(() => remoteReports ?? [], [remoteReports]);
  const authenticated = sessionToken === undefined ? null : sessionToken === null ? false : sessionValid === undefined ? null : sessionValid;
  const t = COPY[language];

  useEffect(() => {
    queueMicrotask(() => {
      setSessionToken(localStorage.getItem("audit-session"));
      setView((localStorage.getItem("audit-view") as "list" | "grid") || "list");
      setLanguage(localStorage.getItem("audit-language") === "ro" ? "ro" : "en");
      setSection(localStorage.getItem("audit-section") === "swot" ? "swot" : "reports");
    });
  }, []);
  useEffect(() => {
    if (sessionToken && sessionValid === false) {
      localStorage.removeItem("audit-session");
    }
  }, [sessionToken, sessionValid]);
  useEffect(() => { localStorage.setItem("audit-view", view); }, [view]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    if (!filterOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterOpen]);

  const visible = useMemo(() => {
    const filtered = reports.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())
      && (!filters.project.length || filters.project.includes(r.project))
      && (!filters.platform.length || filters.platform.includes(r.platform))
      && (!filters.contentType.length || filters.contentType.includes(r.contentType)));
    return [...filtered].sort((a, b) => {
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "project") return a.project.localeCompare(b.project);
      if (sort === "platform") return a.platform.localeCompare(b.platform);
      if (sort === "content") return a.contentType.localeCompare(b.contentType);
      return a.order - b.order;
    });
  }, [reports, query, filters, sort]);
  const websiteTypesForDraft = useMemo(() => {
    if (!draft) return [];
    return (remoteWebsiteContentTypes ?? []).filter((item) => item.project === draft.project).map((item) => item.name);
  }, [draft, remoteWebsiteContentTypes]);
  const availableContentTypes = useMemo(() => Array.from(new Set([
    ...CONTENT_TYPES,
    ...reports.map((report) => report.contentType),
    ...(remoteWebsiteContentTypes ?? []).map((item) => item.name),
  ])), [reports, remoteWebsiteContentTypes]);
  const hasFilters = !!(query || filters.project.length || filters.platform.length || filters.contentType.length);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setAuthError(false);
    try {
      const { token } = await signInWithPasscode({ passcode });
      localStorage.setItem("audit-session", token);
      setSessionToken(token);
      setPasscode("");
    } catch { setAuthError(true); }
  }
  function openNew() {
    const now = Date.now(); const report: Report = { ...EMPTY, id: crypto.randomUUID(), createdAt: now, updatedAt: now, order: reports.length };
    setModalClosing(false);
    setActive(report); setDraft(report); setEditing(true);
  }
  function openReport(report: Report) { setModalClosing(false); setActive(report); setDraft({ ...report }); setEditing(false); }
  async function save() {
    if (!draft || !sessionToken || !draft.title.trim() || !draft.contentType.trim() || !draft.issue.trim() || !draft.improvement.trim()) return;
    setSaving(true); setSaveError(false);
    try {
      const next = { ...draft, updatedAt: Date.now() };
      await saveReport({ token: sessionToken, report: { ...next, evidence: next.evidence.map((image) => image.storageId), examples: next.examples.map((image) => image.storageId) } });
      setActive(next); setDraft(next); setEditing(false);
    } catch { setSaveError(true); }
    finally { setSaving(false); }
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
  async function reorder(targetId: string) {
    if (!sessionToken || !dragId.current || dragId.current === targetId || sort !== "manual" || hasFilters) return;
    const ordered = [...reports].sort((a, b) => a.order - b.order); const to = ordered.findIndex((r) => r.id === targetId);
    const movingIds = selected.includes(dragId.current) ? selected : [dragId.current]; const moving = ordered.filter((r) => movingIds.includes(r.id)); const rest = ordered.filter((r) => !movingIds.includes(r.id));
    const insert = Math.max(0, rest.findIndex((r) => r.id === ordered[to]?.id)); rest.splice(insert, 0, ...moving);
    await reorderReports({ token: sessionToken, ids: rest.map((r) => r.id) }); dragId.current = null;
  }
  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem("audit-language", next);
  }
  function changeSection(next: "reports" | "swot") {
    setSection(next);
    localStorage.setItem("audit-section", next);
  }

  if (authenticated === null) return <main className="auth-shell"><div className="loader" /></main>;
  if (!authenticated) return <main className="auth-shell"><div className="auth-language"><LanguageToggle language={language} onChange={changeLanguage} /></div><section className="login-card">
    <div className="brand-mark">A</div><p className="eyebrow">{t.contentAudit}</p><h1>{t.enterWorkspace}</h1><p className="login-copy">{t.loginCopy}</p>
    <form onSubmit={signIn}><label className="field-label" htmlFor="passcode">{t.passcode}</label><input id="passcode" autoFocus type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••••••" />
      {authError && <p className="form-error">{t.authError}</p>}<button className="primary full" type="submit">{t.continue} <span>→</span></button></form>
    <p className="secure-note"><i /> {t.secureNote}</p>
  </section></main>;

  return <main className="app-shell">
    <header><div><div className="brand-mark small">A</div><span className="wordmark">Alber Audit</span></div><nav className="section-toggle" aria-label="Workspace"><button className={section === "reports" ? "active" : ""} onClick={() => changeSection("reports")}>{t.reports}</button><button className={section === "swot" ? "active" : ""} onClick={() => changeSection("swot")}>SWOT</button></nav><div className="header-actions"><LanguageToggle language={language} onChange={changeLanguage} /><button className="ghost" onClick={async () => { if (sessionToken) await signOutSession({ token: sessionToken }); localStorage.removeItem("audit-session"); setSessionToken(null); }}>{t.logOut}</button></div></header>
    <section className="workspace" hidden={section !== "reports"}>
      <div className="title-row"><h1>{t.reports} <span>{reports.length}</span></h1><button className="primary add" onClick={openNew}><b>＋</b> {t.newReport}</button></div>
      <div className="toolbar">
        <div className="search"><span>⌕</span><input aria-label={t.searchReports} placeholder={t.searchReports} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="toolbar-actions">
          <div className="filter-wrap" ref={filterRef}><button aria-expanded={filterOpen} className={`tool-button ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen(!filterOpen)}>≡ <span>{t.filter}</span>{Object.values(filters).flat().length > 0 && <b>{Object.values(filters).flat().length}</b>}</button>
            {filterOpen && <div className="filter-menu">
              <FilterGroup title={t.project} values={PROJECTS} active={filters.project} toggle={(v) => toggleFilter("project", v)} />
              <FilterGroup title={t.platform} values={PLATFORMS} active={filters.platform} toggle={(v) => toggleFilter("platform", v)} formatValue={(v) => PLATFORM_LABELS[language][v as Platform]} />
              <FilterGroup title={t.contentType} values={availableContentTypes} active={filters.contentType} toggle={(v) => toggleFilter("contentType", v)} formatValue={(v) => CONTENT_TYPE_LABELS[language][v] ?? v} />
            </div>}
          </div>
          <select aria-label={t.sortReports} value={sort} onChange={(e) => setSort(e.target.value)}><option value="manual">{t.manualOrder}</option><option value="newest">{t.newestFirst}</option><option value="oldest">{t.oldestFirst}</option><option value="project">{t.project}</option><option value="platform">{t.platform}</option><option value="content">{t.contentType}</option></select>
          <button className={`tool-button ${selectMode ? "active" : ""}`} onClick={() => { setSelectMode(!selectMode); setSelected([]); }}>✓ <span>{selectMode ? t.done : t.select}</span></button>
          <div className="view-switch"><button aria-label={t.listView} className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷</button><button aria-label={t.gridView} className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>▦</button></div>
        </div>
      </div>
      {Object.values(filters).flat().length > 0 && <div className="chips">{(Object.entries(filters) as [keyof typeof filters, string[]][]).flatMap(([group, values]) => values.map((value) => <button key={group + value} className={`chip ${group}`} onClick={() => toggleFilter(group, value)}>{group === "platform" ? PLATFORM_LABELS[language][value as Platform] : group === "contentType" ? CONTENT_TYPE_LABELS[language][value] : value} ×</button>))}<button className="clear" onClick={() => setFilters({ project: [], platform: [], contentType: [] })}>{t.clearAll}</button></div>}
      {selectMode && <div className="selection-bar"><span><b>{selected.length}</b> {language === "ro" ? (selected.length === 1 ? "selectat" : "selectate") : t.selected}</span><button disabled={!selected.length} onClick={() => setConfirmDelete(true)}>{t.delete}</button></div>}
      {sort === "manual" && hasFilters && <p className="reorder-note">{t.reorderNote}</p>}
      <div className={`report-collection ${view}`}>
        {visible.map((report, index) => <article key={report.id} draggable={sort === "manual" && !hasFilters} onDragStart={() => dragId.current = report.id} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(report.id)} onClick={() => selectMode ? setSelected((s) => s.includes(report.id) ? s.filter((id) => id !== report.id) : [...s, report.id]) : openReport(report)} className={selected.includes(report.id) ? "selected" : ""}>
          {selectMode && <span className="select-dot">{selected.includes(report.id) ? "✓" : ""}</span>}
          <span className="drag">⠿</span><div className={`thumb ${report.platform.toLowerCase()}`}>{report.evidence[0] ? <img src={report.evidence[0].url} alt="" /> : <span>{report.platform.slice(0, 2).toUpperCase()}</span>}</div>
          <div className="report-main"><div className="meta"><span className={`platform ${report.platform.toLowerCase()}`}>{PLATFORM_LABELS[language][report.platform]}</span><i /> <span>{CONTENT_TYPE_LABELS[language][report.contentType] ?? report.contentType}</span></div><h2>{report.title}</h2><p>{report.issue}</p></div>
          <div className="project"><span>{report.project}</span><small>{t.updated} {new Date(report.updatedAt).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" })}</small></div><button className="expand" aria-label={`${t.open} ${report.title}`}>↗</button><span className="number">{String(index + 1).padStart(2, "0")}</span>
        </article>)}
        {!visible.length && <div className="empty"><span>⌕</span><h2>{reports.length ? t.noReportsFound : t.noReportsYet}</h2><p>{reports.length ? t.noReportsFiltered : t.noReportsEmpty}</p>{!reports.length && <button className="secondary" onClick={openNew}>{t.createAReport}</button>}</div>}
      </div>
    </section>
    {section === "swot" && sessionToken && <SwotWorkspace token={sessionToken} language={language} reports={reports} onOpenReport={(reportId) => { const report = reports.find((item) => item.id === reportId); if (report) { changeSection("reports"); openReport(report); } }} />}

    {active && draft && <div className={`modal-backdrop ${modalClosing ? "closing" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && closeModal()}><section className="modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">{reports.some((r) => r.id === active.id) ? t.reportDetail : t.newReport}</p><h2>{editing ? (reports.some((r) => r.id === active.id) ? t.editReport : t.createAReport) : active.title}</h2></div><div>{!editing && <button className="secondary" onClick={() => setEditing(true)}>{t.edit}</button>}{editing && reports.some((r) => r.id === active.id) && <button className="secondary" onClick={() => { setDraft({ ...active }); setEditing(false); }}>{t.cancel}</button>}<button className="close" aria-label={t.close} onClick={closeModal}>×</button></div></div>
      {editing ? <form className="report-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="form-grid"><div className="wide"><label className="field-label">{t.reportTitle} *</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t.titlePlaceholder} required /></div>
          <div><label className="field-label">{t.project} *</label><select value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value as Project, contentType: draft.platform === "Website" ? "" : draft.contentType })}>{PROJECTS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label">{t.sourceUrl} <span>{t.optional}</span></label><input type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" /></div></div>
        <fieldset><legend>{t.platform} *</legend><div className="choice-row">{PLATFORMS.map((p) => <button key={p} type="button" className={draft.platform === p ? "selected" : ""} onClick={() => { if (draft.platform !== p) setDraft({ ...draft, platform: p, contentType: p === "Website" ? "" : TYPES[p][0] }); }}>{PLATFORM_LABELS[language][p]}</button>)}</div></fieldset>
        <fieldset><legend>{t.contentType} *</legend>{draft.platform === "Website" ? <div className="website-type-editor">
          <input maxLength={80} required value={draft.contentType} onChange={(e) => setDraft({ ...draft, contentType: e.target.value })} placeholder={t.websiteTypePlaceholder} />
          <p>{t.websiteTypeHint}</p>
          {websiteTypesForDraft.length > 0 && <div className="saved-website-types"><span>{t.savedForProject} · {draft.project}</span><div className="choice-row compact">{websiteTypesForDraft.map((type) => <button key={type} type="button" className={draft.contentType.toLocaleLowerCase() === type.toLocaleLowerCase() ? "selected" : ""} onClick={() => setDraft({ ...draft, contentType: type })}>{type}</button>)}</div></div>}
        </div> : <div className="choice-row compact">{TYPES[draft.platform].map((type) => <button key={type} type="button" className={draft.contentType === type ? "selected" : ""} onClick={() => setDraft({ ...draft, contentType: type })}>{CONTENT_TYPE_LABELS[language][type]}</button>)}</div>}</fieldset>
        {(draft.platform === "Instagram" || draft.platform === "TikTok") && <fieldset className="social-comments"><legend>{t.commentTopics} <span>{t.optional}</span></legend><p>{t.commentTopicsHint}</p><div>
          <label><span>{t.brandValue}</span><textarea rows={4} value={draft.brandValue} onChange={(e) => setDraft({ ...draft, brandValue: e.target.value })} placeholder={t.brandValuePlaceholder} /></label>
          <label><span>{t.salesValue}</span><textarea rows={4} value={draft.salesValue} onChange={(e) => setDraft({ ...draft, salesValue: e.target.value })} placeholder={t.salesValuePlaceholder} /></label>
          <label><span>{t.entertainmentValue}</span><textarea rows={4} value={draft.entertainmentValue} onChange={(e) => setDraft({ ...draft, entertainmentValue: e.target.value })} placeholder={t.entertainmentValuePlaceholder} /></label>
        </div></fieldset>}
        <div><label className="field-label">{t.issueLabel} *</label><textarea rows={5} value={draft.issue} onChange={(e) => setDraft({ ...draft, issue: e.target.value })} placeholder={t.issuePlaceholder} required /></div>
        <DropZone label={t.screenshots} images={draft.evidence} token={sessionToken!} language={language} onChange={(evidence) => setDraft({ ...draft, evidence })} />
        <div><label className="field-label">{t.improvementLabel} *</label><textarea rows={5} value={draft.improvement} onChange={(e) => setDraft({ ...draft, improvement: e.target.value })} placeholder={t.improvementPlaceholder} required /></div>
        <DropZone label={t.exampleScreenshots} images={draft.examples} token={sessionToken!} language={language} onChange={(examples) => setDraft({ ...draft, examples })} />
        {saveError && <p className="form-error">{t.saveError}</p>}<div className="form-footer"><span>* {t.requiredFields}</span><button type="button" className="secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className="primary" disabled={saving}>{saving ? t.saving : reports.some((r) => r.id === draft.id) ? t.saveChanges : t.createReport}</button></div>
      </form> : <div className="report-detail"><div className="detail-meta"><div><label>{t.project}</label><strong>{active.project}</strong></div><div><label>{t.platform}</label><strong>{PLATFORM_LABELS[language][active.platform]}</strong></div><div><label>{t.contentType}</label><strong>{CONTENT_TYPE_LABELS[language][active.contentType] ?? active.contentType}</strong></div><div><label>{t.lastUpdated}</label><strong>{new Date(active.updatedAt).toLocaleDateString(language === "ro" ? "ro-RO" : "en-GB")}</strong></div></div>
        {(active.platform === "Instagram" || active.platform === "TikTok") && (active.brandValue || active.salesValue || active.entertainmentValue) && <div className="social-comment-detail"><p className="detail-section-label">{t.commentTopics}</p><div>{active.brandValue && <div><label>{t.brandValue}</label><p>{active.brandValue}</p></div>}{active.salesValue && <div><label>{t.salesValue}</label><p>{active.salesValue}</p></div>}{active.entertainmentValue && <div><label>{t.entertainmentValue}</label><p>{active.entertainmentValue}</p></div>}</div></div>}
        <div className="detail-block"><label>{t.issueLabel}</label><p>{active.issue}</p></div>{active.evidence.length > 0 && <div className="detail-images">{active.evidence.map((img, i) => <img key={img.storageId} src={img.url} alt={`${t.screenshots} ${i + 1}`} />)}</div>}
        <div className="detail-block improvement"><label>{t.improvementLabel}</label><p>{active.improvement}</p></div>{active.examples.length > 0 && <><p className="detail-section-label">{t.exampleScreenshots}</p><div className="detail-images">{active.examples.map((img, i) => <img key={img.storageId} src={img.url} alt={`${t.exampleScreenshots} ${i + 1}`} />)}</div></>}{active.url && <a className="source-link" href={active.url} target="_blank" rel="noreferrer">{t.openSource} ↗</a>}
      </div>}
    </section></div>}
    {confirmClose && <Confirm title={t.discardTitle} body={t.discardBody} confirm={t.discardConfirm} cancel={t.cancel} onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); dismissModal(); }} />}
    {confirmDelete && <Confirm danger title={language === "ro" ? `Ștergi ${selected.length} ${selected.length === 1 ? "raport" : "rapoarte"}?` : `Delete ${selected.length} report${selected.length === 1 ? "" : "s"}?`} body={t.deleteBody} confirm={t.deleteReports} cancel={t.cancel} onCancel={() => setConfirmDelete(false)} onConfirm={async () => { if (sessionToken) await removeReports({ token: sessionToken, ids: selected }); setSelected([]); setConfirmDelete(false); }} />}
  </main>;
}

function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <div className="language-toggle" aria-label="Language / Limbă"><button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => onChange("en")}>EN</button><button className={language === "ro" ? "active" : ""} aria-pressed={language === "ro"} onClick={() => onChange("ro")}>RO</button></div>;
}
function FilterGroup({ title, values, active, toggle, formatValue = (value) => value }: { title: string; values: readonly string[]; active: readonly string[]; toggle: (value: string) => void; formatValue?: (value: string) => string }) {
  return <div className="filter-group"><strong>{title}</strong>{values.map((value) => <label key={value}><input type="checkbox" checked={active.includes(value)} onChange={() => toggle(value)} /><span>{formatValue(value)}</span></label>)}</div>;
}
function Confirm({ title, body, confirm, cancel, danger, onCancel, onConfirm }: { title: string; body: string; confirm: string; cancel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="confirm-backdrop"><div className="confirm"><div className={danger ? "danger-icon" : "warn-icon"}>{danger ? "×" : "!"}</div><h2>{title}</h2><p>{body}</p><div><button className="secondary" onClick={onCancel}>{cancel}</button><button className={danger ? "danger-button" : "primary"} onClick={onConfirm}>{confirm}</button></div></div></div>;
}
