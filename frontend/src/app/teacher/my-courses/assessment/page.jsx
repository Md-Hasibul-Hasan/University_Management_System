"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateCourseAssessmentMutation,
  useDeleteCourseAssessmentMutation,
  useGetCourseAssessmentsQuery,
  useUpdateCourseAssessmentMutation,
} from "@/redux/features/course/session-course-assessmentApi";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";

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

export default function Page() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;

  const [form, setForm] = useState({ id: null, title: "", assessment_type: "quiz", max_marks: "", calculation_type: "individual", display_order: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: response, isLoading, refetch } = useGetCourseAssessmentsQuery(
    { session_course: sessionCourseId, records: 100, ordering: "display_order" },
    { skip: !sessionCourseId }
  );

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const items = useMemo(() => normalizeList(response), [response]);

  // Helpers to render human-readable labels for type / calculation.
  const typeLabel = (value) => assessmentTypeOptions.find((o) => o.value === value)?.label || value;
  const calcLabel = (value) => calcTypeOptions.find((o) => o.value === value)?.label || value;

  // Group the assessments by (calculation type + assessment type).
  const groupedAssessments = useMemo(() => {
    const groups = [];
    const index = {};
    items.forEach((item) => {
      const key = `${item.calculation_type || "individual"}__${item.assessment_type || "other"}`;
      if (!index[key]) {
        const group = { key, calculation_type: item.calculation_type || "individual", assessment_type: item.assessment_type || "other", items: [] };
        index[key] = group;
        groups.push(group);
      }
      index[key].items.push(item);
    });
    // Calculate total marks for each group: simple sum for "individual", average for "average".
    groups.forEach((group) => {
      const marks = group.items.map((i) => Number(i.max_marks) || 0);
      if (group.calculation_type === "average") {
        group.total = marks.length ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 100) / 100 : 0;
      } else {
        group.total = marks.reduce((a, b) => a + b, 0);
      }
    });
    // Sort groups: calculation type first, then assessment type (by option order).
    const typeRank = (t) => {
      const idx = assessmentTypeOptions.findIndex((o) => o.value === t);
      return idx === -1 ? 999 : idx;
    };
    return groups.sort((a, b) => {
      if (a.calculation_type !== b.calculation_type) {
        return a.calculation_type.localeCompare(b.calculation_type);
      }
      return typeRank(a.assessment_type) - typeRank(b.assessment_type);
    });
  }, [items]);

  // Top-level total = sum of the per-group totals (matched to the group summaries below).
  const allTotalMarks = useMemo(
    () => groupedAssessments.reduce((sum, g) => sum + (Number(g.total) || 0), 0),
    [groupedAssessments]
  );

  const [create, { isLoading: isCreating }] = useCreateCourseAssessmentMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCourseAssessmentMutation();
  const [remove, { isLoading: isDeleting }] = useDeleteCourseAssessmentMutation();
  const submitting = isCreating || isUpdating;

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 3000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => setForm({ id: null, title: "", assessment_type: "quiz", max_marks: "", calculation_type: "individual", display_order: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!sessionCourseId) return;
    setMessage(""); setError("");
    try {
      const payload = {
        session_course: Number(sessionCourseId),
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
      setError(responseError?.message || first || responseError?.detail || "Failed to save assessment.");
    }
  };

  const handleEdit = (item) => {
    setMessage(""); setError("");
    setForm({
      id: item.id, title: item.title || "", assessment_type: item.assessment_type || "quiz",
      max_marks: item.max_marks ?? "", calculation_type: item.calculation_type || "individual",
      display_order: item.display_order ?? "",
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

  const courseCode = sessionCourse?.course_code || `#${sessionCourseId}`;
  const courseTitle = sessionCourse?.course_title || `#${sessionCourseId}`;
  const sessionLabel = sessionCourse?.session_name || "-";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/my-courses">
              <ArrowLeft className="h-4 w-4" />
              Back to My Courses
            </Link>
          </Button>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Course Assessments</h1>
          <p className="mt-1 text-muted-foreground">
            {courseCode + " - " + courseTitle + " (" + sessionLabel + ")"  || "Select a course to manage assessments."}
          </p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm"><CheckCircle2 className="h-4 w-4" />{message}</div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {!sessionCourseId ? (
          <div className="p-10 text-center text-muted-foreground">No course selected.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">{form.id ? "Update Assessment" : "Add Assessment"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-xl font-semibold text-foreground">Assessment List</h2>
                  <span className="text-sm text-muted-foreground">
                    {items.length} Assessment{items.length !== 1 ? "s" : ""}
                    {items.length > 0 && <> · Total Marks: {allTotalMarks}</>}
                  </span>
                </div>

                {isLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading assessments...</div>
                ) : items.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Assessment Found</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Add an assessment for this course.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-175">
                      {/* <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Order</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Title</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Max Marks</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead> */}
                      <tbody>
                        {groupedAssessments.map((group) => (
                          <Fragment key={group.key}>
                            <tr className="bg-muted/40">
                              <td colSpan={4} className="px-6 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                    {/* <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                                      {calcLabel(group.calculation_type)}
                                    </span> */}
                                    <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                                      {typeLabel(group.assessment_type)}
                                    </span>
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {group.items.map((item) => (
                              <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                                <td className="px-6 py-4 text-sm font-medium text-foreground">{item.display_order}</td>
                                <td className="px-6 py-4 font-medium text-foreground">{item.title}</td>
                                <td className="px-6 py-4 text-sm text-foreground">{item.max_marks}</td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center gap-2">
                                    <button type="button" onClick={() => handleEdit(item)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80">Edit</button>
                                    <button type="button" onClick={() => handleDelete(item)} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/80" disabled={isDeleting}>Delete</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-border bg-accent/20">
                              <td colSpan={4} className="px-6 py-3">
                                <div className="flex items-center justify-end gap-2 text-sm">
                                  <span className="text-muted-foreground">
                                    Total Marks {group.calculation_type === "average" ? "(avg)" : "(sum)"}
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {group.total}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}