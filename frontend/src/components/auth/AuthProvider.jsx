"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";

import { useLazyGetProfileQuery } from "@/redux/features/auth/authApi";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import LoadingPage from "@/components/Loading";

export default function AuthProvider({ children }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();

    const [getProfile] = useLazyGetProfileQuery();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = localStorage.getItem("accessToken");

            // No token
            if (!accessToken) {
                dispatch(clearUser());

                if (pathname === "/") {
                    router.replace("/login");
                }

                setLoading(false);
                return;
            }

            try {
                const profile = await getProfile().unwrap();

                dispatch(setUser(profile.data));

                // Already logged in → don't allow login page
                if (pathname === "/" || pathname === "/login") {
                    if (profile.data.is_admin) {
                        router.replace("/teacher/dashboard");
                    } else if (profile.data.role === "Teacher") {
                        router.replace("/teacher/dashboard");
                    } else {
                        router.replace("/student/dashboard");
                    }
                }
            } catch (error) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                dispatch(clearUser());

                if (pathname !== "/login") {
                    router.replace("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [dispatch, getProfile, pathname, router]);

    if (loading) {
        return <LoadingPage />;
    }

    return children;
}