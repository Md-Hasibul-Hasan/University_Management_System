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
      section_title: "Courses",
      section_items: [
        {
          title: "Course Setup",
          icon: <LayersIcon />,
          isActive: false,
          items: [
            {
              title: "Departments",
              url: "/Admin/Courses/Departments",
              icon: <LayersIcon />,
            },
            {
              title: "Course Levels",
              url: "/Admin/Courses/Levels",
              icon: <TagsIcon />,
            },
            {
              title: "Credit Hours",
              url: "/Admin/Courses/Credits",
              icon: <ScaleIcon />,
            },
          ]
        },
        {
          title: "Course Management",
          icon: <PackageIcon />,
          isActive: false,
          items: [
            {
              title: "All Courses",
              url: "/Admin/Courses",
              icon: <PackageIcon />,
            },
            {
              title: "Add Course",
              url: "/Admin/Courses/new",
              icon: <PlusIcon />,
            },
          ]
        },
      ],
    },
    {
      section_title: "Academic Resources",
      section_items: [
        {
          title: "Faculties",
          url: "/admin/faculty",
          icon: <WarehouseIcon />,
        },
        {
          title: "Departments",
          url: "/admin/department",
          icon: <Building2Icon />,
        },
        {
          title: "Sessions",
          url: "/admin/session",
          icon: <PackageIcon />,
        },
        {
          title: "Year & Semester",
          url: "/admin/year-semester",
          icon: <BarChart4Icon />,
        },
      ],
    },

    {
      section_title: "Teachers",
      section_items: [
        {
          title: "Invite New Teacher",
          url: "/admin/new-teacher",
          icon: <PlusIcon />,
        },
        {
          title: "Deferred Enrollments",
          url: "/Admin/Enrollments/Deferred",
          icon: <ReceiptIcon />,
        },
        {
          title: "Course Switches",
          url: "/Admin/Enrollments/Switches",
          icon: <FileBarChartIcon />,
        },
      ],
    },

    {
      section_title: "Students",
      section_items: [
        {
          title: "All Students",
          url: "/Admin/Students",
          icon: <UsersIcon />,
        },
        {
          title: "Student Groups",
          url: "/Admin/Students/Groups",
          icon: <UserCogIcon />,
        },
      ],
    },
    {
      section_title: "Fees & Finance",
      section_items: [
        {
          title: "Fee Transactions",
          url: "/Admin/Finance/Transactions",
          icon: <DollarSignIcon />,
        },
        {
          title: "Expenses",
          url: "/Admin/Finance/Expenses",
          icon: <ReceiptIcon />,
        },
        {
          title: "Tuition Rates",
          url: "/Admin/Finance/Rates",
          icon: <PercentIcon />,
        },
        {
          title: "Expense Categories",
          url: "/Admin/Finance/Categories",
          icon: <BookOpenIcon />,
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
    <RouterGuard adminOnly>
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