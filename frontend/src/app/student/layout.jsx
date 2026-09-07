"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouterGuard from "@/components/auth/RouterGuard";
import AppHeader from "@/components/sidebar/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  AtSign,
  Award,
  BookOpen,
  BookOpenCheck,
  BookMarked,
  FolderOpen,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LibraryBig,
  ShieldCheck,
  LockKeyhole,
  Mail,
  CircleUserIcon,
  GraduationCapIcon,
  UsersIcon
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
        icon: <GraduationCap />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/my-courses/1-1", icon: <BookOpenCheck /> },
          { title: "Second Semester", url: "/student/my-courses/1-2", icon: <BookMarked /> },
        ],
      },
      {
        title: "Second Year",
        icon: <LibraryBig />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/my-courses/2-1", icon: <BookOpenCheck /> },
          { title: "Second Semester", url: "/student/my-courses/2-2", icon: <BookMarked /> },
        ],
      },
      {
        title: "Third Year",
        icon: <FolderOpen />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/my-courses/3-1", icon: <BookOpenCheck /> },
          { title: "Second Semester", url: "/student/my-courses/3-2", icon: <BookMarked /> },
        ],
      },
      {
        title: "Fourth Year",
        icon: <Award />,
        isActive: false,
        items: [
          { title: "First Semester", url: "/student/my-courses/4-1", icon: <BookOpenCheck /> },
          { title: "Second Semester", url: "/student/my-courses/4-2", icon: <BookMarked /> },
        ],
      },
    ],
  });

  // ── Everyone (continues) ──

  sidebar_section.push({
    section_title: "Teachers & Students",
    section_items: [
      { title: "All Teachers", url: "/student/teachers", icon: <UsersIcon /> },
      { title: "All Students", url: "/student/students", icon: <GraduationCapIcon /> },
    ],
  });


  // ── My Profile ──
  sidebar_section.push({
    section_title: "My Profile",
    section_items: [
      { title: "View Profile", url: "/student/profile", icon: <CircleUserIcon /> },
      { title: "Change Password", action: "change-password", icon: <LockKeyhole /> },
      { title: "Change Email", action: "change-email", icon: <Mail /> },
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