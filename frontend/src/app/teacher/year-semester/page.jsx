"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateYearSemesterMutation,
  useDeleteYearSemesterMutation,
  useGetYearSemestersQuery,
  useUpdateYearSemesterMutation,
} from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const YEAR_OPTIONS = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" },
  { value: "fourth", label: "Fourth" },
];

const SEMESTER_OPTIONS = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
];

const displayYearSemester = (item) => `${item.year || ""} ${item.year ? "Year" : ""}`.trim();

function SetupSelect({ value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 text-left text-sm outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card ${selected ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [form, setForm] = useState({ id: null, year: "", semester: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    data: yearSemestersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetYearSemestersQuery({ search, ordering, page, records });

  const [createYearSemester, { isLoading: isCreating }] = useCreateYearSemesterMutation();
  const [updateYearSemester, { isLoading: isUpdating }] = useUpdateYearSemesterMutation();
  const [deleteYearSemester, { isLoading: isDeleting }] = useDeleteYearSemesterMutation();

  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);
  const count = yearSemestersResponse?.data?.count ?? yearSemestersResponse?.count ?? yearSemesters.length;
  const totalPages = Math.ceil(count / records);
  const submitting = isCreating || isUpdating;

  useEffect(() => {
    setPage(1);
  }, [search, ordering, records]);

  useEffect(() => {
    if (!message && !error) return;

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setForm({ id: null, year: "", semester: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.year || !form.semester) {
      setError("Please select both year and semester.");
      return;
    }

    try {
      const payload = {
        year: form.year,
        semester: form.semester,
      };

      if (form.id) {
        await updateYearSemester({ id: form.id, ...payload }).unwrap();
        setMessage("Year & semester updated successfully.");
      } else {
        await createYearSemester(payload).unwrap();
        setMessage("Year & semester created successfully.");
      }

      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(responseError?.message || firstFieldError || responseError?.detail || "Failed to save year & semester.");
    }
  };

  const handleEdit = (item) => {
    setMessage("");
    setError("");
    setForm({
      id: item.id,
      year: item.year || "",
      semester: item.semester || "",
    });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete year & semester \"${item.year} ${item.semester}\"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteYearSemester(item.id).unwrap();
      if (form.id === item.id) resetForm();
      setMessage("Year & semester deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(responseError?.message || firstFieldError || responseError?.detail || "Failed to delete year & semester.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Year & Semester Management</h1>
          <p className="mt-1 text-muted-foreground">Create, update and manage year & semester records.</p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {form.id ? "Update Year & Semester" : "Add Year & Semester"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.id ? "Modify selected year & semester." : "Create a new year & semester."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Year</label>
                  <SetupSelect value={form.year} onChange={(value) => setForm((prev) => ({ ...prev, year: value }))} placeholder="Select year" options={YEAR_OPTIONS} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Semester</label>
                  <SetupSelect value={form.semester} onChange={(value) => setForm((prev) => ({ ...prev, semester: value }))} placeholder="Select semester" options={SEMESTER_OPTIONS} />
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {form.id ? (
                    <>
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Updating..." : "Update Year & Semester"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "Saving..." : "Add Year & Semester"}
                    </>
                  )}
                </Button>

                {form.id && (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={resetForm}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <DataTableToolbar
                search={search}
                setSearch={setSearch}
                ordering={ordering}
                setOrdering={setOrdering}
                searchPlaceholder="Search year & semester..."
                count={count}
                countLabel="Year & Semesters"
                orderingOptions={[
                  { value: "created_at", label: "Oldest" },
                  { value: "-created_at", label: "Newest" },
                ]}
              />

              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Year & Semester List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading year & semesters...</div>
              ) : yearSemesters.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-medium text-foreground">No Year & Semester Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {search ? "Try adjusting your search or ordering." : "Create your first year & semester from the left panel."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Year</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Semester</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearSemesters.map((item) => (
                        <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                          <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {YEAR_OPTIONS.find((option) => option.value === item.year)?.label || item.year}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {SEMESTER_OPTIONS.find((option) => option.value === item.semester)?.label || item.semester}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/80"
                                disabled={isDeleting}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <DataTablePagination
                page={page}
                totalPages={totalPages}
                records={records}
                setRecords={setRecords}
                setPage={setPage}
                maxRecords={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
