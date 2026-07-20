from ..models import *
from .helpers import Helpers
from django.conf import settings
from ..utils import Util
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group
from django.utils.encoding import force_bytes, smart_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from django.db.models import Count

import time
from django.utils import timezone





class Marks_Attendance_Services:




    @staticmethod
    def get_assignment(
        *,
        session_course,
        teacher,
    ):
        assignment = SessionCourseTeacher.objects.filter(
            session_course=session_course,
            teacher=teacher,
        ).first()

        if not assignment:
            raise ValidationError(
                {
                    "detail": "You are not assigned to this course."
                }
            )

        return assignment


    @staticmethod
    def validate_teacher(
        *,
        session_course,
        teacher,
    ):
        Marks_Attendance_Services.get_assignment(
            session_course=session_course,
            teacher=teacher,
        )


    @staticmethod
    @transaction.atomic
    def save_marks(
        assessment,
        marks_data,
        teacher,
        entered_by,
    ):
        Marks_Attendance_Services.validate_teacher(
            session_course=assessment.session_course,
            teacher=teacher,
        )

        student_courses = StudentCourse.objects.select_related(
            "session_course__course",
        ).filter(
            id__in=[item["student_course"] for item in marks_data]
        )

        student_course_map = {
            student_course.id: student_course
            for student_course in student_courses
        }

        for item in marks_data:

            student_course = student_course_map.get(
                item["student_course"]
            )

            if not student_course:
                raise ValidationError(
                    {
                        "student_course":
                        f"StudentCourse {item['student_course']} does not exist."
                    }
                )

            if (
                student_course.session_course_id
                != assessment.session_course_id
            ):
                raise ValidationError(
                    {
                        "student_course":
                        "Student is not enrolled in this course."
                    }
                )

            if item["marks"] < 0:
                raise ValidationError(
                    {
                        "marks":
                        "Marks cannot be negative."
                    }
                )

            if item["marks"] > assessment.max_marks:
                raise ValidationError(
                    {
                        "marks":
                        f"Maximum marks is {assessment.max_marks}."
                    }
                )

            StudentAssessmentMark.objects.update_or_create(
                student_course=student_course,
                assessment=assessment,
                defaults={
                    "marks": item["marks"],
                    "entered_by": entered_by,
                },
            )


    @staticmethod
    def populate_attendance_percentage(
        students,
        session_course,
    ):
        total_classes = AttendanceSession.objects.filter(
            session_course=session_course,
        ).count()

        present_counts = (
            StudentAttendance.objects.filter(
                attendance_session__session_course=session_course,
                status=StudentAttendance.AttendanceStatus.PRESENT,
            )
            .values("student_course")
            .annotate(
                present_count=Count("id"),
            )
        )

        present_map = {
            row["student_course"]: row["present_count"]
            for row in present_counts
        }

        for student in students:
            present = present_map.get(student.id, 0)

            if total_classes:
                student.attendance_percentage = round(
                    present / total_classes * 100,
                    2,
                )
            else:
                student.attendance_percentage = 0


        return students


    @staticmethod
    @transaction.atomic
    def create_attendance_session(
        *,
        session_course,
        teacher,
        date,
    ):
        Marks_Attendance_Services.validate_teacher(
            session_course=session_course,
            teacher=teacher,
        )

        try:
            return AttendanceSession.objects.create(
                session_course=session_course,
                taken_by=teacher.user,
                date=date,
            )

        except IntegrityError:
            raise ValidationError(
                {
                    "date": "Attendance has already been taken for this date."
                }
            )


    @staticmethod
    @transaction.atomic
    def save_attendance(
        *,
        attendance_session,
        attendance_data,
        teacher,
    ):
        Marks_Attendance_Services.validate_teacher(
            session_course=attendance_session.session_course,
            teacher=teacher,
        )

        if attendance_session.is_locked:
            raise ValidationError(
                {
                    "detail": "Attendance session is locked."
                }
            )

        student_courses = StudentCourse.objects.filter(
            session_course=attendance_session.session_course,
        )

        student_map = {
            student.id: student
            for student in student_courses
        }

        for record in attendance_data:

            student_course = student_map.get(
                record["student_course"]
            )

            if not student_course:
                raise ValidationError(
                    {
                        "student_course":
                        f"StudentCourse {record['student_course']} is invalid."
                    }
                )

            StudentAttendance.objects.update_or_create(
                attendance_session=attendance_session,
                student_course=student_course,
                defaults={
                    "status": record["status"],
                },
            )