"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseAssignmentsQuery,
  useGetCourseAssignmentSubmissionsQuery,
} from "@/redux/features/course/course-contentApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.data?.data?.results)) return response.data.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

const toFileUrl = (file) =>
  file && /^https?:\/\//i.test(file) ? file : `${apiBase}${file}`;

export default function SubmissionPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;

  const [selectedAssignment, setSelectedAssignment] = useState("");

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const { data: assignmentsResponse, isLoading: loadingAssignments } = useGetCourseAssignmentsQuery(
    { session_course: sessionCourseId, records: 100, ordering: "-created_at" },
    { skip: !sessionCourseId }
  );
  const assignments = useMemo(() => normalizeList(assignmentsResponse), [assignmentsResponse]);

  const {
    data: submissionsResponse,
    isLoading: loadingSubmissions,
    isFetching: fetchingSubmissions,
  } = useGetCourseAssignmentSubmissionsQuery(
    { assignment: selectedAssignment, records: 100, ordering: "student__student_id" },
    { skip: !selectedAssignment }
  );
  const submissions = useMemo(() => normalizeList(submissionsResponse), [submissionsResponse]);

  // Sort by student id (ascending) first, then by submission time (newest first).
  const sortedSubmissions = useMemo(
    () =>
      [...submissions].sort((a, b) => {
        const aId = String(a.submitted_by_student_id ?? a.student ?? "");
        const bId = String(b.submitted_by_student_id ?? b.student ?? "");
        const idCmp = aId.localeCompare(bId, undefined, { numeric: true });
        if (idCmp !== 0) return idCmp;
        return (new Date(b.submitted_at || 0)) - (new Date(a.submitted_at || 0));
      }),
    [submissions]
  );

  const selectedTitle = useMemo(
    () => assignments.find((a) => String(a.id) === String(selectedAssignment))?.title || "",
    [assignments, selectedAssignment]
  );

  return (
<div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/my-courses">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Assignment Submissions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_title || "View student submissions for this course."}
          </p>
        </div>

        {!sessionCourseId ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium">No Course Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Open this page from a course in My Courses.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-foreground">Choose Assignment</label>
              {loadingAssignments ? (
                <p className="text-sm text-muted-foreground">Loading assignments...</p>
              ) : (
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark"
                >
                  <option value="">Select an assignment...</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              )}
            </div>

            {!selectedAssignment ? (
              <div className="rounded-2xl border bg-card p-10 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-medium text-foreground">Select an Assignment</h3>
                <p className="mt-2 text-sm text-muted-foreground">Pick an assignment above to see its student submissions.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-xl font-semibold text-foreground">Submissions</h2>
                  <span className="truncate text-sm text-muted-foreground">{selectedTitle || "Assignment"} • {submissions.length} submission{submissions.length !== 1 ? "s" : ""}</span>
                </div>

                {loadingSubmissions || fetchingSubmissions ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    Loading submissions...
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Submissions</h3>
                    <p className="mt-2 text-sm text-muted-foreground">No student has submitted this assignment yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3 font-medium">ID</th>
                          <th className="px-6 py-3 font-medium">Name</th>
                          <th className="px-6 py-3 font-medium">Files</th>
                          <th className="px-6 py-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSubmissions.map((s) => (
                          <tr key={s.id} className="border-b border-border transition hover:bg-accent/50 last:border-0">
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {s.submitted_by_student_id || `#${s.student ?? s.id}`}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                {s.submitted_by_name || `Student #${s.student}`}
                              </span>
                              {s.note && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{s.note}</p>}
                            </td>
                            <td className="px-6 py-4">
                              {Array.isArray(s.files) && s.files.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {s.files.map((f) => (
                                    <a
                                      key={f.id}
                                      href={toFileUrl(f.file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                      <Paperclip className="h-3.5 w-3.5" />
                                      File
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}