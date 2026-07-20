from django.db import transaction
from ..models import *

class CourseServices:

    @staticmethod
    @transaction.atomic
    def create_course(serializer):
        course = serializer.save()

        sessions = Session.objects.all()

        session_courses = [
            SessionCourse(
                session=session,
                course=course,
            )
            for session in sessions
        ]

        SessionCourse.objects.bulk_create(
            session_courses,
            ignore_conflicts=True,
        )

        return course
    

    @staticmethod
    @transaction.atomic
    def create_session(serializer):
        print("create session called")
        session = serializer.save()

        courses = Course.objects.all()

        session_courses = [
            SessionCourse(
                session=session,
                course=course,
            )
            for course in courses
        ]

        SessionCourse.objects.bulk_create(
            session_courses,
            ignore_conflicts=True,
        )

        return session