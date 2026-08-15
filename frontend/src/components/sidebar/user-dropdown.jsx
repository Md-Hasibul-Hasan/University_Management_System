"use client";

import {
    ChevronDown,
    LogOut,
    Settings,
    User,
    MoreVertical,
    LockKeyhole,
    Mail,
    Plus,
    Layers,
    Users
} from "lucide-react";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

import { clearUser } from "@/redux/features/auth/authSlice";

import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";

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
    const router = useRouter();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const [dialog, setDialog] = useState(null);

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        // Remove tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Clear Redux user
        dispatch(clearUser());

        // Go to login
        router.replace("/login");
    };

    const getInitials = (name) => {
        if (!name) return "U";

        return name
            .split(" ")
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const getProfilePath = () => {
        if (user.is_admin) {
            return "/teacher/profile";
        }

        if (user.role === "Teacher") {
            return "/teacher/profile";
        }

        return "/student/profile";
    };

    const isAdmin = user?.role === "Teacher" && user?.is_admin === true;
    const isChairman = user?.role === "Teacher" && user?.teacher?.is_head === true;

    return (
        <>
            <DropdownMenu>

                <DropdownMenuTrigger asChild>
                    <button className="outline-none flex items-center gap-2 pr-2">
                        <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
                            <AvatarImage src={user.image ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${user.image}` : "/pp.jpg"} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
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
                            {user.name}
                        </p>

                        <p className="text-muted-foreground text-xs">
                            {user.email}
                        </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => router.push(getProfilePath())}
                    >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>

                    {/* Change Password */}
                    <DropdownMenuItem
                        onClick={() => setDialog("password")}
                    >
                        <LockKeyhole className="mr-2 h-4 w-4" />
                        Change Password
                    </DropdownMenuItem>

                    {/* Change Email */}
                    <DropdownMenuItem
                        onClick={() => setDialog("email")}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Change Email
                    </DropdownMenuItem>

                    {/* {(isAdmin || isChairman) && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Plus className="mr-2 h-4 w-4" />
                                Management
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {(isAdmin || isChairman) && (
                                        <>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/new-teacher')}>
                                                Invite New Teacher
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/new-student')}>
                                                Approve New Student
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/faculty')}>
                                                Faculties
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/department')}>
                                                Departments
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/session')}>
                                                Sessions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/year-semester')}>
                                                Year & Semester
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/teachers')}>
                                                All Teachers
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push('/teacher/students')}>
                                                All Students
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin`, '_blank')}>
                                                Django Admin
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    )} */}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-500"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>

                </DropdownMenuContent>

            </DropdownMenu>

            <ChangePasswordModal
                isOpen={dialog === "password"}
                onClose={() => setDialog(null)}
                onSuccess={handleLogout}
            />

            <ChangeEmailModal
                isOpen={dialog === "email"}
                onClose={() => setDialog(null)}
                onSuccess={handleLogout}
            />
        </>
    );
}