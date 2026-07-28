"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function RouterGuard({
    children,
    role,
    adminOnly = false,
}) {
    const router = useRouter();

    const { user, isAuthenticated } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        // Not logged in
        if (!isAuthenticated || !user) {
            router.replace("/login");
            return;
        }

        // Admin routes
        if (adminOnly) {
            if (!user.is_admin) {
                router.replace("/unauthorized");
            }
            return;
        }

        // Admin cannot access Teacher/Student routes
        if (user.is_admin) {
            router.replace("/unauthorized");
            return;
        }

        // Wrong role
        if (user.role !== role) {
            router.replace("/unauthorized");
        }
    }, [user, isAuthenticated, role, adminOnly, router]);

    // Wait until auth is loaded
    if (!isAuthenticated || !user) {
        return null;
    }

    // Admin route protection
    if (adminOnly && !user.is_admin) {
        return null;
    }

    // Admin can't access Teacher/Student routes
    if (!adminOnly && user.is_admin) {
        return null;
    }

    // Role protection
    if (!adminOnly && user.role !== role) {
        return null;
    }

    return children;
}