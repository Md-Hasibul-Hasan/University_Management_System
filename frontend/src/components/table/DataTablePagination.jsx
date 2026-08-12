"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTablePagination({
  page,
  totalPages,
  records,
  setRecords,
  setPage,
  maxRecords = 10,
}) {
  if (!totalPages || totalPages <= 0) return null;

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
          value={records}
          onChange={(e) => {
            const val = Number(e.target.value);

            if (val >= 1 && val <= maxRecords) {
              setRecords(val);
            }
          }}
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
            value={page}
            onChange={(e) => {
              const val = Number(e.target.value);

              if (val >= 1 && val <= totalPages) {
                setPage(val);
              }
            }}
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