"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouterGuard from "@/components/auth/RouterGuard";
import AppHeader from "@/components/sidebar/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Archive,
  AtSign,
  BookOpen,
  FolderOpen,
  IdCard,
  LayoutDashboard,
  LibraryBig,
  ShieldCheck,
} from "lucide-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearUser } from "@/redux/features/auth/authSlice";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";

export default function StudentLayout({ children }) {
  const { user } = useSelector((state) => state.auth);

  // Role-based portal branding
  const data = {
    logo: {
      title: "Student Portal",
      description: "KiU Management System",
      url: "/student/dashboard",
    },
  };

  const router = useRouter();
  const dispatch = useDispatch();

  const [modal, setModal] = useState(null);

  const handleProfileAction = (action) => {
    if (action === "change-password") setModal("password");
    if (action === "change-email") setModal("email");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(clearUser());
    router.replace("/login");
  };

  const sidebar_section = [];

  // ── My Dashboard ──
  sidebar_section.push({
    section_title: "My Dashboard",
    section_items: [
      { title: "Dashboard", url: "/student/dashboard", icon: <LayoutDashboard /> },
    ],
  });

  // ── My Courses (per year / semester) ──
  sidebar_section.push({
    section_title: "My Courses",
    section_items: [
      {
        title: "First Year",
        icon: <BookOpen />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/courses/first-year-1st-semester", icon: <Archive /> },
          { title: "Second Semester", url: "/student/courses/first-year-2nd-semester", icon: <Archive /> },
        ],
      },
      {
        title: "Second Year",
        icon: <LibraryBig />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/courses/second-year-1st-semester", icon: <Archive /> },
          { title: "Second Semester", url: "/student/courses/second-year-2nd-semester", icon: <Archive /> },
        ],
      },
      {
        title: "Third Year",
        icon: <FolderOpen />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/courses/third-year-1st-semester", icon: <Archive /> },
          { title: "Second Semester", url: "/student/courses/third-year-2nd-semester", icon: <Archive /> },
        ],
      },
      {
        title: "Fourth Year",
        icon: <Archive />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/courses/fourth-year-1st-semester", icon: <Archive />},
          { title: "Second Semester", url: "/student/courses/fourth-year-2nd-semester", icon: <Archive /> },
        ],
      },
    ],
  });

  // ── My Profile ──
  sidebar_section.push({
    section_title: "My Profile",
    section_items: [
      { title: "View Profile", url: "/student/profile", icon: <IdCard /> },
      { title: "Change Password", action: "change-password", icon: <ShieldCheck /> },
      { title: "Change Email", action: "change-email", icon: <AtSign /> },
    ],
  });

  return (
    <RouterGuard roles={["student"]}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            logo={data.logo}
            sidebar_section={sidebar_section}
            user={user}
            onAction={handleProfileAction}
          />

          <SidebarInset>
            <AppHeader />
            <main className="p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>

      <ChangePasswordModal
        isOpen={modal === "password"}
        onClose={() => setModal(null)}
        onSuccess={handleLogout}
      />
      <ChangeEmailModal
        isOpen={modal === "email"}
        onClose={() => setModal(null)}
        onSuccess={handleLogout}
      />
    </RouterGuard>
  );
}