"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BadgeCheck,
    Building2,
    Fingerprint,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    Save,
    UserCheck,
    UserX,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
    useApproveStudentMutation,
    useGenerateStudentIdMutation,
    useGetStudentsQuery,
    usePartialUpdateStudentMutation,
    useRejectStudentMutation,
} from "@/redux/features/student/studentApi";
import {
    useGetDepartmentsQuery,
    useGetSessionsQuery,
} from "@/redux/features/academics/academicsApi";

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

export default function Page() {
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [ordering, setOrdering] = useState("-created_at");
    const [page, setPage] = useState(1);
    const [records, setRecords] = useState(5);
    const [selected, setSelected] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [studentIdInput, setStudentIdInput] = useState("");

    const {
        data: studentsResponse,
        isLoading,
        isFetching,
        refetch,
    } = useGetStudentsQuery({ search, department, approval_status: "pending", ordering, page, records });

    const { data: departmentsResponse } = useGetDepartmentsQuery({ ordering: "name", page: 1, records: 50 });
    const { data: sessionsResponse } = useGetSessionsQuery({ ordering: "-session_no", page: 1, records: 50 });

    const students = useMemo(() => normalizeList(studentsResponse), [studentsResponse]);
    const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
    const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);

    const count = studentsResponse?.data?.count ?? studentsResponse?.count ?? students.length;
    const totalPages = Math.ceil(count / records);

    const [generateStudentId, { isLoading: isGenerating }] = useGenerateStudentIdMutation();
    const [approveStudent, { isLoading: isApproving }] = useApproveStudentMutation();
    const [rejectStudent, { isLoading: isRejecting }] = useRejectStudentMutation();
    const [partialUpdateStudent, { isLoading: isSavingId }] = usePartialUpdateStudentMutation();

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

    const sessionName = (id) => {
        const session = sessions.find((s) => String(s.id) === String(id));
        return session ? (session.academic_year || `Session ${session.session_no}`) : "-";
    };

    const runAction = async (action, successMsg) => {
        setMessage("");
        setError("");

        try {
            await action.unwrap();
            setMessage(successMsg);
            await refetch();
        } catch (requestError) {
            const responseError = requestError?.data;
            const firstFieldError = responseError
                ? Object.values(responseError).flat().find(Boolean)
                : "";
            setError(firstFieldError || responseError?.detail || "Action failed.");
        }
    };

    const handleGenerateId = async () => {
        if (!selected) return;
        setError("");
        try {
            const res = await generateStudentId(selected.id).unwrap();
            const newId =
                res?.student_id ??
                res?.data?.student_id ??
                res?.data?.data?.student_id ??
                "";
            setStudentIdInput(newId);
            setSelected((prev) => ({ ...prev, student_id: newId }));
            setMessage("Student ID generated.");
            await refetch();
        } catch (requestError) {
            const responseError = requestError?.data;
            const firstFieldError = responseError
                ? Object.values(responseError).flat().find(Boolean)
                : "";
            setError(firstFieldError || responseError?.detail || "Failed to generate ID.");
        }
    };

    const handleSaveStudentId = async () => {
        if (!selected) return;
        setError("");
        setMessage("");

        try {
            await partialUpdateStudent({
                id: selected.id,
                student_id: studentIdInput.trim(),
            }).unwrap();
            setSelected((prev) => ({ ...prev, student_id: studentIdInput.trim() }));
            setMessage("Student ID updated.");
            await refetch();
        } catch (requestError) {
            const responseError = requestError?.data;
            const firstFieldError = responseError
                ? Object.values(responseError).flat().find(Boolean)
                : "";
            setError(firstFieldError || responseError?.detail || "Failed to update student ID.");
        }
    };

    const handleApprove = () => {
        if (!selected) return;
        const s = selected;
        runAction(approveStudent(s.id), "Student approved.");
        setSelected(null);
    };

    const handleReject = () => {
        if (!selected) return;
        runAction(rejectStudent(selected.id), "Student rejected.");
        setSelected(null);
    };

    const renderDetail = selected ? (
        <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
                {selected.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${selected.image}`}
                        alt={selected.name}
                        className="h-20 w-20 rounded-full border border-border object-cover"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
                        {selected.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                )}

                <h3 className="mt-4 text-lg font-semibold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.email}</p>

                <span className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selected.approval_status] || "bg-muted text-muted-foreground"}`}>
                    {selected.approval_status}
                </span>
            </div>

            <div className="space-y-2 text-sm">
                <div className="space-y-2">
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Student ID</label>
                    <div className="flex gap-2">
                        <Input
                            value={studentIdInput}
                            onChange={(e) => setStudentIdInput(e.target.value)}
                            placeholder="Not generated"
                            className="h-9 w-full"
                        />
                        <Button type="button" variant="secondary" onClick={handleSaveStudentId} disabled={isSavingId} className="h-9 shrink-0">
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium text-foreground">{selected.department_name || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">Session:</span>
                    <span className="font-medium text-foreground">{sessionName(selected.session)}</span>
                </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
                <Button className="w-full" variant="secondary" onClick={handleGenerateId} disabled={isGenerating}>
                    <Fingerprint className="h-4 w-4" />
                    {isGenerating ? "Generating..." : selected.student_id ? "Regenerate Student ID" : "Generate Student ID"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                    <Button className="gap-2" onClick={handleApprove} disabled={isApproving}>
                        <UserCheck className="h-4 w-4" />
                        Approve
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={handleReject} disabled={isRejecting}>
                        <UserX className="h-4 w-4" />
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium text-foreground">Select a Student</h3>
            <p className="mt-2 text-sm text-muted-foreground">Click a student in the list to review their information.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">New Student Approvals</h1>
                    <p className="mt-1 text-muted-foreground">Review, generate IDs, and approve or reject newly registered students.</p>
                </div>

                {message && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
                        <BadgeCheck className="h-4 w-4" />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Student list */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-8">
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
                            <h2 className="text-xl font-semibold text-foreground">Pending Students</h2>
                        </div>

                        {isLoading || isFetching ? (
                            <div className="p-10 text-center text-muted-foreground">Loading students...</div>
                        ) : students.length === 0 ? (
                            <div className="p-10 text-center">
                                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                                <h3 className="mt-3 font-medium text-foreground">No Pending Students</h3>
                                <p className="mt-2 text-sm text-muted-foreground">All newly registered students are shown here for approval.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-175">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">ID</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Department</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => {
                                                    setSelected(item);
                                                    setStudentIdInput(item.student_id || "");
                                                }}
                                                className={`border-t border-border transition hover:bg-accent/50 cursor-pointer ${
                                                    selected?.id === item.id ? "bg-accent/50" : ""
                                                }`}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                                                            {item.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground">{item.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{item.department_name || "-"}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{sessionName(item.session)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.approval_status] || "bg-muted text-muted-foreground"}`}>
                                                        {item.approval_status}
                                                    </span>
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

                    {/* Detail panel */}
                    <div className="lg:col-span-4">
                        <Card className="sticky top-24">
                            <CardHeader className="space-y-1 border-b border-border p-6">
                                <CardTitle>Student Review</CardTitle>
                                <CardDescription>Review all details before approving.</CardDescription>
                            </CardHeader>
                            <div className="p-6">{renderDetail}</div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}