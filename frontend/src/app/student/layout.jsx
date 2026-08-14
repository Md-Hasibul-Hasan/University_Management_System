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
    title: "Student Dashboard",
    description: "KiU Management System",
    url: "/student/dashboard",
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
              url: "/Student/Courses/Departments",
              icon: <LayersIcon />,
            },
            {
              title: "Course Levels",
              url: "/Student/Courses/Levels",
              icon: <TagsIcon />,
            },
            {
              title: "Credit Hours",
              url: "/Student/Courses/Credits",
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
              url: "/Student/Courses",
              icon: <PackageIcon />,
            },
            {
              title: "Add Course",
              url: "/Student/Courses/new",
              icon: <PlusIcon />,
            },
          ]
        },
      ],
    },
    {
      section_title: "Enrollments",
      section_items: [
        {
          title: "My Enrollments",
          url: "/Student/Enrollments",
          icon: <ShoppingCartIcon />,
        },
        {
          title: "Deferred Enrollments",
          url: "/Student/Enrollments/Deferred",
          icon: <ReceiptIcon />,
        },
        {
          title: "Course Switches",
          url: "/Student/Enrollments/Switches",
          icon: <FileBarChartIcon />,
        },
      ],
    },
    {
      section_title: "Academic Resources",
      section_items: [
        {
          title: "Faculties",
          url: "/Student/Resources/Faculties",
          icon: <WarehouseIcon />,
        },
        {
          title: "Library",
          url: "/Student/Resources/Library",
          icon: <Building2Icon />,
        },
        {
          title: "Study Materials",
          url: "/Student/Resources/Materials",
          icon: <PackageIcon />,
        },
        {
          title: "Facilities",
          url: "/Student/Resources/Facilities",
          icon: <BarChart4Icon />,
        },
      ],
    },
    {
      section_title: "Classmates",
      section_items: [
        {
          title: "All Classmates",
          url: "/Student/Classmates",
          icon: <UsersIcon />,
        },
        {
          title: "Study Groups",
          url: "/Student/Classmates/Groups",
          icon: <UserCogIcon />,
        },
      ],
    },
    {
      section_title: "Fees & Finance",
      section_items: [
        {
          title: "Fee Payments",
          url: "/Student/Finance/Payments",
          icon: <DollarSignIcon />,
        },
        {
          title: "Fee Receipts",
          url: "/Student/Finance/Receipts",
          icon: <ReceiptIcon />,
        },
        {
          title: "Fee Schedule",
          url: "/Student/Finance/Schedule",
          icon: <PercentIcon />,
        },
        {
          title: "Scholarships",
          url: "/Student/Finance/Scholarships",
          icon: <BookOpenIcon />,
        },
      ],
    },
    {
      section_title: "Payment Methods",
      section_items: [
        {
          title: "My Payment Methods",
          url: "/Student/Payments/Methods",
          icon: <CreditCardIcon />,
        },
        {
          title: "Payment History",
          url: "/Student/Payments/History",
          icon: <SettingsIcon />,
        },
        {
          title: "Refunds",
          url: "/Student/Payments/Refunds",
          icon: <DollarSignIcon />,
        },
      ],
    },
    {
      section_title: "Course Materials",
      section_items: [
        {
          title: "My Materials",
          url: "/Student/Materials/My",
          icon: <TruckIcon />,
        },
        {
          title: "Download Methods",
          url: "/Student/Materials/Methods",
          icon: <GlobeIcon />,
        },
        {
          title: "Material Support",
          url: "/Student/Materials/Support",
          icon: <TruckIcon />,
        },
      ],
    },
    {
      section_title: "Announcements",
      section_items: [
        {
          title: "Important Notices",
          url: "/Student/Announcements/Notices",
          icon: <PercentIcon />,
        },
        {
          title: "Campus Events",
          url: "/Student/Announcements/Events",
          icon: <TagsIcon />,
        },
        {
          title: "Scholarships",
          url: "/Student/Announcements/Scholarships",
          icon: <DollarSignIcon />,
        },
        {
          title: "Messages",
          url: "/Student/Announcements/Messages",
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




export default function StudentLayout({ children }) {
  return (
    <RouterGuard roles={["student"]}>
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
