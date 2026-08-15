"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Users,
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

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const STATUS_COLORS = { running: "#10b981", upcoming: "#f59e0b", completed: "#3b82f6" };
const CONTENT_COLORS = ["#8b5cf6", "#f43f5e", "#06b6d4"];
const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function page() {
  const { user } = useSelector((state) => state.auth);
  const myTeacherId = user?.teacher?.id;

  const { data: myResp, isLoading: loadingCourses } = useGetSessionCourseTeachersQuery(
    { teacher: myTeacherId, ordering: "-created_at", records: 200 },
    { skip: !myTeacherId }
  );
  const { data: scResp } = useGetSessionCoursesQuery({ ordering: "-created_at", records: 200 });
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

  const myScIds = useMemo(
    () => new Set(myCourses.map((m) => String(m.session_course))),
    [myCourses]
  );
  const scInfo = (id) => sessionCourses.find((x) => String(x.id) === String(id));

  // Course status distribution (my courses only)
  const statusData = useMemo(() => {
    const counts = { running: 0, upcoming: 0, completed: 0 };
    myCourses.forEach((m) => {
      const st = scInfo(m.session_course)?.status;
      if (Object.prototype.hasOwnProperty.call(counts, st)) counts[st] += 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name[0].toUpperCase() + name.slice(1),
        count,
        fill: STATUS_COLORS[name],
      }))
      .filter((d) => d.count > 0);
  }, [myCourses, sessionCourses]);

  const runningCount = statusData.find((d) => d.name === "Running")?.count ?? 0;

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
      .map(([id, count]) => ({ name: scInfo(id)?.course_code || `Course #${id}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [studentCourses, myScIds, sessionCourses]);

  const totalEnrolled = enrollmentData.reduce((sum, d) => sum + d.count, 0);

  const stats = [
    { label: "My Courses", value: myCourses.length, icon: BookOpen, tint: "text-emerald-500", href: "/teacher/my-courses" },
    { label: "Running Now", value: runningCount, icon: CalendarCheck, tint: "text-sky-500", href: "/teacher/my-courses" },
    { label: "Students Enrolled", value: totalEnrolled, icon: Users, tint: "text-violet-500", href: "/teacher/students" },
    { label: "Content Posted", value: totalContent, icon: GraduationCap, tint: "text-amber-500", href: "/teacher/my-courses" },
  ];

  if (loadingCourses && myCourses.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name || "Teacher"}
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening across your courses.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/teacher/my-courses">View My Courses</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-bold">{s.value}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <s.icon className={`h-6 w-6 ${s.tint}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Course Status</CardTitle>
            <CardDescription>Running · Upcoming · Completed</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {statusData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "currentColor", opacity: 0.06 }} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Content mix */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Content Posted</CardTitle>
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
                  <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#fff" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Enrollments per course */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Enrollments / Course</CardTitle>
            <CardDescription>Students in your top courses</CardDescription>
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
                  <Tooltip cursor={{ fill: "currentColor", opacity: 0.06 }} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {enrollmentData.map((d, i) => (
                      <Cell key={d.name} fill={CONTENT_COLORS[i % CONTENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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