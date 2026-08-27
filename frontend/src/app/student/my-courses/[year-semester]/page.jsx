"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, CalendarCheck, ChevronDown, ClipboardList, FileText, Gauge, Loader2, Megaphone, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import DataTablePagination from "@/components/table/DataTablePagination";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import { useGetYearSemestersQuery } from "@/redux/features/academics/academicsApi";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetMySemesterResultQuery } from "@/redux/features/result/resultApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const statusStyles = {
  enrolled: "bg-green-500/10 text-green-600 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  dropped: "bg-destructive/10 text-destructive",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  retaken: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

const ordinal = { first: 1, second: 2, third: 3, fourth: 4 };
const yearNames = ["First", "Second", "Third", "Fourth"];

function ManageMenu({ sessionCourseId, base }) {
  const groups = [
    {
      label: "Assesment Marks",
      items: [{ label: "View Marks", icon: Gauge, href: `${base}/marks?session_course=${sessionCourseId}` }],
    },
    {
      label: "Classroom",
      items: [
        { label: "Materials", icon: FileText, href: `${base}/materials?session_course=${sessionCourseId}` },
        { label: "Assignments", icon: ClipboardList, href: `${base}/assignments?session_course=${sessionCourseId}` },
        { label: "Announcements", icon: Megaphone, href: `${base}/announcements?session_course=${sessionCourseId}` },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline"><MoreHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Contents</span><ChevronDown className="hidden h-4 w-4 sm:ml-1 sm:inline" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" avoidCollisions={false} className="w-56">
        {groups.map((group, index) => (
          <div key={group.label}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem asChild key={item.label}>
                  <Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Page() {
  const params = useParams();
  const semesterSlug = params["year-semester"] || "1-1";
  const [yearValue, semesterValue] = String(semesterSlug).split("-");
  const year = Number(yearValue);
  const semester = Number(semesterValue);
  const isValidSlug = year >= 1 && year <= 4 && (semester === 1 || semester === 2);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("course_title");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(10);

  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const updateOrdering = (value) => { setOrdering(value); setPage(1); };
  const updateRecords = (value) => { setRecords(value); setPage(1); };

  const { data: yearSemestersResponse, isLoading: loadingYearSemesters } = useGetYearSemestersQuery({ ordering: "year", page: 1, records: 100 });
  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);
  const yearSemester = yearSemesters.find((item) => ordinal[item.year] === year && ordinal[item.semester] === semester);
  const { data: response, isLoading, isFetching } = useGetStudentCoursesQuery(
    { search, ordering, page, records, "session_course__course__year_semester": yearSemester?.id || "" },
    { skip: !isValidSlug || !yearSemester?.id }
  );
  const courses = useMemo(() => normalizeList(response), [response]);
  // The main table shows only the student's current-attempt courses. The
  // previous attempt's failed courses are rendered in the separate
  // "Previous Failed Semester" table below, so they're excluded here.
  const visibleCourses = useMemo(
    () => courses.filter((course) => course.status !== "failed"),
    [courses]
  );
  const count = response?.data?.count ?? response?.count ?? visibleCourses.length;
  const totalPages = Math.ceil(count / records);

  // Published semester result for this year_semester (semester GPA + grades).
  const { data: semesterResultResponse, isFetching: semesterResultLoading } = useGetMySemesterResultQuery(
    { yearSemester: yearSemester?.id || "" },
    { skip: !isValidSlug || !yearSemester?.id }
  );
  const semesterResult = semesterResultResponse?.data?.data
    ?? semesterResultResponse?.data
    ?? semesterResultResponse;

  // Grade lookup maps ONLY the current attempt's graded courses by code. Failed
  // courses are intentionally excluded so a retake (which shares the same
  // course_code) does not inherit the previous attempt's F / 0.00 grade.
  const gradeByCode = useMemo(() => {
    const map = {};
    (semesterResult?.courses || []).forEach((item) => {
      map[item.course_code] = item;
    });
    return map;
  }, [semesterResult]);
  const title = isValidSlug ? `${yearNames[year - 1]} Year, ${semester === 1 ? "First" : "Second"} Semester` : "Invalid Semester";
  const base = `/student/my-courses/${semesterSlug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6"><h1 className="text-3xl font-bold text-foreground">{title}</h1><p className="mt-1 text-muted-foreground">Your enrolled courses for this semester.</p></div>
        {isValidSlug && semesterResult?.published && semesterResult?.status === "pass" ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-500/30 bg-green-500/5 p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Semester Result · {semesterResult.year_semester_name || title}</p>
              <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">PASSED</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Attempt {Number(semesterResult.attempt) || 1}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Semester GPA</p>
              <p className="text-3xl font-bold text-foreground">{Number(semesterResult.gpa).toFixed(2)}</p>
            </div>
          </div>
        ) : isValidSlug && semesterResultLoading ? (
          <div className="mb-6 flex items-center justify-center rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Checking semester result...</div>
        ) : null}
        {!isValidSlug ? (
          <div className="rounded-2xl border bg-card p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-3 font-medium">Invalid Semester</h2><p className="mt-2 text-sm text-muted-foreground">Choose a valid year and semester from My Courses.</p></div>
        ) : (
          <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <DataTableToolbar search={search} setSearch={updateSearch} ordering={ordering} setOrdering={updateOrdering} searchPlaceholder="Search courses..." count={count} countLabel="Courses" orderingOptions={[{ value: "-enrolled_at", label: "Newest Enrolled" }, { value: "enrolled_at", label: "Oldest Enrolled" }]} />
            {loadingYearSemesters || isLoading || isFetching ? <div className="p-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="mt-2 text-sm">Loading courses...</p></div> : visibleCourses.length === 0 ? <div className="p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-3 font-medium text-foreground">No Courses Found</h2><p className="mt-2 text-sm text-muted-foreground">You have no enrolled courses for this semester.</p></div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-max"><thead className="bg-muted/50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Course</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Grade</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">GPA</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Contents</th></tr></thead><tbody>{visibleCourses.map((course) => { const grade = gradeByCode[course.course_code]; return (<tr key={course.id} className="border-t border-border transition hover:bg-accent/50"><td className="px-6 py-4"><p className="font-medium text-foreground">{course.course_title || "-"}</p><p className="text-sm text-muted-foreground">{course.course_code || "-"}</p></td><td className="px-6 py-4 text-center"><span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${statusStyles[course.status] || "bg-muted text-muted-foreground"}`}>{course.status || "-"}</span></td><td className="px-6 py-4 text-center font-medium text-foreground">{grade?.letter_grade || "-"}</td><td className="px-6 py-4 text-center font-medium text-foreground">{grade?.grade_point != null ? Number(grade.grade_point).toFixed(2) : "-"}</td><td className="px-6 py-4"><div className="flex justify-center"><ManageMenu sessionCourseId={course.session_course} base={base} /></div></td></tr>); })}</tbody></table></div>
            )}
            {/* <DataTablePagination page={page} totalPages={totalPages} records={records} setRecords={updateRecords} setPage={setPage} maxRecords={20} /> */}
          </div>
          
          {semesterResult?.status === "fail" && (semesterResult?.failed_courses || []).length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
                <div>
                  <span className="inline-flex rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Failed</span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">Previous Failed Semester</h3>
                  <p className="text-sm text-muted-foreground">{semesterResult.year_semester_name || title} · Attempt {Number(semesterResult.attempt) || 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Semester GPA</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{Number(semesterResult.gpa).toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto"><table className="w-full min-w-max"><thead className="bg-muted/50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Course</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Grade</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">GPA</th><th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Contents</th></tr></thead><tbody>{(semesterResult.failed_courses || []).map((item, idx) => (<tr key={item.course_code || idx} className="border-t border-border transition hover:bg-accent/50"><td className="px-6 py-4"><p className="font-medium text-foreground">{item.course_title || "-"}</p><p className="text-sm text-muted-foreground">{item.course_code || "-"}</p></td><td className="px-6 py-4 text-center"><span className="inline-flex rounded-md bg-red-500/10 px-2 py-0.5 text-sm font-medium text-red-600 dark:text-red-400">failed</span></td><td className="px-6 py-4 text-center font-medium text-foreground">{item.letter_grade || "-"}</td><td className="px-6 py-4 text-center font-medium text-foreground">{item.grade_point != null ? Number(item.grade_point).toFixed(2) : "-"}</td><td className="px-6 py-4"><div className="flex justify-center"><ManageMenu sessionCourseId={item.session_course} base={base} /></div></td></tr>))}</tbody></table></div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
