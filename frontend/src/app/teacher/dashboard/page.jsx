"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Inbox,
  Megaphone,
  Pin,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CompactSelect from "@/components/ui/compact-select";
import DashboardCalendar from "@/components/features/dashboard-calendar";
import { polyFit } from "@/lib/curve-fit";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetSessionCourseTeachersQuery } from "@/redux/features/course/session-course-teacherApi";
import { useGetSessionCoursesQuery } from "@/redux/features/course/sesion-courseApi";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetCourseAnnouncementsQuery } from "@/redux/features/course/course-contentApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const PERFORMANCE_COLOR = "#6366f1";
const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };
const CHART_TOOLTIP = { background: "#475569", border: "none", borderRadius: 12, color: "#fff" };

// Trading-style dark tooltip card for the student-performance chart.
function StudentPerfTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point || point.gradePoint === null || point.gradePoint === undefined) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">
      <p className="font-semibold">{point.name}</p>
      {point.sid && <p className="mt-0.5 text-white/60">{point.sid}</p>}
      <p className="mt-1.5 text-sm font-bold" style={{ color: "#a5b4fc" }}>
        Grade Point {Number(point.gradePoint).toFixed(2)}
      </p>
      {point.grade && <p className="text-white/60">Grade {point.grade}</p>}
    </div>
  );
}

// Shortcuts into the per-course management pages (same URLs as My Courses).
const COURSE_ACTIONS = [
  { label: "Announcements", icon: Megaphone, path: "announcement" },
  { label: "Assignments", icon: ClipboardList, path: "assignment" },
  { label: "Materials", icon: FileText, path: "material" },
  { label: "Submissions", icon: Inbox, path: "submission" },
  { label: "Attendance", icon: CalendarCheck, path: "attendance" },
];

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
    .join("") || "T";

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

export default function TeacherDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const myTeacherId = user?.teacher?.id;

  const { data: myResp, isLoading: loadingCourses } = useGetSessionCourseTeachersQuery(
    { teacher: myTeacherId, ordering: "-created_at", records: 200 },
    { skip: !myTeacherId }
  );
  const { data: scResp, isLoading: loadingSessionCourses } = useGetSessionCoursesQuery({ ordering: "-created_at", records: 200 });
  const { data: annResp } = useGetCourseAnnouncementsQuery({ records: 200 });

  const myCourses = useMemo(() => normalizeList(myResp), [myResp]);
  const sessionCourses = useMemo(() => normalizeList(scResp), [scResp]);
  const announcements = useMemo(() => normalizeList(annResp), [annResp]);

  // Only running and completed courses contribute to this dashboard.
  const visibleCourses = useMemo(() => {
    const assignedIds = new Set(myCourses.map((m) => String(m.session_course)));
    return sessionCourses.filter(
      (course) => assignedIds.has(String(course.id)) &&
        (course.status === "running" || course.status === "completed")
    );
  }, [myCourses, sessionCourses]);
  const myScIds = useMemo(
    () => new Set(visibleCourses.map((course) => String(course.id))),
    [visibleCourses]
  );
  // Courses listed on this dashboard are limited to the ones being taught right now.
  const runningCourses = useMemo(
    () => visibleCourses.filter((course) => course.status === "running"),
    [visibleCourses]
  );
  const runningCount = runningCourses.length;
  const completedCount = visibleCourses.filter((course) => course.status === "completed").length;
  const totalCourses = visibleCourses.length;

  // Courses where this teacher is the MAIN course teacher. External examiners
  // only enter final marks, so they are excluded from the performance view.
  const mainTaughtIds = useMemo(
    () =>
      new Set(
        myCourses
          .filter((assignment) => assignment.type !== "external_teacher")
          .map((assignment) => String(assignment.session_course))
      ),
    [myCourses]
  );

  // Completed courses the teacher (as main teacher) can inspect performance for.
  const completedCourses = useMemo(
    () =>
      visibleCourses.filter(
        (course) => course.status === "completed" && mainTaughtIds.has(String(course.id))
      ),
    [visibleCourses, mainTaughtIds]
  );

  // Course shown in the performance chart. Derived (not set in an effect) so the
  // first completed course is selected by default without cascading renders.
  const [selectedPerfCourseId, setSelectedPerfCourseId] = useState(null);
  const perfCourseId = selectedPerfCourseId ?? completedCourses[0]?.id ?? null;

  const { data: perfResp, isFetching: loadingPerf } = useGetStudentCoursesQuery(
    { session_course: perfCourseId, records: 500 },
    { skip: !perfCourseId }
  );

  // Students whose semester result is published. A student's status becomes
  // completed/failed only once the semester result is published, so this is the
  // "after publishing" gate. Ordered by grade point so the fitted curve reads as
  // a smooth performance distribution.
  const perfStudents = useMemo(
    () =>
      normalizeList(perfResp)
        .filter(
          (student) =>
            student.grade_point !== null &&
            student.grade_point !== undefined &&
            (student.status === "completed" || student.status === "failed")
        )
        .map((student) => ({ ...student, gradePoint: Number(student.grade_point) }))
        .filter((student) => !Number.isNaN(student.gradePoint))
        .sort((a, b) => a.gradePoint - b.gradePoint),
    [perfResp]
  );

  // Least-squares quadratic fitted through all students' grade points (the "curve").
  const perfFit = useMemo(() => {
    if (perfStudents.length < 3) return null;
    return polyFit(
      perfStudents.map((student, index) => ({ x: index + 1, y: student.gradePoint })),
      2
    );
  }, [perfStudents]);

  const perfChartData = useMemo(
    () =>
      perfStudents.map((student, index) => ({
        x: index + 1,
        gradePoint: student.gradePoint,
        fit: perfFit
          ? Math.max(0, Math.min(4, Math.round(perfFit.predict(index + 1) * 100) / 100))
          : null,
        name: student.student_name || "Student",
        sid: student.student_id || "",
        grade: student.letter_grade || "",
      })),
    [perfStudents, perfFit]
  );

  const perfAverage = perfStudents.length
    ? perfStudents.reduce((sum, student) => sum + student.gradePoint, 0) / perfStudents.length
    : 0;

  // Latest announcements across my running/completed courses (activity feed).
  const recentAnnouncements = useMemo(
    () =>
      announcements
        .filter((item) => myScIds.has(String(item.session_course)))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 10),
    [announcements, myScIds]
  );

  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      caption: "Running + completed",
      icon: BookOpen,
      tile: "bg-linear-to-br from-indigo-500/15 to-indigo-500/5 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-300",
    },
    {
      label: "Running",
      value: runningCount,
      caption: "Currently in progress",
      icon: CalendarCheck,
      tile: "bg-linear-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300",
    },
    {
      label: "Completed",
      value: completedCount,
      caption: "Finished sessions",
      icon: GraduationCap,
      tile: "bg-linear-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-300",
    },
  ];

  const teacherProfile = user?.teacher;
  const roleLabel = user?.is_admin
    ? "Administrator"
    : teacherProfile?.is_head
      ? "Chairman"
      : "Teacher";
  const teacherChips = [
    teacherProfile?.designation,
    teacherProfile?.department,
    teacherProfile?.employee_id ? `ID: ${teacherProfile.employee_id}` : null,
  ].filter(Boolean);

  if (loadingCourses || loadingSessionCourses) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-40 animate-pulse rounded-2xl border bg-muted/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="mx-auto max-w-7xl space-y-4 bg-linear-to-b from-background via-background to-muted/30 sm:space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-hero-1 via-hero-2 to-hero-3 p-5 text-white shadow-sm sm:p-6 lg:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/40 sm:h-16 sm:w-16">
              <AvatarImage src={user?.image} alt={user?.name || "Teacher"} />
              <AvatarFallback className="bg-white/20 text-base font-semibold text-white sm:text-lg">
                {initialsOf(user?.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/25 sm:text-[0.7rem]">
                <Sparkles className="h-3 w-3" />
                {roleLabel}
              </span>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
                {greeting()}, {user?.name?.split(" ")[0] || "Teacher"}
              </h1>
              <p className="mt-1 hidden text-sm text-white/80 sm:block">
                Here&apos;s how your teaching workspace is doing today.
              </p>

              {teacherChips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {teacherChips.map((chip) => (
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              asChild
              className="bg-white text-hero-1 hover:bg-white/90"
            >
              <Link href="/teacher/my-courses">
                My Courses
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/teacher/profile">My Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-border/70 bg-card/90 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-md"
          >
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${s.tile}`}>
                <s.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{s.label}</p>
                <p className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{s.value}</p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{s.caption}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar & charts */}
      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Calendar & reminders */}
        <DashboardCalendar />

        {/* Student performance (each completed course) */}
        <Card className="flex h-full min-w-0 flex-col border-border/70 bg-card/90 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base">Student Performance</CardTitle>
                <CardDescription>
                  Every student&apos;s grade point with a fitted curve
                </CardDescription>
              </div>
              {completedCourses.length > 0 && (
                <div className="w-full sm:w-52">
                  <CompactSelect
                    value={perfCourseId ?? ""}
                    onChange={(value) => setSelectedPerfCourseId(value)}
                    placeholder="Select course"
                    options={completedCourses.map((course) => ({
                      value: course.id,
                      label: course.course_code || `Course #${course.id}`,
                    }))}
                  />
                </div>
              )}
            </div>

            {perfStudents.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{perfStudents.length}</span> students
                </span>
                <span>
                  Avg grade point{" "}
                  <span className="font-semibold text-foreground">{perfAverage.toFixed(2)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: PERFORMANCE_COLOR }} />
                  Students
                </span>
                {perfFit && (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
                    Fitted curve
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="min-h-72 flex-1">
            {completedCourses.length === 0 ? (
              <Empty label="No completed course results yet." />
            ) : loadingPerf ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading performance…
              </div>
            ) : perfStudents.length < 2 ? (
              <Empty label="Not enough graded students yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={perfChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.07} />
                  <XAxis
                    dataKey="x"
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                    height={8}
                  />
                  <YAxis
                    domain={[0, 4]}
                    tick={AXIS_TICK}
                    tickFormatter={(value) => Number(value).toFixed(1)}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    content={<StudentPerfTooltip />}
                    cursor={{ stroke: PERFORMANCE_COLOR, strokeOpacity: 0.3, strokeDasharray: "4 4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gradePoint"
                    stroke={PERFORMANCE_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PERFORMANCE_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  />
                  {perfFit && (
                    <Line
                      type="monotone"
                      dataKey="fit"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses & activity */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">My Courses</CardTitle>
                <CardDescription>Courses you are teaching right now</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/teacher/my-courses">
                  Manage all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {runningCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No running courses"
                description="A course shows up here as soon as its status is set to running."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {runningCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-border/70 bg-card p-4 transition duration-200 hover:border-indigo-500/35 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {course.course_code || `Course #${course.id}`}
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
                      <span className="mt-1 flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500">
                        <span className="sr-only">Running</span>
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                      {COURSE_ACTIONS.map((action) => (
                        <UiTooltip key={action.path}>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/teacher/my-courses/${action.path}?session_course=${course.id}`}
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
            <CardDescription>Latest posts across your courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentAnnouncements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Nothing posted yet"
                description="Announcements you publish in a course will show up here."
              />
            ) : (
              recentAnnouncements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/teacher/my-courses/announcement?session_course=${announcement.session_course}`}
                  className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-muted/60"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
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
                        (course) => String(course.id) === String(announcement.session_course)
                      )?.course_code || "Course"}{" "}
                      · {timeAgo(announcement.created_at)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty({ label = "No data yet." }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">{label}</p>
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