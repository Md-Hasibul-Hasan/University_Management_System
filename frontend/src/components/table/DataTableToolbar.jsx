"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

/**
 * DataTableToolbar - Advanced toolbar with search, dropdown filters, ordering, and count.
 *
 * @param {Object} props
 * @param {string} props.search - Current search value
 * @param {function} props.setSearch - Set search value
 * @param {Array} props.filters - Array of filter objects: { key, label, options, value, setValue }
 *   - key: the query param name (e.g. "school_class", "gender", "status")
 *   - label: display label (e.g. "Class", "Gender", "Status")
 *   - options: array of { value, label } for the dropdown
 *   - value: current selected value
 *   - setValue: setter function
 * @param {string} props.filterValue - (deprecated, use filters) Legacy text filter value
 * @param {function} props.setFilterValue - (deprecated, use filters) Legacy text filter setter
 * @param {string} props.filterPlaceholder - (deprecated) Legacy text filter placeholder
 * @param {string} props.ordering - Current ordering value
 * @param {function} props.setOrdering - Set ordering value
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {number} props.count - Total item count
 * @param {string} props.countLabel - Label for count (e.g. "Students")
 * @param {Array} props.orderingOptions - Ordering dropdown options
 */
export default function DataTableToolbar({
  search,
  setSearch,
  filters = [],
  filterValue,
  setFilterValue,
  ordering,
  setOrdering,
  searchPlaceholder = "Search...",
  filterPlaceholder = "Filter...",
  count = 0,
  countLabel = "Items",
  orderingOptions = [
    { value: "-created_at", label: "Newest First" },
    { value: "created_at", label: "Oldest First" },
    { value: "name", label: "Name (A–Z)" },
    { value: "-name", label: "Name (Z–A)" },
  ],
}) {
  const hasActiveFilter = filters.some((f) => f.value && f.value !== "");

  return (
    <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
      {/* Search */}
      <div className="relative min-w-0 sm:flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring"
        />
      </div>

      {/* Dropdown Filters */}
      {filters.map((filter) => (
        <ToolbarSelect
          key={filter.key}
          value={filter.value || ""}
          onChange={filter.setValue}
          options={filter.options}
          placeholder={filter.label}
          leadingIcon={filter.value ? null : SlidersHorizontal}
          onClear={() => filter.setValue("")}
          clearable={Boolean(filter.value)}
        />
      ))}

              {/* Legacy text filter (for backwards compatibility) */}
              {filterValue !== undefined && setFilterValue && filters.length === 0 && (
                <div className="relative min-w-0 sm:flex-none">
                  <SlidersHorizontal
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder={filterPlaceholder}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/20"
                  />
                </div>
              )}

              {/* Clear all filters button */}
              {hasActiveFilter && (
                <button
                  onClick={() => filters.forEach((f) => f.setValue(""))}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground sm:w-auto"
                  title="Clear all filters"
                >
                  <X size={14} />
                  Clear
                </button>
              )}

              {/* Ordering */}
              <ToolbarSelect
                value={ordering}
                onChange={setOrdering}
                options={orderingOptions}
                className="sm:w-auto"
              />

              {/* Count */}
              <span className="text-sm text-muted-foreground sm:ml-auto sm:whitespace-nowrap">
                {count} {countLabel}
              </span>
            </div>
          );
        }

        function ToolbarSelect({
          value,
          onChange,
          options,
          placeholder,
          leadingIcon: LeadingIcon,
          onClear,
          clearable = false,
          className = "",
        }) {
          const [open, setOpen] = useState(false);
          const menuRef = useRef(null);
          const selected = options.find((option) => String(option.value) === String(value));
          const label = selected?.label || placeholder || "Select...";

          useEffect(() => {
            if (!open) return undefined;

            const closeMenu = (event) => {
              if (!menuRef.current?.contains(event.target)) setOpen(false);
            };

            document.addEventListener("mousedown", closeMenu);
            return () => document.removeEventListener("mousedown", closeMenu);
          }, [open]);

          return (
            <div ref={menuRef} className={`relative min-w-0 w-full sm:w-auto sm:flex-none ${className}`}>
              <button
                type="button"
                onClick={() => setOpen((isOpen) => !isOpen)}
                onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20 ${
                  value ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {LeadingIcon && <LeadingIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{label}</span>
                </span>
                {clearable ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear filter"
                    onClick={(event) => {
                      event.stopPropagation();
                      onClear?.();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onClear?.();
                      }
                    }}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                )}
              </button>

              {open && (
                <div role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                  {placeholder && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={!value}
                      onClick={() => {
                        onChange("");
                        setOpen(false);
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {placeholder}
                    </button>
                  )}
                  {options.map((option) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={String(option.value) === String(value)}
                      key={option.value}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm wrap-break-word hover:bg-accent hover:text-accent-foreground"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }