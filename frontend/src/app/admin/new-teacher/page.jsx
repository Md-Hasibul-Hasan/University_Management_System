"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Building2,
	CheckCircle2,
	Mail,
	Send,
	Shield,
	User,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetDepartmentsQuery } from "@/redux/features/academics/academicsApi";
import {
	useInviteTeacherMutation,
} from "@/redux/features/teacher/teacherApi";

const DESIGNATION_OPTIONS = [
	{ value: "professor", label: "Professor" },
	{ value: "assistant_professor", label: "Assistant Professor" },
	{ value: "associate_teacher", label: "Assistant Teacher" },
	{ value: "lecturer", label: "Lecturer" },
];

const Page = () => {
	const { data: departmentsResponse, isLoading: isLoadingDepartments } =
		useGetDepartmentsQuery();
	const [inviteTeacher, { isLoading: isSubmitting }] =
		useInviteTeacherMutation();

	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [form, setForm] = useState({
		name: "",
		email: "",
		employee_id: "",
		department: "",
		designation: "lecturer",
	});

	const departments = useMemo(() => {
		if (Array.isArray(departmentsResponse)) {
			return departmentsResponse;
		}

		if (Array.isArray(departmentsResponse?.data?.results)) {
			return departmentsResponse.data.results;
		}

		if (Array.isArray(departmentsResponse?.results)) {
			return departmentsResponse.results;
		}

		if (Array.isArray(departmentsResponse?.data)) {
			return departmentsResponse.data;
		}

		return [];
	}, [departmentsResponse]);

	useEffect(() => {
		if (!form.department && departments.length > 0) {
			setForm((prev) => ({ ...prev, department: String(departments[0].id) }));
		}
	}, [departments, form.department]);

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setMessage("");
		setError("");

		try {
			const payload = {
				...form,
				department: Number(form.department),
			};

			const response = await inviteTeacher(payload).unwrap();
			setMessage(response?.message || "Teacher invitation sent successfully.");
			setForm((prev) => ({
				...prev,
				name: "",
				email: "",
				employee_id: "",
				designation: "lecturer",
			}));
		} catch (requestError) {
			const responseError = requestError?.data;
			const firstFieldError = responseError?.errors
				? Object.values(responseError.errors).flat().find(Boolean)
				: "";

			setError(
				firstFieldError || responseError?.message || responseError?.detail || "Failed to send invitation."
			);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8">
					<div>
						<p className="text-sm font-medium text-foreground/70">Teachers</p>
						<h1 className="mt-1 text-3xl font-bold tracking-tight">
							Invite New Teacher
						</h1>
						<p className="mt-2 text-sm text-foreground/70">
							Send an invitation link to create a new faculty account.
						</p>
					</div>
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

				<div className="grid gap-6 lg:grid-cols-[320px_1fr]">
					<Card className="h-fit">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-xl">
								<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
								Invitation Summary
							</CardTitle>
							<CardDescription>
								Review the details before sending the invitation.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="rounded-2xl border bg-muted/40 p-4">
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-indigo-500/10 p-2">
										<Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
											Email
										</p>
										<p className="mt-1 text-sm font-medium">
											{form.email || "teacher@example.com"}
										</p>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border bg-muted/40 p-4">
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-indigo-500/10 p-2">
										<Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
											Department
										</p>
										<p className="mt-1 text-sm font-medium">
											{departments.find((item) => String(item.id) === form.department)
												? `${departments.find((item) => String(item.id) === form.department).code} - ${departments.find((item) => String(item.id) === form.department).name}`
												: "Select a department"}
										</p>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border bg-muted/40 p-4">
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-indigo-500/10 p-2">
										<Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div>
										<p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
											Designation
										</p>
										<p className="mt-1 text-sm font-medium">
											{
												DESIGNATION_OPTIONS.find(
													(item) => item.value === form.designation
												)?.label
											}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Teacher Invitation Form</CardTitle>
							<CardDescription>
								Fill in the teacher details and send the registration link.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="grid gap-6 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="name">
											Full Name
										</label>
										<div className="relative">
											<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
											<Input
												id="name"
												value={form.name}
												onChange={(event) => handleChange("name", event.target.value)}
												placeholder="Enter teacher name"
												className="pl-9"
												required
											/>
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="email">
											Email Address
										</label>
										<div className="relative">
											<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
											<Input
												id="email"
												type="email"
												value={form.email}
												onChange={(event) => handleChange("email", event.target.value)}
												placeholder="teacher@university.edu"
												className="pl-9"
												required
											/>
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="employee_id">
											Employee ID
										</label>
										<Input
											id="employee_id"
											value={form.employee_id}
											onChange={(event) =>
												handleChange("employee_id", event.target.value)
											}
											placeholder="EMP-0001"
											required
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="designation">
											Designation
										</label>
										<div className="relative">
											<Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
											<select
												id="designation"
												value={form.designation}
												onChange={(event) =>
													handleChange("designation", event.target.value)
												}
												className="h-8 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-card dark:text-foreground dark:scheme-dark"
												required
											>
												{DESIGNATION_OPTIONS.map((option) => (
													<option
														key={option.value}
														value={option.value}
														className="bg-background text-foreground dark:bg-card dark:text-foreground"
													>
														{option.label}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium" htmlFor="department">
										Department
									</label>
									<div className="relative">
										<Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
										<select
											id="department"
											value={form.department}
											onChange={(event) => handleChange("department", event.target.value)}
											className="h-8 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-card dark:text-foreground dark:scheme-dark"
											required
											disabled={isLoadingDepartments}
										>
											{!departments.length && (
												<option value="">{isLoadingDepartments ? "Loading departments..." : "No departments available"}</option>
											)}

											{departments.map((department) => (
												<option
													key={department.id}
													value={department.id}
													className="bg-background text-foreground dark:bg-card dark:text-foreground"
												>
													{department.code} - {department.name}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
									<Button
										type="button"
										variant="outline"
										className="gap-2"
										onClick={() => router.back()}
									>
										Cancel
									</Button>

									<Button type="submit" className="gap-2" disabled={isSubmitting}>
										<Send className="h-4 w-4" />
										{isSubmitting ? "Sending..." : "Send Invitation"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default Page;
