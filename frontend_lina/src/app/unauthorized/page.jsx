import Link from "next/link";

export const metadata = {
    title: "403 - Unauthorized",
};

export default function UnauthorizedPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <h1 className="text-8xl font-bold text-red-600">403</h1>

            <h2 className="mt-4 text-3xl font-semibold">
                Access Denied
            </h2>

            <p className="mt-3 max-w-md text-gray-600">
                You don't have permission to access this page.
                Please sign in with an account that has the
                required permissions.
            </p>

            <div className="mt-8 flex gap-4">
                <Link
                    href="/"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                >
                    Go Home
                </Link>

                <Link
                    href="/login"
                    className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                >
                    Login
                </Link>
            </div>
        </main>
    );
}