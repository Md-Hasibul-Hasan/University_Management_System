from rest_framework import serializers

from ..models import (
    Notification,
    Newsfeed,
    NewsfeedMedia,
    ComplainBox,
    ComplainBoxMedia,
    DashboardReminder,
)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "notification_type",
            "title",
            "message",
            "link",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "is_read",
            "created_at",
        ]


class NewsfeedMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsfeedMedia
        fields = [
            "id",
            "newsfeed",
            "media_type",
            "file",
            "thumbnail",
            "caption",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "newsfeed", "created_at"]


class NewsfeedSharedSerializer(serializers.ModelSerializer):
    """Shallow representation of the original post inside a shared post."""

    media = NewsfeedMediaSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_image = serializers.ImageField(source="user.image", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Newsfeed
        fields = [
            "id",
            "user",
            "user_name",
            "user_image",
            "activity_type",
            "content",
            "media",
            "like_count",
            "comment_count",
            "share_count",
            "is_liked",
            "is_owner",
            "is_pinned",
            "created_at",
        ]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False


class NewsfeedSerializer(serializers.ModelSerializer):
    media = NewsfeedMediaSerializer(many=True, read_only=True, required=False)
    shared_post = serializers.SerializerMethodField()
    total_interactions = serializers.IntegerField(read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_image = serializers.ImageField(source="user.image", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    reply_to_user_name = serializers.SerializerMethodField()
    reply_to_id = serializers.SerializerMethodField()

    class Meta:
        model = Newsfeed
        fields = [
            "id",
            "user",
            "user_name",
            "user_image",
            "activity_type",
            "content",
            "media",
            "shared_post",
            "parent",
            "reply_to_user_name",
            "reply_to_id",
            "share_count",
            "like_count",
            "comment_count",
            "total_interactions",
            "is_liked",
            "is_owner",
            "is_pinned",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "parent",
            "share_count",
            "like_count",
            "comment_count",
            "created_at",
            "updated_at",
            "total_interactions",
        ]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False

    def get_shared_post(self, obj):
        if obj.activity_type != Newsfeed.ActivityType.SHARE:
            return None

        target = obj.target_object
        if not isinstance(target, Newsfeed):
            return None

        return NewsfeedSharedSerializer(target, context=self.context).data

    def get_reply_to_user_name(self, obj):
        """Name of the comment author this comment is replying to (if any)."""
        if obj.activity_type != Newsfeed.ActivityType.COMMENT:
            return None

        target = obj.target_object
        if isinstance(target, Newsfeed) and (
            target.activity_type == Newsfeed.ActivityType.COMMENT
        ):
            return target.user.name
        return None

    def get_reply_to_id(self, obj):
        """Id of the comment this comment is replying to (if any)."""
        if obj.activity_type != Newsfeed.ActivityType.COMMENT:
            return None

        target = obj.target_object
        if isinstance(target, Newsfeed) and (
            target.activity_type == Newsfeed.ActivityType.COMMENT
        ):
            return target.id
        return None


# ============================================================
# COMPLAIN BOX
# ============================================================

class ComplainBoxMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplainBoxMedia
        fields = [
            "id",
            "complainbox",
            "file",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "complainbox", "created_at"]


class ComplainBoxSerializer(serializers.ModelSerializer):
    media = ComplainBoxMediaSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_image = serializers.ImageField(source="user.image", read_only=True)
    complain_to_display = serializers.CharField(
        source="get_complain_to_display", read_only=True
    )
    department_name = serializers.CharField(
        source="department.name", read_only=True, default=None
    )
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = ComplainBox
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "user_image",
            "title",
            "message",
            "complain_to",
            "complain_to_display",
            "department",
            "department_name",
            "media",
            "created_at",
            "is_owner",
        ]
        read_only_fields = [
            "id",
            "user",
            "department",
            "created_at",
        ]

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False


class DashboardReminderSerializer(serializers.ModelSerializer):
    """Calendar reminder owned by the logged-in dashboard user."""

    class Meta:
        model = DashboardReminder
        fields = [
            "id",
            "user",
            "date",
            "time",
            "title",
            "is_done",
            "notified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Title can not be empty.")
        return value