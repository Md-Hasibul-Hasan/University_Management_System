"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouterGuard from "@/components/auth/RouterGuard";
import AppHeader from "@/components/sidebar/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  BarChart4Icon,
  BellIcon,
  CreditCardIcon,
  DollarSignIcon,
  GlobeIcon,
  LayersIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PercentIcon,
  PlusIcon,
  RulerIcon,
  ScaleIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  TagsIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearUser } from "@/redux/features/auth/authSlice";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";

const data = {
  logo: {
    title: "Teacher Portal",
    description: "KiU Management System",
    url: "/teacher/dashboard",
  },
};

/* Academic Setup submenu — ADMIN only */
const academicSetupItem = {
  title: "Academic Setup",
  icon: <LayersIcon />,
  isActive: false,
  items: [
    { title: "Faculties", url: "/teacher/faculty", icon: <LayersIcon /> },
    { title: "Departments", url: "/teacher/department", icon: <TagsIcon /> },
    { title: "Sessions", url: "/teacher/session", icon: <ScaleIcon /> },
    { title: "Year & Semester", url: "/teacher/year-semester", icon: <RulerIcon /> },
  ],
};

/* Course Management submenu — ADMIN + CHAIRMAN */
const courseManagementItem = {
  title: "Course Management",
  icon: <PackageIcon />,
  isActive: false,
  items: [
    { title: "Courses", url: "/teacher/course", icon: <PackageIcon /> },
    { title: "Assign Course Teacher", url: "/teacher/course-teachers", icon: <UsersIcon /> },
    { title: "Course Assessments", url: "/teacher/course-assessments", icon: <BarChart4Icon /> },
    { title: "Session Courses", url: "/teacher/session-courses", icon: <LayersIcon /> },
    { title: "Student Courses", url: "/teacher/student-courses", icon: <ShoppingCartIcon /> },
  ],
};

export default function TeacherLayout({ children }) {
  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === "Teacher" && user?.is_admin === true;
  const isChairman = user?.role === "Teacher" && user?.teacher?.is_head === true;

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

  // ── Everyone ──
  sidebar_section.push({
    section_title: "My Dashboard",
    section_items: [
      { title: "Dashboard", url: "/teacher/dashboard", icon: <LayoutDashboardIcon /> },
      { title: "My Courses", url: "/teacher/my-courses", icon: <PackageIcon /> },
    ],
  });

  // ── Combined Academics & Course Management ──
  // Admin → Academic Setup + Course Management
  // Chairman → Course Management only
  if (isAdmin || isChairman) {
    const combinedItems = [];
    if (isAdmin) combinedItems.push(academicSetupItem);
    combinedItems.push(courseManagementItem);

    sidebar_section.push({
      section_title: "Academic & Course Management",
      section_items: combinedItems,
    });

    sidebar_section.push({
      section_title: "Registration",
      section_items: [
        { title: "Invite New Teacher", url: "/teacher/new-teacher", icon: <PlusIcon /> },
        { title: "Approve New Student", url: "/teacher/new-student", icon: <PlusIcon /> },
      ],
    });


  }

  // ── Everyone (continues) ──

  sidebar_section.push({
    section_title: "Teachers & Students",
    section_items: [
      { title: "All Teachers", url: "/teacher/teachers", icon: <UsersIcon /> },
      { title: "All Students", url: "/teacher/students", icon: <UsersIcon /> },
    ],
  });

  sidebar_section.push({
    section_title: "Course Materials",
    section_items: [
      { title: "Material Distribution", url: "/Teacher/Materials/Distribution", icon: <TruckIcon /> },
      { title: "Distribution Methods", url: "/Teacher/Materials/Methods", icon: <GlobeIcon /> },
      { title: "Delivery Partners", url: "/Teacher/Materials/Partners", icon: <TruckIcon /> },
    ],
  });

  sidebar_section.push({
    section_title: "Announcements",
    section_items: [
      { title: "Announcements", url: "/Teacher/Announcements/List", icon: <PercentIcon /> },
      { title: "Notices", url: "/Teacher/Announcements/Notices", icon: <TagsIcon /> },
      { title: "Scholarships", url: "/Teacher/Announcements/Scholarships", icon: <DollarSignIcon /> },
      { title: "Messages", url: "/Teacher/Announcements/Messages", icon: <BellIcon /> },
    ],
  });

  sidebar_section.push({
    section_title: "My Profile",
    section_items: [
      { title: "View Profile", url: "/teacher/profile", icon: <PercentIcon /> },
      { title: "Change Password", action: "change-password", icon: <TagsIcon /> },
      { title: "Change Email", action: "change-email", icon: <DollarSignIcon /> },
    ],
  });

  return (
    <RouterGuard roles={["teacher"]}>
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