from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal, ROUND_HALF_UP
from ..models import *

User = get_user_model()

class StudentSemesterResult(models.Model):
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

    # Which attempt of this year_semester this published result represents
    # (1 = first attempt, 2 = retake, ...).
    attempt = models.PositiveSmallIntegerField(default=1)

    promoted = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    published_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    @property
    def _calculated_result(self):
        courses = self.student.student_courses.filter(
            session_course__session=self.session,
            session_course__course__year_semester=self.year_semester,
        )

        total_credit = Decimal("0.00")
        total_grade_points = Decimal("0.00")

        for course in courses:
            if course.status in {
                StudentCourse.Status.RETAKEN,
                StudentCourse.Status.INCOMPLETE,
                StudentCourse.Status.DROPPED,
            }:
                continue

            grade_point = course.grade_point
            if grade_point is None:
                continue

            total_credit += course.session_course.course.credit
            total_grade_points += grade_point * course.session_course.course.credit

        gpa = (
            (total_grade_points / total_credit).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            if total_credit
            else Decimal("0.00")
        )

        return {"gpa": gpa}

    @property
    def gpa(self):
        return self._calculated_result["gpa"]

    def __str__(self):
        return f"{self.student} - {self.session} - {self.year_semester}"