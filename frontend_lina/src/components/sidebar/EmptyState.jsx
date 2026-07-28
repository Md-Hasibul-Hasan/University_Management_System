"use client";

import { FilePlus2 } from "lucide-react";

export default function EmptyState({
  title = "No data found",
  description = "We couldn't find any data matching your search criteria. Try adjusting your filters or add a new one to get started.",
  actionLabel = "Add New",
  onAction,
  icon: Icon = FilePlus2,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white">
          <Icon size={22} className="text-gray-700" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-gray-500">
        {description}
      </p>

      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 flex items-center gap-2 rounded-md bg-[#081428] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a1a35]"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/40 text-xs leading-none">
            +
          </span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
