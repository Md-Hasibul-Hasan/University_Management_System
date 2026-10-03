from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

from .academic import Department

User = get_user_model()


class Notification(models.Model):

    class Type(models.TextChoices):
        # Authentication
        EMAIL_VERIFICATION = "email_verification", "Email Verification"
        EMAIL_CHANGE = "email_change", "Email Change"
        PASSWORD_CHANGE = "password_change", "Password Change"
        PASSWORD_RESET = "password_reset", "Password Reset"

        # Academic
        STUDENT_APPLICATION = "student_application", "Student Application"
        ATTENDANCE_PENDING = "attendance_pending", "Attendance Pending"
        COURSE_ENROLLMENT = "course_enrollment", "Course Enrollment"
        MARKS_PUBLISHED = "marks_published", "Marks Published"
        ASSIGNMENT_SUBMITTED = "assignment_submitted", "Assignment Submitted"
        RESULT_PUBLISHED = "result_published", "Result Published"
        COURSE_CONTENT_ADDED = "course_content_added", "Course Content Added"

        # Communication
        ANNOUNCEMENT = "announcement", "Announcement"
        COMPLAINT = "complaint", "Complaint"

        # Newsfeed
        NEWSFEED_LIKE = "newsfeed_like", "Newsfeed Like"
        NEWSFEED_COMMENT = "newsfeed_comment", "Newsfeed Comment"
        NEWSFEED_SHARE = "newsfeed_share", "Newsfeed Share"

        # Generic
        SYSTEM = "system", "System"
        GENERAL = "general", "General"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=50,
        choices=Type.choices,
        default=Type.GENERAL,
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    link = models.CharField(
        max_length=500,
        blank=True,
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.email}"



class Newsfeed(models.Model):

    class ActivityType(models.TextChoices):
        POST = "post", "Post"
        COMMENT = "comment", "Comment"
        LIKE = "like", "Like"
        SHARE = "share", "Share"
        ENROLLMENT = "enrollment", "Course Enrollment"
        SUBMISSION = "submission", "Assignment Submission"
        RESULT = "result", "Result Published"
        ANNOUNCEMENT = "announcement", "Announcement"
        ATTENDANCE = "attendance", "Attendance"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="newsfeed_posts",
    )

    activity_type = models.CharField(
        max_length=50,
        choices=ActivityType.choices,
        default=ActivityType.POST,
    )

    content = models.TextField(blank=True)

    # Reference to related object (e.g., a Course, Assignment, etc.)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="newsfeed_items",
    )
    object_id = models.PositiveIntegerField(blank=True, null=True)
    target_object = GenericForeignKey("content_type", "object_id")

    # For comments/likes/shares on another post
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="reactions",
    )

    likes = models.ManyToManyField(
        User,
        blank=True,
        related_name="liked_newsfeed_posts",
    )

    share_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)

    is_pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["activity_type", "created_at"]),
            models.Index(fields=["parent", "created_at"]),
        ]

    def __str__(self):
        return f"{self.activity_type} by {self.user.email} - {self.content[:50]}"

    @property
    def total_interactions(self):
        return self.like_count + self.comment_count + self.share_count

    @property
    def post_link(self):
        return f"/newsfeed/{self.id}"


class NewsfeedMedia(models.Model):

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    newsfeed = models.ForeignKey(
        Newsfeed,
        on_delete=models.CASCADE,
        related_name="media",
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
    )

    file = models.FileField(
        upload_to="newsfeed/media/%Y/%m/",
    )

    thumbnail = models.ImageField(
        upload_to="newsfeed/thumbnails/%Y/%m/",
        blank=True,
        null=True,
    )

    caption = models.CharField(
        max_length=500,
        blank=True,
    )

    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return f"{self.media_type} for Newsfeed #{self.newsfeed.id}"


class ComplainBox(models.Model):

    class ComplainTo(models.TextChoices):
        DEPT_CHAIRMAN = "dept_chairman", _("Department Chairman")
        DEPT_TEACHER = "dept_teacher", _("Department Teacher")
        DEPT_ALL = "dept_all", _("Department All (Student + Teacher)")
        ALL = "all", _("All (All Dept Teacher + Student)")

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="complainbox",
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    complain_to = models.CharField(
        max_length=20,
        choices=ComplainTo.choices,
        default=ComplainTo.DEPT_CHAIRMAN,
    )

    # Department scope of the complaint; derived from the sender's profile
    # (student_profile/teacher_profile) at save time when not provided.
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["complain_to"]),
        ]

    def save(self, *args, **kwargs):
        if self.department_id is None:
            profile = getattr(self.user, "student_profile", None) or getattr(
                self.user, "teacher_profile", None
            )
            self.department_id = getattr(profile, "department_id", None)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.user.email}"


class ComplainBoxMedia(models.Model):
    complainbox = models.ForeignKey(
        ComplainBox,
        on_delete=models.CASCADE,
        related_name="media",
    )

    file = models.FileField(
        upload_to="complainbox/media/%Y/%m/",
    )

    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return f"Media for Complaint #{self.complainbox_id}"