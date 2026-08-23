from django.db import transaction
from ..models import *
from rest_framework.serializers import Serializer


class CourseServices:

    @staticmethod
    @transaction.atomic
    def create_course(serializer: Serializer) -> Course:
        course = serializer.save()

        sessions = Session.objects.all()

        session_courses = []

        for session in sessions:
            session_courses.append(
                SessionCourse(
                    session=session,
                    course=course,
                )
            )
        # session_courses = [
        #     SessionCourse(
        #         session=session,
        #         course=course,
        #     )
        #     for session in sessions
        # ]

        SessionCourse.objects.bulk_create(
            session_courses,
            ignore_conflicts=True,
        )

        # Newly created course-এর SessionCourse গুলো নিয়ে
        # approved matching students-এর enrollment তৈরি
        session_courses = SessionCourse.objects.filter(
            course=course
        )

        student_courses = []

        for session_course in session_courses:
            students = Student.objects.filter(
                session=session_course.session,
                department=course.department,
                year_semester=course.year_semester,
                approval_status=Student.ApprovalStatus.APPROVED,
            )

            for student in students:
                student_courses.append(
                    StudentCourse(
                        student=student,
                        session_course=session_course,
                    )
                )

        StudentCourse.objects.bulk_create(
            student_courses,
            ignore_conflicts=True,
        )

        return course
    

    @staticmethod
    @transaction.atomic
    def create_session(serializer: Serializer) -> Session:
        session = serializer.save()

        courses = Course.objects.all()

        session_courses = []

        for course in courses:
            session_courses.append(
                SessionCourse(
                    session=session,
                    course=course,
                )
            )
            
        # session_courses = [
        #     SessionCourse(
        #         session=session,
        #         course=course,
        #     )
        #     for course in courses
        # ]

        SessionCourse.objects.bulk_create(
            session_courses,
            ignore_conflicts=True,
        )

        # Newly created session-এর SessionCourse
        session_courses = SessionCourse.objects.filter(
            session=session
        )

        student_courses = []

        for session_course in session_courses:
            students = Student.objects.filter(
                session=session,
                department=session_course.course.department,
                year_semester=session_course.course.year_semester,
                approval_status=Student.ApprovalStatus.APPROVED,
            )

            for student in students:
                student_courses.append(
                    StudentCourse(
                        student=student,
                        session_course=session_course,
                    )
                )

        StudentCourse.objects.bulk_create(
            student_courses,
            ignore_conflicts=True,
        )

        return session

    