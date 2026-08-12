import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
    title: "403 - Unauthorized",
};

export default function UnauthorizedPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <h1 className="text-8xl font-bold text-destructive">403</h1>

            <h2 className="mt-4 text-3xl font-semibold">Access Denied</h2>

            <p className="mt-3 max-w-md text-muted-foreground">
                You don't have permission to access this page.
                Please sign in with an account that has the
                required permissions.
            </p>

            <div className="mt-8 flex gap-4">
                <Button asChild>
                    <Link href="/">Go Home</Link>
                </Button>

                <Button variant="outline" asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </main>
    );
}