"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Forward,
  Globe,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  Repeat2,
  Search,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAddCommentMutation,
  useCreateNewsfeedMutation,
  useDeleteCommentMutation,
  useDeleteNewsfeedMutation,
  useEditCommentMutation,
  useGetCommentsQuery,
  useGetNewsfeedPostQuery,
  useGetNewsfeedQuery,
  useSharePostMutation,
  useToggleLikeMutation,
  useUpdateNewsfeedMutation,
} from "@/redux/features/extra/newsfeedApi";

const PAGE_SIZE = 10;
const COMMENT_PAGE_SIZE = 5;
const MAX_FILES = 10;
const REPLIES_PREVIEW = 2;
const MEDIA_PREVIEW_COUNT = 6;

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

// Unwrap a single object out of the backend response envelope.
const unwrapObject = (response) => {
  if (!response) return null;
  if (response.id !== undefined) return response;
  if (response.data?.id !== undefined) return response.data;
  if (response.data?.data?.id !== undefined) return response.data.data;
  return null;
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

const ACTIVITY_LABELS = {
  comment: "Comment",
  like: "Like",
  share: "Shared a post",
  enrollment: "Enrollment",
  submission: "Submission",
  result: "Result",
  announcement: "Announcement",
  attendance: "Attendance",
};

const textareaClasses =
  "w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/* ------------------------------------------------------------------ */
/* MODAL (centered dialog)                                             */
/* ------------------------------------------------------------------ */

function Modal({ open, onOpenChange, title, children, footer }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogPrimitive.Title className="font-heading text-base font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

          {footer && <div className="border-t border-border p-4">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ */
/* MEDIA PREVIEW GRID (create / edit)                                  */
/* ------------------------------------------------------------------ */

function MediaPreviews({ items, onRemove }) {
  if (!items.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.key}
          className="group relative overflow-hidden rounded-xl border border-border bg-muted"
        >
          {item.isVideo ? (
            <video src={item.url} className="h-28 w-full object-cover" muted />
          ) : (
            <img src={item.url} alt={item.name || "media"} className="h-28 w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {item.isExisting && (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              Existing
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPOSER MODAL (create + edit, with media add/remove)               */
/* ------------------------------------------------------------------ */

function ComposerModal({ open, onOpenChange, post }) {
  const { user } = useSelector((state) => state.auth);
  const isEdit = Boolean(post);

  const [createPost, { isLoading: isCreating }] = useCreateNewsfeedMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateNewsfeedMutation();

  const [content, setContent] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Reset the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setContent(post?.content || "");
    setNewFiles([]);
    setError("");
    setExisting(
      (post?.media || []).map((m) => ({
        key: `existing-${m.id}`,
        id: m.id,
        url: toAbsoluteUrl(m.file),
        name: "",
        isVideo: m.media_type === "video",
        isExisting: true,
      }))
    );
  }, [open, post]);

  const previews = useMemo(
    () =>
      newFiles.map((file, i) => ({
        key: `new-${i}-${file.name}`,
        url: URL.createObjectURL(file),
        name: file.name,
        isVideo: file.type.startsWith("video/"),
        isExisting: false,
      })),
    [newFiles]
  );

  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews]
  );

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
    const text = content.trim();
    if (!text && existing.length === 0 && newFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", text);

    if (isEdit) {
      const originalIds = new Set((post?.media || []).map((m) => m.id));
      const keptIds = new Set(existing.filter((m) => m.isExisting).map((m) => m.id));
      for (const id of originalIds) {
        if (!keptIds.has(id)) formData.append("remove_media", String(id));
      }
    }

    newFiles.forEach((file) => formData.append("media", file));

    try {
      if (isEdit) {
        await updatePost({ id: post.id, formData }).unwrap();
      } else {
        await createPost(formData).unwrap();
      }
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const busy = isCreating || isUpdating;
  const canSubmit = Boolean(content.trim()) || newFiles.length > 0 || (isEdit && existing.length > 0);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit post" : "Create post"}
      footer={
        <Button className="w-full" onClick={submit} disabled={busy || !canSubmit}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Post"}
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={toAbsoluteUrl(user?.image) || undefined} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{user?.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            Public
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        autoFocus
        placeholder="What's on your mind?"
        className={`${textareaClasses} mt-3 text-base`}
      />

      <MediaPreviews items={[...existing, ...previews]} onRemove={removeAt} />

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border px-3 py-2">
        <span className="text-sm font-medium text-foreground">Add to post</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4 text-emerald-500" />
            Photos
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Video className="h-4 w-4 text-rose-500" />
            Video
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onPickFiles}
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* SHARE MODAL (Facebook-style: caption + shared post preview)         */
/* ------------------------------------------------------------------ */

function ShareModal({ open, onOpenChange, post }) {
  const { user } = useSelector((state) => state.auth);
  const [sharePost, { isLoading }] = useSharePostMutation();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) setContent("");
  }, [open]);

  const submit = async () => {
    try {
      await sharePost({ id: post.id, content: content.trim() }).unwrap();
      onOpenChange(false);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share this post"
      footer={
        <Button className="w-full" onClick={submit} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Share now
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={toAbsoluteUrl(user?.image) || undefined} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold text-foreground">{user?.name}</p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        autoFocus
        placeholder={`Say something about ${post?.user_name}'s post...`}
        className={`${textareaClasses} mt-3`}
      />

      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={toAbsoluteUrl(post?.user_image) || undefined} />
            <AvatarFallback>{getInitials(post?.user_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-semibold text-foreground">{post?.user_name}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(post?.created_at)}</p>
          </div>
        </div>
        {post?.content && (
          <p className="mt-2 line-clamp-3 text-sm wrap-break-word text-foreground">{post.content}</p>
        )}
        {post?.media?.[0] && post.media[0].media_type !== "video" && (
          <div className="mt-2 overflow-hidden rounded-lg">
            <img src={toAbsoluteUrl(post.media[0].file)} alt="" className="max-h-52 w-full object-cover" />
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* POST TEXT (clamped to 2 lines with See more / See less)             */
/* ------------------------------------------------------------------ */

function PostText({ content, className = "", textClassName = "text-[15px]" }) {
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Collapse again whenever the text itself changes (e.g. after an edit).
  useEffect(() => setExpanded(false), [content]);

  // While clamped, detect whether the text actually needs more than 2 lines.
  useEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [content, expanded]);

  if (!content) return null;

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`${textClassName} wrap-break-word whitespace-pre-wrap text-foreground ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {content}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          className="mt-0.5 text-sm font-medium text-primary hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MEDIA GRID (display)                                                */
/* ------------------------------------------------------------------ */

function MediaGrid({ media }) {
  const [showAll, setShowAll] = useState(false);

  if (!media?.length) return null;

  // Facebook-style: show the first 6 tiles with a +N overlay for the rest.
  const hasMore = media.length > MEDIA_PREVIEW_COUNT;
  const visible = hasMore && !showAll ? media.slice(0, MEDIA_PREVIEW_COUNT) : media;
  const extraCount = media.length - MEDIA_PREVIEW_COUNT;

  const gridCols =
    visible.length === 1
      ? "grid-cols-1"
      : visible.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="mt-3">
      <div className={`grid gap-1.5 overflow-hidden rounded-xl ${gridCols}`}>
        {visible.map((item, index) => {
          const src = toAbsoluteUrl(item.file);
          if (!src) return null;

          const isOverflowTile = hasMore && !showAll && index === visible.length - 1;

          return (
            <div key={item.id} className="relative">
              {item.media_type === "video" ? (
                <video
                  src={src}
                  controls
                  preload="metadata"
                  className="max-h-120 w-full bg-black object-cover"
                />
              ) : (
                <a href={src} target="_blank" rel="noreferrer">
                  <img
                    src={src}
                    alt={item.caption || "Post image"}
                    loading="lazy"
                    className={`w-full object-cover transition hover:opacity-95 ${
                      visible.length === 1 ? "max-h-120" : "h-40 sm:h-48"
                    }`}
                  />
                </a>
              )}

              {isOverflowTile && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white transition hover:bg-black/60"
                >
                  +{extraCount}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAll && hasMore && (
        <button
          type="button"
          className="mt-1.5 text-xs font-medium text-muted-foreground hover:underline"
          onClick={() => setShowAll(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHARED POST PREVIEW (nested original)                               */
/* ------------------------------------------------------------------ */

function SharedPreview({ post }) {
  if (!post) return null;

  return (
    <div className="mt-3 rounded-xl border border-border">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Avatar size="sm">
          <AvatarImage src={toAbsoluteUrl(post.user_image) || undefined} />
          <AvatarFallback>{getInitials(post.user_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{post.user_name}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
      </div>
      {post.content && (
        <PostText content={post.content} className="px-3 pt-2" textClassName="text-sm" />
      )}
      <div className="px-3 pb-3">
        <MediaGrid media={post.media} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMMENT ITEM                                                        */
/* ------------------------------------------------------------------ */

function CommentItem({ comment, post, replies, canDeleteByPostOwner }) {
  const [editComment, { isLoading: isSaving }] = useEditCommentMutation();
  const [removeComment] = useDeleteCommentMutation();
  const [reply, { isLoading: isReplying }] = useAddCommentMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showAllReplies, setShowAllReplies] = useState(false);

  const canEdit = comment.is_owner;
  const canDelete = comment.is_owner || canDeleteByPostOwner;

  const submitReply = async () => {
    const value = replyText.trim();
    if (!value) return;
    try {
      await reply({ postId: post.id, content: value, reply_to: comment.id }).unwrap();
      setReplyText("");
      setShowReply(false);
    } catch {
      /* ignore */
    }
  };

  const saveEdit = async () => {
    const value = draft.trim();
    if (!value || value === comment.content) {
      setIsEditing(false);
      setDraft(comment.content);
      return;
    }
    try {
      await editComment({ commentId: comment.id, content: value }).unwrap();
      setIsEditing(false);
    } catch {
      /* keep editing open */
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await removeComment({ commentId: comment.id, postId: comment.parent }).unwrap();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex gap-2">
      <Avatar size="sm">
        <AvatarImage src={toAbsoluteUrl(comment.user_image) || undefined} />
        <AvatarFallback>{getInitials(comment.user_name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted px-3 py-2">
          <p className="text-xs font-semibold text-foreground">{comment.user_name}</p>

          {comment.reply_to_user_name && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Replying to{" "}
              <span className="font-semibold text-foreground">
                {comment.reply_to_user_name}
              </span>
            </p>
          )}

          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                autoFocus
                className={textareaClasses}
              />
              <div className="mt-1 flex gap-2">
                <Button size="xs" onClick={saveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Save
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setDraft(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm wrap-break-word whitespace-pre-wrap text-foreground">
              {comment.content}
            </p>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 pl-3 text-xs text-muted-foreground">
          <span>{timeAgo(comment.created_at)}</span>
          {!isEditing && (
            <button className="hover:underline" onClick={() => setShowReply((v) => !v)}>
              Reply
            </button>
          )}
          {!isEditing && canEdit && (
            <button className="hover:underline" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
          {!isEditing && canDelete && (
            <button className="hover:text-destructive hover:underline" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>

        {showReply && !isEditing && (
          <div className="mt-2 flex items-end gap-2 pl-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
              rows={1}
              autoFocus
              placeholder={`Reply to ${comment.user_name}...`}
              className={`${textareaClasses} min-h-8 max-h-24`}
            />
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={submitReply}
              disabled={isReplying || !replyText.trim()}
            >
              {isReplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}

        {replies.length > 0 &&
          (() => {
            const visibleReplies = showAllReplies ? replies : replies.slice(-REPLIES_PREVIEW);
            const hiddenCount = replies.length - visibleReplies.length;

            return (
              <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
                {hiddenCount > 0 && (
                  <button
                    className="text-xs font-medium text-muted-foreground hover:underline"
                    onClick={() => setShowAllReplies(true)}
                  >
                    View all {replies.length} replies
                  </button>
                )}

                {visibleReplies.map((replyItem) => (
                  <CommentItem
                    key={replyItem.id}
                    comment={replyItem}
                    post={post}
                    replies={[]}
                    canDeleteByPostOwner={canDeleteByPostOwner}
                  />
                ))}

                {showAllReplies && replies.length > REPLIES_PREVIEW && (
                  <button
                    className="text-xs font-medium text-muted-foreground hover:underline"
                    onClick={() => setShowAllReplies(false)}
                  >
                    Hide replies
                  </button>
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMMENT SECTION                                                     */
/* ------------------------------------------------------------------ */

function CommentSection({ post }) {
  const [offset, setOffset] = useState(0);
  const [pages, setPages] = useState({});
  const [text, setText] = useState("");

  const { data, isLoading, isFetching } = useGetCommentsQuery({
    postId: post.id,
    limit: COMMENT_PAGE_SIZE,
    offset,
  });

  const pageRows = useMemo(() => normalizeList(data), [data]);
  const total = data?.data?.count ?? data?.count ?? 0;
  const hasMore = pageRows.length > 0 && offset + pageRows.length < total;

  // Start over when switching posts.
  useEffect(() => {
    setOffset(0);
    setPages({});
  }, [post.id]);

  // The API serves comments newest-first, so every offset window shifts
  // whenever a comment is added or removed. Whenever the total changes,
  // jump back to the newest window so a just-posted comment is visible
  // even after "Load more" moved the offset deeper into the list.
  const prevTotalRef = useRef(null);
  useEffect(() => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = total;
      return;
    }
    if (prevTotalRef.current !== total) {
      prevTotalRef.current = total;
      setOffset(0);
      setPages({});
    }
  }, [total]);

  // Cache the latest rows per loaded page, so a refetch (add / delete)
  // replaces the rows instead of keeping stale ones around.
  useEffect(() => {
    if (!data) return;
    setPages((prev) => (prev[offset] === pageRows ? prev : { ...prev, [offset]: pageRows }));
  }, [data, offset, pageRows]);

  const items = useMemo(() => {
    const map = new Map();
    Object.keys(pages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((pageOffset) => {
        (pages[pageOffset] || []).forEach((c) => map.set(c.id, c));
      });
    return [...map.values()];
  }, [pages]);

  const [addComment, { isLoading: isAdding }] = useAddCommentMutation();

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      await addComment({ postId: post.id, content: value }).unwrap();
      setText("");
    } catch {
      /* ignore */
    }
  };

  const loadMore = () => setOffset((o) => o + (pageRows.length || COMMENT_PAGE_SIZE));

  // Split top-level comments and replies. Replies-to-replies are flattened
  // into the same thread under their top-level comment (Facebook-style).
  const { topLevel, repliesByComment } = useMemo(() => {
    const byId = new Map(items.map((c) => [c.id, c]));

    const rootIdOf = (c) => {
      let current = c;
      const seen = new Set();
      while (current.reply_to_id && !seen.has(current.reply_to_id)) {
        seen.add(current.reply_to_id);
        const parent = byId.get(current.reply_to_id);
        if (!parent) return null;
        current = parent;
      }
      return current.id;
    };

    const map = new Map();
    const tops = [];
    for (const c of items) {
      if (!c.reply_to_id) {
        tops.push(c);
        continue;
      }
      const rootId = rootIdOf(c);
      if (rootId === null || rootId === c.id) continue;
      const list = map.get(rootId) || [];
      list.push(c);
      map.set(rootId, list);
    }

    // Threads ordered by last activity (a reply bumps updated_at on the
    // whole thread), oldest activity first; replies inside a thread stay
    // oldest-first by created_at.
    tops.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    map.forEach((list) => list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));

    return { topLevel: tops, repliesByComment: map };
  }, [items]);

  return (
    <div className="mt-3 space-y-3">
      {isLoading && !items.length ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <>
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              post={post}
              replies={repliesByComment.get(comment.id) || []}
              canDeleteByPostOwner={post.is_owner}
            />
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={loadMore}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Load more comments
            </Button>
          )}
        </>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Write a comment..."
          className={`${textareaClasses} min-h-9 max-h-32`}
        />
        <Button size="icon-sm" variant="secondary" onClick={submit} disabled={isAdding || !text.trim()}>
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* POST CARD                                                           */
/* ------------------------------------------------------------------ */

function PostCard({ post, initialCommentsOpen = false }) {
  const [toggleLike, { isLoading: isLiking }] = useToggleLikeMutation();
  const [removePost] = useDeleteNewsfeedMutation();

  const [showComments, setShowComments] = useState(initialCommentsOpen);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isShare = post.activity_type === "share" && post.shared_post;
  const activityLabel = ACTIVITY_LABELS[post.activity_type];

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await removePost(post.id).unwrap();
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 pb-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={toAbsoluteUrl(post.user_image) || undefined} />
              <AvatarFallback>{getInitials(post.user_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{post.user_name}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{timeAgo(post.created_at)}</span>
                <Globe className="h-3 w-3" />
                {isShare && (
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3 w-3" />
                    shared a post
                  </span>
                )}
                {!isShare && activityLabel && activityLabel !== "Post" && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {activityLabel}
                  </Badge>
                )}
                {post.is_pinned && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </span>
                )}
              </div>
            </div>
          </div>

          {post.is_owner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        {post.content && <PostText content={post.content} className="px-4 pt-3" />}

        {/* Shared original OR own media */}
        {isShare ? (
          <div className="px-4 pb-1">
            <SharedPreview post={post.shared_post} />
          </div>
        ) : (
          <div className="px-4">
            <MediaGrid media={post.media} />
          </div>
        )}

        {/* Counts */}
        <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-rose-500 text-white">
              <Heart className="h-2.5 w-2.5 fill-current" />
            </span>
            {post.like_count}
          </span>
          <span className="flex gap-3">
            <button className="hover:underline" onClick={() => setShowComments((v) => !v)}>
              {post.comment_count} comments
            </button>
            <span>{post.share_count} shares</span>
          </span>
        </div>

        {/* Actions */}
        <div className="mx-4 mt-2 grid grid-cols-3 gap-1 border-y border-border py-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={isLiking}
            onClick={() => toggleLike(post.id)}
            className={post.is_liked ? "text-rose-500 hover:text-rose-500" : ""}
          >
            <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
            Like
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)}>
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)}>
            <Forward className="h-4 w-4" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="px-4 pb-4">
            <CommentSection post={post} />
          </div>
        )}
      </CardContent>

      <ComposerModal open={editOpen} onOpenChange={setEditOpen} post={post} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} post={post} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* FEATURED POST (opened from a notification link)                     */
/* ------------------------------------------------------------------ */

function FeaturedPostView({ postId, onBack }) {
  const { data, isLoading, isError } = useGetNewsfeedPostQuery(postId);
  const post = useMemo(() => unwrapObject(data), [data]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [postId]);

  const back = (
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" />
      Back to news feed
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {back}
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="space-y-4">
        {back}
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            This post is no longer available. It may have been deleted.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {back}
      <div className="rounded-2xl ring-2 ring-primary/40">
        <PostCard key={post.id} post={post} initialCommentsOpen />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* NEWSFEED (feed container + filters)                                 */
/* ------------------------------------------------------------------ */

function NewsfeedSortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const options = [
    { value: "-created_at", label: "Newest" },
    { value: "created_at", label: "Oldest" },
    { value: "-like_count", label: "Most liked" },
    { value: "-comment_count", label: "Most commented" },
  ];
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [open]);

  return (
    <div ref={menuRef} className="relative w-full sm:order-2 sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:w-36"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsfeedInner() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ?post=<id> (from a notification click) opens that single post.
  const postIdParam = searchParams.get("post");

  const closePost = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("post");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const [filter, setFilter] = useState("all"); // all | mine
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [offset, setOffset] = useState(0);
  const [pages, setPages] = useState({});
  const [composerOpen, setComposerOpen] = useState(false);

  const queryParams = {
    search,
    ordering,
    limit: PAGE_SIZE,
    offset,
    ...(filter === "mine" && user?.id ? { user: user.id } : {}),
  };

  const { data, isLoading, isError, isFetching } = useGetNewsfeedQuery(queryParams);

  const pageRows = useMemo(() => normalizeList(data), [data]);
  const total = data?.data?.count ?? data?.count ?? 0;

  // Reset the accumulated list when filter / search / ordering changes.
  useEffect(() => {
    setOffset(0);
    setPages({});
  }, [filter, search, ordering]);

  // Cache the latest rows per loaded page, so a refetch (delete / edit /
  // share) replaces the rows instead of keeping stale ones around.
  useEffect(() => {
    if (!data) return;
    setPages((prev) => (prev[offset] === pageRows ? prev : { ...prev, [offset]: pageRows }));
  }, [data, offset, pageRows]);

  const items = useMemo(() => {
    const map = new Map();
    Object.keys(pages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((pageOffset) => {
        (pages[pageOffset] || []).forEach((p) => map.set(p.id, p));
      });
    return [...map.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [pages]);

  const hasMore = pageRows.length > 0 && offset + pageRows.length < total;
  const loadMore = () => setOffset((o) => o + (pageRows.length || PAGE_SIZE));

  const tabs = [
    { key: "all", label: "All Posts" },
    { key: "mine", label: "My Posts" },
  ];

  if (postIdParam) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <FeaturedPostView postId={Number(postIdParam)} onBack={closePost} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* Composer trigger */}
      <Card className="py-0">
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar>
            <AvatarImage src={toAbsoluteUrl(user?.image) || undefined} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => setComposerOpen(true)}
            className="h-10 flex-1 rounded-full bg-muted px-4 text-left text-sm text-muted-foreground transition hover:bg-muted/70"
          >
            What&apos;s on your mind ?
          </button>
          <Button size="sm" variant="secondary" onClick={() => setComposerOpen(true)}>
            <ImagePlus className="h-4 w-4" />
            Post
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full rounded-lg bg-muted p-0.75 sm:w-auto sm:self-start">
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

        <NewsfeedSortMenu
          value={ordering}
          onChange={setOrdering}
        />

        <div className="relative w-full sm:order-1 sm:ml-auto sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-48"
          />
        </div>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Failed to load the news feed. Please try again later.
          </CardContent>
        </Card>
      )}

      {isLoading && !items.length ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 && !isError ? (
        <Card>
          <CardContent className="p-10 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-medium text-foreground">No posts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "mine"
                ? "You haven't posted anything yet."
                : "Share the first update with your university community."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasMore && (
            <Button variant="outline" className="w-full" onClick={loadMore} disabled={isFetching}>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
              Load more posts
            </Button>
          )}
        </>
      )}

      <ComposerModal open={composerOpen} onOpenChange={setComposerOpen} post={null} />
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the app router.
export default function Newsfeed() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewsfeedInner />
    </Suspense>
  );
}
