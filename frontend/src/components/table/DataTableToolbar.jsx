"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

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
  const selectClass =
    "px-3 py-2 rounded-lg border border-border bg-background text-muted-foreground text-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring";

  const hasActiveFilter = filters.some((f) => f.value && f.value !== "");

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
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
        <div key={filter.key} className="relative min-w-[140px]">
          {filter.value ? (
            <X
              size={14}
              className="absolute  right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground z-10"
              onClick={() => filter.setValue("")}
            />
          ) : (
            <SlidersHorizontal
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          )}
          <select
            value={filter.value || ""}
            onChange={(e) => filter.setValue(e.target.value)}
            className={`w-full py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring ${
              filter.value ? "pl-3 pr-8 text-foreground font-medium" : "pl-9 pr-3 text-muted-foreground"
            }`}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Legacy text filter (for backwards compatibility) */}
      {filterValue !== undefined && setFilterValue && filters.length === 0 && (
        <div className="relative min-w-[140px]">
          <SlidersHorizontal
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={filterPlaceholder}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-4 focus:ring-ring/20 focus:border-ring"
          />
        </div>
      )}

      {/* Clear all filters button */}
      {hasActiveFilter && (
        <button
          onClick={() => filters.forEach((f) => f.setValue(""))}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          title="Clear all filters"
        >
          <X size={14} />
          Clear
        </button>
      )}

      {/* Ordering */}
      <select
        value={ordering}
        onChange={(e) => setOrdering(e.target.value)}
        className={selectClass}
      >
        {orderingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Count */}
      <span className="text-sm text-muted-foreground whitespace-nowrap ml-auto">
        {count} {countLabel}
      </span>
    </div>
  );
}