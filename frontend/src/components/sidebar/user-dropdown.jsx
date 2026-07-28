"use client";

import {
    ChevronDown,
    LogOut,
    Settings,
    User,
    MoreVertical


} from "lucide-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    
} from "@/components/ui/dropdown-menu";

export default function UserDropdown() {
    return (
        <DropdownMenu>

            <DropdownMenuTrigger asChild>
                <button className="outline-none flex items-center gap-2 pr-2">
                    <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
                        <AvatarImage src="/pp.jpg" />
                        <AvatarFallback>MH</AvatarFallback>
                    </Avatar>
                    {/* <MoreVertical className="h-4 w-4 cursor-pointer" /> */}
                    {/* <ChevronDown className="h-4 w-4 cursor-pointer " /> */}

                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                alignOffset={10}
                className="w-56"
            >
                <div className="px-2 py-2">
                    <p className="font-medium">
                        Md. Hasibul Hasan
                    </p>

                    <p className="text-muted-foreground text-xs">
                        hasibsorker02@gmail.com
                    </p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                </DropdownMenuItem>

                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Email</DropdownMenuItem>
                            <DropdownMenuItem>Message</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>More...</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>

            </DropdownMenuContent>

        </DropdownMenu>
    );
}