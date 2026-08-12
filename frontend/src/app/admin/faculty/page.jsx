"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateFacultyMutation,
  useDeleteFacultyMutation,
  useGetFacultiesQuery,
  useUpdateFacultyMutation,
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
  const [form, setForm] = useState({ id: null, name: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    data: facultiesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetFacultiesQuery({ search, ordering, page, records });

  const [createFaculty, { isLoading: isCreating }] = useCreateFacultyMutation();
  const [updateFaculty, { isLoading: isUpdating }] = useUpdateFacultyMutation();
  const [deleteFaculty, { isLoading: isDeleting }] = useDeleteFacultyMutation();

  const faculties = useMemo(() => normalizeList(facultiesResponse), [facultiesResponse]);
  const count = facultiesResponse?.data?.count ?? facultiesResponse?.count ?? faculties.length;
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
    setForm({ id: null, name: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = { name: form.name.trim() };

      if (form.id) {
        await updateFaculty({ id: form.id, ...payload }).unwrap();
        setMessage("Faculty updated successfully.");
      } else {
        await createFaculty(payload).unwrap();
        setMessage("Faculty created successfully.");
      }

      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(firstFieldError || responseError?.detail || "Failed to save faculty.");
    }
  };

  const handleEdit = (faculty) => {
    setMessage("");
    setError("");
    setForm({
      id: faculty.id,
      name: faculty.name || "",
    });
  };

  const handleDelete = async (faculty) => {
    const confirmed = window.confirm(`Delete faculty \"${faculty.name}\"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteFaculty(faculty.id).unwrap();
      if (form.id === faculty.id) {
        resetForm();
      }
      setMessage("Faculty deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(firstFieldError || responseError?.detail || "Failed to delete faculty.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Faculty Management</h1>
          <p className="mt-1 text-muted-foreground">Create, update and manage faculty records.</p>
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
                  {form.id ? "Update Faculty" : "Add Faculty"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.id ? "Modify selected faculty." : "Create a new faculty."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Faculty Name
                  </label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter faculty name"
                    className="w-full"
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {form.id ? (
                    <>
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Updating..." : "Update Faculty"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "Saving..." : "Add Faculty"}
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
                searchPlaceholder="Search faculty..."
                count={count}
                countLabel="Faculties"
                orderingOptions={[
                  { value: "-created_at", label: "Newest First" },
                  { value: "created_at", label: "Oldest First" },
                  { value: "name", label: "Name (A–Z)" },
                  { value: "-name", label: "Name (Z–A)" },
                ]}
              />

              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Faculty List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading faculty...</div>
              ) : faculties.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-medium text-foreground">No Faculty Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {search ? "Try adjusting your search or ordering." : "Create your first faculty from the left panel."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Faculty Name</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faculties.map((faculty) => (
                        <tr key={faculty.id} className="border-t border-border transition hover:bg-accent/50">
                          <td className="px-6 py-4 text-muted-foreground">#{faculty.id}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{faculty.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(faculty)}
                                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(faculty)}
                                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/80"
                                disabled={isDeleting}
                              >
                                Delete
                              </button>
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
      </div>
    </div>
  );
}
