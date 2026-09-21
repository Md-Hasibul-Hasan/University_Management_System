"use client";

import { useMemo } from "react";
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
  BarChart,
  Bar,
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
import { useGetSessionCourseTeachersQuery } from "@/redux/features/course/session-course-teacherApi";
import { useGetSessionCoursesQuery } from "@/redux/features/course/sesion-courseApi";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import {
  useGetCourseAnnouncementsQuery,
  useGetCourseAssignmentsQuery,
  useGetCourseMaterialsQuery,
} from "@/redux/features/course/course-contentApi";

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
  const { data: studentResp } = useGetStudentCoursesQuery({ ordering: "-created_at", records: 200 });
  const { data: annResp } = useGetCourseAnnouncementsQuery({ records: 200 });
  const { data: asnResp } = useGetCourseAssignmentsQuery({ records: 200 });
  const { data: matResp } = useGetCourseMaterialsQuery({ records: 200 });

  const myCourses = useMemo(() => normalizeList(myResp), [myResp]);
  const sessionCourses = useMemo(() => normalizeList(scResp), [scResp]);
  const studentCourses = useMemo(() => normalizeList(studentResp), [studentResp]);
  const announcements = useMemo(() => normalizeList(annResp), [annResp]);
  const assignments = useMemo(() => normalizeList(asnResp), [asnResp]);
  const materials = useMemo(() => normalizeList(matResp), [matResp]);

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

  // Scope content to my courses
  const myAnnouncements = useMemo(
    () => announcements.filter((x) => myScIds.has(String(x.session_course))).length,
    [announcements, myScIds]
  );
  const myAssignments = useMemo(
    () => assignments.filter((x) => myScIds.has(String(x.session_course))).length,
    [assignments, myScIds]
  );
  const myMaterials = useMemo(
    () => materials.filter((x) => myScIds.has(String(x.session_course))).length,
    [materials, myScIds]
  );
  const totalContent = myAnnouncements + myAssignments + myMaterials;

  const contentMix = useMemo(
    () => [
      { name: "Announcements", value: myAnnouncements },
      { name: "Assignments", value: myAssignments },
      { name: "Materials", value: myMaterials },
    ],
    [myAnnouncements, myAssignments, myMaterials]
  );

  // Enrollment per my course
  const enrollmentData = useMemo(() => {
    const map = new Map();
    studentCourses.forEach((sc) => {
      const id = String(sc.session_course);
      if (myScIds.has(id)) map.set(id, (map.get(id) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, name: visibleCourses.find((course) => String(course.id) === id)?.course_code || `Course #${id}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [studentCourses, myScIds, visibleCourses]);

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
      tile: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
    {
      label: "Running",
      value: runningCount,
      caption: "Currently in progress",
      icon: CalendarCheck,
      tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "Completed",
      value: completedCount,
      caption: "Finished sessions",
      icon: GraduationCap,
      tile: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
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
              <AvatarImage src={user?.image} alt={user?.name || "Teacher"} />
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
                {greeting()}, {user?.name?.split(" ")[0] || "Teacher"}
              </h1>
              <p className="mt-1 text-sm text-white/80">
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

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="bg-white text-emerald-700 hover:bg-white/90"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        {/* Content mix */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Content You Posted</CardTitle>
            <CardDescription>Announcements · Assignments · Materials</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {totalContent === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentMix}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {contentMix.map((d, i) => (
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

        {/* Enrollments per course */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Students per Course</CardTitle>
            <CardDescription>Enrollment split across your top courses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {enrollmentData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "currentColor", opacity: 0.06 }} contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {enrollmentData.map((d, i) => (
                      <Cell key={d.id} fill={CONTENT_COLORS[i % CONTENT_COLORS.length]} />
                    ))}
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
                    className="rounded-xl border bg-card p-4 transition duration-200 hover:border-ring/40 hover:shadow-sm"
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
                description="Announcements you publish in a course will show up here."
              />
            ) : (
              recentAnnouncements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/teacher/my-courses/announcement?session_course=${announcement.session_course}`}
                  className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-muted/60"
                >
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

function Empty() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">No data yet.</p>
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