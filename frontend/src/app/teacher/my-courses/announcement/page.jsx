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
  Pin,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTablePagination from "@/components/table/DataTablePagination";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseAnnouncementsQuery,
  useCreateCourseAnnouncementMutation,
  useDeleteCourseAnnouncementMutation,
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

const getFileName = (file) => {
  const value = String(file || "").split("?")[0];
  return decodeURIComponent(value.split("/").pop() || "File");
};

export default function AnnouncementPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;
  const { user } = useSelector((state) => state.auth);

  // Resolve the uploader's name. Backend now sends `created_by_name`, so prefer
  // it; fall back to matching `created_by` against the logged-in RTK user.
  const uploaderName = (by, byName) => {
    if (byName) return byName;
    if (by && typeof by === "object") return by.name || null;
    return user && by != null && String(by) === String(user?.id) ? user.name || "You" : null;
  };

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);

  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const updateOrdering = (value) => { setOrdering(value); setPage(1); };
  const updateRecords = (value) => { setRecords(value); setPage(1); };

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const {
    data: announcementsResponse,
    isLoading,
    refetch,
  } = useGetCourseAnnouncementsQuery(
    { session_course: sessionCourseId, search, records, page, ordering },
    { skip: !sessionCourseId }
  );
  const announcements = useMemo(() => normalizeList(announcementsResponse), [announcementsResponse]);
  const count = announcementsResponse?.data?.count ?? announcementsResponse?.count ?? announcements.length;
  const totalPages = Math.ceil(count / records);

  const [createAnnouncement, { isLoading: isCreating }] = useCreateCourseAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteCourseAnnouncementMutation();

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setTitle("");
    setMessageText("");
    setIsPinned(false);
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
    if (messageText.trim()) fd.append("message", messageText.trim());
    fd.append("is_pinned", isPinned ? "true" : "false");
    files.forEach((file) => fd.append("files", file));
    try {
      await createAnnouncement(fd).unwrap();
      setMessage("Announcement created successfully.");
      resetForm();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    setMessage("");
    setError("");
    try {
      await deleteAnnouncement(id).unwrap();
      setMessage("Announcement deleted.");
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
          <h1 className="mt-2 text-3xl font-bold text-foreground">Course Announcements</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_code + " - " +  sessionCourse?.course_title  || "Post and manage announcements for this course."}
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
                <h2 className="mb-6 text-xl font-semibold text-foreground">New Announcement</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" placeholder="Class test schedule" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Message</label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark"
                      placeholder="Announcement text"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                    <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="h-4 w-4" />
                    Pin this announcement
                  </label>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Files</label>
                    <input
                      type="file"
                      name="announcement-files"
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
                    {isCreating ? "Posting..." : "Post"}
                  </Button>
                </form>
              </div>
            </div>
<div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <DataTableToolbar
                  search={search}
                  setSearch={updateSearch}
                  ordering={ordering}
                  setOrdering={updateOrdering}
                  searchPlaceholder="Search announcements..."
                  count={count}
                  countLabel="Announcements"
                  orderingOptions={[
                    { value: "-created_at", label: "Newest First" },
                    { value: "created_at", label: "Oldest First" },
                    { value: "title", label: "Title (A-Z)" },
                    { value: "-title", label: "Title (Z-A)" },
                    { value: "-is_pinned", label: "Pinned First" },
                  ]}
                />
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-xl font-semibold text-foreground">Announcement List</h2>
                  <span className="text-sm text-muted-foreground">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</span>
                </div>

                {isLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Announcements</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Post the first announcement for this course.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {announcements.map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                            {a.title}
                            {a.is_pinned && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                                <Pin className="h-3 w-3" /> Pinned
                              </span>
                            )}
                          </p>
                          {a.message && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.message}</p>}
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
                                  {getFileName(f.file)}
                                </a>
                              ))}
                            </div>
                          )}
                          {(a.created_by != null || a.created_at || a.created_by_name) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {uploaderName(a.created_by, a.created_by_name) && <>Posted by {uploaderName(a.created_by, a.created_by_name)}</>}
                              {a.created_at && <>{uploaderName(a.created_by, a.created_by_name) ? " • " : ""}{new Date(a.created_at).toLocaleString()}</>}
                            </p>
                          )}
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
                <DataTablePagination
                  page={page}
                  totalPages={totalPages}
                  records={records}
                  setRecords={updateRecords}
                  setPage={setPage}
                  maxRecords={20}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}