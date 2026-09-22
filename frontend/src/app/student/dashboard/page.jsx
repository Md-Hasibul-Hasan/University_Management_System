"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  Megaphone,
  Pin,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetSessionCoursesQuery } from "@/redux/features/course/sesion-courseApi";
import {
  useGetCourseAnnouncementsQuery,
  useGetCourseAssignmentsQuery,
  useGetCourseMaterialsQuery,
} from "@/redux/features/course/course-contentApi";
import {
  useGetMyCgpaQuery,
  useLazyGetMySemesterResultQuery,
} from "@/redux/features/result/resultApi";
import { useGetYearSemestersQuery } from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const CONTENT_COLORS = ["#8b5cf6", "#f43f5e", "#06b6d4"];
const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };
const CHART_TOOLTIP = { background: "#475569", border: "none", borderRadius: 12, color: "#fff" };

// StudentCourse status -> badge label + colours (mirrors the my-courses table).
const COURSE_STATUS_META = {
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  },
  retaken: {
    label: "Retaken",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  incomplete: {
    label: "Incomplete",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
  },
  dropped: {
    label: "Withdrawn",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  enrolled: {
    label: "Enrolled",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
};

// Deferred/retake courses have no computed grade point.
const formatGradePoint = (value) => {
  if (value === null || value === undefined || value === "") return "—";

  const gradePoint = Number(value);
  return Number.isNaN(gradePoint) ? String(value) : gradePoint.toFixed(2);
};

// Shortcuts into the per-course pages under /student/my-courses (same URLs as the courses table menu).
const COURSE_ACTIONS = [
  { label: "Materials", icon: FileText, path: "materials" },
  { label: "Assignments", icon: ClipboardList, path: "assignments" },
  { label: "Announcements", icon: Megaphone, path: "announcements" },
  { label: "Marks", icon: Gauge, path: "marks" },
];

const YEAR_ORDINALS = { first: 1, second: 2, third: 3, fourth: 4 };
const SEMESTER_ORDINALS = { first: 1, second: 2 };

// "First Year - First Semester" -> "1-1", matching the /student/my-courses/[year-semester] slug.
const yearSemesterSlug = (label) => {
  const words = String(label || "").toLowerCase().match(/first|second|third|fourth/g);
  if (!words || words.length < 2) return null;

  const year = YEAR_ORDINALS[words[0]];
  const semester = SEMESTER_ORDINALS[words[1]];
  return year && semester ? `${year}-${semester}` : null;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const initialsOf = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "S";

const timeAgo = (value) => {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";

  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(time).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function StudentDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const myStudentId = user?.student?.id;

  // Live CGPA computed from completed (passed) courses on the backend.
  const { data: cgpaResp, isLoading: loadingCgpa } = useGetMyCgpaQuery(
    undefined,
    { skip: !myStudentId }
  );
  const cgpaData = cgpaResp?.data ?? cgpaResp;
  const cgpa = cgpaData?.cgpa != null ? Number(cgpaData.cgpa).toFixed(2) : null;

  const { data: scResp, isLoading: loadingCourses } = useGetStudentCoursesQuery(
    { ordering: "-enrolled_at", records: 200 },
    { skip: !myStudentId }
  );
  const { data: sessResp, isLoading: loadingSessionCourses } = useGetSessionCoursesQuery({
    ordering: "-created_at",
    records: 200,
  });
  const { data: annResp } = useGetCourseAnnouncementsQuery({ records: 200 });
  const { data: asnResp } = useGetCourseAssignmentsQuery({ records: 200 });
  const { data: matResp } = useGetCourseMaterialsQuery({ records: 200 });

  const allStudentCourses = useMemo(() => normalizeList(scResp), [scResp]);
  const sessionCourses = useMemo(() => normalizeList(sessResp), [sessResp]);
  const announcements = useMemo(() => normalizeList(annResp), [annResp]);
  const assignments = useMemo(() => normalizeList(asnResp), [asnResp]);
  const materials = useMemo(() => normalizeList(matResp), [matResp]);

  // Only my own enrollments, and only courses that are running or completed.
  const visibleCourses = useMemo(() => {
    const enrolled = allStudentCourses.filter(
      (sc) => String(sc.student) === String(myStudentId)
    );

    return enrolled
      .map((sc) => {
        const info = sessionCourses.find(
          (x) => String(x.id) === String(sc.session_course)
        );

        return {
          id: sc.id,
          sessionCourseId: sc.session_course,
          status: info?.status,
          course_code: info?.course_code || sc.course_code,
          course_title: info?.course_title || sc.course_title,
          session_name: info?.session_name || sc.session,
        };
      })
      .filter((course) => course.status === "running" || course.status === "completed");
  }, [allStudentCourses, myStudentId, sessionCourses]);

  const myScIds = useMemo(
    () => new Set(visibleCourses.map((course) => String(course.sessionCourseId))),
    [visibleCourses]
  );

  const runningCount = visibleCourses.filter(
    (course) => course.status === "running"
  ).length;
  const completedCount = visibleCourses.filter(
    (course) => course.status === "completed"
  ).length;
  const totalCourses = visibleCourses.length;

  // ---- Current & previous semester results --------------------------------------
  const { data: ysResp, isLoading: loadingYearSemesters } = useGetYearSemestersQuery({
    ordering: "year",
    records: 100,
  });
  const yearSemesters = useMemo(() => normalizeList(ysResp), [ysResp]);
  const currentYearSemesterLabel = user?.student?.year_semester;

  // "First Year - First Semester" -> 11, so semesters can be ordered 11, 12, 21 …
  const currentYearSemesterKey = useMemo(() => {
    const slug = yearSemesterSlug(currentYearSemesterLabel);
    if (!slug) return null;

    const [year, semester] = slug.split("-").map(Number);
    return year * 10 + semester;
  }, [currentYearSemesterLabel]);

  // The YearSemester record matching the student's current profile.
  const currentYearSemester = useMemo(
    () =>
      yearSemesters.find(
        (ys) =>
          YEAR_ORDINALS[ys.year] * 10 + SEMESTER_ORDINALS[ys.semester] ===
          currentYearSemesterKey
      ),
    [yearSemesters, currentYearSemesterKey]
  );

  // Courses of the current year & semester — the same set listed on
  // /student/my-courses/[year-semester].
  const { data: currentCourseResp, isLoading: loadingCurrentCourseList } =
    useGetStudentCoursesQuery(
      {
        "session_course__course__year_semester": currentYearSemester?.id || "",
        ordering: "-enrolled_at",
        records: 100,
      },
      { skip: !myStudentId || !currentYearSemester?.id }
    );

  const currentSemesterCourses = useMemo(
    () =>
      normalizeList(currentCourseResp)
        .filter((sc) => String(sc.student) === String(myStudentId))
        .map((sc) => {
          const info = sessionCourses.find(
            (x) => String(x.id) === String(sc.session_course)
          );

          return {
            id: sc.id,
            sessionCourseId: sc.session_course,
            status: sc.status,
            course_code: sc.course_code || info?.course_code,
            course_title: sc.course_title || info?.course_title,
            session_name: info?.session_name || sc.session,
          };
        }),
    [currentCourseResp, myStudentId, sessionCourses]
  );

  const loadingMyCourses = loadingYearSemesters || loadingCurrentCourseList;

  // Every year/semester before the one the student is in now, oldest first.
  const previousSemesters = useMemo(() => {
    if (currentYearSemesterKey == null) return [];

    return yearSemesters
      .filter((ys) => YEAR_ORDINALS[ys.year] && SEMESTER_ORDINALS[ys.semester])
      .map((ys) => ({
        id: ys.id,
        key: YEAR_ORDINALS[ys.year] * 10 + SEMESTER_ORDINALS[ys.semester],
        label: `${YEAR_ORDINALS[ys.year]}-${SEMESTER_ORDINALS[ys.semester]}`,
      }))
      .filter((ys) => ys.key < currentYearSemesterKey)
      .sort((a, b) => a.key - b.key);
  }, [yearSemesters, currentYearSemesterKey]);

  const [triggerMySemesterResult] = useLazyGetMySemesterResultQuery();

  // Identity of the semester list being fetched, e.g. "3,4".
  const previousSemesterKey = useMemo(
    () => previousSemesters.map((semester) => semester.id).join(","),
    [previousSemesters]
  );

  // Results are stored with the key they belong to, so "still loading" is
  // derived instead of tracked with extra state.
  const [semesterState, setSemesterState] = useState({ key: "", results: [] });

  // One request per earlier semester; semesters whose result is not published
  // yet are skipped.
  useEffect(() => {
    if (!previousSemesterKey) return;

    let cancelled = false;

    Promise.all(
      previousSemesters.map((semester) =>
        triggerMySemesterResult({ yearSemester: semester.id })
          .unwrap()
          .then((response) => response?.data ?? response)
          .catch(() => null)
      )
    )
      .then((responses) => {
        if (cancelled) return;

        const results = responses
          .map((payload, index) => ({ payload, semester: previousSemesters[index] }))
          .filter(
            ({ payload }) =>
              payload && payload.published !== false && payload.gpa != null
          )
          .map(({ payload, semester }) => ({
            id: semester.id,
            key: semester.key,
            label: semester.label,
            name: payload.year_semester_name || semester.label,
            gpa: Number(payload.gpa),
            courses: [
              ...(payload.courses || []),
              ...(payload.failed_courses || []),
              ...(payload.deferred || []),
              ...(payload.retakes || []),
            ],
          }));

        setSemesterState({ key: previousSemesterKey, results });
      })
      .catch(() => {
        if (!cancelled) {
          setSemesterState({ key: previousSemesterKey, results: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previousSemesterKey, previousSemesters, triggerMySemesterResult]);

  const semesterResults = useMemo(
    () => (semesterState.key === previousSemesterKey ? semesterState.results : []),
    [semesterState, previousSemesterKey]
  );
  const loadingSemesterResults =
    Boolean(previousSemesterKey) && semesterState.key !== previousSemesterKey;

  // Oldest first — drives the GPA trend chart.
  const gpaTrend = semesterResults;

  // Newest first — drives the previous-courses table.
  const previousCourseRows = useMemo(
    () =>
      [...semesterResults]
        .reverse()
        .flatMap((semester) =>
          semester.courses.map((course) => ({
            ...course,
            semesterLabel: semester.label,
            semesterName: semester.name,
          }))
        ),
    [semesterResults]
  );

  // Content available inside my courses, grouped by type.
  const contentData = useMemo(() => {
    const inMyCourses = (item) => myScIds.has(String(item.session_course));

    return [
      { name: "Announcements", value: announcements.filter(inMyCourses).length },
      { name: "Assignments", value: assignments.filter(inMyCourses).length },
      { name: "Materials", value: materials.filter(inMyCourses).length },
    ];
  }, [announcements, assignments, materials, myScIds]);
  const totalContent = contentData.reduce((sum, item) => sum + item.value, 0);

  // Latest announcements across my courses (activity feed).
  const recentAnnouncements = useMemo(
    () =>
      announcements
        .filter((item) => myScIds.has(String(item.session_course)))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5),
    [announcements, myScIds]
  );

  const cgpaDisplay = loadingCgpa
    ? "…"
    : cgpa ??
      (user?.student?.cgpa != null ? Number(user.student.cgpa).toFixed(2) : "0.00");

  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      caption: "Running + completed",
      icon: BookOpen,
      tile: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
    {
      label: "Running",
      value: runningCount,
      caption: "Currently studying",
      icon: CalendarCheck,
      tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "Completed",
      value: completedCount,
      caption: "Finished courses",
      icon: GraduationCap,
      tile: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    },
    {
      label: "CGPA",
      value: cgpaDisplay,
      caption: "Credit-weighted average",
      icon: Gauge,
      tile: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
  ];

  const studentProfile = user?.student;
  const roleLabel = user?.is_admin ? "Administrator" : "Student";
  const studentChips = [
    studentProfile?.student_id ? `ID: ${studentProfile.student_id}` : null,
    studentProfile?.department,
    studentProfile?.year_semester,
    studentProfile?.session ? `Session ${studentProfile.session}` : null,
  ].filter(Boolean);

  const coursesBase = yearSemesterSlug(studentProfile?.year_semester)
    ? `/student/my-courses/${yearSemesterSlug(studentProfile?.year_semester)}`
    : null;

  if (loadingCourses || loadingSessionCourses) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-40 animate-pulse rounded-2xl border bg-muted/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
          <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white shadow-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-white/40">
              <AvatarImage src={user?.image} alt={user?.name || "Student"} />
              <AvatarFallback className="bg-white/20 text-lg font-semibold text-white">
                {initialsOf(user?.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25">
                <Sparkles className="h-3 w-3" />
                {roleLabel}
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting()}, {user?.name?.split(" ")[0] || "Student"}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                Here&apos;s everything happening across your courses.
              </p>

              {studentChips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {studentChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/90 ring-1 ring-inset ring-white/20"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {coursesBase && (
              <Button asChild className="bg-white text-emerald-700 hover:bg-white/90">
                <Link href={coursesBase}>
                  My Courses
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/student/profile">My Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.tile}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold leading-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.caption}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content available */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Course Content Available</CardTitle>
            <CardDescription>Announcements · Assignments · Materials</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {totalContent === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {contentData.map((d, i) => (
                      <Cell key={d.name} fill={CONTENT_COLORS[i % CONTENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Previous semester results */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Previous Semester Results</CardTitle>
            <CardDescription>Your GPA across earlier semesters</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {loadingSemesterResults ? (
              <ChartLoading />
            ) : gpaTrend.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gpaTrend}
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 4]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "currentColor", opacity: 0.06 }}
                    contentStyle={CHART_TOOLTIP}
                    formatter={(value) => [Number(value).toFixed(2), "GPA"]}
                    labelFormatter={(label) =>
                      gpaTrend.find((semester) => semester.label === label)?.name || label
                    }
                  />
                  <Bar dataKey="gpa" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {gpaTrend.map((semester, i) => (
                      <Cell key={semester.id} fill={CONTENT_COLORS[i % CONTENT_COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="gpa"
                      position="top"
                      fill="#94a3b8"
                      fontSize={11}
                      formatter={(value) => Number(value).toFixed(2)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses & activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">My Courses</CardTitle>
                <CardDescription>
                  {currentYearSemesterLabel
                    ? `Your enrolled courses · ${currentYearSemesterLabel}`
                    : "Courses you are enrolled in this semester"}
                </CardDescription>
              </div>
              {coursesBase && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={coursesBase}>
                    All courses
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingMyCourses ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading courses…</p>
              </div>
            ) : currentSemesterCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses this semester"
                description="Your enrolled courses for this semester will appear here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {currentSemesterCourses.map((course) => (
                  <CourseCard key={course.id} course={course} coursesBase={coursesBase} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
            <CardDescription>Latest posts across your courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentAnnouncements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Nothing posted yet"
                description="Announcements from your courses will show up here."
              />
            ) : (
              recentAnnouncements.map((announcement) => {
                const card = (
                  <>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {announcement.title || "Untitled announcement"}
                        </span>
                        {announcement.is_pinned && (
                          <Pin className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {visibleCourses.find(
                          (course) =>
                            String(course.sessionCourseId) === String(announcement.session_course)
                        )?.course_code || "Course"}{" "}
                        · {timeAgo(announcement.created_at)}
                      </span>
                    </span>
                  </>
                );

                return coursesBase ? (
                  <Link
                    key={announcement.id}
                    href={`${coursesBase}/announcements?session_course=${announcement.session_course}`}
                    className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-muted/60"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={announcement.id} className="flex items-start gap-3 p-2">
                    {card}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous courses */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Previous Courses</CardTitle>
          <CardDescription>
            Every course from your earlier semesters with its status and grade point
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSemesterResults ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading results…</p>
            </div>
          ) : previousCourseRows.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No earlier results yet"
              description="Once a previous semester result is published, its courses will be listed here."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Grade Point
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousCourseRows.map((row, index) => {
                      const meta = COURSE_STATUS_META[row.status] || {
                        label: row.status || "—",
                        className: "bg-muted text-muted-foreground",
                      };

                      return (
                        <tr
                          key={`${row.semesterLabel}-${row.course_code}-${index}`}
                          className="border-t border-border transition hover:bg-accent/50"
                        >
                          <td className="px-6 py-3">
                            <p className="font-medium text-foreground">
                              {row.course_title || row.course_code}
                            </p>
                            <p className="text-sm text-muted-foreground">{row.course_code}</p>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className="inline-flex rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground"
                              title={row.semesterName}
                            >
                              {row.semesterLabel}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-medium tabular-nums text-foreground">
                            {formatGradePoint(row.grade_point)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">No data yet.</p>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading results…</p>
    </div>
  );
}

function CourseCard({ course, coursesBase }) {
  const meta = COURSE_STATUS_META[course.status] || {
    label: course.status || "—",
    className: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-xl border bg-card p-4 transition duration-200 hover:border-ring/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {course.course_code || `Course #${course.sessionCourseId}`}
          </p>
          <h3
            className="mt-1 truncate font-medium text-foreground"
            title={course.course_title || ""}
          >
            {course.course_title || "Untitled course"}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {course.session_name || "Session not set"}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      {coursesBase && (
        <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
          {COURSE_ACTIONS.map((action) => (
            <UiTooltip key={action.path}>
              <TooltipTrigger asChild>
                <Link
                  href={`${coursesBase}/${action.path}?session_course=${course.sessionCourseId}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <action.icon className="h-4 w-4" />
                  <span className="sr-only">{action.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </UiTooltip>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}