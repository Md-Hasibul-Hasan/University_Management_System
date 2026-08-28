"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useUpdateCourseMutation,
} from "@/redux/features/course/courseApi";
import {
  useGetDepartmentsQuery,
  useGetYearSemestersQuery,
} from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";

const ordinalToNumber = (value) => {
  const map = {
    first: 1, second: 2, third: 3, fourth: 4,
    fifth: 5, sixth: 6, seventh: 7, eighth: 8,
  };
  return map[String(value || "").toLowerCase()] ?? value;
};

const selectClasses =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

export default function Page() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [form, setForm] = useState({
    id: null,
    code: "",
    title: "",
    credit: "",
    department: "",
    year_semester: "",
    course_type: "theory",
    is_active: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    data: coursesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCoursesQuery({ search, department, ordering, page, records });

  const { data: departmentsResponse, isLoading: isLoadingDepartments } =
    useGetDepartmentsQuery({ ordering: "name", page: 1, records: 10 });
  const { data: yearSemestersResponse, isLoading: isLoadingYearSemesters } =
    useGetYearSemestersQuery({ ordering: "created_at", page: 1, records: 10 });

  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  const courses = useMemo(() => normalizeList(coursesResponse), [coursesResponse]);
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);

  const count = coursesResponse?.data?.count ?? coursesResponse?.count ?? courses.length;
  const totalPages = Math.ceil(count / records);
  const submitting = isCreating || isUpdating;

  useEffect(() => {
    setPage(1);
  }, [search, department, ordering, records]);

  useEffect(() => {
    if (!message && !error) return;

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setForm({
      id: null,
      code: "",
      title: "",
      credit: "",
      department: "",
      year_semester: "",
      course_type: "theory",
      is_active: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        credit: Number(form.credit),
        department: Number(form.department),
        year_semester: Number(form.year_semester),
        course_type: form.course_type,
        is_active: form.is_active,
      };

      if (form.id) {
        await updateCourse({ id: form.id, ...payload }).unwrap();
        setMessage("Course updated successfully.");
      } else {
        await createCourse(payload).unwrap();
        setMessage("Course created successfully.");
      }

      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(responseError?.message || responseError?.message ||firstFieldError || responseError?.detail || "Failed to save course.");
    }
  };

  const handleEdit = (item) => {
    setMessage("");
    setError("");
    setForm({
      id: item.id,
      code: item.code || "",
      title: item.title || "",
      credit: item.credit ?? "",
      department: String(item.department ?? ""),
      year_semester: String(item.year_semester ?? ""),
      course_type: item.course_type || "theory",
      is_active: item.is_active ?? true,
    });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete course "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteCourse(item.id).unwrap();
      if (form.id === item.id) resetForm();
      setMessage("Course deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(responseError?.message || firstFieldError || responseError?.detail || "Failed to delete course.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="mt-1 text-muted-foreground">Create, update and manage courses.</p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {form.id ? "Update Course" : "Add Course"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.id ? "Modify selected course." : "Create a new course."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Code</label>
                  <Input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="CSE101"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                  <Input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Data Structures"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Credit</label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={form.credit}
                    onChange={(e) => setForm((prev) => ({ ...prev, credit: e.target.value }))}
                    placeholder="3"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                    className={selectClasses}
                    required
                    disabled={isLoadingDepartments || !!form.id}
                  >
                    <option value="">{isLoadingDepartments ? "Loading departments..." : "Select department"}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Year / Semester</label>
                  <select
                    value={form.year_semester}
                    onChange={(e) => setForm((prev) => ({ ...prev, year_semester: e.target.value }))}
                    className={selectClasses}
                    required
                    disabled={isLoadingYearSemesters || !!form.id}
                  >
                    <option value="">{isLoadingYearSemesters ? "Loading levels..." : "Select year / semester"}</option>
                    {yearSemesters.map((item) => (
                      <option key={item.id} value={item.id}>
                        {ordinalToNumber(item.year)} - {ordinalToNumber(item.semester)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Course Type</label>
                  <select
                    value={form.course_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, course_type: e.target.value }))}
                    className={selectClasses}
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="viva">Viva</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={String(form.is_active)}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                    className={selectClasses}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {form.id ? (
                    <>
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Updating..." : "Update Course"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "Saving..." : "Add Course"}
                    </>
                  )}
                </Button>

                {form.id && (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={resetForm}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
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
                    options: departments.map((d) => ({
                      value: String(d.id),
                      label: d.name,
                    })),
                  },
                ]}
                ordering={ordering}
                setOrdering={setOrdering}
                searchPlaceholder="Search courses..."
                count={count}
                countLabel="Courses"
                orderingOptions={[
                  { value: "-created_at", label: "Newest First" },
                  { value: "created_at", label: "Oldest First" },
                  { value: "code", label: "Code (A–Z)" },
                  { value: "-code", label: "Code (Z–A)" },
                  { value: "title", label: "Title (A–Z)" },
                  { value: "-title", label: "Title (Z–A)" },
                ]}
              />

              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Course List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 font-medium text-foreground">No Course Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {search ? "Try adjusting your search or ordering." : "Create your first course from the left panel."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Code</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Title</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Credit</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Department</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Year / Semester</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Type</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((item) => {
                        const departmentName =
                          departments.find((d) => String(d.id) === String(item.department))?.name || item.department || "-";
                        const yearSemester =
                          yearSemesters.find((ys) => String(ys.id) === String(item.year_semester));
                        const yearSemesterLabel = yearSemester
                          ? `${ordinalToNumber(yearSemester.year)} - ${ordinalToNumber(yearSemester.semester)}`
                          : item.year_semester || "-";

                        return (
                          <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                            <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{item.code}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{item.title}</td>
                            <td className="px-6 py-4 text-center text-foreground">{item.credit}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{departmentName}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{yearSemesterLabel}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{capitalize(item.course_type)}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  item.is_active
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/80"
                                  disabled={isDeleting}
                                >
                                  Delete
                                </button>
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
      </div>
    </div>
  );
}