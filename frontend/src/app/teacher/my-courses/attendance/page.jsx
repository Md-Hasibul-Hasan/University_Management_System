"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Save,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetSessionCourseAttendancesQuery,
  useCreateSessionCourseAttendanceMutation,
  useGetAttendanceSessionRecordsQuery,
  useCreateAttendanceSessionRecordsMutation,
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

// Ascending, numeric-aware sort by student id.
const byStudentIdAsc = (a, b) =>
  String(a?.student_id ?? "").localeCompare(String(b?.student_id ?? ""), undefined, { numeric: true });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatShort = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const getErrorMessage = (err) => {
  const data = err?.data || {};
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length) {
      return typeof value[0] === "string" ? value[0] : JSON.stringify(value[0]);
    }
  }
  return "Failed to save.";
};

// Fetch records for a single attendance session and report them up to the parent.
function SessionRecordsLoader({ sessionId, onData, refreshKey }) {
  const { data, refetch } = useGetAttendanceSessionRecordsQuery(sessionId);
  const rows = useMemo(() => normalizeList(data), [data]);
  useEffect(() => {
    if (rows.length) onData(sessionId, rows);
  }, [sessionId, rows, onData]);
  // Re-fetch this session's records whenever the parent asks (after a save).
  useEffect(() => {
    if (refreshKey > 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  return null;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;

  const [date, setDate] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [recordsBySession, setRecordsBySession] = useState({});
  const [roster, setRoster] = useState([]);
  const [draft, setDraft] = useState({}); // student_course -> status for the editing column
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  const {
    data: sessionsResponse,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useGetSessionCourseAttendancesQuery(sessionCourseId || undefined, { skip: !sessionCourseId });
  const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);

  const [createSession, { isLoading: isCreatingSession }] = useCreateSessionCourseAttendanceMutation();
  const [createRecords, { isLoading: isSaving }] = useCreateAttendanceSessionRecordsMutation();

  // Records callback used by every SessionRecordsLoader (builds roster + status maps).
  const handleRecordsLoaded = useMemo(
    () => (sessionId, rows) => {
      setRecordsBySession((prev) => ({ ...prev, [String(sessionId)]: rows }));
      // Use the first session that resolves as the canonical roster.
      setRoster((prev) => (prev.length ? prev : [...rows].sort(byStudentIdAsc)));
    },
    []
  );

  // Sessions come back newest-first; flip so the sheet reads oldest -> newest.
  const displaySessions = useMemo(() => [...sessions].reverse(), [sessions]);

  // (Re)initialise the draft for the selected session's column.
  const selectedRecords = useMemo(
    () => recordsBySession[selectedSessionId] || [],
    [recordsBySession, selectedSessionId]
  );
  useEffect(() => {
    if (!selectedSessionId) return;
    const init = {};
    selectedRecords.forEach((r) => { init[String(r.student_course)] = r.status || "PRESENT"; });
    setDraft(init);
    // selectedRecords referenced intentionally to refresh after save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId, selectedRecords]);

  // Build a lookup of saved status per session.
  const statusBySession = useMemo(() => {
    const map = {};
    Object.entries(recordsBySession).forEach(([sid, rows]) => {
      const inner = {};
      rows.forEach((r) => { inner[String(r.student_course)] = r.status; });
      map[sid] = inner;
    });
    return map;
  }, [recordsBySession]);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);
const handleCreateSession = async () => {
    if (!sessionCourseId || !date) return;
    setMessage("");
    setError("");
    try {
      const res = await createSession({ sessionCourseId: Number(sessionCourseId), date }).unwrap();
      const newId = res?.data?.data?.id ?? res?.data?.id;
      setDate("");
      setSelectedSessionId(String(newId));
      setMessage("Attendance session created. Tick the boxes to mark students present, then save.");
      await refetchSessions();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleCell = (studentCourseId) => {
    const key = String(studentCourseId);
    const next = draft[key] === "PRESENT" ? "ABSENT" : "PRESENT";
    setDraft((prev) => ({ ...prev, [key]: next }));
  };

  const makeAllPresent = () => {
    const allPresent = {};
    roster.forEach((s) => { allPresent[String(s.student_course)] = "PRESENT"; });
    setDraft(allPresent);
  };

  const handleSave = async () => {
    if (!selectedSessionId || roster.length === 0) return;
    setMessage("");
    setError("");
    const payload = {
      attendance: roster.map((s) => ({
        student_course: Number(s.student_course),
        status: draft[String(s.student_course)] || "PRESENT",
      })),
    };
    try {
      await createRecords({ attendanceSessionId: Number(selectedSessionId), ...payload }).unwrap();
      setMessage("Attendance saved successfully.");
      setSelectedSessionId("");   // deselect after save
      setDraft({});
      await refetchSessions();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const selectedIsNewest =
    sessions.length > 0 && String(sessions[0].id) === String(selectedSessionId);
  const markedCount = roster.filter((s) => draft[String(s.student_course)] === "PRESENT").length;
const selectedSession = sessions.find((s) => String(s.id) === String(selectedSessionId));

return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/my-courses">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Attendance Sheet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_title || "Take attendance and review all previous records."}
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {!sessionCourseId ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium">No Course Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">Open this page from a course in My Courses.</p>
          </div>
        ) : (
          <>
            {/* Create a new attendance date */}
            <div className="mb-6 rounded-xl border bg-card p-5">
              <h2 className="mb-4 flex items-center text-base font-semibold text-foreground">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                Take New Attendance
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-auto"
                />
                <Button size="sm" onClick={handleCreateSession} disabled={isCreatingSession || !date}>
                  {isCreatingSession ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isCreatingSession ? "Creating..." : "Create Date & Take Attendance"}
                </Button>
              </div>
            </div>

            {/* The one attendance matrix */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedSession
                      ? `Attendance - ${formatDate(selectedSession.date)}`
                      : "Attendance Record"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sessions.length === 0
                      ? "No sessions yet — create a date above to start."
                      : selectedSessionId
                        ? `${markedCount} / ${roster.length} marked present · tick the ${selectedIsNewest ? "newest " : ""}date column to edit`
                        : `${sessions.length} session(s). Click a date column header to edit it.`}
                  </p>
                </div>
                {selectedSessionId && roster.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={makeAllPresent}
                      disabled={isSaving}
                      title="Mark every student present in the selected date column"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark All Present
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSaving ? "Saving..." : "Save Attendance"}
                    </Button>
                  </div>
                )}
              </div>
{/* Load the records for every session to build the matrix */}
              {displaySessions.map((s) => (
                <SessionRecordsLoader key={s.id} sessionId={s.id} onData={handleRecordsLoaded} refreshKey={refreshKey} />
              ))}

              {sessionsLoading || sessions.length === 0 ? (
                sessionsLoading ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-2 text-sm">Loading attendance...</p>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-medium text-foreground">No Sessions Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create a date above to take the first attendance.
                    </p>
                  </div>
                )
              ) : roster.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 font-medium text-foreground">No Students Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No student enrolments for this course.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="sticky left-0 z-10 border-r border-border bg-muted px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Student
                        </th>
                        {displaySessions.map((s) => {
                          const isSel = String(s.id) === String(selectedSessionId);
                          return (
                            <th
                              key={s.id}
                              onClick={() => setSelectedSessionId(String(s.id))}
                              title="Click heading to edit this date"
                              className={`cursor-pointer whitespace-nowrap px-3 py-4 text-center text-sm transition-colors ${
                                isSel
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span className="block">{formatShort(s.date)}</span>
                              <span
                                className={`mx-auto mt-1 block h-1 w-6 rounded-full ${
                                  isSel ? "bg-primary" : "bg-transparent"
                                }`}
                              />
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
<tbody>
                      {roster.map((student) => (
                        <tr
                          key={student.student_course}
                          className="border-t border-border transition hover:bg-accent/50"
                        >
                          <td className="sticky left-0 z-10 border-r border-border bg-card px-6 py-3">
                            <span className="block text-sm font-medium text-foreground">
                              {student.student_name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {student.student_id || "-"}
                            </span>
                          </td>
                          {displaySessions.map((s) => {
                            const isSel = String(s.id) === String(selectedSessionId);
                            if (isSel) {
                              const key = String(student.student_course);
                              const isPresent = (draft[key] || "PRESENT") === "PRESENT";
                              return (
                                <td key={s.id} className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleCell(key)}
                                    aria-pressed={isPresent}
                                    title={
                                      isPresent
                                        ? "Present — click to mark absent"
                                        : "Absent — click to mark present"
                                    }
                                    className={`mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                                      isPresent
                                        ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
                                        : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                                    }`}
                                  >
                                    {isPresent ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </button>
                                </td>
                              );
                            }
                            const saved = statusBySession[String(s.id)]?.[String(student.student_course)];
                            let cell;
                            if (saved === "PRESENT") {
                              cell = <Check className="mx-auto h-4 w-4 text-green-600" />;
                            } else if (saved === "ABSENT") {
                              cell = <X className="mx-auto h-4 w-4 text-red-500" />;
                            } else {
                              cell = <span className="text-muted-foreground/40">-</span>;
                            }
                            return <td key={s.id} className="px-3 py-3 text-center">{cell}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </>
          )}
      </div>
    </div>
  );
}