"use client";

import { useState } from "react";
import { useLoginMutation, useLazyGetProfileQuery } from "@/redux/features/auth/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${messageType === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
            >
              {messageType === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} University Management System
        </p>
      </div>
    </div>
  );
};

export default Page;