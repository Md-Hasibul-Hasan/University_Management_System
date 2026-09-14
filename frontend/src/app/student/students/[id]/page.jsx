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
  useGetStudentQuery,
  usePartialUpdateStudentMutation,
} from "@/redux/features/student/studentApi";
import {
  useGetDepartmentsQuery,
  useGetSessionsQuery,
  useGetYearSemestersQuery,
} from "@/redux/features/academics/academicsApi";

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

const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const statusStyle = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
};

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

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function Page() {
  const params = useParams();
  const id = params?.id;

  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "Teacher" && user?.is_admin === true;
  const isChairman = user?.role === "Teacher" && user?.teacher?.is_head === true;
  const canEdit = isAdmin || isChairman;

  const { data, isLoading, isError } = useGetStudentQuery(id, { skip: !id });
  const [partialUpdateStudent, { isLoading: isSaving }] = usePartialUpdateStudentMutation();

  const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 50 });
  const { data: sessionsResponse } = useGetSessionsQuery({ ordering: "-session_no", page: 1, records: 50 });
  const { data: yearSemestersResponse } = useGetYearSemestersQuery({ ordering: "year", page: 1, records: 50 });

  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);
  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);

  const student = useMemo(() => data?.data ?? data, [data]);

  const displayDepartment = departments.find((d) => String(d.id) === String(student?.department))?.name || student?.department_name || "—";
  const matchedSession = sessions.find((s) => String(s.id) === String(student?.session));
  const displaySession = matchedSession ? (matchedSession.academic_year || `Session ${matchedSession.session_no}`) : "—";
  const matchedYs = yearSemesters.find((ys) => String(ys.id) === String(student?.year_semester));
  const displayYearSemester = matchedYs ? `${capitalize(matchedYs.year)} Year - ${capitalize(matchedYs.semester)} Semester` : "—";

  const [form, setForm] = useState({
    student_id: "", department: "", session: "", year_semester: "", cgpa: "",
    phone: "", father_name: "", father_phone: "", mother_name: "", mother_phone: "",
    address: "", approval_status: "pending",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    setForm({
      student_id: student.student_id || "",
      department: String(student.department ?? ""),
      session: String(student.session ?? ""),
      year_semester: String(student.year_semester ?? ""),
      cgpa: student.cgpa ?? "",
      phone: student.phone || "",
      father_name: student.father_name || "",
      father_phone: student.father_phone || "",
      mother_name: student.mother_name || "",
      mother_phone: student.mother_phone || "",
      address: student.address || "",
      approval_status: student.approval_status || "pending",
    });
  }, [student]);

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
      await partialUpdateStudent({
        id,
        student_id: form.student_id.trim(),
        department: form.department ? Number(form.department) : null,
        session: form.session ? Number(form.session) : null,
        year_semester: form.year_semester ? Number(form.year_semester) : null,
        cgpa: form.cgpa || null,
        phone: form.phone.trim(),
        father_name: form.father_name.trim(),
        father_phone: form.father_phone.trim(),
        mother_name: form.mother_name.trim(),
        mother_phone: form.mother_phone.trim(),
        address: form.address.trim(),
        approval_status: form.approval_status,
      }).unwrap();
      setMessage("Student updated successfully.");
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

  if (isError || !student) {
    return <div className="p-10 text-center text-muted-foreground">Student not found or could not be loaded.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/students">
              <ArrowLeft className="h-4 w-4" />
              Back to Students
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
              {student.image ? (
                <AvatarImage src={toAbsoluteUrl(student.image)} alt={student.name} />
              ) : null}
              <AvatarFallback className="text-xl">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-center sm:items-start">
              <h2 className="text-xl font-semibold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">{student.department_name || "No department"}</Badge>
                {student.student_id && <Badge>ID: {student.student_id}</Badge>}
                <Badge className={statusStyle[student.approval_status] || "bg-muted"}>{statusLabel[student.approval_status] || student.approval_status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form — editable only for admins/chairmen; read-only view for others */}
        {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Student</CardTitle>
            <CardDescription>Update the student's information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Student ID</label>
                <Input value={form.student_id} onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))} className="w-full" placeholder="Student ID" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Approval Status</label>
                <select value={form.approval_status} onChange={(e) => setForm((prev) => ({ ...prev, approval_status: e.target.value }))} className={selectClasses}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Session</label>
                <select value={form.session} onChange={(e) => setForm((prev) => ({ ...prev, session: e.target.value }))} className={selectClasses}>
                  <option value="">None</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.academic_year || `Session ${s.session_no}`}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Year / Semester</label>
                <select value={form.year_semester} onChange={(e) => setForm((prev) => ({ ...prev, year_semester: e.target.value }))} className={selectClasses}>
                  <option value="">None</option>
                  {yearSemesters.map((ys) => <option key={ys.id} value={ys.id}>{capitalize(ys.year)} Year - {capitalize(ys.semester)} Semester</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">CGPA</label>
                <Input type="number" step="any" value={form.cgpa} className="w-full" placeholder="CGPA" disabled />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full" placeholder="Phone" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Address</label>
                <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full" placeholder="Address" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Father's Name</label>
                <Input value={form.father_name} onChange={(e) => setForm((prev) => ({ ...prev, father_name: e.target.value }))} className="w-full" placeholder="Father's name" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Father's Phone</label>
                <Input value={form.father_phone} onChange={(e) => setForm((prev) => ({ ...prev, father_phone: e.target.value }))} className="w-full" placeholder="Father's phone" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Mother's Name</label>
                <Input value={form.mother_name} onChange={(e) => setForm((prev) => ({ ...prev, mother_name: e.target.value }))} className="w-full" placeholder="Mother's name" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Mother's Phone</label>
                <Input value={form.mother_phone} onChange={(e) => setForm((prev) => ({ ...prev, mother_phone: e.target.value }))} className="w-full" placeholder="Mother's phone" />
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
            <CardTitle>Student Details</CardTitle>
            <CardDescription>You have read-only access to this student's profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Student ID</dt>
                <dd className="mt-1 text-sm">{form.student_id || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Approval Status</dt>
                <dd className="mt-1 text-sm">{statusLabel[form.approval_status] || form.approval_status || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                <dd className="mt-1 text-sm">{displayDepartment}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Session</dt>
                <dd className="mt-1 text-sm">{displaySession}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Year / Semester</dt>
                <dd className="mt-1 text-sm">{displayYearSemester}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">CGPA</dt>
                <dd className="mt-1 text-sm">{form.cgpa || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-1 text-sm">{form.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd className="mt-1 text-sm">{form.address || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Father's Name</dt>
                <dd className="mt-1 text-sm">{form.father_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Father's Phone</dt>
                <dd className="mt-1 text-sm">{form.father_phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Mother's Name</dt>
                <dd className="mt-1 text-sm">{form.mother_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Mother's Phone</dt>
                <dd className="mt-1 text-sm">{form.mother_phone || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}