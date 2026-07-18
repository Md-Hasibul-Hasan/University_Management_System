from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser

from ..models import *
from ..serializers import *
from drf_spectacular.utils import extend_schema

@extend_schema(tags=["Course"])
class CourseViewSet(ModelViewSet):
    queryset = Course.objects.select_related(
        "department",
        "year_semester",
    )

    serializer_class = CourseSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=["Course"])
class CourseAssessmentViewSet(ModelViewSet):
    queryset = (
        CourseAssessment.objects
        .select_related("course")
        .order_by("display_order")
    )

    serializer_class = CourseAssessmentSerializer
    permission_classes = [IsAdminUser]






@extend_schema(tags=["Assign Course & Course Teacher"])
class SessionCourseViewSet(ModelViewSet):
    queryset = (
        SessionCourse.objects
        .select_related(
            "session",
            "course",
            "course__department",
            "course__year_semester",
        )
    )

    serializer_class = SessionCourseSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=["Assign Course & Course Teacher"])
class SessionCourseTeacherViewSet(ModelViewSet):
    queryset = (
        SessionCourseTeacher.objects
        .select_related(
            "teacher",
            "teacher__user",
            "session_course",
            "session_course__session",
            "session_course__course",
        )
    )

    serializer_class = SessionCourseTeacherSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)