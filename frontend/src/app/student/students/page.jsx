"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import { useGetStudentsQuery } from "@/redux/features/student/studentApi";
import { useGetDepartmentsQuery } from "@/redux/features/academics/academicsApi";

const toAbsoluteUrl = (url) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${url}`;
};

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const statusStyles = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(10);

  const { data: studentsResponse, isLoading, isFetching } = useGetStudentsQuery({
    search,
    department,
    ordering,
    page,
    records,
  });

  const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 50 });

  const students = useMemo(() => normalizeList(studentsResponse), [studentsResponse]);
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const count = studentsResponse?.data?.count ?? studentsResponse?.count ?? students.length;
  const totalPages = Math.ceil(count / records);

  useEffect(() => {
    setPage(1);
  }, [search, department, ordering, records]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">All Students</h1>
          <p className="mt-1 text-muted-foreground">View, search and filter all students in the university.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTableToolbar
            search={search}
            setSearch={setSearch}
            filters={[
              {
                key: "department",
                label: "Department",
                value: department,
                setValue: setDepartment,
                options: departments.map((d) => ({ value: String(d.id), label: d.name })),
              },
            ]}
            ordering={ordering}
            setOrdering={setOrdering}
            searchPlaceholder="Search students..."
            count={count}
            countLabel="Students"
            orderingOptions={[
              { value: "-created_at", label: "Newest First" },
              { value: "created_at", label: "Oldest First" },
              { value: "name", label: "Name (A–Z)" },
              { value: "-name", label: "Name (Z–A)" },
            ]}
          />

          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Student List</h2>
          </div>

          {isLoading || isFetching ? (
            <div className="p-10 text-center text-muted-foreground">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No Student Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Department</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((item) => (
                    <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                      <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {item.image ? (
                              <AvatarImage
                                src={toAbsoluteUrl(item.image)}
                                alt={item.name}
                              />
                            ) : null}
                            <AvatarFallback className="text-sm">{getInitials(item.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{item.student_id || "-"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.department_name || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.approval_status] || "bg-muted text-muted-foreground"}`}>
                          {item.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/student/students/${item.id}`}>View</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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