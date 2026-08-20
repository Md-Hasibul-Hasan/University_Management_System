"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarCheck, ChevronDown, ClipboardCheck, ClipboardList, FileText, Gauge, Loader2, Megaphone, MoreHorizontal } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import DataTablePagination from "@/components/table/DataTablePagination";
import DataTableToolbar from "@/components/table/DataTableToolbar";
import { useGetYearSemestersQuery } from "@/redux/features/academics/academicsApi";
import { useGetStudentCoursesQuery } from "@/redux/features/course/student-courseApi";

const normalizeList = (response) => {
	if (Array.isArray(response)) return response;
	if (Array.isArray(response?.data?.results)) return response.data.results;
	if (Array.isArray(response?.results)) return response.results;
	if (Array.isArray(response?.data)) return response.data;
	return [];
};

const statusStyles = {
	enrolled: "bg-green-500/10 text-green-600 dark:text-green-400",
	completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	dropped: "bg-destructive/10 text-destructive",
	failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function ManageMenu({ sessionCourseId }) {
	const base = "/student/my-courses/1-1";
	const groups = [
		{
			label: "Assesment Marks",
			items: [
				{ label: "View Marks", icon: Gauge, href: `${base}/marks?session_course=${sessionCourseId}` },
			],
		},
		{
			label: "Classroom",
			items: [
				{ label: "Materials", icon: FileText, href: `${base}/materials?session_course=${sessionCourseId}` },
				{ label: "Assignments", icon: ClipboardList, href: `${base}/assignments?session_course=${sessionCourseId}` },
				{ label: "Announcements", icon: Megaphone, href: `${base}/announcements?session_course=${sessionCourseId}` },
			],
		},
	];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="sm" variant="outline">
					<MoreHorizontal className="h-4 w-4" />
					<span className="hidden sm:inline">Contents</span>
					<ChevronDown className="hidden h-4 w-4 sm:ml-1 sm:inline" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align="end" avoidCollisions={false} className="w-56">
				{groups.map((group, index) => (
					<div key={group.label}>
						{index > 0 && <DropdownMenuSeparator />}
						<DropdownMenuGroup>
							<DropdownMenuLabel>{group.label}</DropdownMenuLabel>
							{group.items.map((item) => (
								<DropdownMenuItem
													key={item.label}
													asChild={Boolean(item.href)}
													onSelect={item.href ? undefined : (event) => event.preventDefault()}
								>
													{item.href ? (
														<Link href={item.href}>
															<item.icon className="h-4 w-4" />
															{item.label}
										</Link>
									) : (
										<>
															<item.icon className="h-4 w-4" />
															{item.label}
										</>
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function Page() {
	const [search, setSearch] = useState("");
	const [ordering, setOrdering] = useState("course_title");
	const [page, setPage] = useState(1);
	const [records, setRecords] = useState(10);

	const updateSearch = (value) => { setSearch(value); setPage(1); };
	const updateOrdering = (value) => { setOrdering(value); setPage(1); };
	const updateRecords = (value) => { setRecords(value); setPage(1); };

	const { data: yearSemestersResponse, isLoading: loadingYearSemesters } = useGetYearSemestersQuery({
		ordering: "year",
		page: 1,
		records: 100,
	});
	const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);
	const firstSemester = yearSemesters.find((item) =>
		String(item.year).toLowerCase() === "first" && String(item.semester).toLowerCase() === "first"
	);
	const yearSemesterId = firstSemester?.id || "";

	const { data: response, isLoading, isFetching } = useGetStudentCoursesQuery(
		{
			search,
			ordering,
			page,
			records,
			"session_course__course__year_semester": yearSemesterId,
		},
		{ skip: !yearSemesterId }
	);
	const courses = useMemo(() => normalizeList(response), [response]);
	const count = response?.data?.count ?? response?.count ?? courses.length;
	const totalPages = Math.ceil(count / records);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-foreground">First Year, First Semester</h1>
					<p className="mt-1 text-muted-foreground">Your enrolled courses for this semester.</p>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
					<DataTableToolbar
						search={search}
						setSearch={updateSearch}
						ordering={ordering}
						setOrdering={updateOrdering}
						searchPlaceholder="Search courses..."
						count={count}
						countLabel="Courses"
						orderingOptions={[
							{ value: "-enrolled_at", label: "Newest Enrolled" },
							{ value: "enrolled_at", label: "Oldest Enrolled" },
						]}
					/>

					{loadingYearSemesters || isLoading || isFetching ? (
						<div className="p-10 text-center text-muted-foreground">
							<Loader2 className="mx-auto h-6 w-6 animate-spin" />
							<p className="mt-2 text-sm">Loading courses...</p>
						</div>
					) : courses.length === 0 ? (
						<div className="p-10 text-center">
							<BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
							<h2 className="mt-3 font-medium text-foreground">No Courses Found</h2>
							<p className="mt-2 text-sm text-muted-foreground">You have no enrolled courses for this semester.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-175">
								<thead className="bg-muted/50">
									<tr>
										<th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Course</th>
										<th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Session</th>
										<th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
										<th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Contents</th>
									</tr>
								</thead>
								<tbody>
									{courses.map((course) => (
										<tr key={course.id} className="border-t border-border transition hover:bg-accent/50">
											<td className="px-6 py-4">
												<p className="font-medium text-foreground">{course.course_title || "-"}</p>
												<p className="text-sm text-muted-foreground">{course.course_code || "-"}</p>
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">{course.session || "-"}</td>
											<td className="px-6 py-4 text-center">
												<span className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${statusStyles[course.status] || "bg-muted text-muted-foreground"}`}>
													{course.status || "-"}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex justify-center">
													<ManageMenu sessionCourseId={course.session_course} />
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<DataTablePagination page={page} totalPages={totalPages} records={records} setRecords={updateRecords} setPage={setPage} maxRecords={20} />
				</div>
			</div>
		</div>
	);
}
