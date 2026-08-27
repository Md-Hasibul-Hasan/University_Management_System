"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useGetCourseAssessmentsQuery } from "@/redux/features/course/session-course-assessmentApi";
import { useGetAssessmentMarksQuery, useLazyGetAssessmentMarksQuery } from "@/redux/features/course/course-contentApi";
import { useGetSessionCourseResultsQuery } from "@/redux/features/result/resultApi";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import { useSelector } from "react-redux";

const normalizeList = (response) => {
	if (Array.isArray(response)) return response;
	if (Array.isArray(response?.data?.results)) return response.data.results;
	if (Array.isArray(response?.results)) return response.results;
	if (Array.isArray(response?.data)) return response.data;
	return [];
};

const byStudentIdAsc = (a, b) =>
	String(a?.student_id ?? "").localeCompare(String(b?.student_id ?? ""), undefined, { numeric: true });

const selectClasses =
	"h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

export default function Page() {
	const params = useParams();
	const searchParams = useSearchParams();
	const semesterSlug = params["year-semester"] || "1-1";
	const sessionCourseId = searchParams.get("session_course") || "";
	const { user } = useSelector((state) => state.auth);
	const myStudentId = user?.student?.student_id;
	const { data: scData } = useGetSessionCourseQuery(sessionCourseId, { skip: !sessionCourseId });
	const sessionCourse = useMemo(() => scData?.data ?? scData, [scData]);
	const isPublished = Boolean(sessionCourse?.publish_course_result);
	const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
	const [summaryMarks, setSummaryMarks] = useState([]);
	const [loadAssessmentMarks] = useLazyGetAssessmentMarksQuery();

	const { data: assessmentsResponse, isLoading: assessmentsLoading } = useGetCourseAssessmentsQuery(
		{ session_course: sessionCourseId, records: 100, ordering: "display_order" },
		{ skip: !sessionCourseId }
	);
	const assessments = useMemo(() => normalizeList(assessmentsResponse), [assessmentsResponse]);

	const { data: marksResponse, isLoading: marksLoading } = useGetAssessmentMarksQuery(
		selectedAssessmentId || undefined,
		{ skip: !selectedAssessmentId }
	);
	const selectedMarks = useMemo(() => [...normalizeList(marksResponse)].sort(byStudentIdAsc), [marksResponse]);

	// The logged-in student's computed course result (total / grade / GPA).
	const { data: resultsResponse, isFetching: resultsLoading } = useGetSessionCourseResultsQuery(
		sessionCourseId,
		{ skip: !sessionCourseId }
	);
	const myResult = useMemo(() => {
		const list = normalizeList(resultsResponse);
		if (list.length === 0) return null;
		// Resolve the logged-in student's own computed course result.
		if (myStudentId) {
			const mine = list.find(
				(r) => String(r.student_id) === String(myStudentId)
			);
			if (mine) return mine;
		}
		return list[0];
	}, [resultsResponse, myStudentId]);
	// Per-student computed results, keyed by student_course, so the summary
	// table shows each student's OWN total / grade / GPA (not a shared value).
	const resultByStudentCourse = useMemo(() => {
		const map = {};
		normalizeList(resultsResponse).forEach((r) => {
			map[String(r.student_course)] = r;
		});
		return map;
	}, [resultsResponse]);

	useEffect(() => {
		if (selectedAssessmentId || assessments.length === 0) {
			return undefined;
		}

		let active = true;
		Promise.all(assessments.map(async (assessment) => ({
			assessment,
			rows: normalizeList(await loadAssessmentMarks(assessment.id).unwrap()),
		})))
			.then((assessmentRows) => {
				if (!active) return;
				const studentsById = new Map();
				assessmentRows.forEach(({ assessment, rows }) => {
					rows.forEach((row) => {
						const key = String(row.student_course);
						const current = studentsById.get(key) || {
							student_course: row.student_course,
							student_id: row.student_id,
							student_name: row.student_name,
							marks: {},
						};
						current.marks[String(assessment.id)] = row.marks;
						studentsById.set(key, current);
					});
				});
				setSummaryMarks([...studentsById.values()].sort(byStudentIdAsc));
			})
			.catch(() => { if (active) setSummaryMarks([]); });

		return () => { active = false; };
	}, [assessments, loadAssessmentMarks, selectedAssessmentId]);

	const selectedAssessment = assessments.find((item) => String(item.id) === String(selectedAssessmentId));
	const summaryLoading = !selectedAssessmentId && assessments.length > 0 && summaryMarks.length === 0;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6">
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/student/my-courses/${semesterSlug}`}>
							<ArrowLeft className="h-4 w-4" />
							Back to Courses
						</Link>
					</Button>
					<h1 className="text-3xl font-bold text-foreground">Assessment Marks</h1>
					<p className="mt-2 text-sm text-muted-foreground">View marks for the selected course.</p>
				</div>

				{!sessionCourseId ? (
					<div className="rounded-2xl border bg-card p-10 text-center">
						<BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
						<h2 className="mt-3 font-medium text-foreground">No Course Selected</h2>
						<p className="mt-2 text-sm text-muted-foreground">Open this page from a course to view its marks.</p>
					</div>
				) : (

				<div className="mb-6 rounded-xl border bg-card p-5">
					<label className="mb-2 block text-sm font-medium text-muted-foreground">Select Assessment</label>
					<select value={selectedAssessmentId} onChange={(event) => setSelectedAssessmentId(event.target.value)} className={selectClasses} disabled={assessmentsLoading}>
						<option value="">-- View all assessment marks --</option>
						{assessments.map((assessment) => (
							<option key={assessment.id} value={assessment.id}>{assessment.title} ({assessment.assessment_type})</option>
						))}
					</select>
				</div>
				)}

				{sessionCourseId && isPublished && myResult?.total_marks != null && (
					<div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Your Course Result</p>
							<div className="mt-1 flex items-center gap-3">
								<span
									className={`inline-flex rounded-md px-2 py-0.5 text-sm font-semibold ${
										myResult.letter_grade === "F"
											? "bg-red-500/10 text-red-600 dark:text-red-400"
											: "bg-green-500/10 text-green-600 dark:text-green-400"
									}`}
								>
									{myResult.letter_grade}
								</span>
								<span className="text-sm text-muted-foreground">
									Total {Number(myResult.total_marks).toFixed(2)}
								</span>
							</div>
						</div>
						<div className="text-right">
							<p className="text-sm font-medium text-muted-foreground">Grade Point</p>
							<p className="text-3xl font-bold text-foreground">{Number(myResult.grade_point).toFixed(2)}</p>
						</div>
					</div>
				)}

				{sessionCourseId && <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
					<div className="border-b border-border px-6 py-4">
						<h2 className="text-xl font-semibold text-foreground">{selectedAssessment ? "Student Marks" : "All Assessment Marks"}</h2>
					</div>

					{selectedAssessmentId ? (
						marksLoading ? <LoadingMarks /> : <SelectedMarksTable rows={selectedMarks} assessment={selectedAssessment} />
					) : (
						summaryLoading ? <LoadingMarks /> : <SummaryMarksTable rows={summaryMarks} assessments={assessments} resultByStudentCourse={resultByStudentCourse} resultsLoading={resultsLoading} isPublished={isPublished} />
					)}
				</div>}
			</div>
		</div>
	);
}

function LoadingMarks() {
	return <div className="p-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
}

function EmptyMarks() {
	return <div className="p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No marks found.</p></div>;
}

function StudentCells({ row }) {
	return <>
		<td className="px-6 py-4 text-sm text-muted-foreground">{row.student_id || "-"}</td>
		<td className="px-6 py-4 font-medium text-foreground">{row.student_name}</td>
	</>;
}

function SelectedMarksTable({ rows, assessment }) {
	if (rows.length === 0) return <EmptyMarks />;
	const isAttendance = assessment?.assessment_type === "attendance";
	return <div className="overflow-x-auto"><table className="w-full min-w-max"><thead className="bg-muted/50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student ID</th><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>{isAttendance && <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Attendance %</th>}<th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Marks</th></tr></thead><tbody>{rows.map((row) => <tr key={row.student_course} className="border-t border-border transition hover:bg-accent/50"><StudentCells row={row} />{isAttendance && <td className="px-6 py-4 text-center text-sm text-muted-foreground">{row.attendance_percentage != null ? `${row.attendance_percentage}%` : "-"}</td>}<td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-foreground">{row.marks ?? "-"}</td></tr>)}</tbody></table></div>;
}

function SummaryMarksTable({ rows, assessments, resultByStudentCourse, resultsLoading, isPublished }) {
	if (rows.length === 0) return <EmptyMarks />;
	return <div className="overflow-x-auto"><table className="w-full min-w-max"><thead className="bg-muted/50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student ID</th><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>{assessments.map((assessment) => <th key={assessment.id} className="min-w-32 whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-muted-foreground">{assessment.title}</th>)}<th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Total</th><th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Grade</th><th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-muted-foreground">GPA</th></tr></thead><tbody>{rows.map((row) => {
		const result = resultByStudentCourse && resultByStudentCourse[String(row.student_course)];
		return (
			<tr key={row.student_course} className="border-t border-border transition hover:bg-accent/50">
				<StudentCells row={row} />
				{assessments.map((assessment) => (
					<td key={assessment.id} className="px-6 py-4 text-center text-sm text-foreground">{row.marks[String(assessment.id)] ?? "-"}</td>
				))}
				<td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-foreground">{isPublished && !resultsLoading && result?.total_marks != null ? Number(result.total_marks).toFixed(2) : "-"}</td>
				<td className="whitespace-nowrap px-6 py-4 text-center">{isPublished && !resultsLoading && result?.letter_grade ? <span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${result.letter_grade === "F" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400"}`}>{result.letter_grade}</span> : <span className="text-sm text-muted-foreground">-</span>}</td>
				<td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-foreground">{isPublished && !resultsLoading && result?.grade_point != null ? Number(result.grade_point).toFixed(2) : "-"}</td>
			</tr>
		);
	})}</tbody></table></div>;
}
