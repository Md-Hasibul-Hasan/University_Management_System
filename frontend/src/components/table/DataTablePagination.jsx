"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const clampNumber = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

export default function DataTablePagination({
  page,
  totalPages,
  records,
  setRecords,
  setPage,
  maxRecords = 10,
}) {
  // Local drafts let the user type freely (including clearing the field).
  // `null` means "not editing" → the input mirrors the prop; on blur/Enter the
  // typed value is validated and clamped (negative/empty → 1, too big → max).
  const [pageDraft, setPageDraft] = useState(null);
  const [recordsDraft, setRecordsDraft] = useState(null);

  if (!totalPages || totalPages <= 0) return null;

  const commitPage = () => {
    const next = clampNumber(pageDraft ?? page, 1, totalPages);
    if (next !== page) setPage(next);
    setPageDraft(null);
  };

  const commitRecords = () => {
    const next = clampNumber(recordsDraft ?? records, 1, maxRecords);
    if (next !== records) setRecords(next);
    setRecordsDraft(null);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-border gap-3">
      {/* Page Info */}
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>

      {/* Records Per Page */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Per page
        </span>

        <input
          type="number"
          min={1}
          max={maxRecords}
          value={recordsDraft ?? String(records)}
          onFocus={() => setRecordsDraft(String(records))}
          onChange={(e) => setRecordsDraft(e.target.value)}
          onBlur={commitRecords}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">
            Go to
          </span>

          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageDraft ?? String(page)}
            onFocus={() => setPageDraft(String(page))}
            onChange={(e) => setPageDraft(e.target.value)}
            onBlur={commitPage}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring"
          />
        </div>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}