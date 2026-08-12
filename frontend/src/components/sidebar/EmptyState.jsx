"use client";

import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EmptyState({
  title = "No data found",
  description = "We couldn't find any data matching your search criteria. Try adjusting your filters or add a new one to get started.",
  actionLabel = "Add New",
  onAction,
  icon: Icon = FilePlus2,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
          <Icon size={22} className="text-muted-foreground" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      {onAction && (
        <Button onClick={onAction} className="mt-6 flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-primary-foreground/40 text-xs leading-none">
            +
          </span>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}