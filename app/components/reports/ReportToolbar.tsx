"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT_TYPE_LABELS, PLATFORMS, PLATFORM_LABELS, VALUE_TYPES, type Language, type Platform, type ReportSort, type ValueType } from "../../lib/domain";
import { FilterGroup, SortMenu } from "../ui/AuditControls";

type ToolbarCopy = {
  searchReports: string; platform: string; allPlatforms: string; filter: string; contentType: string; valueComment: string;
  brandValue: string; salesValue: string; entertainmentValue: string; sortReports: string; newestFirst: string; oldestFirst: string;
  select: string; done: string; listView: string; gridView: string;
};

export function ReportToolbar({ language, copy, query, platform, contentTypes, valueTypes, availableContentTypes, sort, selectMode, view, onQuery, onPlatform, onToggleFilter, onSort, onSelectMode, onView }: {
  language: Language; copy: ToolbarCopy; query: string; platform: Platform | null; contentTypes: string[]; valueTypes: ValueType[];
  availableContentTypes: string[]; sort: ReportSort; selectMode: boolean; view: "list" | "grid";
  onQuery: (query: string) => void; onPlatform: (platform: Platform | null) => void;
  onToggleFilter: (group: "contentType" | "valueType", value: string) => void; onSort: (sort: ReportSort) => void;
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
      <button className={platform === null ? "active" : ""} aria-pressed={platform === null} onClick={() => onPlatform(null)}>{copy.allPlatforms}</button>
      {PLATFORMS.map((option) => <button key={option} className={platform === option ? "active" : ""} aria-pressed={platform === option} onClick={() => onPlatform(platform === option ? null : option)}>{PLATFORM_LABELS[language][option]}</button>)}
    </div>
    <div className="toolbar-actions">
      <div className="filter-wrap" ref={filterRef}><button aria-expanded={filterOpen} className={`tool-button ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen((open) => !open)}>≡ <span>{copy.filter}</span>{filterCount > 0 && <b>{filterCount}</b>}</button>
        {filterOpen && <div className="filter-menu">
          <FilterGroup title={copy.contentType} values={availableContentTypes} active={contentTypes} toggle={(value) => onToggleFilter("contentType", value)} formatValue={(value) => CONTENT_TYPE_LABELS[language][value] ?? value} />
          <FilterGroup title={copy.valueComment} values={VALUE_TYPES} active={valueTypes} toggle={(value) => onToggleFilter("valueType", value)} formatValue={(value) => value === "brand" ? copy.brandValue : value === "sales" ? copy.salesValue : copy.entertainmentValue} />
        </div>}
      </div>
      <SortMenu label={copy.sortReports} value={sort} onChange={(value) => onSort(value as ReportSort)} options={[{ value: "newest", label: copy.newestFirst }, { value: "oldest", label: copy.oldestFirst }, { value: "platform", label: copy.platform }, { value: "content", label: copy.contentType }]} />
      <button className={`tool-button ${selectMode ? "active" : ""}`} onClick={onSelectMode}>✓ <span>{selectMode ? copy.done : copy.select}</span></button>
      <div className="view-switch"><button aria-label={copy.listView} className={view === "list" ? "active" : ""} onClick={() => onView("list")}>☷</button><button aria-label={copy.gridView} className={view === "grid" ? "active" : ""} onClick={() => onView("grid")}>▦</button></div>
    </div>
  </div>;
}
