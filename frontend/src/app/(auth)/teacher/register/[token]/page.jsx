"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const token = useMemo(() => params?.token, [params]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (message) setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setMessageType("error");
      setMessage("Invalid registration link.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teacher/register/${token}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const fieldErrors = data?.errors && typeof data.errors === "object"
          ? Object.values(data.errors).flat().find(Boolean)
          : "";
        const firstError = fieldErrors || data?.message || data?.detail || "Registration failed.";
        throw new Error(firstError);
      }

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
      setMessage(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !token}>
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
