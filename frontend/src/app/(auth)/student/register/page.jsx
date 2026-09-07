"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff, GraduationCap, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    useStudentRegisterMutation,
    useVerifyEmailOtpMutation,
    useResendVerificationEmailMutation,
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
    if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const getErrorMessage = (err) => {
    const data = err?.data || {};
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.detail) return data.detail;

    const first = Object.values(data)[0];
    return Array.isArray(first) ? first[0] || "Something went wrong." : "Something went wrong. Please try again.";
};

const selectClasses =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-4 focus:ring-ring/20 dark:border-input dark:bg-card dark:scheme-dark";

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Live password-strength checks.
const validations = (pw) => {
    const checks = [
        {
            key: "length",
            label: "At least 8 characters long",
            passed: pw.length >= 8,
        },
        {
            key: "upper",
            label: "At least one uppercase letter",
            passed: /[A-Z]/.test(pw),
        },
        {
            key: "special",
            label: "At least one special character",
            passed: /[^A-Za-z0-9]/.test(pw),
        },
    ];
    return {
        checks,
        allPassed: checks.every((c) => c.passed),
    };
};

export default function Page() {
    const router = useRouter();

    const [studentRegister, { isLoading: isRegistering }] = useStudentRegisterMutation();
    const [verifyEmailOtp, { isLoading: isVerifying }] = useVerifyEmailOtpMutation();
    const [resendVerificationEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();

    const { data: departmentsResponse, isLoading: isLoadingDepartments } = useGetDepartmentsQuery({
        ordering: "name", page: 1, records: 50,
    });
    const { data: sessionsResponse, isLoading: isLoadingSessions } = useGetSessionsQuery({
        ordering: "-session_no", page: 1, records: 50,
    });
    const { data: yearSemestersResponse, isLoading: isLoadingYearSemesters } = useGetYearSemestersQuery({
        ordering: "created_at", page: 1, records: 50,
    });

    const departments = useMemo(() => normalizeList(departmentsResponse), [departmentsResponse]);
    const sessions = useMemo(() => normalizeList(sessionsResponse), [sessionsResponse]);
    const yearSemesters = useMemo(() => normalizeList(yearSemestersResponse), [yearSemestersResponse]);

    const [step, setStep] = useState("register");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm_password: "",
        department: "",
        session: "",
        year_semester: "",
    });
    const [show, setShow] = useState({ password: false, confirm: false });
    
    const [otp, setOtp] = useState(Array(6).fill(""));
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const otpRefs = useRef([]);

    // Live password feedback.
    const { checks: passwordChecks, allPassed: passwordValid } = validations(form.password);
    const confirmMatch = form.confirm_password.length > 0
        ? form.password === form.confirm_password
        : null;
    const canSubmit =
        passwordValid &&
        form.password === form.confirm_password &&
        form.name.trim() &&
        form.email.trim() &&
        form.department &&
        form.session &&
        form.year_semester;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (form.password !== form.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const res = await studentRegister({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                confirm_password: form.confirm_password,
                department: Number(form.department),
                session: Number(form.session),
                year_semester: Number(form.year_semester),
            }).unwrap();

            setMessage(res?.message || "Registration successful. Please verify your email.");
            setOtp(Array(6).fill(""));
            setStep("verify");
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await verifyEmailOtp({ email: form.email.trim(), otp: otp.join("") }).unwrap();
            setMessage(res?.message || "Email verified successfully. Wait for admin approval.");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleResend = async () => {
        setError("");
        setMessage("");

        try {
            const res = await resendVerificationEmail({ email: form.email.trim() }).unwrap();
            setOtp(Array(6).fill(""));
            setMessage(res?.message || "Verification email sent successfully.");
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        setOtp((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
        setOtp(digits.concat(Array(6).fill("")).slice(0, 6));
        otpRefs.current[digits.length < 6 ? digits.length : 5]?.focus();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
                        <GraduationCap />
                        Student Registration
                    </CardTitle>
                    <CardDescription>
                        {step === "register"
                            ? "Create your student account"
                            : "Verify your email to complete registration"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {message && (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === "register" ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Full Name</label>
                                <Input id="name" name="name" value={form.name} onChange={handleInputChange} placeholder="Your full name" required />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input id="email" name="email" type="email" value={form.email} onChange={handleInputChange} placeholder="you@example.com" className="pl-9" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Password</label>
                                <div className="relative">
                                    <Input id="password" name="password" type={show.password ? "text" : "password"} value={form.password} onChange={handleInputChange} placeholder="••••••••" className="pr-10" required />
                                    <button type="button" onClick={() => toggleShow("password")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                        {show.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {form.password.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {passwordChecks.map((check) => (
                                            <li key={check.key} className="flex items-center gap-2 text-xs">
                                                {check.passed ? (
                                                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                                                )}
                                                <span className={check.passed ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                                                    {check.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-muted-foreground">Confirm Password</label>
                                <div className="relative">
                                    <Input id="confirm_password" name="confirm_password" type={show.confirm ? "text" : "password"} value={form.confirm_password} onChange={handleInputChange} placeholder="••••••••" className="pr-10" required />
                                    <button type="button" onClick={() => toggleShow("confirm")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                        {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {confirmMatch === false && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="block text-sm font-medium text-muted-foreground">Department</label>
                                <select id="department" name="department" value={form.department} onChange={handleInputChange} className={selectClasses} required disabled={isLoadingDepartments}>
                                    <option value="">{isLoadingDepartments ? "Loading departments..." : "Select department"}</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="session" className="block text-sm font-medium text-muted-foreground">Session</label>
                                <select id="session" name="session" value={form.session} onChange={handleInputChange} className={selectClasses} required disabled={isLoadingSessions}>
                                    <option value="">{isLoadingSessions ? "Loading sessions..." : "Select session"}</option>
                                    {sessions.map((session) => (
                                        <option key={session.id} value={session.id}>{session.academic_year || `Session ${session.session_no}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="year_semester" className="block text-sm font-medium text-muted-foreground">Year / Semester</label>
                                <select id="year_semester" name="year_semester" value={form.year_semester} onChange={handleInputChange} className={selectClasses} required disabled={isLoadingYearSemesters}>
                                    <option value="">{isLoadingYearSemesters ? "Loading levels..." : "Select year / semester"}</option>
                                    {yearSemesters.map((ys) => (
                                        <option key={ys.id} value={ys.id}>{capitalize(ys.year)} Year - {capitalize(ys.semester)} Semester</option>
                                    ))}
                                </select>
                            </div>

                            <Button type="submit" className="w-full" disabled={isRegistering || !canSubmit}>
                                {isRegistering && <Loader2 className="h-4 w-4 animate-spin" />}
                                Register
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="font-medium text-foreground hover:underline">Login</Link>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted-foreground">Enter OTP</label>
                                <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to {form.email}.</p>
                                <div className="flex justify-between gap-2 pt-1">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className="h-12 w-12 rounded-lg border bg-background text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isVerifying}>
                                {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                                Verify Email
                            </Button>

                            <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={isResending}>
                                {isResending ? "Sending..." : "Resend verification email"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Go back to{" "}
                                <Link href="/login" className="font-medium text-foreground hover:underline">Login</Link>
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>

            <p className="mt-6 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} University Management System
            </p>
        </div>
    );
}