"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateReminderMutation,
  useDeleteReminderMutation,
  useGetRemindersQuery,
  useUpdateReminderMutation,
} from "@/redux/features/extra/reminderApi";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const keyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const prettyDate = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

// Backend reminder -> shape used by this component.
const mapReminder = (r) => ({
  id: r.id,
  date: r.date,
  time: r.time ? String(r.time).slice(0, 5) : "",
  title: r.title,
  done: Boolean(r.is_done),
  notified: Boolean(r.notified),
});

const fieldClasses =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/**
 * Month calendar with per-day reminders.
 * Reminders are persisted on the backend, scoped to the logged-in user.
 */
export default function DashboardCalendar() {
  const { user } = useSelector((state) => state.auth);

  const today = useMemo(() => new Date(), []);
  const todayKey = keyOf(today);

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [fired, setFired] = useState([]);

  const { data: reminderData, isLoading, isError } = useGetRemindersQuery(
    {},
    { skip: !user?.id }
  );
  const [createReminder, { isLoading: creating }] = useCreateReminderMutation();
  const [updateReminder] = useUpdateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  // Group backend reminders by date key: { "YYYY-MM-DD": [reminder, ...] }
  const reminders = useMemo(() => {
    const map = {};
    for (const item of normalizeList(reminderData)) {
      const r = mapReminder(item);
      (map[r.date] = map[r.date] || []).push(r);
    }
    return map;
  }, [reminderData]);

  // Fire due reminders (once each) while the page is open.
  const firedIdsRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const check = () => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const dayKey = keyOf(now);
      const due = (reminders[dayKey] || []).filter(
        (r) =>
          r.time &&
          !r.done &&
          !r.notified &&
          !firedIdsRef.current.has(r.id) &&
          toMinutes(r.time) !== null &&
          toMinutes(r.time) <= nowMin
      );
      if (!due.length) return;

      due.forEach((r) => firedIdsRef.current.add(r.id));
      setFired((prev) => [...prev, ...due]);
      due.forEach((r) => {
        updateReminder({ id: r.id, notified: true });
      });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        due.forEach((r) => {
          try {
            new Notification("Reminder", { body: r.title });
          } catch {
            // ignore — in-app banner still shows
          }
        });
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [reminders, updateReminder, user?.id]);

  // 6-week grid for the visible month.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const moveMonth = (delta) => {
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const goToday = () => {
    setView({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedKey(todayKey);
  };

  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedKey]);

  const dayReminders = useMemo(() => {
    const list = [...(reminders[selectedKey] || [])];
    return list.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [reminders, selectedKey]);

  const addReminder = useCallback(async () => {
    const title = draftTitle.trim();
    if (!title) return;
    try {
      await createReminder({
        date: selectedKey,
        time: draftTime || null,
        title,
      }).unwrap();
      setDraftTitle("");
      setDraftTime("");
      if (draftTime && typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch {
      // keep the draft so the user can retry
    }
  }, [createReminder, draftTime, draftTitle, selectedKey]);

  const toggleReminder = useCallback(
    async (id) => {
      const item = dayReminders.find((r) => r.id === id);
      if (!item) return;
      try {
        await updateReminder({ id, is_done: !item.done }).unwrap();
      } catch {
        // list refetches on next mount / arg change
      }
    },
    [dayReminders, updateReminder]
  );

  const deleteReminderById = useCallback(
    async (id) => {
      try {
        await deleteReminder(id).unwrap();
      } catch {
        // list refetches on next mount / arg change
      }
    },
    [deleteReminder]
  );

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="min-w-0 border-border/70 bg-card/90 shadow-sm lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-hero-1 dark:text-hero-3" />
          Calendar &amp; Reminders
        </CardTitle>
        <CardDescription>Pick a day and set a reminder for it</CardDescription>
      </CardHeader>

      <CardContent className="min-w-0 space-y-3">
        {/* Due-reminder banner */}
        {fired.length > 0 && (
          <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
            {fired.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <BellRingIcon />
                <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                <span className="text-[0.65rem] uppercase tracking-wide">now</span>
                <button
                  type="button"
                  onClick={() => setFired((prev) => prev.filter((f) => f.id !== r.id))}
                  className="rounded p-0.5 hover:bg-amber-500/20"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Dismiss</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Month navigation */}
        <div className="flex min-w-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => moveMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <span className="min-w-0 flex-1 text-center text-sm font-semibold text-foreground">
            {monthLabel}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => moveMonth(1)}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
          <Button variant="ghost" size="xs" className="ml-1" onClick={goToday}>
            Today
          </Button>
        </div>

        {/* Day grid */}
        <div
          className="grid min-w-0 grid-cols-7 gap-0.5 text-center"
          style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {DAY_NAMES.map((name) => (
            <span key={name} className="py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {name}
            </span>
          ))}
          {cells.map((d) => {
            const k = keyOf(d);
            const inMonth = d.getMonth() === view.month;
            const isSelected = k === selectedKey;
            const isToday = k === todayKey;
            const hasReminders = (reminders[k] || []).length > 0;
            const allDone = hasReminders && reminders[k].every((r) => r.done);

            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedKey(k)}
                className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-sm transition ${
                  isSelected
                    ? "bg-hero-1 font-semibold text-white"
                    : "hover:bg-muted"
                } ${inMonth ? "" : "text-muted-foreground/40"} ${
                  !isSelected && isToday ? "font-bold text-hero-1 dark:text-hero-3" : ""
                }`}
              >
                {d.getDate()}
                {hasReminders && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      isSelected ? "bg-white" : allDone ? "bg-muted-foreground/50" : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day */}
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-foreground">{prettyDate(selectedDate)}</p>

          {/* Add reminder */}
          <div className="mt-2 flex items-center gap-1.5">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addReminder()}
              placeholder="Reminder title..."
              maxLength={120}
              disabled={creating}
              className={`${fieldClasses} min-w-0 flex-1`}
            />
              <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
                className={`${fieldClasses} w-25 shrink-0 px-1.5 sm:w-27.5 sm:px-2.5`}
              aria-label="Reminder time"
            />
            <Button size="icon-sm" onClick={addReminder} disabled={!draftTitle.trim() || creating}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add reminder</span>
            </Button>
          </div>

          {/* Reminder list */}
          {isError ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 py-2 text-xs text-destructive">
              <Bell className="h-3.5 w-3.5" />
              Could not load reminders.
            </p>
          ) : isLoading ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5 animate-pulse" />
              Loading reminders...
            </p>
          ) : dayReminders.length === 0 ? (
            <p className="mt-3 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              No reminders for this day.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {dayReminders.map((r) => (
                <li
                  key={r.id}
                  className="group flex items-center gap-2 rounded-lg bg-background px-2 py-1.5 text-sm ring-1 ring-border/60"
                >
                  <input
                    type="checkbox"
                    checked={r.done}
                    onChange={() => toggleReminder(r.id)}
                    className="h-3.5 w-3.5 shrink-0 accent-hero-1"
                    aria-label={`Mark "${r.title}" as ${r.done ? "not done" : "done"}`}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      r.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                    title={r.title}
                  >
                    {r.title}
                  </span>
                  {r.time && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {r.time}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteReminderById(r.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete reminder</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BellRingIcon() {
  return <Bell className="h-3.5 w-3.5 shrink-0" />;
}
