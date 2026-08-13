"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useGetSessionsQuery,
  useUpdateSessionMutation,
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
  const [ordering, setOrdering] = useState("-session_no");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(5);
  const [form, setForm] = useState({ id: null, session_no: "", academic_year: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    data: sessionsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSessionsQuery({ search, ordering, page, records });

  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation();
  const [deleteSession, { isLoading: isDeleting }] = useDeleteSessionMutation();

  const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);
  const count = sessionsResponse?.data?.count ?? sessionsResponse?.count ?? sessions.length;
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
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, error]);

  const resetForm = () => {
    setForm({ id: null, session_no: "", academic_year: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        session_no: Number(form.session_no),
        academic_year: form.academic_year.trim(),
      };

      if (form.id) {
        await updateSession({ id: form.id, ...payload }).unwrap();
        setMessage("Session updated successfully.");
      } else {
        await createSession(payload).unwrap();
        setMessage("Session created successfully.");
      }

      resetForm();
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError( responseError?.message || firstFieldError || responseError?.detail || "Failed to save session.");
    }
  };

  const handleEdit = (item) => {
    setMessage("");
    setError("");
    setForm({
      id: item.id,
      session_no: String(item.session_no ?? ""),
      academic_year: item.academic_year || "",
    });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete session \"${item.academic_year}\"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteSession(item.id).unwrap();
      if (form.id === item.id) resetForm();
      setMessage("Session deleted successfully.");
      await refetch();
    } catch (requestError) {
      const responseError = requestError?.data;
      const firstFieldError = responseError
        ? Object.values(responseError).flat().find(Boolean)
        : "";

      setError(responseError?.message || firstFieldError || responseError?.detail || "Failed to delete session.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Session Management</h1>
          <p className="mt-1 text-muted-foreground">Create, update and manage sessions.</p>
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
                  {form.id ? "Update Session" : "Add Session"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.id ? "Modify selected session." : "Create a new session."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Session No</label>
                  <Input
                    type="number"
                    value={form.session_no}
                    onChange={(e) => setForm((prev) => ({ ...prev, session_no: e.target.value }))}
                    placeholder="01"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Academic Year</label>
                  <Input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => setForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="2024-25"
                    className="w-full"
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {form.id ? (
                    <>
                      <Save className="h-4 w-4" />
                      {isUpdating ? "Updating..." : "Update Session"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "Saving..." : "Add Session"}
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
                searchPlaceholder="Search sessions..."
                count={count}
                countLabel="Sessions"
                orderingOptions={[
                  { value: "-session_no", label: "Session No (High-Low)" },
                  { value: "session_no", label: "Session No (Low-High)" },
                  { value: "academic_year", label: "Academic Year (A–Z)" },
                  { value: "-academic_year", label: "Academic Year (Z–A)" },
                ]}
              />

              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Session List</h2>
              </div>

              {isLoading || isFetching ? (
                <div className="p-10 text-center text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-medium text-foreground">No Session Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {search ? "Try adjusting your search or ordering." : "Create your first session from the left panel."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Academic Year</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((item) => (
                        <tr key={item.id} className="border-t border-border transition hover:bg-accent/50">
                          <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{item.session_no}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{item.academic_year}</td>
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
