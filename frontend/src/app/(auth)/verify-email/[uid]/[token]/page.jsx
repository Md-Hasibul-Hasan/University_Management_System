"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useVerifyEmailLinkMutation } from "@/redux/features/student/studentApi";

const getErrorMessage = (err) => {
    const data = err?.data || {};
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.detail) return data.detail;

    const first = Object.values(data)[0];
    return Array.isArray(first) ? first[0] || "Something went wrong." : "Something went wrong. Please try again.";
};

export default function Page() {
    const router = useRouter();
    const params = useParams();

    const [verifyEmailLink, { isLoading }] = useVerifyEmailLinkMutation();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const uid = useMemo(() => params?.uid, [params]);
    const token = useMemo(() => params?.token, [params]);

    useEffect(() => {
        if (!uid || !token) {
            setError("Invalid verification link.");
            return;
        }

        verifyEmailLink({ uid, token })
            .unwrap()
            .then((res) => {
                setMessage(res?.message || "Email verified successfully. Wait for admin approval.");
                setTimeout(() => router.replace("/login"), 4000);
            })
            .catch((err) => setError(getErrorMessage(err)));
    }, [uid, token, verifyEmailLink, router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
                    <CardDescription>Verifying your account...</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted px-4 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying your email, please wait...
                        </div>
                    )}

                    {message && !isLoading && (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="text-center text-sm text-muted-foreground">
                        Redirecting to{" "}
                        <Link href="/login" className="font-medium text-foreground hover:underline">Login</Link>
                        {message && " in a moment..."}
                    </p>

                    {error && !isLoading && (
                        <div className="text-center">
                            <Button asChild>
                                <Link href="/login">Go to Login</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}