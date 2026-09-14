from django.db import models
from django.contrib.auth import get_user_model

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