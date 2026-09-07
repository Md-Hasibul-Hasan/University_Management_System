"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeacherRegisterMutation, useGetTeacherInvitationQuery } from "@/redux/features/teacher/teacherApi";

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

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const token = useMemo(() => params?.token, [params]);

  const { data: inviteData, isLoading: isInviteLoading } = useGetTeacherInvitationQuery(token, {
    skip: !token,
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [teacherRegister, { isLoading: isSubmitting }] = useTeacherRegisterMutation();

  // Pre-fill the invited teacher's name & email from the invitation token.
  useEffect(() => {
    const invite = inviteData?.data ?? inviteData;
    if (invite) {
      setForm((prev) => ({
        ...prev,
        name: invite?.name ?? prev.name,
        email: invite?.email ?? prev.email,
      }));
    }
  }, [inviteData]);

  // Live password feedback.
  const { checks: passwordChecks, allPassed: passwordValid } = validations(form.password);
  const confirmMatch = form.confirm_password.length > 0
    ? form.password === form.confirm_password
    : null;
  const invite = inviteData?.data ?? inviteData;
  const canSubmit =
    !isInviteLoading &&
    invite &&
    passwordValid &&
    form.password === form.confirm_password;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (message) setMessage("");
  };

  const getErrorMessage = (err) => {
    const data = err?.data || {};

    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.detail) return data.detail;

    const fieldErrors =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().find(Boolean)
        : "";

    if (fieldErrors) return fieldErrors;

    const first = Object.values(data)[0];
    return Array.isArray(first)
      ? first[0] || "Registration failed."
      : "Registration failed. Please try again.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setMessageType("error");
      setMessage("Invalid registration link.");
      return;
    }

    setMessage("");

    try {
      const data = await teacherRegister({
        token,
        password: form.password,
        confirm_password: form.confirm_password,
      }).unwrap();

      setMessageType("success");
      setMessage(data?.message || "Teacher account created successfully.");
      setForm({
        name: "",
        email: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Complete Teacher Registration</CardTitle>
          <CardDescription>
            Finish creating your teacher account using the invitation link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-9"
                  disabled
                  readOnly
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@university.edu"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-9"
                  disabled
                  readOnly
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {form.password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <li key={check.key} className="flex items-center gap-2 text-xs">
                      {check.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
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
              <label htmlFor="confirm_password" className="block text-sm font-medium text-muted-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirm_password}
                  onChange={(e) => handleChange("confirm_password", e.target.value)}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {confirmMatch === false && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Passwords do not match
                </p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !token || !canSubmit}>
              {isSubmitting ? "Submitting..." : <><Send className="h-4 w-4" /> Complete Registration</>}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            After registration, you will be redirected to the login page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
