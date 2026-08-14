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
    title: "Admin Panel",
    description: "KiU Management System",
    url: "/admin/dashboard",
  },

  sidebar_section: [
    {
      section_title: "My Dashboard",
      section_items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: <LayoutDashboardIcon />,
        },
      ],
    },
    {
      section_title: "Academics",
      section_items: [

        {
          title: "Academic Setup",
          icon: <LayersIcon />,
          isActive: false,
          items: [
            {
              title: "Faculties",
              url: "/admin/faculty",
              icon: <LayersIcon />,
            },
            {
              title: "Departments",
              url: "/admin/department",
              icon: <TagsIcon />,
            },
            {
              title: "Sessions",
              url: "/admin/session",
              icon: <ScaleIcon />,
            },
            {
              title: "Year & Semester",
              url: "/admin/year-semester",
              icon: <RulerIcon />,
            },
          ]
        },
        {
          title: "Course Management",
          icon: <PackageIcon />,
          isActive: false,
          items: [
            {
              title: "Courses",
              url: "/admin/course",
              icon: <PackageIcon />,
            },
            {
              title: "Assign Course Teacher",
              url: "/admin/course-teachers",
              icon: <UsersIcon />,
            },
            {
              title: "Course Assessments",
              url: "/admin/course-assessments",
              icon: <BarChart4Icon />,
            },
            {
              title: "Session Courses",
              url: "/admin/session-courses",
              icon: <LayersIcon />,
            },
            {
              title: "Student Courses",
              url: "/admin/student-courses",
              icon: <ShoppingCartIcon />,
            },
          ]
        },
      ],
    },

    {
      section_title: "Registration",
      section_items: [
        {
          title: "Invite New Teacher",
          url: "/admin/new-teacher",
          icon: <PlusIcon />,
        },
        {
          title: "Approve New Student",
          url: "/admin/new-student",
          icon: <PlusIcon />,
        },
      ],
    },

    {
      section_title: "Teachers & Students",
      section_items: [
        {
          title: "All Teachers",
          url: "/admin/teachers",
          icon: <UsersIcon />,
        },
        {
          title: "All Students",
          url: "/admin/students",
          icon: <UsersIcon />,
        },
      ],
    },
    {
      section_title: "Assigned Courses",
      section_items: [
        {
          title: "My Courses",
          url: "/admin/my-courses",
          icon: <DollarSignIcon />,
        },
      ],
    },
    {
      section_title: "Fee Management",
      section_items: [
        {
          title: "Payment Transactions",
          url: "/Admin/Fees/Transactions",
          icon: <CreditCardIcon />,
        },
        {
          title: "Payment Gateways",
          url: "/Admin/Fees/Gateways",
          icon: <SettingsIcon />,
        },
        {
          title: "Scholarships",
          url: "/Admin/Fees/Scholarships",
          icon: <DollarSignIcon />,
        },
      ],
    },
    {
      section_title: "Course Materials",
      section_items: [
        {
          title: "Material Distribution",
          url: "/Admin/Materials/Distribution",
          icon: <TruckIcon />,
        },
        {
          title: "Distribution Methods",
          url: "/Admin/Materials/Methods",
          icon: <GlobeIcon />,
        },
        {
          title: "Delivery Partners",
          url: "/Admin/Materials/Partners",
          icon: <TruckIcon />,
        },
      ],
    },
    {
      section_title: "Announcements",
      section_items: [
        {
          title: "Announcements",
          url: "/Admin/Announcements/List",
          icon: <PercentIcon />,
        },
        {
          title: "Notices",
          url: "/Admin/Announcements/Notices",
          icon: <TagsIcon />,
        },
        {
          title: "Scholarships",
          url: "/Admin/Announcements/Scholarships",
          icon: <DollarSignIcon />,
        },
        {
          title: "Messages",
          url: "/Admin/Announcements/Messages",
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




export default function AdminLayout({ children }) {
  return (
    <RouterGuard roles={["admin"]}>
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