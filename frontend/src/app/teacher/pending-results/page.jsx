"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, ClipboardList, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useGetPublishableSemesterResultsQuery,
  useCalculateDepartmentSemesterResultsMutation,
  usePublishDepartmentSemesterResultsMutation,
} from "@/redux/features/result/resultApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.publishable_semester_results)) return response.data.publishable_semester_results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const statusStyles = {
  pass: "bg-green-500/10 text-green-600 dark:text-green-400",
  fail: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function Page() {
  const { data: pendingResponse, isLoading, refetch } = useGetPublishableSemesterResultsQuery();
  const [calculate, { isLoading: calculating }] = useCalculateDepartmentSemesterResultsMutation();
  const [publish, { isLoading: publishing }] = usePublishDepartmentSemesterResultsMutation();

  const pending = useMemo(() => {
    const list = normalizeList(pendingResponse);
    return Array.isArray(list) ? list : [];
  }, [pendingResponse]);

  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [publishError, setPublishError] = useState("");

  const handleReview = async (item) => {
    setSelected(item);
    setPreview(null);
    setPublishError("");
    setIsLoadingPreview(true);
    try {
      const result = await calculate({ session: item.session, year_semester: item.year_semester }).unwrap();
      const data = result?.data?.data ?? result?.data ?? result;
      setPreview(normalizeList(data.results));
    } catch (err) {
      setPublishError(err?.data?.message || err?.data?.detail || "Failed to calculate semester results.");
      setPreview([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleBack = () => {
    setSelected(null);
    setPreview(null);
    setPublishError("");
  };

  const handlePublish = async () => {
    if (!selected) return;
    setPublishError("");
    try {
      await publish({ session: selected.session, year_semester: selected.year_semester }).unwrap();
      setPreview(null);
      setSelected(null);
      refetch();
    } catch (err) {
      setPublishError(err?.data?.message || err?.data?.detail || "Failed to publish semester result.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Pending Semester Results</h1>
          <p className="mt-1 text-muted-foreground">Semester results ready to be reviewed and published for your department.</p>
        </div>

        {selected ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
                <h2 className="text-xl font-semibold text-foreground">Review Semester Result</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {formatValue(selected.session_name)} <span className="mx-1">&middot;</span> {formatValue(selected.year_semester_name)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">Semester Result Preview</h2>
              <p className="text-sm text-muted-foreground">Computed from all published course results. Verify before publishing.</p>
            </div>

            {isLoadingPreview || calculating ? (
              <div className="flex items-center justify-center p-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating semester result...
              </div>
            ) : preview && preview.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">GPA</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={row.student_id || idx} className="border-t border-border transition hover:bg-accent/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{row.student_name}</p>
                          <p className="text-sm text-muted-foreground">{row.student_id}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${statusStyles[row.status] || "bg-muted text-muted-foreground"}`}>{row.status}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-foreground">{formatValue(row.gpa)}</td>
                          <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                            {Array.isArray(row.courses)
                              ? (() => {
                                  const passed = row.courses.filter((c) => Number(c.grade_point) >= 2.0).length;
                                  const failed = row.courses.length - passed;
                                  return failed > 0
                                    ? `${passed} passed, ${failed} failed`
                                    : `${row.courses.length} course${row.courses.length !== 1 ? "s" : ""}`;
                              })()
                            : "-"}
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                {publishError ? (
                  <>
                    <BookOpen className="mx-auto h-10 w-10 text-destructive" />
                    <h3 className="mt-3 font-medium text-foreground">Cannot preview</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{publishError}</p>
                  </>
                ) : (
                  <>
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No results yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">No students were found for this semester.</p>
                  </>
                )}
              </div>
            )}

            {preview && preview.length > 0 && (
              <div className="flex items-center justify-end gap-3 px-6 py-4">
                {publishError && <span className="text-sm text-destructive">{publishError}</span>}
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Publish Semester Result
                </Button>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-2 text-sm">Loading pending semester results...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-medium text-foreground">No Pending Results</h2>
            <p className="mt-2 text-sm text-muted-foreground">All semester results for your department have been reviewed and published.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Year &amp; Semester</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((item) => (
                    <tr key={`${item.session}-${item.year_semester}`} className="border-t border-border transition hover:bg-accent/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{formatValue(item.session_name)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{formatValue(item.year_semester_name)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Button size="sm" onClick={() => handleReview(item)} disabled={calculating}>
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}