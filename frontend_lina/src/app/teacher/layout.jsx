import RouterGuard from "@/components/auth/RouterGuard";
import AppHeader from "@/components/sidebar/app-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  Building2Icon,
  WarehouseIcon,
  PercentIcon,
  CreditCardIcon,
  TruckIcon,
  BookOpenIcon,
  SettingsIcon,
  ShieldIcon,
  UserCogIcon,
  BarChart4Icon,
  StoreIcon,
  TagsIcon,
  LayersIcon,
  ReceiptIcon,
  DollarSignIcon,
  BellIcon,
  GlobeIcon,
  FileBarChartIcon,
  PlusIcon,
  RulerIcon,
  ScaleIcon,
} from "lucide-react";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const data = {
  logo: {
    title: "Teacher Dashboard",
    description: "KiU Management System",
    url: "/teacher/dashboard",
  },

  sidebar_section: [
    {
      section_title: "Courses",
      section_items: [
        {
          title: "Course Setup",
          icon: <LayersIcon />,
          isActive: false,
          items: [
            {
              title: "My Departments",
              url: "/Teacher/Courses/Departments",
              icon: <LayersIcon />,
            },
            {
              title: "Course Levels",
              url: "/Teacher/Courses/Levels",
              icon: <TagsIcon />,
            },
            {
              title: "Credit Hours",
              url: "/Teacher/Courses/Credits",
              icon: <ScaleIcon />,
            },
          ]
        },
        {
          title: "My Courses",
          icon: <PackageIcon />,
          isActive: false,
          items: [
            {
              title: "All Courses",
              url: "/Teacher/Courses",
              icon: <PackageIcon />,
            },
            {
              title: "Create Course",
              url: "/Teacher/Courses/new",
              icon: <PlusIcon />,
            },
          ]
        },
      ],
    },
    {
      section_title: "Class Management",
      section_items: [
        {
          title: "My Classes",
          url: "/Teacher/Classes",
          icon: <ShoppingCartIcon />,
        },
        {
          title: "Student Requests",
          url: "/Teacher/Classes/Requests",
          icon: <ReceiptIcon />,
        },
        {
          title: "Class Schedules",
          url: "/Teacher/Classes/Schedules",
          icon: <FileBarChartIcon />,
        },
      ],
    },
    {
      section_title: "Academic Resources",
      section_items: [
        {
          title: "My Faculty",
          url: "/Teacher/Resources/Faculty",
          icon: <WarehouseIcon />,
        },
        {
          title: "Resource Library",
          url: "/Teacher/Resources/Library",
          icon: <Building2Icon />,
        },
        {
          title: "Teaching Materials",
          url: "/Teacher/Resources/Materials",
          icon: <PackageIcon />,
        },
        {
          title: "Classroom Resources",
          url: "/Teacher/Resources/Classrooms",
          icon: <BarChart4Icon />,
        },
      ],
    },
    {
      section_title: "Students",
      section_items: [
        {
          title: "All Students",
          url: "/Teacher/Students",
          icon: <UsersIcon />,
        },
        {
          title: "Student Groups",
          url: "/Teacher/Students/Groups",
          icon: <UserCogIcon />,
        },
      ],
    },
    {
      section_title: "Grading & Assessment",
      section_items: [
        {
          title: "Assignments",
          url: "/Teacher/Grading/Assignments",
          icon: <DollarSignIcon />,
        },
        {
          title: "Grade Book",
          url: "/Teacher/Grading/GradeBook",
          icon: <ReceiptIcon />,
        },
        {
          title: "Grade Scales",
          url: "/Teacher/Grading/Scales",
          icon: <PercentIcon />,
        },
        {
          title: "Rubrics",
          url: "/Teacher/Grading/Rubrics",
          icon: <BookOpenIcon />,
        },
      ],
    },
    {
      section_title: "Attendance",
      section_items: [
        {
          title: "Attendance Records",
          url: "/Teacher/Attendance/Records",
          icon: <CreditCardIcon />,
        },
        {
          title: "Attendance Reports",
          url: "/Teacher/Attendance/Reports",
          icon: <SettingsIcon />,
        },
        {
          title: "Attendance Settings",
          url: "/Teacher/Attendance/Settings",
          icon: <DollarSignIcon />,
        },
      ],
    },
    {
      section_title: "Course Materials",
      section_items: [
        {
          title: "Upload Materials",
          url: "/Teacher/Materials/Upload",
          icon: <TruckIcon />,
        },
        {
          title: "Distribution",
          url: "/Teacher/Materials/Distribution",
          icon: <GlobeIcon />,
        },
        {
          title: "Material Support",
          url: "/Teacher/Materials/Support",
          icon: <TruckIcon />,
        },
      ],
    },
    {
      section_title: "Communications",
      section_items: [
        {
          title: "Send Announcements",
          url: "/Teacher/Communications/Announcements",
          icon: <PercentIcon />,
        },
        {
          title: "Class Notices",
          url: "/Teacher/Communications/Notices",
          icon: <TagsIcon />,
        },
        {
          title: "Important Updates",
          url: "/Teacher/Communications/Updates",
          icon: <DollarSignIcon />,
        },
        {
          title: "Messages",
          url: "/Teacher/Communications/Messages",
          icon: <BellIcon />,
        },
      ],
    },
    {
      section_title: "Administration",
      section_items: [
        {
          title: "Employees",
          url: "/Admin/Employees",
          icon: <UsersIcon />,
        },
        {
          title: "Groups & Permissions",
          url: "/Admin/Access/Groups",
          icon: <ShieldIcon />,
        },
        {
          title: "User Access",
          url: "/Admin/Access/Users",
          icon: <UserCogIcon />,
        },
        {
          title: "Django Admin",
          url: `${process.env.NEXT_PUBLIC_API_URL}/admin`,
          icon: <SettingsIcon />,
        },
      ],
    },
  ],
};




export default function TeacherLayout({ children }) {
  return (
    <RouterGuard role="Teacher">
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            logo={data.logo}
            sidebar_section={data.sidebar_section}
          />

          <SidebarInset>
            <AppHeader />
            <main className="p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </RouterGuard>
  );
}
