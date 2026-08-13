"use client";

import { useState } from "react";
import { useLoginMutation, useLazyGetProfileQuery } from "@/redux/features/auth/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [login, { isLoading }] = useLoginMutation();
  const [getProfile] = useLazyGetProfileQuery();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear message when user modifies input
    if (message) setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await login(formData).unwrap();

      localStorage.setItem("accessToken", response.data.token.access);
      localStorage.setItem("refreshToken", response.data.token.refresh);
      setMessage(response.data.message || "Login successful.!!!");
      setMessageType("success");

      const profile = await getProfile().unwrap();
      dispatch(setUser(profile.data));

      if (profile.data.is_admin) {
        router.replace("/admin/dashboard");
      } else if (profile.data.role === "Teacher") {
        router.replace("/teacher/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    } catch (err) {
      console.log(err.data);
      setMessage(err?.data?.message || "Login failed. Please try again.!!!");
      setMessageType("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message Toast */}
          {message && (
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn />
                  Sign In
                </>
              )}
            </Button>

            {/* Register & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/student/register"
                  className="font-medium text-foreground hover:underline"
                >
                  Register
                </Link>
              </p>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} University Management System
      </p>

      {/* Forgot Password modal */}
      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </div>
  );
};

export default Page;