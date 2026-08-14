"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

/**
 * Generalized RouterGuard for all roles.
 *
 * @param {Array} roles - Allowed roles. Supported values:
 *   "admin"       → user.is_admin === true
 *   "student"     → user.role === "Student"
 *   "chairman"    → user.role === "Teacher" && user.teacher?.is_head === true
 *   "teacher"     → user.role === "Teacher" && !user.is_admin && !user.teacher?.is_head (normal teacher)
 *   "teacher_any" → user.role === "Teacher" (any teacher-level user: admin, chairman, normal)
 *
 * @param {string} redirectTo - fallback redirect on unauthorized (default "/unauthorized")
 */
export default function RouterGuard({
    children,
    roles = [],
    redirectTo = "/unauthorized",
}) {
    const router = useRouter();

    const { user, isAuthenticated } = useSelector(
        (state) => state.auth
    );

    const isAdmin = user?.is_admin === true;
    const isStudent = user?.role === "Student";
    const isTeacher = user?.role === "Teacher";
    const isChairman = isTeacher && user?.teacher?.is_head === true;
    const isNormalTeacher = isTeacher && !isAdmin && !isChairman;

    useEffect(() => {
        // Not logged in
        if (!isAuthenticated || !user) {
            router.replace("/login");
            return;
        }

        // Check allowed roles
        const allowed = roles.some((role) => {
            switch (role) {
                case "admin":          return isAdmin;
                case "student":        return isStudent;
                case "chairman":       return isChairman;
                case "teacher":        return isNormalTeacher;
                case "teacher_any":    return isTeacher && (isAdmin || isChairman || isNormalTeacher);
                default:               return false;
            }
        });

        if (!allowed) {
            router.replace(redirectTo);
        }
    }, [user, isAuthenticated, roles, redirectTo, router,
        isAdmin, isStudent, isTeacher, isChairman, isNormalTeacher]);

    if (!isAuthenticated || !user) {
        return null;
    }

    // Check allowed roles (same check for render guard)
    const allowed = roles.some((role) => {
        switch (role) {
            case "admin":          return isAdmin;
            case "student":        return isStudent;
            case "chairman":       return isChairman;
            case "teacher":        return isNormalTeacher;
            case "teacher_any":    return isTeacher && (isAdmin || isChairman || isNormalTeacher);
            default:               return false;
        }
    });

    if (!allowed) {
        return null;
    }

    return children;
}