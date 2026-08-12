"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.replace("/login");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <h1 className="text-8xl font-bold">404</h1>

            <h2 className="mt-4 text-3xl font-semibold">Page Not Found</h2>

            <p className="mt-3 max-w-md text-muted-foreground">
                The page you're looking for doesn't exist or may
                have been moved.
            </p>

            <div className="mt-8 flex gap-4">
                <Button onClick={handleGoBack}>Go Back</Button>

                <Button variant="outline" asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </main>
    );
}