"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  GraduationCap,
  Timer,
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
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetSessionCoursesQuery } from "@/redux/features/course/sesion-courseApi";
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
  const myStudentId = user?.student?.id;

  const { data: scResp, isLoading: loadingCourses } = useGetStudentCoursesQuery(
    { ordering: "-enrolled_at", records: 200 },
    { skip: !myStudentId }
  );
  const { data: sessResp } = useGetSessionCoursesQuery({ ordering: "-created_at", records: 200 });
  const { data: annResp } = useGetCourseAnnouncementsQuery({ records: 200 });
  const { data: asnResp } = useGetCourseAssignmentsQuery({ records: 200 });
  const { data: matResp } = useGetCourseMaterialsQuery({ records: 200 });

  const allStudentCourses = useMemo(() => normalizeList(scResp), [scResp]);
  const sessionCourses = useMemo(() => normalizeList(sessResp), [sessResp]);
  const announcements = useMemo(() => normalizeList(annResp), [annResp]);
  const assignments = useMemo(() => normalizeList(asnResp), [asnResp]);
  const materials = useMemo(() => normalizeList(matResp), [matResp]);

  // Only the logged-in student's own course enrollments.
  const myCourses = useMemo(
    () => allStudentCourses.filter((sc) => String(sc.student) === String(myStudentId)),
    [allStudentCourses, myStudentId]
  );

  const myScIds = useMemo(
    () => new Set(myCourses.map((m) => String(m.session_course))),
    [myCourses]
  );
  const scInfo = (id) => sessionCourses.find((x) => String(x.id) === String(id));

  // Course status distribution (my courses only).
  const statusData = useMemo(() => {
    const counts = { running: 0, upcoming: 0, completed: 0 };
    myCourses.forEach((m) => {
      const st = scInfo(m.session_course)?.status;
      if (Object.prototype.hasOwnProperty.call(counts, st)) counts[st] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: value,
      fill: STATUS_COLORS[name] || "#94a3b8",
    }));
  }, [myCourses]);

  const runningCount = myCourses.filter((m) => scInfo(m.session_course)?.status === "running").length;
  const upcomingCount = myCourses.filter((m) => scInfo(m.session_course)?.status === "upcoming").length;
  const completedCount = myCourses.filter((m) => scInfo(m.session_course)?.status === "completed").length;

  // Content available in the student's courses (announcements/assignments/materials).
  const inMyCourses = (item) => myScIds.has(String(item.session_course));
  const contentMix = [
    { name: "Announcements", value: announcements.filter(inMyCourses).length },
    { name: "Assignments", value: assignments.filter(inMyCourses).length },
    { name: "Materials", value: materials.filter(inMyCourses).length },
  ].filter((d) => d.value > 0);
  const totalContent = contentMix.reduce((s, d) => s + d.value, 0);
  const upcomingAssignments = assignments.filter(
    (a) => inMyCourses(a) && a.deadline && new Date(a.deadline) > new Date()
  ).length;

  const stats = [
    { label: "My Courses", value: myCourses.length, icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Running Now", value: runningCount, icon: <Timer className="h-4 w-4" /> },
    { label: "Upcoming", value: upcomingCount, icon: <CalendarRange className="h-4 w-4" /> },
    { label: "Completed", value: completedCount, icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Greeting header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "Student"} 
            </h1>
            <p className="mt-1 text-muted-foreground">
              {user?.student?.student_id
                ? `Student ID: ${user.student.student_id}`
                : "Here's an overview of your courses and progress."}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Course status */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Course Status</CardTitle>
              <CardDescription>Running · Upcoming · Completed</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {statusData.every((d) => d.count === 0) ? (
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
              <CardTitle className="text-base">Course Content</CardTitle>
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

          {/* Mini overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Quick Overview</CardTitle>
              <CardDescription>Your academic snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OverviewRow
                icon={<GraduationCap className="h-4 w-4" />}
                label="Enrolled Courses"
                value={myCourses.length}
              />
              <OverviewRow
                icon={<CalendarCheck className="h-4 w-4" />}
                label="Content Available"
                value={totalContent}
              />
              <OverviewRow
                icon={<Timer className="h-4 w-4" />}
                label="Open Assignments"
                value={upcomingAssignments}
              />
              {user?.student?.cgpa != null && (
                <OverviewRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Current CGPA"
                  value={Number(user.student.cgpa).toFixed(2)}
                />
              )}
            </CardContent>
          </Card>
        </div>
{/* My courses list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Courses</CardTitle>
            <CardDescription>Courses you are currently enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <div className="py-10 text-center text-muted-foreground">Loading your courses...</div>
            ) : myCourses.length === 0 ? (
              <div className="py-10 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-medium text-foreground">No Courses Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You'll see your enrolled courses here once you're enrolled.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Course</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Code</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myCourses.map((sc) => {
                      const info = scInfo(sc.session_course);
                      const status = info?.status;
                      return (
                        <tr key={sc.id} className="border-t border-border">
                          <td className="px-6 py-3 font-medium text-foreground">
                            {info?.course_title || sc.course_title || `Course #${sc.session_course}`}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground">
                            {info?.course_code || sc.course_code || "-"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[status] ? "bg-current/10" : "bg-muted text-muted-foreground"
                              }`}
                              style={STATUS_COLORS[status] ? { color: STATUS_COLORS[status] } : undefined}
                            >
                              {status || "unknown"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
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