"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT_TYPE_LABELS, PLATFORMS, PLATFORM_LABELS, VALUE_TYPES, type Language, type Platform, type ValueType } from "../../lib/domain";
import { FilterGroup } from "../ui/AuditControls";

type ToolbarCopy = {
  searchReports: string; platform: string; allPlatforms: string; filter: string; contentType: string; valueComment: string;
  brandValue: string; salesValue: string; entertainmentValue: string;
  select: string; done: string; listView: string; gridView: string;
};

function PlatformIcon({ platform }: { platform: Platform | "all" }) {
  if (platform === "Instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" /></svg>;
  if (platform === "TikTok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4v10.2a4.2 4.2 0 1 1-3.2-4.1" /><path d="M14.5 4c.5 2.8 2.2 4.4 5 4.8" /></svg>;
  if (platform === "Advertisement") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 13 13-6v10L4 11Z" /><path d="M7 13.6 8.5 20h3L10 12.2M19.5 9v6" /></svg>;
  if (platform === "Website") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5S14.3 18.1 12 20.5C9.7 18.1 8.5 15.3 8.5 12S9.7 5.9 12 3.5Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
}

export function ReportToolbar({ language, copy, query, platform, contentTypes, valueTypes, availableContentTypes, canEdit, selectMode, view, onQuery, onPlatform, onToggleFilter, onSelectMode, onView }: {
  language: Language; copy: ToolbarCopy; query: string; platform: Platform | null; contentTypes: string[]; valueTypes: ValueType[];
  availableContentTypes: string[]; canEdit: boolean; selectMode: boolean; view: "list" | "grid";
  onQuery: (query: string) => void; onPlatform: (platform: Platform | null) => void;
  onToggleFilter: (group: "contentType" | "valueType", value: string) => void;
  onSelectMode: () => void; onView: (view: "list" | "grid") => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const outside = (event: PointerEvent) => { if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [filterOpen]);

  const filterCount = contentTypes.length + valueTypes.length;
  return <div className="toolbar">
    <div className="search"><span>⌕</span><input aria-label={copy.searchReports} placeholder={copy.searchReports} value={query} onChange={(event) => onQuery(event.target.value)} /></div>
    <div className="platform-quick-filter" aria-label={copy.platform}>
      <button className={platform === null ? "active" : ""} aria-pressed={platform === null} onClick={() => onPlatform(null)}><PlatformIcon platform="all" /><span>{copy.allPlatforms}</span></button>
      {PLATFORMS.map((option) => <button key={option} className={platform === option ? "active" : ""} aria-pressed={platform === option} onClick={() => onPlatform(platform === option ? null : option)}><PlatformIcon platform={option} /><span>{PLATFORM_LABELS[language][option]}</span></button>)}
    </div>
    <div className="toolbar-actions">
      <div className="filter-wrap" ref={filterRef}><button aria-expanded={filterOpen} className={`tool-button ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen((open) => !open)}>≡ <span>{copy.filter}</span>{filterCount > 0 && <b>{filterCount}</b>}</button>
        {filterOpen && <div className="filter-menu">
          <FilterGroup title={copy.contentType} values={availableContentTypes} active={contentTypes} toggle={(value) => onToggleFilter("contentType", value)} formatValue={(value) => CONTENT_TYPE_LABELS[language][value] ?? value} />
          <FilterGroup title={copy.valueComment} values={VALUE_TYPES} active={valueTypes} toggle={(value) => onToggleFilter("valueType", value)} formatValue={(value) => value === "brand" ? copy.brandValue : value === "sales" ? copy.salesValue : copy.entertainmentValue} />
        </div>}
      </div>
      {canEdit && <button className={`tool-button ${selectMode ? "active" : ""}`} onClick={onSelectMode}>✓ <span>{selectMode ? copy.done : copy.select}</span></button>}
      <div className="view-switch"><button aria-label={copy.listView} className={view === "list" ? "active" : ""} onClick={() => onView("list")}>☷</button><button aria-label={copy.gridView} className={view === "grid" ? "active" : ""} onClick={() => onView("grid")}>▦</button></div>
    </div>
  </div>;
}
