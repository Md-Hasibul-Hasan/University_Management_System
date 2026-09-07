"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import RouterGuard from "@/components/auth/RouterGuard";
import AppHeader from "@/components/sidebar/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  BookMarkedIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CircleUserIcon,
  ClipboardListIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  MailIcon,
  SchoolIcon,
  TagsIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  LinkIcon,
  Mail,
  LockKeyhole,
  Settings2Icon,

} from "lucide-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearUser } from "@/redux/features/auth/authSlice";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";

/* Academic Setup submenu — ADMIN only */
const academicSetupItem = {
  title: "Academic Setup",
  icon: <SchoolIcon />,
  isActive: false,
  items: [
    { title: "Faculties", url: "/teacher/faculty", icon: <LandmarkIcon /> },
    { title: "Departments", url: "/teacher/department", icon: <TagsIcon /> },
    { title: "Sessions", url: "/teacher/session", icon: <CalendarDaysIcon /> },
    { title: "Year & Semester", url: "/teacher/year-semester", icon: <CalendarRangeIcon /> },
  ],
};

/* Course Management submenu — ADMIN + CHAIRMAN */
const courseManagementItem = {
  title: "Course Management",
  icon: <FolderKanbanIcon />,
  isActive: false,
  items: [
    { title: "Courses", url: "/teacher/course", icon: <BookMarkedIcon /> },
    { title: "Course Assignments", url: "/teacher/course-teachers", icon: <UserPlusIcon /> },
    { title: "Course Assessments", url: "/teacher/course-assessments", icon: <ClipboardListIcon /> },
    { title: "Course Offerings", url: "/teacher/session-courses", icon: <LayersIcon /> },
    { title: "Course Enrollments", url: "/teacher/student-courses", icon: <UsersIcon /> },
  ],
};

export default function TeacherLayout({ children }) {
  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === "Teacher" && user?.is_admin === true;
  const isChairman = user?.role === "Teacher" && user?.teacher?.is_head === true;

  // Role-based portal branding
  const portalTitle = isAdmin ? "Admin Portal" : isChairman ? "Chairman Portal" : "Teacher Portal";
  const data = {
    logo: {
      title: portalTitle,
      description: "KiU Management System",
      url: "/teacher/dashboard",
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

  // ── Everyone ──
  sidebar_section.push({
    section_title: "My Dashboard",
    section_items: [
      { title: "Dashboard", url: "/teacher/dashboard", icon: <LayoutDashboardIcon /> },
      { title: "My Courses", url: "/teacher/my-courses", icon: <BookOpenIcon /> },
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
      section_title: "Publish Results",
      section_items: [
        {
          title: "Pending Results",
          url: "/teacher/pending-results",
          icon: <MailIcon />,
        },
      ],
    });

    sidebar_section.push({
      section_title: "Registration",
      section_items: [
        { title: "Invite New Teacher", url: "/teacher/new-teacher", icon: <UserPlusIcon /> },
        { title: "Approve New Student", url: "/teacher/new-student", icon: <UserCheckIcon /> },
      ],
    });


  }

  // ── Everyone (continues) ──

  sidebar_section.push({
    section_title: "Teachers & Students",
    section_items: [
      { title: "All Teachers", url: "/teacher/teachers", icon: <UsersIcon /> },
      { title: "All Students", url: "/teacher/students", icon: <GraduationCapIcon /> },
    ],
  });


  sidebar_section.push({
    section_title: "My Profile",
    section_items: [
      { title: "View Profile", url: "/teacher/profile", icon: <CircleUserIcon /> },
      { title: "Change Password", action: "change-password", icon: <LockKeyhole /> },
      { title: "Change Email", action: "change-email", icon: <Mail /> },
    ],
  });

  if (isAdmin) {
    sidebar_section.push({
      section_title: "Admin Panel",
      section_items: [
        { title: "Admin Panel", url: `${process.env.NEXT_PUBLIC_API_URL}admin/`, icon: <Settings2Icon /> },
      ]
    });
  }

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