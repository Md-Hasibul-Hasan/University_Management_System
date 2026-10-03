from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


from ..models import (
    Notification,
    Newsfeed,
    NewsfeedMedia,
    ComplainBox,
    ComplainBoxMedia,
)
from ..serializers import (
    NotificationSerializer,
    NewsfeedSerializer,
    ComplainBoxSerializer,
)
from ..services import NewsfeedServices, ComplainBoxServices
from drf_spectacular.utils import extend_schema

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from ..paginations import MyLimitOffsetPagination


@extend_schema(tags=["Notifications"])
class NotificationViewSet(ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_read"]
    search_fields = ["title", "message"]
    ordering_fields = ["created_at"]
    pagination_class = MyLimitOffsetPagination

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        )

    @action(detail=True, methods=["patch"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response({
            "detail": "Notification marked as read."
        })

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response({
            "detail": "All notifications marked as read."
        })

    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_notification(self, request, pk=None):
        notification = self.get_object()
        notification.delete()

        return Response(
            {"detail": "Notification deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


@extend_schema(tags=["Newsfeed"])
class NewsfeedViewSet(ModelViewSet):
    serializer_class = NewsfeedSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["activity_type", "is_pinned", "user"]
    search_fields = ["content"]
    ordering_fields = ["created_at", "like_count", "comment_count", "share_count"]
    pagination_class = MyLimitOffsetPagination

    def get_queryset(self):
        return Newsfeed.objects.filter(
            parent__isnull=True,
        ).select_related("user").prefetch_related("media", "likes", "target_object")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @staticmethod
    def _getlist(request, key):
        """Read repeated fields from multipart/form-data or JSON payloads."""
        data = request.data

        if hasattr(data, "getlist"):
            values = data.getlist(key)
            if len(values) == 1 and isinstance(values[0], str):
                # JSON clients may send a comma separated string.
                parts = [v.strip() for v in values[0].split(",") if v.strip()]
                if len(parts) > 1:
                    return parts
            return values

        value = data.get(key)
        if value is None:
            return []
        return value if isinstance(value, list) else [value]

    def create(self, request, *args, **kwargs):
        """Support multipart posts: content + repeated 'media' file parts."""
        if not request.FILES.getlist("media"):
            return super().create(request, *args, **kwargs)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            newsfeed = serializer.save(
                user=request.user,
                activity_type=request.data.get(
                    "activity_type", Newsfeed.ActivityType.POST
                ),
            )

            for order, file in enumerate(request.FILES.getlist("media")):
                content_type = (file.content_type or "").split("/")[0]
                NewsfeedMedia.objects.create(
                    newsfeed=newsfeed,
                    media_type=(
                        NewsfeedMedia.MediaType.VIDEO
                        if content_type == "video"
                        else NewsfeedMedia.MediaType.IMAGE
                    ),
                    file=file,
                    display_order=order,
                )

        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(newsfeed, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        """Author may edit content and add / remove media."""
        instance = self.get_object()

        if not (request.user.is_staff or instance.user_id == request.user.id):
            return Response(
                {"detail": "You can only edit your own post."},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)

        new_files = request.FILES.getlist("media")
        remove_ids = [
            int(value)
            for value in self._getlist(request, "remove_media")
            if str(value).isdigit()
        ]

        with transaction.atomic():
            post = serializer.save()

            if remove_ids:
                NewsfeedMedia.objects.filter(
                    newsfeed=post, id__in=remove_ids
                ).delete()

            order = (
                post.media.order_by("-display_order")
                .values_list("display_order", flat=True)
                .first()
                or 0
            )

            for file in new_files:
                order += 1
                content_type = (file.content_type or "").split("/")[0]
                NewsfeedMedia.objects.create(
                    newsfeed=post,
                    media_type=(
                        NewsfeedMedia.MediaType.VIDEO
                        if content_type == "video"
                        else NewsfeedMedia.MediaType.IMAGE
                    ),
                    file=file,
                    display_order=order,
                )

        return Response(
            self.get_serializer(post, context={"request": request}).data
        )

    def destroy(self, request, *args, **kwargs):
        """Only the author may delete their own post."""
        instance = self.get_object()
        if not (request.user.is_staff or instance.user_id == request.user.id):
            return Response(
                {"detail": "You can only delete your own post."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    # --------------------------------------------------------
    # LIKE (toggle)
    # --------------------------------------------------------

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        newsfeed = self.get_object()

        if newsfeed.likes.filter(id=request.user.id).exists():
            newsfeed.likes.remove(request.user)
            newsfeed.like_count = max(newsfeed.like_count - 1, 0)
            newsfeed.save(update_fields=["like_count"])
            is_liked = False
        else:
            newsfeed.likes.add(request.user)
            newsfeed.like_count += 1
            newsfeed.save(update_fields=["like_count"])
            is_liked = True
            # Notify post owner
            NewsfeedServices.notify_newsfeed_like(newsfeed, request.user)

        return Response({
            "detail": "Like toggled.",
            "like_count": newsfeed.like_count,
            "is_liked": is_liked,
        })

    # --------------------------------------------------------
    # COMMENT
    # --------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="comment")
    def comment(self, request, pk=None):
        newsfeed = self.get_object()

        content = request.data.get("content", "").strip()
        if not content:
            return Response(
                {"detail": "Comment content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optional: reply to an existing comment on this post.
        reply_to = None
        reply_to_id = request.data.get("reply_to")
        if reply_to_id:
            reply_to = newsfeed.reactions.filter(
                id=reply_to_id,
                activity_type=Newsfeed.ActivityType.COMMENT,
            ).first()
            if reply_to is None:
                return Response(
                    {"detail": "Comment to reply to was not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        comment = Newsfeed.objects.create(
            user=request.user,
            activity_type=Newsfeed.ActivityType.COMMENT,
            content=content,
            parent=newsfeed,
            content_type=(
                ContentType.objects.get_for_model(Newsfeed) if reply_to else None
            ),
            object_id=reply_to.id if reply_to else None,
        )

        newsfeed.comment_count += 1
        newsfeed.save(update_fields=["comment_count"])

        # Bump the replied-to chain's updated_at so the whole thread
        # resurfaces in the most-recent comment window (list_comments
        # orders by -updated_at).
        if reply_to:
            newsfeed_ct = ContentType.objects.get_for_model(Newsfeed)
            ancestor = reply_to
            seen = set()
            now = timezone.now()
            while ancestor is not None and ancestor.id not in seen:
                seen.add(ancestor.id)
                Newsfeed.objects.filter(id=ancestor.id).update(updated_at=now)
                if (
                    ancestor.content_type_id == newsfeed_ct.id
                    and ancestor.object_id
                ):
                    ancestor = Newsfeed.objects.filter(
                        id=ancestor.object_id,
                        activity_type=Newsfeed.ActivityType.COMMENT,
                    ).first()
                else:
                    ancestor = None

        # Notify post owner
        NewsfeedServices.notify_newsfeed_comment(comment, request.user)

        # Notify the author of the replied-to comment
        if reply_to:
            NewsfeedServices.notify_newsfeed_reply(comment, reply_to, request.user)

        serializer = NewsfeedSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @comment.mapping.get
    def list_comments(self, request, pk=None):
        newsfeed = self.get_object()

        # Newest activity first: a reply bumps its whole thread's
        # updated_at, so active threads stay in the recent window.
        # The client sorts the loaded comments oldest-first for display.
        comments = newsfeed.reactions.filter(
            activity_type=Newsfeed.ActivityType.COMMENT,
        ).select_related("user").prefetch_related("media", "likes").order_by(
            "-updated_at"
        )

        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = NewsfeedSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = NewsfeedSerializer(
            comments, many=True, context={"request": request}
        )
        return Response(serializer.data)

    # --------------------------------------------------------
    # SHARE
    # --------------------------------------------------------

    @action(detail=True, methods=["post"])
    def share(self, request, pk=None):
        """Share a post to the timeline, optionally with a caption."""
        newsfeed = self.get_object()
        content = (request.data.get("content") or "").strip()

        with transaction.atomic():
            shared = Newsfeed.objects.create(
                user=request.user,
                activity_type=Newsfeed.ActivityType.SHARE,
                content=content,
                content_type=ContentType.objects.get_for_model(Newsfeed),
                object_id=newsfeed.id,
            )

            newsfeed.share_count += 1
            newsfeed.save(update_fields=["share_count"])

        # Notify post owner
        NewsfeedServices.notify_newsfeed_share(newsfeed, request.user)

        return Response(
            self.get_serializer(shared, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Newsfeed"])
class NewsfeedCommentViewSet(ModelViewSet):
    """
    Edit / delete comments.

    - Comment owner: can edit or delete their own comment.
    - Post owner: can delete comments on their own post.
    - Admin/staff: can do both.
    """

    serializer_class = NewsfeedSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "delete", "get", "head", "options"]

    def get_queryset(self):
        return Newsfeed.objects.filter(
            activity_type=Newsfeed.ActivityType.COMMENT,
            parent__isnull=False,
        ).select_related("user", "parent")

    @staticmethod
    def _is_admin(user):
        return user.is_staff or user.is_superuser

    def update(self, request, *args, **kwargs):
        """Only the comment owner (or admin) can edit a comment."""
        comment = self.get_object()

        if not (self._is_admin(request.user) or comment.user_id == request.user.id):
            return Response(
                {"detail": "You can only edit your own comment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        content = (request.data.get("content") or "").strip()
        if not content:
            return Response(
                {"detail": "Comment content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Comment owner or post owner (or admin) can delete a comment."""
        comment = self.get_object()

        is_allowed = (
            self._is_admin(request.user)
            or comment.user_id == request.user.id
            or (comment.parent and comment.parent.user_id == request.user.id)
        )

        if not is_allowed:
            return Response(
                {"detail": "You cannot delete this comment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        parent = instance.parent

        # Collect all descendant replies (linked through the GFK) so that
        # deleting a comment removes its whole reply thread.
        newsfeed_ct = ContentType.objects.get_for_model(Newsfeed)
        to_delete = [instance]
        frontier = [instance]
        while frontier:
            frontier = list(
                Newsfeed.objects.filter(
                    activity_type=Newsfeed.ActivityType.COMMENT,
                    content_type=newsfeed_ct,
                    object_id__in=[c.id for c in frontier],
                )
            )
            to_delete.extend(frontier)

        with transaction.atomic():
            child_ids = [c.id for c in to_delete[1:]]
            if child_ids:
                Newsfeed.objects.filter(id__in=child_ids).delete()
            instance.delete()
            if parent:
                parent.comment_count = max(
                    parent.comment_count - len(to_delete), 0
                )
                parent.save(update_fields=["comment_count"])


@extend_schema(tags=["ComplainBox"])
class ComplainBoxViewSet(ModelViewSet):
    """
    Complaint box.

    - Anyone authenticated can create a complaint (with optional media files).
    - Visibility depends on 'complain_to' audience (see ComplainBoxServices).
    - Only the owner (or admin) can edit / delete a complaint.
    """

    serializer_class = ComplainBoxSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["complain_to", "department", "user"]
    search_fields = ["title", "message"]
    ordering_fields = ["created_at"]
    pagination_class = MyLimitOffsetPagination

    def get_queryset(self):
        return ComplainBoxServices.visible_to(
            self.request.user
        ).select_related("user", "department").prefetch_related("media")

    @staticmethod
    def _getlist(request, key):
        """Read repeated fields from multipart/form-data or JSON payloads."""
        data = request.data

        if hasattr(data, "getlist"):
            values = data.getlist(key)
            if len(values) == 1 and isinstance(values[0], str):
                parts = [v.strip() for v in values[0].split(",") if v.strip()]
                if len(parts) > 1:
                    return parts
            return values

        value = data.get(key)
        if value is None:
            return []
        return value if isinstance(value, list) else [value]

    def perform_create(self, serializer):
        complaint = serializer.save(user=self.request.user)

        # Notify the audience this complaint is addressed to.
        ComplainBoxServices.notify_complainbox(complaint)

    def create(self, request, *args, **kwargs):
        """Support multipart posts: title/message/complain_to + 'media' files."""
        if not request.FILES.getlist("media"):
            return super().create(request, *args, **kwargs)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            complaint = serializer.save(user=request.user)

            for order, file in enumerate(request.FILES.getlist("media")):
                ComplainBoxMedia.objects.create(
                    complainbox=complaint,
                    file=file,
                    display_order=order,
                )

            # Notify the audience this complaint is addressed to.
            ComplainBoxServices.notify_complainbox(complaint)

        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(complaint, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        """Owner may edit the complaint and add / remove media."""
        instance = self.get_object()

        if not (
            ComplainBoxServices.is_admin(request.user)
            or instance.user_id == request.user.id
        ):
            return Response(
                {"detail": "You can only edit your own complaint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)

        new_files = request.FILES.getlist("media")
        remove_ids = [
            int(value)
            for value in self._getlist(request, "remove_media")
            if str(value).isdigit()
        ]

        with transaction.atomic():
            complaint = serializer.save()

            if remove_ids:
                ComplainBoxMedia.objects.filter(
                    complainbox=complaint, id__in=remove_ids
                ).delete()

            order = (
                complaint.media.order_by("-display_order")
                .values_list("display_order", flat=True)
                .first()
                or 0
            )

            for file in new_files:
                order += 1
                ComplainBoxMedia.objects.create(
                    complainbox=complaint,
                    file=file,
                    display_order=order,
                )

        return Response(
            self.get_serializer(complaint, context={"request": request}).data
        )

    def destroy(self, request, *args, **kwargs):
        """Only the owner (or admin) may delete a complaint."""
        instance = self.get_object()

        if not (
            ComplainBoxServices.is_admin(request.user)
            or instance.user_id == request.user.id
        ):
            return Response(
                {"detail": "You can only delete your own complaint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)
    

