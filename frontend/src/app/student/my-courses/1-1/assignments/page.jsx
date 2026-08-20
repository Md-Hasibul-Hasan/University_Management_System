"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, BookOpen, CalendarClock, FileUp, Loader2, Paperclip, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTablePagination from "@/components/table/DataTablePagination";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseAssignmentsQuery,
  useGetCourseAssignmentSubmissionsQuery,
  useCreateCourseAssignmentSubmissionMutation,
  useDeleteCourseAssignmentSubmissionFileMutation,
} from "@/redux/features/course/course-contentApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
const toFileUrl = (file) => file && /^https?:\/\//i.test(file) ? file : `${apiBase}${file}`;
const getFileName = (file) => {
  const value = String(file || "").split("?")[0];
  return decodeURIComponent(value.split("/").pop() || "File");
};

const formatRemaining = (dueAt, now) => {
  const remaining = new Date(dueAt).getTime() - now;
  if (remaining <= 0) return "Deadline passed";
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
  return `${hours}h ${minutes}m ${seconds}s remaining`;
};

export default function AssignmentsPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;
  const { user } = useSelector((state) => state.auth);
  const studentId = user?.student?.id || "";
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [now, setNow] = useState(() => Date.now());
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const updateOrdering = (value) => { setOrdering(value); setPage(1); };
  const updateRecords = (value) => { setRecords(value); setPage(1); };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const { data: sessionCourseResponse } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => sessionCourseResponse?.data ?? sessionCourseResponse, [sessionCourseResponse]);
  const { data: assignmentsResponse, isLoading } = useGetCourseAssignmentsQuery(
    { session_course: sessionCourseId, search, ordering, page, records },
    { skip: !sessionCourseId }
  );
  const assignments = useMemo(() => normalizeList(assignmentsResponse), [assignmentsResponse]);
  const count = assignmentsResponse?.data?.count ?? assignmentsResponse?.count ?? assignments.length;
  const totalPages = Math.ceil(count / records);
  const { data: submissionsResponse, refetch: refetchSubmissions } = useGetCourseAssignmentSubmissionsQuery(
    { student: studentId, session_course: sessionCourseId, records: 100, ordering: "-submitted_at" },
    { skip: !sessionCourseId || !studentId }
  );
  const submissions = useMemo(() => normalizeList(submissionsResponse), [submissionsResponse]);
  const submissionsByAssignment = useMemo(
    () => Object.fromEntries(submissions.map((submission) => [String(submission.assignment), submission])),
    [submissions]
  );

  const [submitAssignment, { isLoading: isSubmitting }] = useCreateCourseAssignmentSubmissionMutation();
  const [deleteSubmissionFile, { isLoading: isDeletingFile }] = useDeleteCourseAssignmentSubmissionFileMutation();

  const updateDraft = (assignmentId, field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [assignmentId]: { ...previous[assignmentId], [field]: value },
    }));
  };

  const submit = async (assignment) => {
    const draft = drafts[assignment.id] || {};
    if (new Date(assignment.due_at).getTime() <= Date.now()) return;
    setMessage("");
    setError("");
    const formData = new FormData();
    formData.append("assignment", String(assignment.id));
    if (draft.note?.trim()) formData.append("note", draft.note.trim());
    (draft.files || []).forEach((file) => formData.append("files", file));

    try {
      await submitAssignment(formData).unwrap();
      setMessage(`Submission saved for ${assignment.title}.`);
      setDrafts((previous) => ({ ...previous, [assignment.id]: { note: "", files: [] } }));
      await refetchSubmissions();
    } catch (requestError) {
      setError(requestError?.data?.detail || requestError?.data?.message || "Failed to submit assignment.");
    }
  };

  const deletePreviousFile = async (submission, file) => {
    setMessage("");
    setError("");
    try {
      await deleteSubmissionFile({ submissionId: submission.id, fileId: file.id }).unwrap();
      setMessage("Previous file deleted.");
      await refetchSubmissions();
    } catch (requestError) {
      setError(requestError?.data?.detail || "Failed to delete previous file.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/my-courses/1-1"><ArrowLeft className="h-4 w-4" />Back to Courses</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Course Assignments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_code && sessionCourse?.course_title ? `${sessionCourse.course_code} - ${sessionCourse.course_title}` : "View and submit your assignments."}
          </p>
        </div>

        {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</div>}
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

        {!sessionCourseId ? (
          <div className="rounded-2xl border bg-card p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 font-medium">No Course Selected</h3><p className="mt-2 text-sm text-muted-foreground">Open this page from a course in My Courses.</p></div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <DataTableToolbar
              search={search}
              setSearch={updateSearch}
              ordering={ordering}
              setOrdering={updateOrdering}
              searchPlaceholder="Search assignments..."
              count={count}
              countLabel="Assignments"
              orderingOptions={[
                { value: "-created_at", label: "Newest First" },
                { value: "created_at", label: "Oldest First" },
                { value: "title", label: "Title (A-Z)" },
                { value: "-title", label: "Title (Z-A)" },
                { value: "due_at", label: "Due Date (Soonest)" },
                { value: "-due_at", label: "Due Date (Latest)" },
              ]}
            />
            <div className="flex items-center justify-between border-b border-border px-6 py-4"><h2 className="text-xl font-semibold text-foreground">Assignment List</h2></div>

            {isLoading ? <div className="p-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="mt-2 text-sm">Loading assignments...</p></div> : assignments.length === 0 ? <div className="p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 font-medium text-foreground">No Assignments</h3><p className="mt-2 text-sm text-muted-foreground">No assignments have been posted for this course yet.</p></div> : (
              <ul className="divide-y divide-border">
                {assignments.map((assignment, assignmentIndex) => {
                  const expired = new Date(assignment.due_at).getTime() <= now;
                  const draft = drafts[assignment.id] || {};
                  const previousSubmission = submissionsByAssignment[String(assignment.id)];
                  const hasSubmission = Boolean(previousSubmission);
                  return (
                    <li key={assignment.id} className="space-y-4 border-b border-border bg-background px-6 py-7 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Assignment {assignmentIndex + 1}</span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assignment details</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{assignment.title}</p>
                        {assignment.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{assignment.description}</p>}
                        {Array.isArray(assignment.files) && assignment.files.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Attached files</p>
                            <div className="flex flex-wrap gap-2">
                              {assignment.files.map((file) => <a key={file.id} href={toFileUrl(file.file)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"><Paperclip className="h-3.5 w-3.5" />{getFileName(file.file)}</a>)}
                            </div>
                          </div>
                        )}
                        <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${expired ? "text-destructive" : "text-green-600 dark:text-green-400"}`}><CalendarClock className="h-3.5 w-3.5" />{assignment.due_at ? `Due ${new Date(assignment.due_at).toLocaleString()} • ${formatRemaining(assignment.due_at, now)}` : "No due date"}</div>
                      </div>

                      {previousSubmission && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-xs font-medium text-muted-foreground">Your previous submission</p>
                          {previousSubmission.note && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{previousSubmission.note}</p>}
                          {Array.isArray(previousSubmission.files) && previousSubmission.files.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {previousSubmission.files.map((file) => (
                                  <span key={file.id} className="inline-flex">
                                    <a href={toFileUrl(file.file)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-l-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                                      <Paperclip className="h-3.5 w-3.5" />
                                      {getFileName(file.file)}
                                    </a>
                                    {!expired && <button type="button" onClick={() => deletePreviousFile(previousSubmission, file)} disabled={isDeletingFile} title="Delete previously submitted file" className="-ml-2 rounded-r-md border border-l-0 border-border bg-background px-2 py-1 text-muted-foreground hover:text-destructive disabled:opacity-50">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {previousSubmission.submitted_at && <p className="mt-2 text-xs text-muted-foreground">Submitted on {new Date(previousSubmission.submitted_at).toLocaleString()}</p>}
                        </div>
                      )}

                      {!expired && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <textarea value={draft.note ?? previousSubmission?.note ?? ""} onChange={(event) => updateDraft(assignment.id, "note", event.target.value)} rows={3} placeholder={previousSubmission ? "Update your note (optional)" : "Add a note (optional)"} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20" />
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <input
                                id={`assignment-files-${assignment.id}`}
                                type="file"
                                multiple
                                onChange={(event) => updateDraft(assignment.id, "files", Array.from(event.target.files || []))}
                                className="sr-only"
                              />
                              <label
                                htmlFor={`assignment-files-${assignment.id}`}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                              >
                                <FileUp className="h-4 w-4 text-muted-foreground" />
                                Choose files
                              </label>
                              {(draft.files || []).length > 0 && (
                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {draft.files.map((file) => <li key={`${file.name}-${file.lastModified}`} className="truncate">{file.name}</li>)}
                                </ul>
                              )}
                            </div>
                            <Button size="sm" onClick={() => submit(assignment)} disabled={isSubmitting || !studentId}><Send className="mr-2 h-4 w-4" />{isSubmitting ? (hasSubmission ? "Re-submitting..." : "Submitting...") : hasSubmission ? "Re-submit" : "Submit Assignment"}</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <DataTablePagination page={page} totalPages={totalPages} records={records} setRecords={updateRecords} setPage={setPage} maxRecords={20} />
          </div>
        )}
      </div>
    </div>
  );
}
