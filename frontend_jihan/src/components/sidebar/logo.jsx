import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function Logo({ data }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
        >
          <Link href={data.url}>

            <div className="flex p-0.5 aspect-square size-8 items-center justify-center rounded-lg bg-primary-foreground">
              <Image
                src="/logo4.png"
                alt="University Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {data.title}
              </span>

              <span className="truncate text-xs text-muted-foreground">
                {data.description}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}