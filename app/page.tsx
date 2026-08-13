"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";

type Platform = "Instagram" | "TikTok" | "Advertisement" | "Website";
type Project = "City of Mara" | "Nord1" | "Vivalia" | "Via Project";
type ImageAsset = { storageId: string; url: string };
type Report = {
  id: string;
  title: string;
  project: Project;
  platform: Platform;
  contentType: string;
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

const PROJECTS: Project[] = ["City of Mara", "Nord1", "Vivalia", "Via Project"];
const TYPES: Record<Platform, string[]> = {
  Instagram: ["Carousel", "Post", "Reel"],
  TikTok: ["Carousel", "Video"],
  Advertisement: ["Carousel", "Image", "Text"],
  Website: ["Website"],
};
const PLATFORMS = Object.keys(TYPES) as Platform[];
const CONTENT_TYPES = ["Carousel", "Post", "Reel", "Video", "Image", "Text", "Website"];
const EMPTY: Omit<Report, "id" | "createdAt" | "updatedAt" | "order"> = {
  title: "",
  project: "City of Mara",
  platform: "Instagram",
  contentType: "Carousel",
  issue: "",
  improvement: "",
  url: "",
  evidence: [],
  examples: [],
};

function DropZone({ label, images, token, onChange }: { label: string; images: ImageAsset[]; token: string; onChange: (next: ImageAsset[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(GENERATE_UPLOAD_URL);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const add = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (!valid.length) return;
    setUploading(true); setUploadError("");
    try {
      const incoming = await Promise.all(valid.map(async (file) => {
        const uploadUrl = await generateUploadUrl({ token });
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json() as { storageId: string };
        return { storageId, url: URL.createObjectURL(file) };
      }));
      onChange([...images, ...incoming]);
    } catch { setUploadError("One or more images could not be uploaded. Please try again."); }
    finally { setUploading(false); }
  };
  return <div>
    <label className="field-label">{label} <span>Optional · multiple allowed</span></label>
    <div className="dropzone" tabIndex={0} role="button" onClick={() => input.current?.click()}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      onPaste={(e) => add(e.clipboardData.files)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }}>
      <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && add(e.target.files)} />
      <span className="upload-icon">↑</span><strong>{uploading ? "Uploading…" : "Drop images here"}</strong><small>or click to browse · JPEG, PNG, WebP</small>
    </div>
    {uploadError && <p className="form-error">{uploadError}</p>}
    {images.length > 0 && <div className="image-strip">{images.map((image, index) => <div className="image-chip" key={image.storageId}>
      <img src={image.url} alt={`${label} ${index + 1}`} />
      <button type="button" aria-label="Remove image" onClick={() => onChange(images.filter((_, i) => i !== index))}>×</button>
    </div>)}</div>}
  </div>;
}

export default function Home() {
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
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
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dragId = useRef<string | null>(null);
  const signInWithPasscode = useAction(SIGN_IN);
  const signOutSession = useMutation(SIGN_OUT);
  const saveReport = useMutation(SAVE_REPORT);
  const removeReports = useMutation(REMOVE_REPORTS);
  const reorderReports = useMutation(REORDER_REPORTS);
  const sessionValid = useQuery(VALIDATE_SESSION, typeof sessionToken === "string" ? { token: sessionToken } : "skip");
  const remoteReports = useQuery(LIST_REPORTS, typeof sessionToken === "string" && sessionValid ? { token: sessionToken } : "skip");
  const reports = useMemo(() => remoteReports ?? [], [remoteReports]);
  const authenticated = sessionToken === undefined ? null : sessionToken === null ? false : sessionValid === undefined ? null : sessionValid;

  useEffect(() => {
    queueMicrotask(() => {
      setSessionToken(localStorage.getItem("audit-session"));
      setView((localStorage.getItem("audit-view") as "list" | "grid") || "list");
    });
  }, []);
  useEffect(() => {
    if (sessionToken && sessionValid === false) {
      localStorage.removeItem("audit-session");
    }
  }, [sessionToken, sessionValid]);
  useEffect(() => { localStorage.setItem("audit-view", view); }, [view]);

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
  const hasFilters = !!(query || filters.project.length || filters.platform.length || filters.contentType.length);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setAuthError("");
    try {
      const { token } = await signInWithPasscode({ passcode });
      localStorage.setItem("audit-session", token);
      setSessionToken(token);
      setPasscode("");
    } catch { setAuthError("That passcode isn’t correct, or the workspace is not configured yet."); }
  }
  function openNew() {
    const now = Date.now(); const report: Report = { ...EMPTY, id: crypto.randomUUID(), createdAt: now, updatedAt: now, order: reports.length };
    setActive(report); setDraft(report); setEditing(true);
  }
  function openReport(report: Report) { setActive(report); setDraft({ ...report }); setEditing(false); }
  async function save() {
    if (!draft || !sessionToken || !draft.title.trim() || !draft.issue.trim() || !draft.improvement.trim()) return;
    setSaving(true); setSaveError("");
    try {
      const next = { ...draft, updatedAt: Date.now() };
      await saveReport({ token: sessionToken, report: { ...next, evidence: next.evidence.map((image) => image.storageId), examples: next.examples.map((image) => image.storageId) } });
      setActive(next); setDraft(next); setEditing(false);
    } catch { setSaveError("This report could not be saved. Please try again."); }
    finally { setSaving(false); }
  }
  function closeModal() {
    if (editing && JSON.stringify(draft) !== JSON.stringify(active)) setConfirmClose(true);
    else { setActive(null); setDraft(null); setEditing(false); }
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

  if (authenticated === null) return <main className="auth-shell"><div className="loader" /></main>;
  if (!authenticated) return <main className="auth-shell"><section className="login-card">
    <div className="brand-mark">A</div><p className="eyebrow">Content audit</p><h1>Enter the workspace</h1><p className="login-copy">Use the shared passcode to review and organise your team’s content reports.</p>
    <form onSubmit={signIn}><label className="field-label" htmlFor="passcode">Passcode</label><input id="passcode" autoFocus type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••••••" />
      {authError && <p className="form-error">{authError}</p>}<button className="primary full" type="submit">Continue <span>→</span></button></form>
    <p className="secure-note"><i /> Access stays active for 30 days on this device</p>
  </section></main>;

  return <main className="app-shell">
    <header><div><div className="brand-mark small">A</div><span className="wordmark">Audit</span></div><button className="ghost" onClick={async () => { if (sessionToken) await signOutSession({ token: sessionToken }); localStorage.removeItem("audit-session"); setSessionToken(null); }}>Log out</button></header>
    <section className="workspace">
      <div className="title-row"><div><p className="eyebrow">Content intelligence</p><h1>Reports <span>{reports.length}</span></h1><p>Review, organise and improve every piece of content.</p></div><button className="primary add" onClick={openNew}><b>＋</b> New report</button></div>
      <div className="toolbar">
        <div className="search"><span>⌕</span><input aria-label="Search reports" placeholder="Search reports…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="toolbar-actions">
          <div className="filter-wrap"><button className={`tool-button ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen(!filterOpen)}>≡ <span>Filter</span>{Object.values(filters).flat().length > 0 && <b>{Object.values(filters).flat().length}</b>}</button>
            {filterOpen && <div className="filter-menu">
              <FilterGroup title="Project" values={PROJECTS} active={filters.project} toggle={(v) => toggleFilter("project", v)} />
              <FilterGroup title="Platform" values={PLATFORMS} active={filters.platform} toggle={(v) => toggleFilter("platform", v)} />
              <FilterGroup title="Content type" values={CONTENT_TYPES} active={filters.contentType} toggle={(v) => toggleFilter("contentType", v)} />
            </div>}
          </div>
          <select aria-label="Sort reports" value={sort} onChange={(e) => setSort(e.target.value)}><option value="manual">Manual order</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="project">Project</option><option value="platform">Platform</option><option value="content">Content type</option></select>
          <button className={`tool-button ${selectMode ? "active" : ""}`} onClick={() => { setSelectMode(!selectMode); setSelected([]); }}>✓ <span>{selectMode ? "Done" : "Select"}</span></button>
          <div className="view-switch"><button aria-label="List view" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷</button><button aria-label="Grid view" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>▦</button></div>
        </div>
      </div>
      {Object.values(filters).flat().length > 0 && <div className="chips">{(Object.entries(filters) as [keyof typeof filters, string[]][]).flatMap(([group, values]) => values.map((value) => <button key={group + value} className={`chip ${group}`} onClick={() => toggleFilter(group, value)}>{value} ×</button>))}<button className="clear" onClick={() => setFilters({ project: [], platform: [], contentType: [] })}>Clear all</button></div>}
      {selectMode && <div className="selection-bar"><span><b>{selected.length}</b> selected</span><button disabled={!selected.length} onClick={() => setConfirmDelete(true)}>Delete</button></div>}
      {sort === "manual" && hasFilters && <p className="reorder-note">Clear search and filters to reorder reports.</p>}
      <div className={`report-collection ${view}`}>
        {visible.map((report, index) => <article key={report.id} draggable={sort === "manual" && !hasFilters} onDragStart={() => dragId.current = report.id} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(report.id)} onClick={() => selectMode ? setSelected((s) => s.includes(report.id) ? s.filter((id) => id !== report.id) : [...s, report.id]) : openReport(report)} className={selected.includes(report.id) ? "selected" : ""}>
          {selectMode && <span className="select-dot">{selected.includes(report.id) ? "✓" : ""}</span>}
          <span className="drag">⠿</span><div className={`thumb ${report.platform.toLowerCase()}`}>{report.evidence[0] ? <img src={report.evidence[0].url} alt="" /> : <span>{report.platform.slice(0, 2).toUpperCase()}</span>}</div>
          <div className="report-main"><div className="meta"><span className={`platform ${report.platform.toLowerCase()}`}>{report.platform}</span><i /> <span>{report.contentType}</span></div><h2>{report.title}</h2><p>{report.issue}</p></div>
          <div className="project"><span>{report.project}</span><small>Updated {new Date(report.updatedAt).toLocaleDateString("en", { day: "numeric", month: "short" })}</small></div><button className="expand" aria-label={`Open ${report.title}`}>↗</button><span className="number">{String(index + 1).padStart(2, "0")}</span>
        </article>)}
        {!visible.length && <div className="empty"><span>⌕</span><h2>{reports.length ? "No reports found" : "No reports yet"}</h2><p>{reports.length ? "Try removing a filter or using a different search." : "Create your first content audit report to get started."}</p>{!reports.length && <button className="secondary" onClick={openNew}>Create a report</button>}</div>}
      </div>
    </section>

    {active && draft && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}><section className="modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">{reports.some((r) => r.id === active.id) ? "Report detail" : "New report"}</p><h2>{editing ? (reports.some((r) => r.id === active.id) ? "Edit report" : "Create a report") : active.title}</h2></div><div>{!editing && <button className="secondary" onClick={() => setEditing(true)}>Edit</button>}{editing && reports.some((r) => r.id === active.id) && <button className="secondary" onClick={() => { setDraft({ ...active }); setEditing(false); }}>Cancel</button>}<button className="close" aria-label="Close" onClick={closeModal}>×</button></div></div>
      {editing ? <form className="report-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="form-grid"><div className="wide"><label className="field-label">Report title *</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="A clear, concise description" required /></div>
          <div><label className="field-label">Project *</label><select value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value as Project })}>{PROJECTS.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label">Source URL <span>Optional</span></label><input type="url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" /></div></div>
        <fieldset><legend>Platform *</legend><div className="choice-row">{PLATFORMS.map((p) => <button key={p} type="button" className={draft.platform === p ? "selected" : ""} onClick={() => setDraft({ ...draft, platform: p, contentType: TYPES[p][0] })}>{p}</button>)}</div></fieldset>
        <fieldset><legend>Content type *</legend><div className="choice-row compact">{TYPES[draft.platform].map((t) => <button key={t} type="button" className={draft.contentType === t ? "selected" : ""} onClick={() => setDraft({ ...draft, contentType: t })}>{t}</button>)}</div></fieldset>
        <div><label className="field-label">What is wrong and why? *</label><textarea rows={5} value={draft.issue} onChange={(e) => setDraft({ ...draft, issue: e.target.value })} placeholder="Describe the problem, its impact, and any relevant context…" required /></div>
        <DropZone label="Screenshots" images={draft.evidence} token={sessionToken!} onChange={(evidence) => setDraft({ ...draft, evidence })} />
        <div><label className="field-label">How to do this better *</label><textarea rows={5} value={draft.improvement} onChange={(e) => setDraft({ ...draft, improvement: e.target.value })} placeholder="Explain the recommended improvement…" required /></div>
        <DropZone label="Example screenshots" images={draft.examples} token={sessionToken!} onChange={(examples) => setDraft({ ...draft, examples })} />
        {saveError && <p className="form-error">{saveError}</p>}<div className="form-footer"><span>* Required fields</span><button type="button" className="secondary" onClick={closeModal}>Cancel</button><button type="submit" className="primary" disabled={saving}>{saving ? "Saving…" : reports.some((r) => r.id === draft.id) ? "Save changes" : "Create report"}</button></div>
      </form> : <div className="report-detail"><div className="detail-meta"><div><label>Project</label><strong>{active.project}</strong></div><div><label>Platform</label><strong>{active.platform}</strong></div><div><label>Content type</label><strong>{active.contentType}</strong></div><div><label>Last updated</label><strong>{new Date(active.updatedAt).toLocaleDateString()}</strong></div></div>
        <div className="detail-block"><label>What is wrong and why?</label><p>{active.issue}</p></div>{active.evidence.length > 0 && <div className="detail-images">{active.evidence.map((img, i) => <img key={img.storageId} src={img.url} alt={`Evidence ${i + 1}`} />)}</div>}
        <div className="detail-block improvement"><label>How to do this better</label><p>{active.improvement}</p></div>{active.examples.length > 0 && <><p className="detail-section-label">Example screenshots</p><div className="detail-images">{active.examples.map((img, i) => <img key={img.storageId} src={img.url} alt={`Example ${i + 1}`} />)}</div></>}{active.url && <a className="source-link" href={active.url} target="_blank" rel="noreferrer">Open source ↗</a>}
      </div>}
    </section></div>}
    {confirmClose && <Confirm title="Discard unsaved changes?" body="Your edits won’t be saved." confirm="Discard changes" onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); setActive(null); setDraft(null); setEditing(false); }} />}
    {confirmDelete && <Confirm danger title={`Delete ${selected.length} report${selected.length === 1 ? "" : "s"}?`} body="This will remove the selected reports from the audit." confirm="Delete reports" onCancel={() => setConfirmDelete(false)} onConfirm={async () => { if (sessionToken) await removeReports({ token: sessionToken, ids: selected }); setSelected([]); setConfirmDelete(false); }} />}
  </main>;
}

function FilterGroup({ title, values, active, toggle }: { title: string; values: readonly string[]; active: readonly string[]; toggle: (value: string) => void }) {
  return <div className="filter-group"><strong>{title}</strong>{values.map((value) => <label key={value}><input type="checkbox" checked={active.includes(value)} onChange={() => toggle(value)} /><span>{value}</span></label>)}</div>;
}
function Confirm({ title, body, confirm, danger, onCancel, onConfirm }: { title: string; body: string; confirm: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="confirm-backdrop"><div className="confirm"><div className={danger ? "danger-icon" : "warn-icon"}>{danger ? "×" : "!"}</div><h2>{title}</h2><p>{body}</p><div><button className="secondary" onClick={onCancel}>Cancel</button><button className={danger ? "danger-button" : "primary"} onClick={onConfirm}>{confirm}</button></div></div></div>;
}
