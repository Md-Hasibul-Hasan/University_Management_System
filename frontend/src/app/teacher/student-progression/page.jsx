"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, Loader2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import DataTablePagination from "@/components/table/DataTablePagination";
import {
  useDemoteStudentsMutation,
  useGetProgressionStudentsQuery,
  usePromoteStudentsMutation,
} from "@/redux/features/student/studentApi";
import {
  useGetDepartmentsQuery,
  useGetSessionsQuery,
  useGetYearSemestersQuery,
} from "@/redux/features/academics/academicsApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const responseData = (response) => response?.data?.data ?? response?.data ?? response;

const formatSemester = (year, semester) => {
  if (!year || !semester) return "-";
  return `${String(year).replace(/^./, (value) => value.toUpperCase())} year / ${String(semester).replace(/^./, (value) => value.toUpperCase())} semester`;
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [session, setSession] = useState("");
  const [yearSemester, setYearSemester] = useState("");
  const [ordering, setOrdering] = useState("student_id");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState(50);
  const [selectedIds, setSelectedIds] = useState([]);
  const [demoteOpen, setDemoteOpen] = useState(false);
  const [targetSession, setTargetSession] = useState("");
  const [targetYearSemester, setTargetYearSemester] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const { data: studentsResponse, isLoading, isFetching, refetch } = useGetProgressionStudentsQuery({
    search,
    department,
    session,
    year_semester: yearSemester,
    ordering,
    page,
    records,
  });
  const { data: departmentsResponse } = useGetDepartmentsQuery({ records: 100 });
  const { data: sessionsResponse } = useGetSessionsQuery({ records: 100 });
  const { data: yearSemestersResponse } = useGetYearSemestersQuery({ ordering: "year", records: 100 });
  const [promote, { isLoading: promoting }] = usePromoteStudentsMutation();
  const [demote, { isLoading: demoting }] = useDemoteStudentsMutation();

  const students = useMemo(() => normalizeList(studentsResponse), [studentsResponse]);
  const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
  const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);
  const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);
  const allSelected = students.length > 0 && students.every((student) => selectedIds.includes(student.id));
  const busy = promoting || demoting;
  const count = studentsResponse?.data?.count ?? studentsResponse?.count ?? students.length;
  const totalPages = Math.ceil(count / records);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, department, session, yearSemester, ordering, records]);

  const changePage = (updater) => {
    setPage(updater);
    setSelectedIds([]);
  };

  const filters = [
    {
      key: "department",
      label: "Department",
      value: department,
      setValue: (value) => { setDepartment(value); setSelectedIds([]); },
      options: departments.map((item) => ({ value: String(item.id), label: item.name || item.code })),
    },
    {
      key: "session",
      label: "Session",
      value: session,
      setValue: (value) => { setSession(value); setSelectedIds([]); },
      options: sessions.map((item) => ({ value: String(item.id), label: item.academic_year })),
    },
    {
      key: "year_semester",
      label: "Year & Semester",
      value: yearSemester,
      setValue: (value) => { setYearSemester(value); setSelectedIds([]); },
      options: yearSemesters.map((item) => ({ value: String(item.id), label: formatSemester(item.year, item.semester) })),
    },
  ];

  const toggleStudent = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : students.map((student) => student.id));
  };

  const showSuccess = (message) => {
    setActionError("");
    setActionMessage(message);
    setSelectedIds([]);
    setDemoteOpen(false);
    refetch();
  };

  const getError = (error, fallback) => error?.data?.detail || error?.data?.message || fallback;

  const handlePromote = async () => {
    if (selectedIds.length === 0 || busy) return;
    setActionMessage("");
    setActionError("");
    try {
      await promote({ student_ids: selectedIds }).unwrap();
      showSuccess(`${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"} promoted successfully.`);
    } catch (error) {
      setActionError(getError(error, "Unable to promote selected students."));
    }
  };

  const handleDemote = async () => {
    if (selectedIds.length === 0 || !targetSession || !targetYearSemester || busy) return;
    setActionMessage("");
    setActionError("");
    try {
      await demote({
        student_ids: selectedIds,
        target_session: Number(targetSession),
        target_year_semester: Number(targetYearSemester),
      }).unwrap();
      showSuccess(`${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"} demoted successfully.`);
    } catch (error) {
      setActionError(getError(error, "Unable to demote selected students."));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Academic Operations</p>
            <h1 className="mt-1 text-3xl font-bold">Student Progression</h1>
            <p className="mt-2 text-sm text-muted-foreground">Promote or reset student enrollment from a controlled semester boundary.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {count} students
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button onClick={handlePromote} disabled={selectedIds.length === 0 || busy}>
            {promoting ? <Loader2 className="animate-spin" /> : <ArrowUpToLine />}
            Promote selected
          </Button>
          <Button variant="outline" onClick={() => setDemoteOpen(true)} disabled={selectedIds.length === 0 || busy}>
            <ArrowDownToLine /> Demote selected
          </Button>
          {selectedIds.length > 0 && <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>}
        </div>

        {actionMessage && <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">{actionMessage}</div>}
        {actionError && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{actionError}</div>}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DataTableToolbar
            search={search}
            setSearch={(value) => { setSearch(value); setSelectedIds([]); }}
            filters={filters}
            ordering={ordering}
            setOrdering={setOrdering}
            searchPlaceholder="Search student name or ID..."
            count={count}
            countLabel="Students"
            orderingOptions={[{ value: "student_id", label: "Student ID" }, { value: "-created_at", label: "Newest" }]}
          />
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="mr-2 animate-spin" /> Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No students found in this scope.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-12 px-4 py-4 text-center"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all students" /></th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Department</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Current semester</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t border-border hover:bg-accent/40">
                      <td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} aria-label={`Select ${student.name || student.student_id}`} /></td>
                      <td className="px-4 py-4"><p className="font-medium">{student.name || "-"}</p><p className="text-sm text-muted-foreground">{student.student_id || "-"}</p></td>
                      <td className="px-4 py-4 text-sm">{student.department_name || "-"}</td>
                      <td className="px-4 py-4 text-sm">{student.session_name || student.session?.academic_year || "-"}</td>
                      <td className="px-4 py-4 text-sm">{formatSemester(student.year, student.semester)}</td>
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
            setPage={changePage}
            maxRecords={500}
          />
        </div>
      </div>

      {demoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="demote-title">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="demote-title" className="text-xl font-semibold">Demote students</h2><p className="mt-1 text-sm text-muted-foreground">Target enrollments will replace the target and all later semesters.</p></div>
              <Button variant="ghost" size="icon" onClick={() => setDemoteOpen(false)} aria-label="Close dialog"><X /></Button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Target session<select value={targetSession} onChange={(event) => setTargetSession(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="">Choose session</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.academic_year}</option>)}</select></label>
              <label className="block text-sm font-medium">Target year-semester<select value={targetYearSemester} onChange={(event) => setTargetYearSemester(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="">Choose semester</option>{yearSemesters.map((item) => <option key={item.id} value={item.id}>{formatSemester(item.year, item.semester)}</option>)}</select></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setDemoteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDemote} disabled={!targetSession || !targetYearSemester || demoting}>{demoting ? <Loader2 className="animate-spin" /> : <ArrowDownToLine />} Demote</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
