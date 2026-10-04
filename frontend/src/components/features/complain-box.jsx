"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Globe,
  ImagePlus,
  Loader2,
  MessageSquareWarning,
  Pencil,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useCreateComplaintMutation,
  useDeleteComplaintMutation,
  useGetComplaintQuery,
  useGetComplaintsQuery,
  useUpdateComplaintMutation,
} from "@/redux/features/extra/complainboxApi";

const PAGE_SIZE = 10;
const MAX_FILES = 10;

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

const toAbsoluteUrl = (url) => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${apiBase}${url}`;
};

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
  return days < 7
    ? `${days}d ago`
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
};

const getErrorMessage = (err) => {
  const data = err?.data || {};
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first[0] || "Something went wrong." : "Something went wrong.";
};

const isImageFile = (file) =>
  (file?.type || file?.name || "").match(/image/i) ||
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file?.name || file || "");

const AUDIENCE_OPTIONS = [
  {
    value: "dept_chairman",
    label: "Department Chairman",
    icon: <Users className="h-3.5 w-3.5" />,
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    ring: "border-l-violet-500",
  },
  {
    value: "dept_teacher",
    label: "Department Teacher",
    icon: <Users className="h-3.5 w-3.5" />,
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ring: "border-l-blue-500",
  },
  {
    value: "dept_all",
    label: "Department All (Student + Teacher)",
    icon: <Users className="h-3.5 w-3.5" />,
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ring: "border-l-amber-500",
  },
  {
    value: "all",
    label: "All (All Dept Teacher + Student)",
    icon: <Globe className="h-3.5 w-3.5" />,
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "border-l-emerald-500",
  },
];

const audienceMeta = (value) =>
  AUDIENCE_OPTIONS.find((o) => o.value === value) || {
    value,
    label: value,
    icon: <Users className="h-3.5 w-3.5" />,
    badge: "bg-muted text-muted-foreground",
    ring: "border-l-border",
  };

const fieldClasses =
  "w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/* ------------------------------------------------------------------ */
/* MEDIA PREVIEW GRID (compose / edit)                                 */
/* ------------------------------------------------------------------ */

function MediaPreviews({ items, onRemove }) {
  if (!items.length) return null;

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <div
          key={item.key}
          className="group relative overflow-hidden rounded-lg border border-border bg-muted"
        >
          {item.isVideo ? (
            <video src={item.url} className="h-20 w-full object-cover" muted />
          ) : (
            <img src={item.url} alt={item.name || "media"} className="h-20 w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white transition hover:bg-black/80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ComplaintAudienceMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const selected = audienceMeta(value);

  useEffect(() => {
    if (!open) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-input bg-transparent px-3 py-2 text-left text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-md p-1 ${selected.badge}`}>{selected.icon}</span>
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {AUDIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className={`shrink-0 rounded-md p-1 ${option.badge}`}>{option.icon}</span>
              <span className="wrap-break-word">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPOSE PANEL (left column — create / edit inline)                  */
/* ------------------------------------------------------------------ */

function ComposePanel({ editing, onCancelEdit }) {
  const { user } = useSelector((state) => state.auth);
  const isEdit = Boolean(editing);

  const [createComplaint, { isLoading: isCreating }] = useCreateComplaintMutation();
  const [updateComplaint, { isLoading: isUpdating }] = useUpdateComplaintMutation();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [complainTo, setComplainTo] = useState("dept_chairman");
  const [newFiles, setNewFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setComplainTo("dept_chairman");
    setNewFiles([]);
    setExisting([]);
    setError("");
  };

  // Load the complaint into the form when editing, reset otherwise.
  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "");
      setMessage(editing.message || "");
      setComplainTo(editing.complain_to || "dept_chairman");
      setNewFiles([]);
      setError("");
      setExisting(
        (editing.media || []).map((m) => ({
          key: `existing-${m.id}`,
          id: m.id,
          url: toAbsoluteUrl(m.file),
          name: "",
          isVideo: !isImageFile(m.file),
          isExisting: true,
        }))
      );
    } else {
      resetForm();
    }
  }, [editing]);

  const previews = useMemo(
    () =>
      newFiles.map((file, i) => ({
        key: `new-${i}-${file.name}`,
        url: URL.createObjectURL(file),
        name: file.name,
        isVideo: !file.type.startsWith("image/"),
        isExisting: false,
      })),
    [newFiles]
  );

  useEffect(() => {
    const urls = previews.map((p) => p.url);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const onPickFiles = (e) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setNewFiles((prev) => [...prev, ...selected].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeAt = (index) => {
    const all = [...existing, ...previews];
    const target = all[index];
    if (!target) return;
    if (target.isExisting) {
      setExisting((prev) => prev.filter((m) => m.key !== target.key));
    } else {
      const newIdx = index - existing.length;
      setNewFiles((prev) => prev.filter((_, i) => i !== newIdx));
    }
  };

  const submit = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) return;

    const formData = new FormData();
    formData.append("title", t);
    formData.append("message", m);
    formData.append("complain_to", complainTo);

    if (isEdit) {
      const originalIds = new Set((editing?.media || []).map((x) => x.id));
      const keptIds = new Set(existing.filter((x) => x.isExisting).map((x) => x.id));
      for (const id of originalIds) {
        if (!keptIds.has(id)) formData.append("remove_media", String(id));
      }
    }

    newFiles.forEach((file) => formData.append("media", file));

    try {
      if (isEdit) {
        await updateComplaint({ id: editing.id, formData }).unwrap();
        onCancelEdit?.();
      } else {
        await createComplaint(formData).unwrap();
      }
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const busy = isCreating || isUpdating;
  const canSubmit = Boolean(title.trim() && message.trim());

  return (
    <Card className="py-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
            <MessageSquareWarning className="h-4 w-4 text-hero-1 dark:text-hero-3" />
            {isEdit ? "Edit Complaint" : "Write a Complaint"}
          </h2>
          {isEdit && (
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={toAbsoluteUrl(user?.image) || undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          Posting as <span className="font-medium text-foreground">{user?.name}</span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Complaint title"
          maxLength={255}
          className={`${fieldClasses} font-medium`}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your complaint in detail..."
          rows={5}
          className={`${fieldClasses} resize-none`}
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Complain to
          </label>
          <ComplaintAudienceMenu value={complainTo} onChange={setComplainTo} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={newFiles.length >= MAX_FILES}
          >
            <ImagePlus className="h-4 w-4" />
            Add media
          </Button>
          <span className="text-xs text-muted-foreground">max {MAX_FILES}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={onPickFiles}
          />
        </div>

        <MediaPreviews items={[...existing, ...previews]} onRemove={removeAt} />

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button className="w-full" onClick={submit} disabled={busy || !canSubmit}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isEdit ? "Save changes" : "Submit complaint"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* MEDIA GRID (card display)                                           */
/* ------------------------------------------------------------------ */

function MediaGrid({ media }) {
  if (!media?.length) return null;

  const shown = media.slice(0, 6);
  const extra = media.length - shown.length;

  // Stretch images to fill the row when there are fewer than 3:
  // 1 -> full width, 2 -> two halves, 3+ -> three columns.
  const colsClass =
    shown.length === 1
      ? "grid-cols-1"
      : shown.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-xl border border-border ${colsClass}`}>
      {shown.map((item, i) => (
        <div key={item.id} className="relative">
          {isImageFile(item.file) ? (
            <img
              src={toAbsoluteUrl(item.file)}
              alt="complaint media"
              className="h-40 w-full object-cover"
            />
          ) : (
            <video
              src={toAbsoluteUrl(item.file)}
              controls
              className="h-40 w-full bg-black object-cover"
            />
          )}
          {i === shown.length - 1 && extra > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-semibold text-white">
              +{extra}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPLAINT ROW (ticket-style card, not a social post)                */
/* ------------------------------------------------------------------ */

function ComplaintRow({ complaint, onEdit }) {
  const [deleteComplaint] = useDeleteComplaintMutation();
  const meta = audienceMeta(complaint.complain_to);

  const handleDelete = async () => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    try {
      await deleteComplaint(complaint.id).unwrap();
    } catch {
      // ignore — list refetch will reflect the real state
    }
  };

  return (
    <Card className={`gap-0 py-0 ${meta.ring} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={`gap-1 border-0 ${meta.badge}`}>
            {meta.icon}
            {complaint.complain_to_display || meta.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            #{String(complaint.id).padStart(4, "0")}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(complaint.created_at)}
          </span>

          {complaint.is_owner && (
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(complaint)}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          )}
        </div>

        <h3 className="mt-2 font-heading text-base font-semibold text-foreground">
          {complaint.title}
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {complaint.message}
        </p>

        <MediaGrid media={complaint.media} />

        <Separator className="my-3" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={toAbsoluteUrl(complaint.user_image) || undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(complaint.user_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">
            {complaint.user_name || complaint.user_email}
          </span>
          {complaint.department_name && (
            <>
              <span>·</span>
              <span>{complaint.department_name}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* SINGLE COMPLAINT VIEW (opened from a notification link)             */
/* ------------------------------------------------------------------ */

function FeaturedComplaintView({ complaintId, onBack }) {
  const { data, isLoading } = useGetComplaintQuery(complaintId);
  const complaint =
    data?.data?.id !== undefined ? data.data : data?.id !== undefined ? data : data?.data?.data;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Complain Box
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : complaint ? (
        <ComplaintRow complaint={complaint} onEdit={() => {}} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Complaint not found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPLAIN BOX (compose panel + ticket list)                          */
/* ------------------------------------------------------------------ */

function ComplainBoxInner() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ?complaint=<id> (from a notification click) opens that single complaint.
  const complaintIdParam = searchParams.get("complaint");

  const closeComplaint = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("complaint");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const [filter, setFilter] = useState("all"); // all | mine
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);

  const queryParams = {
    search,
    ordering: "-created_at",
    limit: PAGE_SIZE,
    offset,
    ...(filter === "mine" && user?.id ? { user: user.id } : {}),
  };

  const { data, isLoading, isError, isFetching } = useGetComplaintsQuery(queryParams);

  const pageRows = useMemo(() => normalizeList(data), [data]);
  const total = data?.data?.count ?? data?.count ?? 0;

  // First page (or any filter change) replaces the list — this way a newly
  // created complaint shows up immediately without a manual refresh.
  useEffect(() => {
    if (!data) return;
    if (offset === 0) {
      setRows(pageRows);
    } else {
      setRows((prev) => {
        const map = new Map(prev.map((r) => [r.id, r]));
        pageRows.forEach((r) => map.set(r.id, r));
        return [...map.values()].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      });
    }
  }, [data, offset, pageRows]);

  // Reset paging when filters change.
  useEffect(() => {
    setOffset(0);
  }, [filter, search]);

  const hasMore = rows.length > 0 && rows.length < total;
  const loadMore = () => setOffset((o) => o + PAGE_SIZE);

  const handleEdit = (complaint) => {
    setEditing(complaint);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (complaintIdParam) {
    return (
      <FeaturedComplaintView
        complaintId={Number(complaintIdParam)}
        onBack={closeComplaint}
      />
    );
  }

  const tabs = [
    { key: "all", label: "All Complaints" },
    { key: "mine", label: "My Complaints" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      {/* Left: compose */}
      <div className="lg:sticky lg:top-4">
        <ComposePanel editing={editing} onCancelEdit={() => setEditing(null)} />
      </div>

      {/* Right: complaint list */}
      <div className="space-y-3">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex w-full rounded-lg bg-muted p-0.75 sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 rounded-md px-3 py-1 text-center text-sm font-medium transition sm:flex-none ${
                  filter === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:ml-auto sm:w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {isError && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Failed to load complaints. Please try again later.
            </CardContent>
          </Card>
        )}

        {isLoading && !rows.length ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 && !isError ? (
          <Card>
            <CardContent className="p-10 text-center">
              <MessageSquareWarning className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-medium text-foreground">No complaints</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "mine"
                  ? "You haven't submitted any complaint yet."
                  : "Complaints addressed to you will appear here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {rows.map((complaint) => (
              <ComplaintRow key={complaint.id} complaint={complaint} onEdit={handleEdit} />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
                disabled={isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more complaints
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the app router.
export default function ComplainBox() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ComplainBoxInner />
    </Suspense>
  );
}
