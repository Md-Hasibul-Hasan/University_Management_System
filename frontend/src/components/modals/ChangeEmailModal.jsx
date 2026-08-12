"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    useChangeEmailMutation,
    useVerifyChangeEmailMutation,
} from "@/redux/features/auth/authApi";

import { AlertCircle, CheckCircle, X } from "lucide-react";

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

export default function ChangeEmailModal({ isOpen, onClose, onSuccess }) {
    const [changeEmail, { isLoading: sendingOtp }] = useChangeEmailMutation();
    const [verifyChangeEmail, { isLoading: verifying }] =
        useVerifyChangeEmailMutation();

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(Array(6).fill(""));
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");
    const otpRefs = useRef([]);

    // Clear any previous message/state when the modal opens
    useEffect(() => {
        if (isOpen) {
            setError("");
            setInfo("");
            setStep("email");
            setEmail("");
            setOtp(Array(6).fill(""));
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

        setOtp(
            digits.concat(Array(6).fill("")).slice(0, 6)
        );

        const nextIndex = digits.length < 6 ? digits.length : 5;
        otpRefs.current[nextIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            if (step === "email") {
                const res = await changeEmail({ new_email: email }).unwrap();
                setOtp(Array(6).fill(""));
                setInfo(res?.message || "OTP sent to your new email.");
                setStep("otp");
                setTimeout(() => otpRefs.current[0]?.focus(), 50);
            } else {
                await verifyChangeEmail({ otp: otp.join("") }).unwrap();
                onSuccess();
            }
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
                    <h2 className="text-lg font-semibold">Change Email</h2>

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

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {step === "email" ? (
                        <div className="space-y-1.5">
                            <label htmlFor="ce-email" className="block text-sm font-medium text-foreground/70">
                                New Email
                            </label>
                            <Input
                                id="ce-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground/70">
                                Enter OTP
                            </label>
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
                                        onChange={(e) =>
                                            handleOtpChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleOtpKeyDown(index, e)
                                        }
                                        onPaste={handleOtpPaste}
                                        className="h-12 w-12 rounded-lg border bg-background text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={sendingOtp || verifying}>
                        {step === "email" ? (
                            sendingOtp ? "Sending..." : "Send OTP"
                        ) : (
                            verifying ? "Verifying..." : "Verify & Change"
                        )}
                    </Button>

                    {step === "otp" && (
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setInfo("");
                                setError("");
                            }}
                            className="w-full text-center text-sm text-foreground/70 underline"
                        >
                            Use a different email
                        </button>
                    )}
                </form>
            </div>
        </div>,
        document.body
    );
}