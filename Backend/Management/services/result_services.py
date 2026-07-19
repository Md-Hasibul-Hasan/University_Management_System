from collections import defaultdict
from rest_framework.exceptions import ValidationError
from decimal import Decimal, ROUND_HALF_UP
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from ..models import *


class ResultServices:
    """Service layer for calculating student results and grades."""

    # Ordered from highest minimum marks to lowest. The first entry whose
    # minimum is met/exceeded by the total marks determines the grade.
    GRADING_SCALE = [
        (80, "A+", Decimal("4.00")),
        (75, "A", Decimal("3.75")),
        (70, "A-", Decimal("3.50")),
        (65, "B+", Decimal("3.25")),
        (60, "B", Decimal("3.00")),
        (55, "B-", Decimal("2.75")),
        (50, "C+", Decimal("2.50")),
        (45, "C", Decimal("2.25")),
        (40, "D", Decimal("2.00")),
    ]

    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_session_course_result(session_course):
        """Calculate results for every enrolled student in a session course.

        Executes only 3 DB queries regardless of student count.
        """
        student_courses = list(
            StudentCourse.objects.filter(
                session_course=session_course,
                status=StudentCourse.Status.ENROLLED,
            ).select_related("student")
        )

        assessments = list(session_course.assessments.all())

        marks_lookup = ResultServices._build_marks_lookup(session_course)

        return [
            ResultServices.calculate_student_result(
                student_course=student_course,
                assessments=assessments,
                marks_lookup=marks_lookup,
            )
            for student_course in student_courses
        ]

    @staticmethod
    def calculate_student_result(student_course, assessments, marks_lookup,  hide_final=False,):
        """Calculate the result for a single student.

        Performs ZERO database queries — all data is passed in.
        """
        grouped_assessments = ResultServices._group_marks(
            student_course=student_course,
            assessments=assessments,
            marks_lookup=marks_lookup,
        )

        assessment_breakdown, total_marks = (
            ResultServices._build_assessment_breakdown(grouped_assessments)
        )

        total_marks = ResultServices._round(total_marks)
        grade = ResultServices.calculate_grade(total_marks)

        return {
            "student_course": student_course.id,
            "student_id": student_course.student.student_id,
            "student_name": str(student_course.student),
            "assessments": assessment_breakdown,
            "total_marks": total_marks,
            "letter_grade": grade["letter_grade"],
            "grade_point": grade["grade_point"],
        }

    # ------------------------------------------------------------------
    # Private helpers — data fetching / grouping
    # ------------------------------------------------------------------

    @staticmethod
    def _build_marks_lookup(session_course):
        """Build an O(1) lookup of {(student_course_id, assessment_id): marks}."""
        marks_qs = StudentAssessmentMark.objects.filter(
            student_course__session_course=session_course,
        )
        return {
            (mark.student_course_id, mark.assessment_id): mark.marks
            for mark in marks_qs
        }

    @staticmethod
    def _group_marks(student_course, assessments, marks_lookup):
        """Group assessments by their `assessment_type` and attach obtained marks.

        Uses the O(1) marks_lookup instead of hitting the database.
        """
        grouped = defaultdict(list)

        for assessment in assessments:
            key = (student_course.id, assessment.id)
            obtained_marks = marks_lookup.get(key, Decimal("0.00"))

            grouped[assessment.assessment_type].append(
                {
                    "assessment": assessment,
                    "marks": obtained_marks,
                }
            )

        return grouped

    @staticmethod
    def _validate_group(items):
        """Validate that all assessments in a group have:
        - The same calculation_type.
        - If AVERAGE, identical max_marks.

        Not currently called (kept for future use, matching original code).
        """
        first = items[0]["assessment"]

        for item in items[1:]:
            assessment = item["assessment"]

            if assessment.calculation_type != first.calculation_type:
                raise ValueError(
                    "All assessments in the same group must have the "
                    "same calculation type. "
                    f"Expected '{first.calculation_type}', "
                    f"got '{assessment.calculation_type}'."
                )

        if first.calculation_type == CourseAssessment.CalculationType.AVERAGE:
            first_max = first.max_marks
            for item in items[1:]:
                if item["assessment"].max_marks != first_max:
                    raise ValueError(
                        "All assessments in an AVERAGE group must have "
                        "identical max_marks. "
                        f"Expected {first_max}, "
                        f"got {item['assessment'].max_marks}."
                    )

    # ------------------------------------------------------------------
    # Private helpers — breakdown building
    # ------------------------------------------------------------------

    @staticmethod
    def _build_assessment_breakdown(grouped_assessments):
        """Build the per-group breakdown list and the running total marks.

        Returns a tuple of (assessment_breakdown, total_marks).
        """
        assessment_breakdown = []
        total_marks = Decimal("0.00")

        for assessment_type, items in grouped_assessments.items():
            ResultServices._validate_group(items)
            group_marks = ResultServices._calculate_group_marks(items)
            group_max_marks = ResultServices._calculate_group_max_marks(items)
            group_name = ResultServices._get_group_name(assessment_type, items)

            total_marks += group_marks

            assessment_breakdown.append(
                {
                    "id": items[0]["assessment"].id,
                    "title": items[0]["assessment"].title,
                    "name": group_name,
                    "assessment_type": assessment_type,
                    "calculation_type": items[0]["assessment"].calculation_type,
                    "marks": ResultServices._round(group_marks),
                    "max_marks": ResultServices._round(group_max_marks),
                }
            )

        return assessment_breakdown, total_marks

    @staticmethod
    def _calculate_group_marks(items):
        """Calculate total (or averaged) marks for a group of assessments."""
        calculation_type = items[0]["assessment"].calculation_type
        total = sum(item["marks"] for item in items)

        if calculation_type == CourseAssessment.CalculationType.AVERAGE:
            return total / len(items)

        return total

    @staticmethod
    def _calculate_group_max_marks(items):
        """Calculate the max marks achievable for a group."""
        calculation_type = items[0]["assessment"].calculation_type

        if calculation_type == CourseAssessment.CalculationType.AVERAGE:
            return items[0]["assessment"].max_marks

        return sum(item["assessment"].max_marks for item in items)

    @staticmethod
    def _get_group_name(assessment_type, items):
        """Return a human-readable name for the assessment group."""
        assessment = items[0]["assessment"]

        if assessment_type == CourseAssessment.AssessmentType.ATTENDANCE:
            return "Attendance"

        if assessment_type == CourseAssessment.AssessmentType.FINAL:
            return assessment.title

        return assessment.get_assessment_type_display()

    @staticmethod
    def _round(value):
        """Round a Decimal to 2 decimal places using HALF_UP rounding."""
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # ------------------------------------------------------------------
    # Public grading
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_grade(total_marks):
        """Return the letter grade and grade point for given total marks."""
        for minimum_marks, letter_grade, grade_point in ResultServices.GRADING_SCALE:
            if total_marks >= Decimal(str(minimum_marks)):
                return {
                    "letter_grade": letter_grade,
                    "grade_point": grade_point,
                }

        return {
            "letter_grade": "F",
            "grade_point": Decimal("0.00"),
        }
    





    @staticmethod
    def get_student_result(student_course_id):
        student_course = get_object_or_404(
            StudentCourse.objects.select_related(
                "student",
                "session_course",
            ),
            pk=student_course_id,
        )

        assessments = list(
            student_course.session_course.assessments.all()
        )

        marks_lookup = ResultServices._build_marks_lookup(
            student_course.session_course
        )

        return ResultServices.calculate_student_result(
            student_course=student_course,
            assessments=assessments,
            marks_lookup=marks_lookup,
        )

    @staticmethod
    def get_session_course_results(session_course_id):

        session_course = get_object_or_404(
            SessionCourse,
            pk=session_course_id,
        )

        return ResultServices.calculate_session_course_result(
            session_course
        )
    





    @staticmethod
    @transaction.atomic
    def publish_result(session_course_id, user):
        session_course = get_object_or_404(
            SessionCourse,
            pk=session_course_id,
        )

        result, _ = SessionCourseResult.objects.get_or_create(
            session_course=session_course,
        )

        if result.is_published:
            raise ValidationError(
                {
                    "detail": "Result has already been published."
                }
            )

        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = user
        result.save(
            update_fields=[
                "is_published",
                "published_at",
                "published_by",
            ]
        )

        return result