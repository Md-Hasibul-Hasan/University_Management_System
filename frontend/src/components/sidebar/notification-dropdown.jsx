"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  CheckCheck,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

const initialNotifications = [
  {
    id: 1,
    title: "New Student Application",
    description: "Rahim Khan applied for admission — pending approval.",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    title: "Attendance Pending",
    description: "Attendance for CSE-201 hasn't been marked yet.",
    time: "10m ago",
    read: false,
  },
  {
    id: 3,
    title: "Course Enrollment",
    description: "New student enrolled in Mathematics 101.",
    time: "1h ago",
    read: false,
  },
  {
    id: 4,
    title: "Marks Published",
    description: "Quiz 2 marks are now available for review.",
    time: "3h ago",
    read: true,
  },
  {
    id: 5,
    title: "Assignment Submitted",
    description: "Karim submitted the Data Structures assignment.",
    time: "5h ago",
    read: true,
  },
];

export default function NotificationDropdown() {
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(null);

  const [notifications, setNotifications] =
    useState(initialNotifications);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  const filteredNotifications =
    tab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );

    setMenuOpen(null);
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((item) => item.id !== id)
    );

    setMenuOpen(null);
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        alignOffset={-40}
        className="w-80"
      >
        {/* Header */}

        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Notifications
            </h3>

            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600"
            >
              Mark all as read
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setTab("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${tab === "all"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "bg-muted"
                }`}
            >
              All
            </button>

            <button
              onClick={() => setTab("unread")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${tab === "unread"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  : "bg-muted"
                }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications */}

        <div className="max-h-[420px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications found
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`
                  cursor-pointer border-b p-4
                  hover:bg-muted/50
                  ${!item.read
                    ? "bg-blue-50/50 dark:bg-blue-500/10"
                    : ""
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      mt-1 h-2.5 w-2.5 rounded-full
                      ${item.read
                        ? "bg-transparent"
                        : "bg-blue-600"
                      }
                    `}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.time}
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setMenuOpen(
                          menuOpen === item.id
                            ? null
                            : item.id
                        );
                      }}
                      className="rounded p-1 hover:bg-muted"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {menuOpen === item.id && (
                      <div
                        className="
                          absolute right-0 top-7 z-50
                          w-44 overflow-hidden rounded-lg
                          border bg-background shadow-lg
                        "
                      >
                        {!item.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item.id);
                            }}
                            className="
                              flex w-full items-center gap-2
                              px-3 py-2 text-sm hover:bg-muted
                            "
                          >
                            <CheckCheck size={14} />
                            Mark as read
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="
                            flex w-full items-center gap-2
                            px-3 py-2 text-sm text-red-500
                            hover:bg-muted
                          "
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}

        <div className="border-t p-3">
          <Link
            href="/notifications"
            className="
              block rounded-lg py-2 text-center
              text-sm font-medium text-blue-600
            "
          >
            View All Notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}