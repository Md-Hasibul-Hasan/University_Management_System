"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateCourseAssessmentMutation,
  useDeleteCourseAssessmentMutation,
  useGetCourseAssessmentsQuery,
  useUpdateCourseAssessmentMutation,
} from "@/redux/features/course/session-course-assessmentApi";
import { useGetSessionCoursesQuery } from "@/redux/features/course/sesion-courseApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const assessmentTypeOptions = [
  { value: "attendance", label: "Attendance" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "incourse", label: "Incourse" },
  { value: "evaluation", label: "Evaluation" },
  { value: "presentation", label: "Presentation" },
  { value: "viva", label: "Viva" },
  { value: "final", label: "Final" },
];
const calcTypeOptions = [
  { value: "individual", label: "Individual" },
  { value: "average", label: "Average" },
];

const selectClasses =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

function SearchSelect({ label, value, options, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        value={open ? query : selected ? selected.label : ""}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder={`Search ${label.toLowerCase()}...`}
        className={selectClasses}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={() => { onChange(String(o.value)); setOpen(false); setQuery(""); }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const querySessionCourse = searchParams.get("session_course") || "";

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [form, setForm] = useState({ id: null, session_course: querySessionCourse, title: "", assessment_type: "quiz", max_marks: "", calculation_type: "individual", display_order: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: listResponse, isLoading, isFetching, refetch } = useGetCourseAssessmentsQuery({ search, ordering, page, records });
  const { data: sessionCoursesResponse } = useGetSessionCoursesQuery({ ordering: "-created_at", page: 1, records: 50 });

  const items = useMemo(() => normalizeList(listResponse), [listResponse]);
  const sessionCourses = useMemo(() => normalizeList(sessionCoursesResponse), [sessionCoursesResponse]);

  const scLabel = (id) => {
    const sc = sessionCourses.find((x) => String(x.id) === String(id));
    return sc ? `${sc.course_code || sc.course_title ||  sc.course} - ${sc.session_name || sc.session}` : id;
  };
  const count = listResponse?.data?.count ?? listResponse?.count ?? items.length;
  const totalPages = Math.ceil(count / records);

  const [create, { isLoading: isCreating }] = useCreateCourseAssessmentMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCourseAssessmentMutation();
  const [remove, { isLoading: isDeleting }] = useDeleteCourseAssessmentMutation();
  const submitting = isCreating || isUpdating;

  useEffect(() => { setPage(1); }, [search, ordering, records]);
  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 3000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => setForm({ id: null, session_course: "", title: "", assessment_type: "quiz", max_marks: "", calculation_type: "individual", display_order: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    try {
      const payload = {
        session_course: Number(form.session_course),
        title: form.title.trim(),
        assessment_type: form.assessment_type,
        max_marks: Number(form.max_marks),
        calculation_type: form.calculation_type,
        display_order: form.display_order ? Number(form.display_order) : undefined,
      };
      if (form.id) {
        await update({ id: form.id, ...payload }).unwrap();
        setMessage("Assessment updated successfully.");
      } else {
        await create(payload).unwrap();
        setMessage("Assessment created successfully.");
      }
      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const first = responseError ? Object.values(responseError).flat().find(Boolean) : "";
      setError(first || responseError?.detail || "Failed to save assessment.");
    }
  };

  const handleEdit = (item) => {
    setMessage(""); setError("");
    setForm({
      id: item.id, session_course: String(item.session_course ?? ""), title: item.title || "",
      assessment_type: item.assessment_type || "quiz", max_marks: item.max_marks ?? "",
      calculation_type: item.calculation_type || "individual", display_order: item.display_order ?? "",
    });
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this assessment?")) return;
    setMessage(""); setError("");
    try {
      await remove(item.id).unwrap();
      if (form.id === item.id) resetForm();
      setMessage("Assessment deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const first = responseError ? Object.values(responseError).flat().find(Boolean) : "";
      setError(first || responseError?.detail || "Failed to delete assessment.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Course Assessments</h1>
          <p className="mt-1 text-muted-foreground">Manage assessments for session courses.</p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm"><CheckCircle2 className="h-4 w-4" />{message}</div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-foreground">{form.id ? "Update Assessment" : "Add Assessment"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <SearchSelect
                  label="Session Course"
                  value={form.session_course}
                  options={sessionCourses.map((sc) => ({
                    value: String(sc.id),
                    label: `${sc.course_code || sc.course_title || sc.course} - ${sc.session_name || sc.session}`,
                  }))}
                  onChange={(v) => setForm((p) => ({ ...p, session_course: v }))}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                  <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full" placeholder="Quiz 1" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                    <select value={form.assessment_type} onChange={(e) => setForm((p) => ({ ...p, assessment_type: e.target.value }))} className={selectClasses}>
                      {assessmentTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Max Marks</label>
                    <Input type="number" step="any" value={form.max_marks} onChange={(e) => setForm((p) => ({ ...p, max_marks: e.target.value }))} className="w-full" placeholder="100" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Calculation</label>
                    <select value={form.calculation_type} onChange={(e) => setForm((p) => ({ ...p, calculation_type: e.target.value }))} className={selectClasses}>
                      {calcTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Display Order</label>
                    <Input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} className="w-full" placeholder="1" />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {form.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {form.id ? (isUpdating ? "Updating..." : "Update") : (isCreating ? "Saving..." : "Add")}
                </Button>
                {form.id && (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={resetForm}><X className="h-4 w-4" /> Cancel</Button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <DataTableToolbar
                search={search} setSearch={setSearch}
                ordering={ordering} setOrdering={setOrdering}
                searchPlaceholder="Search assessments..." count={count} countLabel="Assessments"
                orderingOptions={[
                  { value: "-created_at", label: "Newest First" },
                  { value: "created_at", label: "Oldest First" },
                ]}
              />
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Assessment List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading assessments...</div>
              ) : items.length === 0 ? (
                <div className="p-10 text-center"><h3 className="font-medium text-foreground">No Assessment Found</h3></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session Course</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Title</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Max Marks</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Calculation</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                          <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                          <td className="px-6 py-4">{scLabel(item.session_course)}</td>
                          <td className="px-6 py-4 font-sm text-foreground">{item.title}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{item.assessment_type}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{item.max_marks}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{item.calculation_type}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button type="button" onClick={() => handleEdit(item)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80">Edit</button>
                              <button type="button" onClick={() => handleDelete(item)} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/80" disabled={isDeleting}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <DataTablePagination page={page} totalPages={totalPages} records={records} setRecords={setRecords} setPage={setPage} maxRecords={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}