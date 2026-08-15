"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { BookOpen, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import { useGetSessionCourseTeachersQuery } from "@/redux/features/course/session-course-teacherApi";
import { useGetSessionCoursesQuery, usePartialUpdateSessionCourseMutation } from "@/redux/features/course/sesion-courseApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const statusStyles = {
  upcoming: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  running: "bg-green-500/10 text-green-600 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export default function Page() {
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [filterStatus, setFilterStatus] = useState("running");

  const myTeacherId = user?.teacher?.id;

  const { data: response, isLoading, isFetching, refetch } = useGetSessionCourseTeachersQuery(
    { teacher: myTeacherId, search, ordering, page, records },
    { skip: !myTeacherId }
  );

  const { data: sessionsCoursesResponse, refetch: refetchSC } = useGetSessionCoursesQuery({ ordering: "-created_at", page: 1, records: 200 });
  const sessionCourses = useMemo(() => normalizeList(sessionsCoursesResponse), [sessionsCoursesResponse]);

  const [partialUpdateSessionCourse, { isLoading: isToggling }] = usePartialUpdateSessionCourseMutation();

  const items = useMemo(() => normalizeList(response), [response]);
  const count = response?.data?.count ?? response?.count ?? items.length;
  const totalPages = Math.ceil(count / records);

  const scInfo = (id) => sessionCourses.find((x) => String(x.id) === String(id));

  // Filter items by course status
  const filteredItems = useMemo(
    () => items.filter((item) => {
      const status = scInfo(item.session_course)?.status;
      return !filterStatus || status === filterStatus;
    }),
    [items, filterStatus, sessionCourses]
  );

  useEffect(() => { setPage(1); }, [search, ordering, records, filterStatus]);

  const handleToggleStatus = async (item) => {
    const sc = scInfo(item.session_course);
    const currentStatus = sc?.status;
    const newStatus = currentStatus === "running" ? "completed" : "running";

    try {
      await partialUpdateSessionCourse({ id: Number(item.session_course), status: newStatus }).unwrap();
      await refetchSC();
      await refetch();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="mt-1 text-muted-foreground">Courses assigned to you.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTableToolbar
            search={search}
            setSearch={setSearch}
            filters={[
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                setValue: setFilterStatus,
                options: [
                  { value: "running", label: "Running" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "completed", label: "Completed" },
                ],
              },
            ]}
            ordering={ordering}
            setOrdering={setOrdering}
            searchPlaceholder="Search my courses..."
            count={filteredItems.length}
            countLabel="Courses"
            orderingOptions={[
              { value: "-created_at", label: "Newest First" },
              { value: "created_at", label: "Oldest First" },
            ]}
          />
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Assigned Courses</h2>
          </div>

          {isLoading || isFetching ? (
            <div className="p-10 text-center text-muted-foreground">Loading my courses...</div>
          ) : !myTeacherId ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No Teacher Profile</h3>
              <p className="mt-2 text-sm text-muted-foreground">No teacher profile is linked to your account.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No Assigned Courses</h3>
              <p className="mt-2 text-sm text-muted-foreground">No courses match your current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Course</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const sc = scInfo(item.session_course);
                    const courseTitle = sc?.course_title || item.course || `#${item.session_course}`;
                    const status = sc?.status;
                    const isRunning = status === "running";

                    return (
                      <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                        <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{courseTitle}</p>
                          {sc?.course_code && <p className="text-sm text-muted-foreground">{sc.course_code}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{sc?.session_name || item.session || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${statusStyles[status] || "bg-muted text-muted-foreground"}`}>
                              {status || "-"}
                            </span>
                            <Button
                              size="sm"
                              variant={isRunning ? "destructive" : "outline"}
                              onClick={() => handleToggleStatus(item)}
                              disabled={isToggling}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {isRunning ? "Close" : status === "completed" ? "Reopen" : "Toggle"}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button variant="secondary" size="sm" asChild>
                              <Link href={`/teacher/my-courses/assessment?session_course=${item.session_course}`}>Assessments</Link>
                            </Button>
                            <Button size="sm" disabled title="Coming soon">Marks</Button>
                            <Button size="sm" disabled title="Coming soon">Attendance</Button>
                            <Button size="sm" disabled title="Coming soon">Assignments</Button>
                            <Button size="sm" disabled title="Coming soon">Anouncement</Button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <DataTablePagination
            page={page}
            totalPages={totalPages}
            records={records}
            setRecords={setRecords}
            setPage={setPage}
            maxRecords={10}
          />
        </div>
      </div>
    </div>
  );
}