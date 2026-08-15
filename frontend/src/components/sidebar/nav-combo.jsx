// "use client"

// import { usePathname } from "next/navigation"; // <-- এটি ইমপোর্ট করুন
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible"
// import {
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from "@/components/ui/sidebar"
// import { ChevronRightIcon } from "lucide-react"

// export function NavCombo({
//   data
// }) {
//   const pathname = usePathname(); // <-- বর্তমান রাউট ট্র্যাক করার জন্য

//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel>Combo</SidebarGroupLabel>
      
//       <SidebarMenu>
//         {data.map((item) => {
//           // চেক করুন বর্তমান URL এই প্যারেন্টের কোনো চাইল্ড URL এর সাথে ম্যাচ করছে কি না
//           const isChildActive = item.items?.some((subItem) => subItem.url === pathname);
          
//           // যদি ডেটাতে isActive true থাকে অথবা কোনো চাইল্ড লিংক অ্যাকটিভ থাকে, তবে ফোল্ডারটি ওপেন থাকবে
//           const shouldBeOpen = item.isActive || isChildActive;

//           return item.items?.length ? (
//             <Collapsible
//               key={item.title}
//               asChild
//               defaultOpen={shouldBeOpen} // <-- এখানে shouldBeOpen বসিয়ে দিন
//               className="group/collapsible"
//             >
//               <SidebarMenuItem>
//                 <CollapsibleTrigger asChild>
//                   <SidebarMenuButton tooltip={item.title}>
//                     {item.icon}
//                     <span>{item.title}</span>

//                     <ChevronRightIcon
//                       className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
//                     />
//                   </SidebarMenuButton>
//                 </CollapsibleTrigger>

//                 <CollapsibleContent>
//                   <SidebarMenuSub>
//                     {item.items.map((subItem) => (
//                       <SidebarMenuSubItem key={subItem.title}>
//                         <SidebarMenuSubButton asChild isActive={subItem.url === pathname}>
//                           <a href={subItem.url}>
//                             <span>{subItem.title}</span>
//                           </a>
//                         </SidebarMenuSubButton>
//                       </SidebarMenuSubItem>
//                     ))}
//                   </SidebarMenuSub>
//                 </CollapsibleContent>
//               </SidebarMenuItem>
//             </Collapsible>
//           ) : (
//             <SidebarMenuItem key={item.title}>
//               <SidebarMenuButton asChild tooltip={item.title} isActive={item.url === pathname}>
//                 <a href={item.url}>
//                   {item.icon}
//                   <span>{item.title}</span>
//                 </a>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           )
//         })}
//       </SidebarMenu>
//     </SidebarGroup>
//   );
// }



"use client"

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button";

export function NavCombo({ data, title, onAction }) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    const newOpenItems = { ...openItems };
    let hasChanges = false;

    data.forEach((item) => {
      const isChildActive = item.items?.some((subItem) => subItem.url === pathname);
      if (isChildActive || item.isActive) {
        if (!newOpenItems[item.title]) {
          newOpenItems[item.title] = true;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setOpenItems(newOpenItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, data]);

  const handleOpenChange = (title, isOpen) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: isOpen,
    }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      
      <SidebarMenu>
        {data.map((item) => {
          const isOpen = openItems[item.title] || false;

          return item.items?.length ? (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild onClick={(e) => {
                  if (state === "collapsed") {
                    e.preventDefault();
                    toggleSidebar();
                  }
                }}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={subItem.url === pathname}>
                          <Link href={subItem.url} className="flex gap-3 px-3" >
                            {/* {subItem.icon} */}
                            <Button variant="link" size="sm" className="px-0">{subItem.icon}</Button>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : item.action ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={false}
                className="cursor-pointer"
                onClick={() => onAction?.(item.action)}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.url === pathname}>
                {/* এখানেও <a> ট্যাগের বদলে <Link> */}
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}