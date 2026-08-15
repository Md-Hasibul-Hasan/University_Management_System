"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseAssignmentsQuery,
  useCreateCourseAssignmentMutation,
  useDeleteCourseAssignmentMutation,
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

const getErrorMessage = (err) => {
  const data = err?.data || {};
  if (typeof data === "string") return data;
  if (data.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
  if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  const extract = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return extract(value[0]);
    }
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) {
        const result = extract(value[key]);
        if (result) return result;
      }
    }
    return null;
  };
  return extract(data) || "Failed to save.";
};

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

const toFileUrl = (file) =>
  file && /^https?:\/\//i.test(file) ? file : `${apiBase}${file}`;

export default function AssignmentPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;

  const { user } = useSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const {
    data: assignmentsResponse,
    isLoading,
    refetch,
  } = useGetCourseAssignmentsQuery(
    { session_course: sessionCourseId, records: 100, ordering: "-created_at" },
    { skip: !sessionCourseId }
  );
  const assignments = useMemo(() => normalizeList(assignmentsResponse), [assignmentsResponse]);

  const [createAssignment, { isLoading: isCreating }] = useCreateCourseAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteCourseAssignmentMutation();

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueAt("");
    setFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionCourseId) return;
    setMessage("");
    setError("");
    const fd = new FormData();
    fd.append("session_course", String(sessionCourseId));
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    if (dueAt) fd.append("due_at", dueAt);
    files.forEach((file) => fd.append("files", file));
    try {
      await createAssignment(fd).unwrap();
      setMessage("Assignment created successfully.");
      resetForm();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    setMessage("");
    setError("");
    try {
      await deleteAssignment(id).unwrap();
      setMessage("Assignment deleted.");
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const givenByName = (a) => a?.given_by || (user && a?.created_by != null && String(a.created_by) === String(user?.id) ? user.name || "You" : null);
return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/my-courses">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Course Assignments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_title || "Create and manage assignments for this course."}
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>
        )}

        {!sessionCourseId ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium">No Course Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Open this page from a course in My Courses.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">New Assignment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" placeholder="Mid-term assignment" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark"
                      placeholder="Optional instructions"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Due At</label>
                    <Input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Files</label>
                    <input
                      type="file"
                      name="assignment-files"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
                    />
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {files.map((f, i) => <li key={i}>{f.name}</li>)}
                      </ul>
                    )}
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isCreating || !title.trim() || !dueAt}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </form>
              </div>
            </div>
<div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-xl font-semibold text-foreground">Assignment List</h2>
                  <span className="text-sm text-muted-foreground">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
                </div>

                {isLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Assignments</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Create the first assignment for this course.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {assignments.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{a.title}</p>
                          {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                          {Array.isArray(a.files) && a.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {a.files.map((f) => (
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
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {givenByName(a) && <span>Given by {givenByName(a)}</span>}
                            {a.due_at && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Due {new Date(a.due_at).toLocaleString()}
                              </span>
                            )}
                            {a.created_at && <span>{new Date(a.created_at).toLocaleString()}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(a.id)}
                          disabled={isDeleting}
                          className="shrink-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}