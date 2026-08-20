"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";
import { useGetSessionsQuery, useGetDepartmentsQuery, useGetYearSemestersQuery } from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const statusStyles = {
  enrolled: "bg-green-500/10 text-green-600 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  dropped: "bg-destructive/10 text-destructive",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearSemesterFilter, setYearSemesterFilter] = useState("");
  const [ordering, setOrdering] = useState("-enrolled_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);

  const { data: response, isLoading, isFetching } = useGetStudentCoursesQuery({
    search,
    ordering,
    page,
    records,
    "session_course__session": sessionFilter,
    "session_course__course__department": departmentFilter,
    "session_course__course__year_semester": yearSemesterFilter,
  });
  const { data: sessionsResponse } = useGetSessionsQuery({ ordering: "-session_no", page: 1, records: 50 });
  const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 100 });
  const { data: yearSemestersResponse } = useGetYearSemestersQuery({ ordering: "year", page: 1, records: 100 });
  const items = useMemo(() => normalizeList(response), [response]);
  const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);
  const count = response?.data?.count ?? response?.count ?? items.length;
  const totalPages = Math.ceil(count / records);

  useEffect(() => { setPage(1); }, [search, sessionFilter, departmentFilter, yearSemesterFilter, ordering, records]);

  const ordinalToNumber = (value) => {
    const map = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8 };
    return map[String(value || "").toLowerCase()] ?? value;
  };

  const filters = [
    {
      key: "session_course__session",
      label: "Session",
      value: sessionFilter,
      setValue: setSessionFilter,
      options: sessions.map((session) => ({
        value: String(session.id),
        label: session.academic_year || `Session ${session.session_no}`,
      })),
    },
    {
      key: "session_course__course__department",
      label: "Department",
      value: departmentFilter,
      setValue: setDepartmentFilter,
      options: departments.map((department) => ({ value: String(department.id), label: department.name })),
    },
    {
      key: "session_course__course__year_semester",
      label: "Year & Semester",
      value: yearSemesterFilter,
      setValue: setYearSemesterFilter,
      options: yearSemesters.map((yearSemester) => ({
        value: String(yearSemester.id),
        label: `${ordinalToNumber(yearSemester.year)} - ${ordinalToNumber(yearSemester.semester)}`,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Student Courses</h1>
          <p className="mt-1 text-muted-foreground">Courses auto-assigned to students when approved.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTableToolbar
            search={search} setSearch={setSearch}
            filters={filters}
            ordering={ordering} setOrdering={setOrdering}
            searchPlaceholder="Search student courses..." count={count} countLabel="Student Courses"
            orderingOptions={[
              { value: "-enrolled_at", label: "Newest First" },
              { value: "enrolled_at", label: "Oldest First" },
            ]}
          />
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Student Course List</h2>
          </div>

          {isLoading || isFetching ? (
            <div className="p-10 text-center text-muted-foreground">Loading student courses...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No Student Course Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Student courses are created automatically when a student is approved.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Course</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                      <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{item.student_name}</p>
                        <p className="text-sm text-muted-foreground">{item.student_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{item.course_title}</p>
                        <p className="text-sm text-muted-foreground">{item.course_code}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.session || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] || "bg-muted text-muted-foreground"}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DataTablePagination page={page} totalPages={totalPages} records={records} setRecords={setRecords} setPage={setPage} maxRecords={10} />
        </div>
      </div>
    </div>
  );
}