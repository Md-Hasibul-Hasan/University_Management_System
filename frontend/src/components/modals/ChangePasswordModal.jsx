"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useChangePasswordMutation } from "@/redux/features/auth/authApi";

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

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const [form, setForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [show, setShow] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Clear any previous message when the modal opens
    useEffect(() => {
        if (isOpen) {
            setError("");
            setSuccess("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleShow = (field) => {
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.new_password !== form.confirm_password) {
            setError("New password and confirmation do not match.");
            return;
        }

        try {
            await changePassword(form).unwrap();
            setSuccess("Password changed successfully. Logging you out...");
            setTimeout(() => onSuccess(), 1500);
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
                    <h2 className="text-lg font-semibold">Change Password</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-foreground/70 hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {success && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="cp-current" className="block text-sm font-medium text-foreground/70">
                            Current Password
                        </label>
                        <div className="relative">
                            <Input
                                id="cp-current"
                                type={show.current ? "text" : "password"}
                                value={form.current_password}
                                onChange={(e) => handleChange("current_password", e.target.value)}
                                className="pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow("current")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                                tabIndex={-1}
                            >
                                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="cp-new" className="block text-sm font-medium text-foreground/70">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                id="cp-new"
                                type={show.new ? "text" : "password"}
                                value={form.new_password}
                                onChange={(e) => handleChange("new_password", e.target.value)}
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
                        <label htmlFor="cp-confirm" className="block text-sm font-medium text-foreground/70">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                id="cp-confirm"
                                type={show.confirm ? "text" : "password"}
                                value={form.confirm_password}
                                onChange={(e) => handleChange("confirm_password", e.target.value)}
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

                    <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                        {isLoading ? "Changing..." : "Change Password"}
                    </Button>
                </form>
            </div>
        </div>,
        document.body
    );
}