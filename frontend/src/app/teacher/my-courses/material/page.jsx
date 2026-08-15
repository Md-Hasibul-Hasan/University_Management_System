"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseMaterialsQuery,
  useCreateCourseMaterialMutation,
  useDeleteCourseMaterialMutation,
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

// API returns `file` as an absolute URL (e.g. http://host/media/...); use it
// directly, but still support a relative path just in case.
const toFileUrl = (file) =>
  file && /^https?:\/\//i.test(file) ? file : `${apiBase}${file}`;

export default function MaterialPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;
  const { user } = useSelector((state) => state.auth);

  // Resolve the uploader's name. Backend now sends `uploaded_by_name`, so prefer
  // it; fall back to matching `uploaded_by` against the logged-in RTK user.
  const uploaderName = (by, byName) => {
    if (byName) return byName;
    if (by && typeof by === "object") return by.name || null;
    return user && by != null && String(by) === String(user?.id) ? user.name || "You" : null;
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const {
    data: materialsResponse,
    isLoading,
    refetch,
  } = useGetCourseMaterialsQuery(
    { session_course: sessionCourseId, records: 100, ordering: "-uploaded_at" },
    { skip: !sessionCourseId }
  );
  const materials = useMemo(() => normalizeList(materialsResponse), [materialsResponse]);

  const [createMaterial, { isLoading: isCreating }] = useCreateCourseMaterialMutation();
  const [deleteMaterial, { isLoading: isDeleting }] = useDeleteCourseMaterialMutation();

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
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
    files.forEach((file) => fd.append("files", file));
    try {
      await createMaterial(fd).unwrap();
      setMessage("Material uploaded successfully.");
      resetForm();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this material?")) return;
    setMessage("");
    setError("");
    try {
      await deleteMaterial(id).unwrap();
      setMessage("Material deleted.");
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
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
          <h1 className="mt-2 text-3xl font-bold text-foreground">Course Materials</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_title || "Upload and manage materials for this course."}
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
                <h2 className="mb-6 text-xl font-semibold text-foreground">Upload Material</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" placeholder="Lecture 1 Notes" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark"
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Files</label>
                    <input
                      type="file"
                      name="material-files"
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
                  <Button type="submit" className="w-full gap-2" disabled={isCreating || !title.trim()}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isCreating ? "Uploading..." : "Upload"}
                  </Button>
                </form>
              </div>
            </div>
<div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-xl font-semibold text-foreground">Material List</h2>
                  <span className="text-sm text-muted-foreground">{materials.length} material{materials.length !== 1 ? "s" : ""}</span>
                </div>

                {isLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading materials...</div>
                ) : materials.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Materials</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Upload the first material for this course.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {materials.map((m) => (
                      <li key={m.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{m.title}</p>
                          {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                          {Array.isArray(m.files) && m.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {m.files.map((f) => (
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
                          {(m.uploaded_by != null || m.uploaded_at || m.uploaded_by_name) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {uploaderName(m.uploaded_by, m.uploaded_by_name) && <>Uploaded by {uploaderName(m.uploaded_by, m.uploaded_by_name)}</>}
                              {m.uploaded_at && <>{uploaderName(m.uploaded_by, m.uploaded_by_name) ? " • " : ""}{new Date(m.uploaded_at).toLocaleString()}</>}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(m.id)}
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