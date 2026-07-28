"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <h1 className="text-8xl font-bold">404</h1>

            <h2 className="mt-4 text-3xl font-semibold">
                Page Not Found
            </h2>

            <p className="mt-3 max-w-md text-gray-600">
                The page you're looking for doesn't exist or may
                have been moved.
            </p>

            <div className="mt-8 flex gap-4">
                <button
                    onClick={handleGoBack}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                >
                    Go Back
                </button>

                <Link
                    href="/login"
                    className="rounded-lg border px-5 py-2 hover:bg-gray-100 hover:text-gray-900"
                >
                    Login
                </Link>
            </div>
        </main>
    );
}