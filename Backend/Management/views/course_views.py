from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView, GenericAPIView
from django.db.models import Prefetch
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework import status

from ..models import *
from ..serializers import *
from ..services import *
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
        .select_related("session_course__course")
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







@extend_schema(
    tags=["Student Course"],
    summary="Student Course List",
)
class StudentCourseListView(ListAPIView):
    queryset = (
        StudentCourse.objects.select_related(
            "student__user",
            "session_course__course",
            "session_course__session",
        )
    )
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAdminUser]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "session_course", "status"]
    search_fields = ["student__user__name","student__student_id","session_course__course__code","session_course__course__title"]
    ordering_fields = ["created_at", "enrolled_at"]
    # ordering = ['-created_at'] # Default ordering
    # pagination_class = MyPageNumberPagination


@extend_schema(
    tags=["Student Course"],
    summary="Student Course Detail",
)
class StudentCourseDetailView(RetrieveAPIView):
    queryset = (
        StudentCourse.objects.select_related(
            "student__user",
            "session_course__course",
            "session_course__session",
        )
    )
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAdminUser]


