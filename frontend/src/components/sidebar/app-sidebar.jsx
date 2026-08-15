"use client"

import * as React from "react"

import { NavUser } from "@/components/sidebar/nav-user"
import { NavCombo } from "@/components/sidebar/nav-combo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Logo } from "./logo"
import { DashboardSwitcher } from "./dashboard-switcher"


export function AppSidebar({
  logo,
  teams,
  sidebar_section,
  combo,
  user,
  onAction,
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>

      <SidebarHeader>
        <Logo data={logo} />
        {/* <DashboardSwitcher teams={teams} /> */}
      </SidebarHeader>

      <SidebarContent>
        {sidebar_section.map((item) => (
          <NavCombo key={item.section_title} data={item.section_items} title={item.section_title} onAction={onAction} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="py-3"></div>
        {/* <NavUser user={user} /> */}
      </SidebarFooter>

      <SidebarRail />

    </Sidebar>
  );
}
