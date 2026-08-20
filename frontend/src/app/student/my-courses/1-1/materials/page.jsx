"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import DataTablePagination from "@/components/table/DataTablePagination";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import { useGetSessionCourseQuery } from "@/redux/features/course/sesion-courseApi";
import { useGetCourseMaterialsQuery } from "@/redux/features/course/course-contentApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

const toFileUrl = (file) =>
  file && /^https?:\/\//i.test(file) ? file : `${apiBase}${file}`;

const getFileName = (file) => {
  const value = String(file || "").split("?")[0];
  return decodeURIComponent(value.split("/").pop() || "File");
};

export default function MaterialsPage() {
  const searchParams = useSearchParams();
  const sessionCourseId = searchParams.get("session_course") || null;
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-uploaded_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);

  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const updateOrdering = (value) => { setOrdering(value); setPage(1); };
  const updateRecords = (value) => { setRecords(value); setPage(1); };

  const { data: sessionCourseResponse } = useGetSessionCourseQuery(sessionCourseId, {
    skip: !sessionCourseId,
  });
  const sessionCourse = useMemo(
    () => sessionCourseResponse?.data ?? sessionCourseResponse,
    [sessionCourseResponse]
  );

  const { data: materialsResponse, isLoading } = useGetCourseMaterialsQuery(
    { session_course: sessionCourseId, search, records, page, ordering },
    { skip: !sessionCourseId }
  );
  const materials = useMemo(() => normalizeList(materialsResponse), [materialsResponse]);
  const count = materialsResponse?.data?.count ?? materialsResponse?.count ?? materials.length;
  const totalPages = Math.ceil(count / records);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/my-courses/1-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Course Materials</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionCourse?.course_code && sessionCourse?.course_title
              ? `${sessionCourse.course_code} - ${sessionCourse.course_title}`
              : "View materials for this course."}
          </p>
        </div>

        {!sessionCourseId ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium">No Course Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Open this page from a course in My Courses.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <DataTableToolbar
              search={search}
              setSearch={updateSearch}
              ordering={ordering}
              setOrdering={updateOrdering}
              searchPlaceholder="Search materials..."
              count={count}
              countLabel="Materials"
              orderingOptions={[
                { value: "-uploaded_at", label: "Newest First" },
                { value: "uploaded_at", label: "Oldest First" },
                { value: "title", label: "Title (A-Z)" },
                { value: "-title", label: "Title (Z-A)" },
              ]}
            />
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">Material List</h2>
              <span className="text-sm text-muted-foreground">
                {materials.length} material{materials.length !== 1 ? "s" : ""}
              </span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                <p className="mt-2 text-sm">Loading materials...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-medium text-foreground">No Materials</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No materials have been added for this course yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {materials.map((material) => (
                  <li key={material.id} className="px-6 py-4">
                    <p className="font-medium text-foreground">{material.title}</p>
                    {material.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{material.description}</p>
                    )}
                    {Array.isArray(material.files) && material.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {material.files.map((file) => (
                          <a
                            key={file.id}
                            href={toFileUrl(file.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {getFileName(file.file)}
                          </a>
                        ))}
                      </div>
                    )}
                    {(material.uploaded_by_name || material.uploaded_at) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {material.uploaded_by_name && `Uploaded by ${material.uploaded_by_name}`}
                        {material.uploaded_at && (
                          <>{material.uploaded_by_name ? " • " : ""}{new Date(material.uploaded_at).toLocaleString()}</>
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <DataTablePagination
              page={page}
              totalPages={totalPages}
              records={records}
              setRecords={updateRecords}
              setPage={setPage}
              maxRecords={20}
            />
          </div>
        )}
      </div>
    </div>
  );
}
