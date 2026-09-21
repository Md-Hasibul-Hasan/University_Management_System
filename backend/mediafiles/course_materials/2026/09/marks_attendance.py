from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from ..models import *

User = get_user_model()


class StudentAssessmentMark(models.Model):
    student_course = models.ForeignKey(
        StudentCourse,
        on_delete=models.CASCADE,
        related_name="assessment_marks",
    )

    assessment = models.ForeignKey(
        CourseAssessment,
        on_delete=models.CASCADE,
        related_name="student_marks",
    )

    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entered_student_marks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "student_course",
            "assessment__display_order",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["student_course", "assessment"],
                name="unique_student_assessment_mark",
            )
        ]

    def __str__(self):
        return (
            f"{self.student_course.student.student_id} - "
            f"{self.assessment.title} ({self.marks})"
        )
    


class AttendanceSession(models.Model):
    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="attendance_sessions",
    )

    date = models.DateField()

    taken_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
    )

    is_locked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=["session_course", "date"],
                name="unique_attendance_session_per_day",
            )
        ]

    def __str__(self):
        return f"{self.session_course} - {self.date}"   
    
class StudentAttendance(models.Model):

    class AttendanceStatus(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"

    attendance_session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    student_course = models.ForeignKey(
        StudentCourse,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "attendance_session",
                    "student_course",
                ],
                name="unique_student_attendance",
            )
        ]

    def __str__(self):
        return f"{self.student_course} - {self.status}"




