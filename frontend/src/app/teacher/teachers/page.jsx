"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import { useGetTeachersQuery } from "@/redux/features/teacher/teacherApi";
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

const designationLabel = {
  professor: "Professor",
  assistant_professor: "Assistant Professor",
  associate_teacher: "Assistant Teacher",
  lecturer: "Lecturer",
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

  const { data: teachersResponse, isLoading, isFetching } = useGetTeachersQuery({
    search,
    department,
    ordering,
    page,
    records,
  });

  const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 50 });

  const teachers = useMemo(() => normalizeList(teachersResponse), [teachersResponse]);
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const count = teachersResponse?.data?.count ?? teachersResponse?.count ?? teachers.length;
  const totalPages = Math.ceil(count / records);

  useEffect(() => {
    setPage(1);
  }, [search, department, ordering, records]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">All Teachers</h1>
          <p className="mt-1 text-muted-foreground">View, search and filter all teachers in the university.</p>
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
            searchPlaceholder="Search teachers..."
            count={count}
            countLabel="Teachers"
            orderingOptions={[
              { value: "-created_at", label: "Newest First" },
              { value: "created_at", label: "Oldest First" },
              { value: "name", label: "Name (A–Z)" },
              { value: "-name", label: "Name (Z–A)" },
            ]}
          />

          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Teacher List</h2>
          </div>

          {isLoading || isFetching ? (
            <div className="p-10 text-center text-muted-foreground">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No Teacher Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Teacher</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Designation</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Phone</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((item) => (
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.department_name || "-"}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{designationLabel[item.designation] || item.designation || "-"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.phone || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/teacher/teachers/${item.id}`}>View</Link>
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