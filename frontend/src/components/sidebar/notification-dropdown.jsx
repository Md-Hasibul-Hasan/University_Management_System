"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/redux/features/extra/notificationApi";

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const timeAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export default function NotificationDropdown() {
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(null);
  const router = useRouter();

  const PAGE_SIZE = 50;
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState([]);

  const { data, isLoading } = useGetNotificationsQuery({ limit: PAGE_SIZE, offset });
  const pageRows = useMemo(() => normalizeList(data), [data]);
  const totalCount = data?.data?.count ?? data?.count ?? 0;
  const hasMore = pageRows.length > 0 && offset + pageRows.length < totalCount;

  // Append each fetched page into the accumulated list (deduplicated by id).
  useEffect(() => {
    if (!pageRows.length) return;
    setItems((prev) => {
      const map = new Map(prev.map((n) => [n.id, n]));
      pageRows.forEach((n) => map.set(n.id, n));
      return [...map.values()];
    });
  }, [pageRows]);

  const notifications = items.map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    link: item.link || "",
    type: item.notification_type,
    read: !!item.is_read,
    time: timeAgo(item.created_at),
  }));

  // Advance by the number of records the API actually returned, so we never
  // skip a gap even if the backend caps (clamps) the requested page size.
  const loadMore = () => {
    const step = pageRows.length || PAGE_SIZE;
    setOffset((o) => o + step);
  };

  // Infinite scroll: fetch the next page when the list is scrolled to its bottom.
  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && hasMore && !isLoading) {
      loadMore();
    }
  };

  const [markNotification] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [removeNotification] = useDeleteNotificationMutation();

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  const filteredNotifications =
    tab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = async (id) => {
    try {
      await markNotification(id).unwrap();
    } catch {
      /* ignore network errors in the dropdown */
    }
    setMenuOpen(null);
  };

  const deleteNotification = async (id) => {
    try {
      await removeNotification(id).unwrap();
    } catch {
      /* ignore network errors in the dropdown */
    }
    setMenuOpen(null);
  };

  const markAllAsRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      /* ignore network errors in the dropdown */
    }
  };

  // Clicking a notification marks it read (if needed) and routes to its link.
  const openNotification = async (item) => {
    if (!item.read) {
      try {
        await markNotification(item.id).unwrap();
      } catch {
        /* ignore network errors */
      }
    }
    if (item.link) {
      router.push(item.link);
    }
    setMenuOpen(null);
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
          {!isLoading && unreadCount > 0 && (
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
              disabled={unreadCount === 0}
              className="text-sm text-blue-600 disabled:opacity-50"
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

        <div
          className="max-h-[420px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications found
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => openNotification(item)}
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
                      {(item.message || "").length > 120
                        ? `${(item.message || "").slice(0, 120)}...`
                        : item.message}
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
{hasMore && filteredNotifications.length > 0 && (
              <div className="px-4 py-3 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="text-sm font-medium text-blue-600 disabled:opacity-50"
                >
                  {isLoading ? "Loading more..." : "Load more"}
                </button>
              </div>
            )}
        </div>

        {/* Footer */}

        {/* <div className="border-t p-3">
          <Link
            href="/notifications"
            className="
              block rounded-lg py-2 text-center
              text-sm font-medium text-blue-600
            "
          >
            View All Notifications
          </Link>
        </div> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}