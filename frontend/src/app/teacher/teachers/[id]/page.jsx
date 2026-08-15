"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGetTeacherQuery,
  usePartialUpdateTeacherMutation,
} from "@/redux/features/teacher/teacherApi";
import { useGetDepartmentsQuery } from "@/redux/features/academics/academicsApi";

const toAbsoluteUrl = (url) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${url}`;
};

const normalizeList = (response) => {
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response)) return response;
  return [];
};

const designationOptions = [
  { value: "professor", label: "Professor" },
  { value: "assistant_professor", label: "Assistant Professor" },
  { value: "associate_teacher", label: "Assistant Teacher" },
  { value: "lecturer", label: "Lecturer" },
];
const designationLabel = Object.fromEntries(designationOptions.map((o) => [o.value, o.label]));

const selectClasses =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

const getErrorMessage = (err) => {
  const data = err?.data || {};
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first[0] || "Failed to save." : "Failed to save.";
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
};

export default function Page() {
  const params = useParams();
  const id = params?.id;

  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "Teacher" && user?.is_admin === true;
  const isChairman = user?.role === "Teacher" && user?.teacher?.is_head === true;
  const canEdit = isAdmin || isChairman;

  const { data, isLoading, isError } = useGetTeacherQuery(id, { skip: !id });
  const [partialUpdateTeacher, { isLoading: isSaving }] = usePartialUpdateTeacherMutation();

  const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 50 });
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);

  const teacher = useMemo(() => data?.data ?? data, [data]);

  const displayDepartment = departments.find((d) => String(d.id) === String(teacher?.department))?.name || teacher?.department_name || "—";

  const [form, setForm] = useState({
    employee_id: "", department: "", designation: "lecturer", is_head: false, phone: "", address: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teacher) return;
    setForm({
      employee_id: teacher.employee_id || "",
      department: String(teacher.department ?? ""),
      designation: teacher.designation || "lecturer",
      is_head: teacher.is_head ?? false,
      phone: teacher.phone || "",
      address: teacher.address || "",
    });
  }, [teacher]);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await partialUpdateTeacher({
        id,
        employee_id: form.employee_id.trim(),
        department: form.department ? Number(form.department) : null,
        designation: form.designation,
        is_head: form.is_head,
        phone: form.phone.trim(),
        address: form.address.trim(),
      }).unwrap();
      setMessage("Teacher updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !teacher) {
    return <div className="p-10 text-center text-muted-foreground">Teacher not found or could not be loaded.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/teachers">
              <ArrowLeft className="h-4 w-4" />
              Back to Teachers
            </Link>
          </Button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>
        )}

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-center sm:text-left">
            <Avatar className="h-16 w-16">
              {teacher.image ? (
                <AvatarImage src={toAbsoluteUrl(teacher.image)} alt={teacher.name} />
              ) : null}
              <AvatarFallback className="text-xl">{getInitials(teacher.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-center sm:items-start">
              <h2 className="text-xl font-semibold">{teacher.name}</h2>
              <p className="text-sm text-muted-foreground">{teacher.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">{teacher.department_name || "No department"}</Badge>
                {teacher.employee_id && <Badge>ID: {teacher.employee_id}</Badge>}
                <Badge>{designationLabel[teacher.designation] || teacher.designation || "Lecturer"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form — editable only for admins/chairmen; read-only view for others */}
        {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Teacher</CardTitle>
            <CardDescription>Update the teacher's information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Employee ID</label>
                <Input value={form.employee_id} onChange={(e) => setForm((prev) => ({ ...prev, employee_id: e.target.value }))} className="w-full" placeholder="Employee ID" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Department Head</label>
                <select value={String(form.is_head)} onChange={(e) => setForm((prev) => ({ ...prev, is_head: e.target.value === "true" }))} className={selectClasses}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Department</label>
                <select value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className={selectClasses}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Designation</label>
                <select value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} className={selectClasses}>
                  {designationOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full" placeholder="Phone number" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Address</label>
                <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full" placeholder="Address" />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Details</CardTitle>
            <CardDescription>You have read-only access to this teacher's profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Employee ID</dt>
                <dd className="mt-1 text-sm">{form.employee_id || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Department Head</dt>
                <dd className="mt-1 text-sm">{form.is_head ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                <dd className="mt-1 text-sm">{displayDepartment}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Designation</dt>
                <dd className="mt-1 text-sm">{designationLabel[form.designation] || form.designation || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-1 text-sm">{form.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd className="mt-1 text-sm">{form.address || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}