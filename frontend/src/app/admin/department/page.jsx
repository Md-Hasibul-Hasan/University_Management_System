"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useGetFacultiesQuery,
  useUpdateDepartmentMutation,
} from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [form, setForm] = useState({ id: null, code: "", name: "", faculty: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    data: departmentsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetDepartmentsQuery({ search, ordering, page, records });

  const { data: facultiesResponse, isLoading: isLoadingFaculties } = useGetFacultiesQuery({
    ordering: "name",
    page: 1,
    records: 10,
  });

  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const faculties = useMemo(() => normalizeList(facultiesResponse), [facultiesResponse]);
  const count = departmentsResponse?.data?.count ?? departmentsResponse?.count ?? departments.length;
  const totalPages = Math.ceil(count / records);
  const submitting = isCreating || isUpdating;

  useEffect(() => {
    setPage(1);
  }, [search, ordering, records]);

  useEffect(() => {
    if (!message && !error) return;

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setForm({ id: null, code: "", name: "", faculty: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        faculty: Number(form.faculty),
      };

      if (form.id) {
        await updateDepartment({ id: form.id, ...payload }).unwrap();
        setMessage("Department updated successfully.");
      } else {
        await createDepartment(payload).unwrap();
        setMessage("Department created successfully.");
      }

      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(firstFieldError || responseError?.detail || "Failed to save department.");
    }
  };

  const handleEdit = (item) => {
    setMessage("");
    setError("");
    setForm({
      id: item.id,
      code: item.code || "",
      name: item.name || "",
      faculty: String(item.faculty ?? ""),
    });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete department \"${item.name}\"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteDepartment(item.id).unwrap();
      if (form.id === item.id) resetForm();
      setMessage("Department deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(firstFieldError || responseError?.detail || "Failed to delete department.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Department Management</h1>
          <p className="mt-1 text-muted-foreground">Create, update and manage departments.</p>
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
                  {form.id ? "Update Department" : "Add Department"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.id ? "Modify selected department." : "Create a new department."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Code</label>
                  <Input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="CSE"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Department Name</label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Computer Science and Engineering"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Faculty</label>
                  <select
                    value={form.faculty}
                    onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark"
                    required
                    disabled={isLoadingFaculties}
                  >
                    <option value="">{isLoadingFaculties ? "Loading faculties..." : "Select faculty"}</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {form.id ? (
                    <>
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Updating..." : "Update Department"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "Saving..." : "Add Department"}
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
                ordering={ordering}
                setOrdering={setOrdering}
                searchPlaceholder="Search departments..."
                count={count}
                countLabel="Departments"
                orderingOptions={[
                  { value: "-created_at", label: "Newest First" },
                  { value: "created_at", label: "Oldest First" },
                  { value: "code", label: "Code (A–Z)" },
                  { value: "-code", label: "Code (Z–A)" },
                  { value: "name", label: "Name (A–Z)" },
                  { value: "-name", label: "Name (Z–A)" },
                ]}
              />

              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Department List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-medium text-foreground">No Department Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {search ? "Try adjusting your search or ordering." : "Create your first department from the left panel."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Code</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Department Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Faculty</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((item) => {
                        const facultyName = faculties.find((faculty) => String(faculty.id) === String(item.faculty))?.name || item.faculty || "-";

                        return (
                          <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                            <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{item.code}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{facultyName}</td>
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
