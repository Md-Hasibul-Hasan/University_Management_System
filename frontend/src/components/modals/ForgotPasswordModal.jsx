"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    useForgotPasswordMutation,
    useResetPasswordMutation,
} from "@/redux/features/auth/authApi";

import { AlertCircle, CheckCircle, Eye, EyeOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getErrorMessage = (err) => {
    const data = err?.data || {};

    if (typeof data === "string") return data;
    if (data.message) return data.message;

    const first = Object.values(data)[0];

    return Array.isArray(first)
        ? first[0] || "Something went wrong."
        : "Something went wrong. Please try again.";
};

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }) {
    const [forgotPassword, { isLoading: sendingOtp }] =
        useForgotPasswordMutation();
    const [resetPassword, { isLoading: resetting }] =
        useResetPasswordMutation();

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [show, setShow] = useState({ new: false, confirm: false });
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");
    const [resetDone, setResetDone] = useState(false);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setError("");
            setInfo("");
            setStep("email");
            setEmail("");
            setOtp(Array(6).fill(""));
            setNewPassword("");
            setConfirmPassword("");
            setResetDone(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        setOtp((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const digits = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6)
            .split("");
        setOtp(digits.concat(Array(6).fill("")).slice(0, 6));
        otpRefs.current[digits.length < 6 ? digits.length : 5]?.focus();
    };

    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        try {
            const res = await forgotPassword({ email }).unwrap();
            setOtp(Array(6).fill(""));
            setInfo(res?.message || "Password reset OTP sent to your email.");
            setStep("otp");
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        try {
            await resetPassword({
                email,
                otp: otp.join(""),
                new_password: newPassword,
                confirm_password: confirmPassword,
            }).unwrap();
            setResetDone(true);
            setInfo("Password reset successfully. You can now log in.");
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl"
        >
            <div
                className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Reset Password</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-foreground/70 hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {info && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{info}</span>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {step === "email" ? (
                    <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="fp-email" className="block text-sm font-medium text-foreground/70">
                                Email
                            </label>
                            <Input
                                id="fp-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={sendingOtp}>
                            {sendingOtp ? "Sending..." : "Send OTP"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetSubmit} className="mt-5 space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground/70">Enter OTP</label>
                            <p className="text-xs text-foreground/70">
                                Enter the 6-digit code sent to {email}.
                            </p>

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

                        <div className="space-y-1.5">
                            <label htmlFor="fp-new" className="block text-sm font-medium text-foreground/70">
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="fp-new"
                                    type={show.new ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleShow("new")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="fp-confirm" className="block text-sm font-medium text-foreground/70">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="fp-confirm"
                                    type={show.confirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleShow("confirm")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                                                <Button type="submit" className="w-full" disabled={resetting || resetDone}>
                            {resetting ? "Resetting..." : "Reset Password"}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setInfo("");
                                setError("");
                                setResetDone(false);
                            }}
                            className="w-full text-center text-sm text-foreground/70 underline"
                        >
                            Use a different email
                        </button>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}