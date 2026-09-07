from django.db import models
from django.contrib.auth import get_user_model
from ..models import *

User = get_user_model()

class StudentSemesterResult(models.Model):

    class Status(models.TextChoices):
        PASS = "pass", "Pass"
        FAIL = "fail", "Fail"

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="semester_results",
    )

    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
    )

    year_semester = models.ForeignKey(
        YearSemester,
        on_delete=models.CASCADE,
    )

    gpa = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
    )

    # Which attempt of this year_semester this published result represents
    # (1 = first attempt, 2 = retake, ...).
    attempt = models.PositiveSmallIntegerField(default=1)

    promoted = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    published_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.student} - {self.session} - {self.year_semester}"