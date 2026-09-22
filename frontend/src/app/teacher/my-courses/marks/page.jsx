"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCourseAssessmentsQuery } from "@/redux/features/course/session-course-assessmentApi";
import {
  useGetSessionCourseQuery,
  usePartialUpdateSessionCourseMutation,
} from "@/redux/features/course/sesion-courseApi";
import {
  useCreateAssessmentMarksMutation,
  useGetAssessmentMarksQuery,
  useLazyGetAssessmentMarksQuery,
} from "@/redux/features/course/course-contentApi";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetSessionCourseTeachersQuery, useGetSessionCourseTeacherResultsQuery, usePublishSessionCourseTeacherResultMutation } from "@/redux/features/course/session-course-teacherApi";
import ExcelExportButton from "@/components/table/ExcelExportButton";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

// Ascending, numeric-aware sort by student id.
const byStudentIdAsc = (a, b) =>
  String(a?.student_id ?? "").localeCompare(String(b?.student_id ?? ""), undefined, { numeric: true });

// Excel cells stay numeric when the value parses as a finite number.
const toExportValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : String(value);
};

const selectClasses =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

const getErrorMessage = (err) => {
  const data = err?.data || {};
  if (data.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
  if (typeof data === "string") return data;
  if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);

  // Flatten nested DRF validation errors (e.g. {marks:[{marks:["..."]}]})
  // into the first readable string so we never render an object as text.
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

export default function Page() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;

  const { user } = useSelector((state) => state.auth);
  const myTeacherId = user?.teacher?.id;

  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  // Holds only the marks the teacher types (overrides). Loaded/saved marks come
  // straight from the current assessment's fetch, so switching assessments can
  // never show another assessment's marks.
  const [marks, setMarks] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: assessmentsResponse, isLoading: assessmentsLoading } = useGetCourseAssessmentsQuery(
    { session_course: sessionCourseId, records: 100, ordering: "display_order" },
    { skip: !sessionCourseId }
  );
  const assessments = useMemo(() => normalizeList(assessmentsResponse), [assessmentsResponse]);

  const { data: scData, refetch: refetchSessionCourse } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
  const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);

  // Teacher assignments for this course: used to detect external teachers
  // (final marks only) and to track per-teacher result publication.
  const { data: assignmentResponse, refetch: refetchAssignments } = useGetSessionCourseTeachersQuery(
    { session_course: sessionCourseId, records: 20 },
    { skip: !sessionCourseId }
  );
  const assignments = useMemo(() => normalizeList(assignmentResponse), [assignmentResponse]);
  const myAssignment = useMemo(
    () => assignments.find((a) => String(a.teacher) === String(myTeacherId)),
    [assignments, myTeacherId]
  );
  const isExternal = myAssignment?.type === "external_teacher";
  const myResultPublished = Boolean(myAssignment?.result_published);

  // Total / Grade / Grade Point computed from THIS teacher's own final marks.
  const {
    data: ownResultsResponse,
    isFetching: ownResultsLoading,
    refetch: refetchOwnResults,
  } = useGetSessionCourseTeacherResultsQuery(myAssignment?.id, {
    skip: !myAssignment?.id,
  });
  const ownResultByStudentCourse = useMemo(() => {
    const map = {};
    const rows = Array.isArray(ownResultsResponse?.results)
      ? ownResultsResponse.results
      : normalizeList(ownResultsResponse);
    rows.forEach((row) => {
      map[String(row.student_course)] = row;
    });
    return map;
  }, [ownResultsResponse]);

  // Assessments the teacher can open and edit: external examiners may only
  // enter the final exam marks.
  const visibleAssessments = useMemo(
    () => (isExternal ? assessments.filter((a) => a.assessment_type === "final") : assessments),
    [assessments, isExternal]
  );

  // Assessments shown in the read-only "All Assessment Marks" table / export.
  // External examiners can see every assessment (attendance, incourse, ...)
  // here, they just cannot edit the ones that are not the final exam.
  const summaryAssessments = assessments;

  const { data: marksResponse, isLoading: marksLoading, refetch } = useGetAssessmentMarksQuery(
    selectedAssessmentId || undefined,
    { skip: !selectedAssessmentId }
  );
  const students = useMemo(() => [...normalizeList(marksResponse)].sort(byStudentIdAsc), [marksResponse]);
  const [loadAssessmentMarks] = useLazyGetAssessmentMarksQuery();
  const [summaryMarks, setSummaryMarks] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const selectedAssessment = assessments.find((a) => String(a.id) === String(selectedAssessmentId));
  const isAttendance = selectedAssessment?.assessment_type === "attendance";
  const isFinal = selectedAssessment?.assessment_type === "final";
  const isPublished = Boolean(sessionCourse?.publish_course_result);

  // Total / Grade / Grade Point stay hidden until this teacher submits their
  // own final marks (or once the course result is published).
  const showOwnResult = myResultPublished || isPublished;

  const [createMarks, { isLoading: isSaving }] = useCreateAssessmentMarksMutation();
  const [publishSessionCourse, { isLoading: isPublishing }] = usePartialUpdateSessionCourseMutation();
  const [publishAssignmentResult, { isLoading: isPublishingAssignment }] = usePublishSessionCourseTeacherResultMutation();

  const { data: studentCoursesResponse, isFetching: studentCoursesLoading, refetch: refetchStudentCourses } = useGetStudentCoursesQuery(
    { session_course: sessionCourseId, records: 200 },
    { skip: !sessionCourseId }
  );

  // "All Assessment Marks" is exportable once the course result is published.
  const exportColumns = useMemo(
    () => [
      { label: "Student ID", width: 16 },
      { label: "Student", width: 28 },
      ...summaryAssessments.map((assessment) => ({ label: assessment.title, width: 14 })),
      { label: "Total", width: 10 },
      { label: "Grade", width: 10 },
      { label: "GPA", width: 10 },
    ],
    [summaryAssessments]
  );

  const exportRows = useMemo(
    () =>
      summaryMarks.map((student) => {
        const result = ownResultByStudentCourse[String(student.student_course)];

        return [
          student.student_id || "",
          student.student_name || "",
          ...summaryAssessments.map((assessment) => toExportValue(student.marks[String(assessment.id)])),
          toExportValue(result?.total_marks),
          result?.letter_grade || "",
          toExportValue(result?.grade_point),
        ];
      }),
    [summaryAssessments, ownResultByStudentCourse, summaryMarks]
  );

  // Whenever the selected assessment changes, clear typed overrides so a student's
// value from one assessment never leaks into another (keys are student_course,
// which is shared across assessments).
  useEffect(() => {
    setMarks({});
  }, [selectedAssessmentId]);

  useEffect(() => {
    if (selectedAssessmentId || summaryAssessments.length === 0) {
      setSummaryMarks([]);
      return;
    }

    let active = true;
    setSummaryLoading(true);

    Promise.all(
      summaryAssessments.map(async (assessment) => ({
        assessment,
        rows: normalizeList(await loadAssessmentMarks(assessment.id).unwrap()),
      }))
    )
      .then((assessmentRows) => {
        if (!active) return;

        const studentsById = new Map();
        assessmentRows.forEach(({ assessment, rows }) => {
          rows.forEach((student) => {
            const key = String(student.student_course);
            const current = studentsById.get(key) || {
              student_course: student.student_course,
              student_id: student.student_id,
              student_name: student.student_name,
              marks: {},
            };
            current.marks[String(assessment.id)] = student.marks;
            studentsById.set(key, current);
          });
        });

        setSummaryMarks([...studentsById.values()].sort(byStudentIdAsc));
      })
      .catch(() => {
        if (active) setSummaryMarks([]);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => { active = false; };
  }, [summaryAssessments, loadAssessmentMarks, selectedAssessmentId]);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 5000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const handleAssessmentSelect = (e) => {
    setSelectedAssessmentId(e.target.value);
  };

  const saveMarks = async () => {
    if (!selectedAssessmentId) return;

    const payload = {
      assessmentId: Number(selectedAssessmentId),
      marks: students.map((s) => ({
        student_course: Number(s.student_course),
        marks: marks[String(s.student_course)] ?? (s.marks != null ? s.marks : "0"),
      })),
    };

    await createMarks(payload).unwrap();
    await refetch();
  };

  const handleSave = async () => {
    // if (isPublished) return;
    setMessage("");
    setError("");

    try {
      await saveMarks();
      setMessage("Marks saved successfully.");
      refetchStudentCourses();
      refetchOwnResults();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handlePublish = async () => {
    if (!sessionCourseId || !myAssignment || myResultPublished) return;
    setMessage("");
    setError("");

    try {
      // If a specific assessment is open, persist its typed marks first.
      if (selectedAssessmentId) {
        await saveMarks();
      }

      const result = await publishAssignmentResult(myAssignment.id).unwrap();
      await refetchAssignments();
      await refetchSessionCourse();
      refetchStudentCourses();
      // Recompute Total / Grade / Grade Point from the marks just submitted.
      refetchOwnResults();

      setMessage(
        result?.course_published
          ? "Final marks submitted successfully. Course result is now published."
          : "Your final marks have been submitted. Waiting for the other teacher to submit."
      );
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
          <h1 className="mt-2 text-3xl font-bold text-foreground">Assessment Marks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_code + " - " + sessionCourse?.course_title  || "Select an assessment to enter student marks."}
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
          <div className="mb-6 rounded-xl border bg-card p-5">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Select Assessment</label>
            <select
              value={selectedAssessmentId}
              onChange={handleAssessmentSelect}
              className={selectClasses}
              disabled={assessmentsLoading}
            >
              <option value="">-- Select an assessment --</option>
              {visibleAssessments.map((a) => (
                <option key={a.id} value={a.id}>{a.title} ({a.assessment_type})</option>
              ))}
            </select>
            {isExternal && (
              <p className="mt-3 text-sm text-muted-foreground">
                As an external teacher, only final exam marks can be entered for this course.
              </p>
            )}
            {!assessmentsLoading && visibleAssessments.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {isExternal
                  ? "No final exam assessment found for this course."
                  : "No assessments found for this course. Create one under Assessments first."}
              </p>
            )}
          </div>
        )}

        {selectedAssessmentId && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">Student Marks</h2>
              <Button size="sm" onClick={handleSave} disabled={isSaving || isPublishing || marksLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                { isSaving ? "Saving..." : "Save Marks"}
              </Button>
            </div>

            {marksLoading ? (
              <div className="p-10 text-center text-muted-foreground">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-medium text-foreground">No Students Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">No student enrolments for this course.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student Name</th>
                      {isAttendance && (
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Attendance %</th>
                      )}
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={s.student_course} className="border-t border-border transition hover:bg-accent/50">
                        <td className="px-6 py-4 text-sm text-muted-foreground">{s.student_id || "-"}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{s.student_name}</td>
                        {isAttendance && (
                          <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                            {s.attendance_percentage != null ? `${s.attendance_percentage}%` : "-"}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              step="any"
                              value={marks[String(s.student_course)] ?? (s.marks != null ? s.marks : "")}
                              onChange={(e) => setMarks((prev) => ({ ...prev, [String(s.student_course)]: e.target.value }))}
                              className="w-32 text-center"
                              placeholder="0"
                              // disabled={isPublished}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {sessionCourseId && !selectedAssessmentId && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">All Assessment Marks</h2>
                <p className="mt-1 text-sm text-muted-foreground">Select an assessment above to edit its marks.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ExcelExportButton
                  fileName={`assessment-marks-${sessionCourse?.course_code || sessionCourseId || "course"}.xlsx`}
                  sheetName="All Assessment Marks"
                  columns={exportColumns}
                  rows={exportRows}
                  disabled={!isPublished || summaryLoading}
                  label="Download Excel"
                />
                <Button onClick={handlePublish} disabled={isPublishingAssignment || studentCoursesLoading || myResultPublished || !myAssignment}>
                  {isPublishingAssignment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {myResultPublished ? "Your Result Submitted" : isPublishingAssignment ? "Submitting..." : "Submit My Final Marks"}
                </Button>
              </div>
            </div>

            {assignments.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-6 py-3 text-sm">
                <span className="text-muted-foreground">Result submission status:</span>
                {assignments.map((a) => (
                  <span key={a.id} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium ${a.result_published ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                    {a.teacher_name || `Teacher #${a.teacher}`} ({a.type === "external_teacher" ? "External" : "Course"})
                    {a.result_published ? " — Submitted" : " — Pending"}
                  </span>
                ))}
                {!isPublished && <span className="text-muted-foreground">Course completes when all teachers submit.</span>}
              </div>
            )}

            {summaryLoading ? (
              <div className="p-10 text-center text-muted-foreground">Loading marks summary...</div>
            ) : summaryMarks.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No student marks found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                      {summaryAssessments.map((assessment) => (
                        <th key={assessment.id} className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                          {assessment.title}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Total</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Grade</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryMarks.map((student, index) => (
                      <tr key={student.student_course} className="border-t border-border transition hover:bg-accent/50">
                        <td className="px-6 py-4 text-sm text-muted-foreground">{student.student_id || "-"}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{student.student_name}</td>
                        {summaryAssessments.map((assessment) => (
                          <td key={assessment.id} className="px-6 py-4 text-center text-sm text-foreground">
                            {student.marks[String(assessment.id)] ?? "-"}
                          </td>
                        ))}
                        {(() => {
                          const result = ownResultByStudentCourse[String(student.student_course)];
                          const showResult = showOwnResult && !ownResultsLoading && result;
                          return (
                            <>
                              <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                                {showResult && result.total_marks != null ? Number(result.total_marks).toFixed(2) : "-"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {showResult && result.letter_grade ? (
                                  <span
                                    className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${
                                      result.letter_grade === "F"
                                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                        : "bg-green-500/10 text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {result.letter_grade}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                                {showResult && result.grade_point != null ? Number(result.grade_point).toFixed(2) : "-"}
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}