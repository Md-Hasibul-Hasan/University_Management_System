

"use client";

import { Bell, User, HomeIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link"; 

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./ModeToggle";
import UserDropdown from "./user-dropdown";
import NotificationDropdown from "./notification-dropdown";
import { NavUser } from "@/components/sidebar/nav-user";



export default function AppHeader() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <header
      className="flex sticky top-0 z-20 h-16 shrink-0 items-center justify-between border-b bg-background px-1 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      {/* Left Side */}
      <div className="flex items-center gap-2 ">
        <SidebarTrigger />

        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto hidden md:block"
        />

        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <div className="flex items-center">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </div>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((segment, index) => {
              const href =
                "/" + segments.slice(0, index + 1).join("/");

              const isLast =
                index === segments.length - 1;

              const label =
                segment.charAt(0).toUpperCase() +
                segment.slice(1);

              return (
                <div
                  key={href}
                  className="flex items-center"
                >
                  <BreadcrumbSeparator />

                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-2">
        <ModeToggle />
        <NotificationDropdown />
        <UserDropdown />
        {/* <NavUser user={} /> */}
        
      </div>
    </header>
  );
}
