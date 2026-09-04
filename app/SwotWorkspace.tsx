"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Language, Project, Quadrant, Report, SwotPoint } from "./lib/domain";

const QUADRANTS: Quadrant[] = ["strength", "weakness", "opportunity", "threat"];
const COPY = {
  en: {
    title: "SWOT analysis", add: "Add a point of analysis", all: "All quadrants", previous: "Previous quadrant", next: "Next quadrant", select: "Select", done: "Done", delete: "Delete", edit: "Edit", strength: "Strengths", weakness: "Weaknesses", opportunity: "Opportunities", threat: "Threats", point: "point", points: "points", empty: "No analysis points yet", emptyHint: "Add a point to begin building this quadrant.", evidence: "evidence sources", evidenceOne: "evidence source", noEvidence: "No reports linked", detail: "Analysis detail", close: "Close", quadrant: "Quadrant", analysis: "Analysis", linkedReports: "Linked reports", openReport: "Open report", newPoint: "New analysis point", editPoint: "Edit analysis point", pointTitle: "Title", titlePlaceholder: "A concise strategic observation", analysisPlaceholder: "Explain the insight, why it matters, and its implications…", chooseEvidence: "Select reports as evidence", evidenceHint: "Link any relevant reports from the Reports workspace.", search: "Search reports…", noReports: "No matching reports", selected: "selected", cancel: "Cancel", save: "Add point", saveChanges: "Save changes", saving: "Saving…", required: "Enter a title and analysis before saving.", saveError: "The analysis point could not be saved. Please try again.", deleteBody: "The selected analysis points will be permanently removed from the SWOT analysis.", deleteConfirm: "Delete points",
  },
  ro: {
    title: "Analiză SWOT", add: "Adaugă un punct de analiză", all: "Toate cadranele", previous: "Cadranul anterior", next: "Cadranul următor", select: "Selectează", done: "Gata", delete: "Șterge", edit: "Editează", strength: "Puncte forte", weakness: "Puncte slabe", opportunity: "Oportunități", threat: "Amenințări", point: "punct", points: "puncte", empty: "Nu există încă puncte de analiză", emptyHint: "Adaugă un punct pentru a începe analiza acestui cadran.", evidence: "dovezi", evidenceOne: "dovadă", noEvidence: "Niciun raport asociat", detail: "Detalii analiză", close: "Închide", quadrant: "Cadran", analysis: "Analiză", linkedReports: "Rapoarte asociate", openReport: "Deschide raportul", newPoint: "Punct nou de analiză", editPoint: "Editează punctul de analiză", pointTitle: "Titlu", titlePlaceholder: "O observație strategică formulată concis", analysisPlaceholder: "Explică observația, relevanța și implicațiile acesteia…", chooseEvidence: "Selectează rapoarte ca dovezi", evidenceHint: "Asociază orice raport relevant din secțiunea Rapoarte.", search: "Caută rapoarte…", noReports: "Niciun raport găsit", selected: "selectate", cancel: "Anulează", save: "Adaugă punctul", saveChanges: "Salvează modificările", saving: "Se salvează…", required: "Completează titlul și analiza înainte de salvare.", saveError: "Punctul de analiză nu a putut fi salvat. Încearcă din nou.", deleteBody: "Punctele de analiză selectate vor fi eliminate definitiv din analiza SWOT.", deleteConfirm: "Șterge punctele",
  },
} as const;

export function SwotWorkspace({ token, language, project, reports, canEdit, onOpenReport }: { token: string; language: Language; project: Project; reports: Report[]; canEdit: boolean; onOpenReport: (reportId: string) => void }) {
  const t = COPY[language];
  const remotePoints = useQuery(api.swot.list, { token, project });
  const savePoint = useMutation(api.swot.save);
  const removePoints = useMutation(api.swot.remove);
  const points = useMemo(() => (remotePoints ?? []) as SwotPoint[], [remotePoints]);
  const [focused, setFocused] = useState<Quadrant | null>(null);
  const [active, setActive] = useState<SwotPoint | null>(null);
  const [draft, setDraft] = useState<SwotPoint | null>(null);
  const [editingOriginal, setEditingOriginal] = useState<SwotPoint | null>(null);
  const [evidenceQuery, setEvidenceQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [closingModal, setClosingModal] = useState<"active" | "draft" | null>(null);
  const [formError, setFormError] = useState<"required" | "save" | "">("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const shownQuadrants = focused ? [focused] : QUADRANTS;
  const matchingReports = reports.filter((report) => `${report.title} ${report.project} ${report.platform} ${report.contentType}`.toLocaleLowerCase().includes(evidenceQuery.toLocaleLowerCase()));
  const quadrantLabel = (quadrant: Quadrant) => t[quadrant];
  const platformLabel = (platform: string) => language === "ro" ? ({ Advertisement: "Publicitate", Website: "Site web" }[platform] ?? platform) : platform;
  const contentTypeLabel = (contentType: string) => language === "ro" ? ({ Carousel: "Carusel", Post: "Postare", Video: "Videoclip", Image: "Imagine", Website: "Site web" }[contentType] ?? contentType) : contentType;
  const cycle = (direction: -1 | 1) => {
    if (!focused) return;
    const index = QUADRANTS.indexOf(focused);
    setFocused(QUADRANTS[(index + direction + QUADRANTS.length) % QUADRANTS.length]);
  };
  const openNew = () => {
    if (!canEdit) return;
    const now = Date.now();
    setDraft({ id: crypto.randomUUID(), project, title: "", analysis: "", quadrant: focused ?? "strength", reportIds: [], createdAt: now, updatedAt: now });
    setEditingOriginal(null); setEvidenceQuery(""); setFormError(""); setSaveSuccess(false); setClosingModal(null);
  };
  const openEdit = () => {
    if (!canEdit || !active) return;
    setEditingOriginal(active);
    setDraft({ ...active });
    setActive(null);
    setEvidenceQuery(""); setFormError(""); setSaveSuccess(false); setClosingModal(null);
  };
  const closeModal = (target: "active" | "draft") => {
    if (closingModal) return;
    setClosingModal(target);
    window.setTimeout(() => {
      if (target === "active") setActive(null); else { setDraft(null); setEditingOriginal(null); }
      setClosingModal(null);
    }, 220);
  };
  const submit = async () => {
    if (!draft?.title.trim() || !draft.analysis.trim()) { setFormError("required"); return; }
    setSaving(true); setFormError("");
    try {
      await savePoint({ token, point: { ...draft, updatedAt: Date.now() } });
      setSaving(false); setSaveSuccess(true);
      window.setTimeout(() => { setSaveSuccess(false); setEditingOriginal(null); closeModal("draft"); }, 560);
    }
    catch { setFormError("save"); }
    finally { setSaving(false); }
  };

  return <section className="swot-workspace">
    <div className="swot-title-row"><div><div><p className="eyebrow">{project}</p><h1>{t.title}</h1></div>{focused && <button className="swot-all" onClick={() => setFocused(null)}>← {t.all}</button>}</div><div className="swot-actions">
      {canEdit && <button className={`tool-button ${selectMode ? "active" : ""}`} onClick={() => { setSelectMode(!selectMode); setSelected([]); }}>✓ <span>{selectMode ? t.done : t.select}</span></button>}
      {canEdit && <button className="primary add" onClick={openNew}><b>＋</b> {t.add}</button>}
    </div></div>
    {canEdit && selectMode && <div className="selection-bar swot-selection"><span><b key={selected.length}>{selected.length}</b> {language === "ro" ? (selected.length === 1 ? "selectat" : "selectate") : t.selected}</span><button disabled={!selected.length} onClick={() => setConfirmDelete(true)}>{t.delete}</button></div>}
    {focused && <div className="quadrant-cycle"><button aria-label={t.previous} onClick={() => cycle(-1)}>←</button><strong>{quadrantLabel(focused)}</strong><button aria-label={t.next} onClick={() => cycle(1)}>→</button></div>}
    <div key={focused ?? "all"} className={`swot-board ${focused ? "focused" : ""}`}>
      {shownQuadrants.map((quadrant) => {
        const quadrantPoints = points.filter((point) => point.quadrant === quadrant).sort((a, b) => b.updatedAt - a.updatedAt);
        return <section key={quadrant} className={`swot-quadrant ${quadrant}`}>
          <button className="quadrant-head" onClick={() => setFocused(quadrant)}><span><i />{quadrantLabel(quadrant)}</span><b>{quadrantPoints.length} {quadrantPoints.length === 1 ? t.point : t.points}</b><em>↗</em></button>
          <div className="swot-points">
            {quadrantPoints.map((point) => <button key={point.id} className={`swot-point ${selected.includes(point.id) ? "selected" : ""}`} onClick={() => selectMode ? setSelected((current) => current.includes(point.id) ? current.filter((id) => id !== point.id) : [...current, point.id]) : setActive(point)}>{selectMode && <span className="swot-select-dot">{selected.includes(point.id) ? "✓" : ""}</span>}<span className="point-icon">{point.title.slice(0, 1).toUpperCase()}</span><span className="point-copy"><strong>{point.title}</strong><small>{point.analysis}</small><em>{point.reportIds.length ? `${point.reportIds.length} ${point.reportIds.length === 1 ? t.evidenceOne : t.evidence}` : t.noEvidence}</em></span><b>→</b></button>)}
            {!quadrantPoints.length && <div className="swot-empty"><strong>{t.empty}</strong><span>{t.emptyHint}</span></div>}
          </div>
        </section>;
      })}
    </div>

    {active && <div className={`modal-backdrop ${closingModal === "active" ? "closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && closeModal("active")}><section className="modal swot-detail-modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">{t.detail}</p><h2>{active.title}</h2></div><div>{canEdit && <button className="secondary" onClick={openEdit}>{t.edit}</button>}<button className="close" aria-label={t.close} onClick={() => closeModal("active")}>×</button></div></div>
      <div className="swot-detail"><div className={`swot-detail-tag ${active.quadrant}`}><i />{quadrantLabel(active.quadrant)}</div><div className="detail-block"><label>{t.analysis}</label><p>{active.analysis}</p></div><div className="swot-evidence-detail"><label>{t.linkedReports}</label>
        {active.reportIds.length ? active.reportIds.map((reportId) => { const report = reports.find((item) => item.id === reportId); return report ? <button key={reportId} onClick={() => onOpenReport(reportId)}><span><strong>{report.title}</strong><small>{report.project} · {platformLabel(report.platform)} · {contentTypeLabel(report.contentType)}</small></span><b>{t.openReport} ↗</b></button> : null; }) : <p>{t.noEvidence}</p>}
      </div></div>
    </section></div>}

    {draft && <div className={`modal-backdrop ${closingModal === "draft" ? "closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && closeModal("draft")}><section className="modal swot-form-modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">SWOT</p><h2>{editingOriginal ? t.editPoint : t.newPoint}</h2></div><button className="close" aria-label={t.close} onClick={() => closeModal("draft")}>×</button></div>
      <form className="swot-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div><label className="field-label">{t.quadrant} *</label><div className="swot-quadrant-choices">{QUADRANTS.map((quadrant) => <button type="button" key={quadrant} className={`${quadrant} ${draft.quadrant === quadrant ? "selected" : ""}`} onClick={() => setDraft({ ...draft, quadrant })}><i />{quadrantLabel(quadrant)}</button>)}</div></div>
        <div><label className="field-label">{t.pointTitle} *</label><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t.titlePlaceholder} /></div>
        <div><label className="field-label">{t.analysis} *</label><textarea required rows={7} value={draft.analysis} onChange={(event) => setDraft({ ...draft, analysis: event.target.value })} placeholder={t.analysisPlaceholder} /></div>
        <div className="evidence-picker"><label className="field-label">{t.chooseEvidence} <span>{draft.reportIds.length} {language === "ro" && draft.reportIds.length === 1 ? "selectat" : t.selected}</span></label><p>{t.evidenceHint}</p><input value={evidenceQuery} onChange={(event) => setEvidenceQuery(event.target.value)} placeholder={t.search} />
          <div className="evidence-options">{matchingReports.map((report) => { const selected = draft.reportIds.includes(report.id); return <button type="button" key={report.id} className={selected ? "selected" : ""} onClick={() => setDraft({ ...draft, reportIds: selected ? draft.reportIds.filter((id) => id !== report.id) : [...draft.reportIds, report.id] })}><i>{selected ? "✓" : ""}</i><span><strong>{report.title}</strong><small>{report.project} · {platformLabel(report.platform)} · {contentTypeLabel(report.contentType)}</small></span></button>; })}{!matchingReports.length && <div className="evidence-empty">{t.noReports}</div>}</div>
        </div>
        {formError && <p className="form-error">{formError === "required" ? t.required : t.saveError}</p>}
        <div className="form-footer"><span>*</span><button type="button" className="secondary" onClick={() => { if (editingOriginal) { setDraft(null); setActive(editingOriginal); setEditingOriginal(null); } else closeModal("draft"); }}>{t.cancel}</button><button type="submit" className={`primary save-button ${saveSuccess ? "success" : ""}`} disabled={saving || saveSuccess}>{saving ? t.saving : saveSuccess ? (language === "ro" ? "✓ Salvat" : "✓ Saved") : editingOriginal ? t.saveChanges : t.save}</button></div>
      </form>
    </section></div>}
    {confirmDelete && <div className="confirm-backdrop"><div className="confirm"><div className="danger-icon">×</div><h2>{language === "ro" ? `Ștergi ${selected.length} ${selected.length === 1 ? "punct" : "puncte"}?` : `Delete ${selected.length} point${selected.length === 1 ? "" : "s"}?`}</h2><p>{t.deleteBody}</p><div><button className="secondary" onClick={() => setConfirmDelete(false)}>{t.cancel}</button><button className="danger-button" onClick={async () => { await removePoints({ token, project, ids: selected }); setSelected([]); setConfirmDelete(false); }}>{t.deleteConfirm}</button></div></div></div>}
  </section>;
}
