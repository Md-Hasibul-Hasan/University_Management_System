from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView, GenericAPIView
from django.db.models import Prefetch
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated, AllowAny
from ..permissions import IsAdminUser, IsTeacherUser, IsDepartmentChairman,IsAdminOrChairman,IsAdminOrTeacher
from rest_framework.response import Response
from rest_framework import status

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from ..paginations import MyPageNumberPagination


from ..models import *
from ..serializers import *
from ..services import *
from drf_spectacular.utils import extend_schema


class PublicReadPrivateWriteMixin:
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAdminUser()]
    

@extend_schema(tags=["Course"])
class CourseViewSet(PublicReadPrivateWriteMixin,ModelViewSet):
    queryset = Course.objects.select_related(
        "department",
        "year_semester",
    )

    serializer_class = CourseSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["department"]
    search_fields = ["code", "title"]
    ordering_fields = ["created_at"]
    pagination_class = MyPageNumberPagination

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = CourseServices.create_course(serializer)

        output = self.get_serializer(course)
        return Response(output.data, status=status.HTTP_201_CREATED)




@extend_schema(tags=["Session Course"] , summary="Auto generated when session or course is created")
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
    permission_classes = [IsAdminOrTeacher]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["session", "status"]
    search_fields = ["session__session_no", "session__academic_year", "course__code", "course__title"]
    ordering_fields = ["created_at"]
    pagination_class = MyPageNumberPagination



@extend_schema(tags=["Session Course Teacher"])
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
    permission_classes = [IsAdminOrTeacher]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["session_course__session", "session_course__course", "teacher"]
    search_fields = ["session_course__session__session_no", "session_course__session__academic_year", "session_course__course__code", "session_course__course__title", "teacher__user__name"]
    ordering_fields = ["created_at"]
    pagination_class = MyPageNumberPagination

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


@extend_schema(tags=["Session Course Assessment"])
class CourseAssessmentViewSet(ModelViewSet):
    queryset = (
        CourseAssessment.objects
        .select_related("session_course__course")
        .order_by("display_order")
    )

    serializer_class = CourseAssessmentSerializer
    permission_classes = [IsAdminOrTeacher]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["session_course","session_course__session", "session_course__course"]
    search_fields = ["session_course__course__title",  "session_course__course__code", "session_course__session__session_no","session_course__session__academic_year"]
    ordering_fields = ["created_at","display_order"]
    # ordering = ['display_order'] # Default ordering
    pagination_class = MyPageNumberPagination






@extend_schema(
    tags=["Session Course Student"],
    summary="Student Course List - auto generated when student is approved",
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
    permission_classes = [IsAdminOrTeacher]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # filterset_fields = ["session_course", "status", "student"]
    search_fields = ["student__user__name","student__student_id","session_course__course__code","session_course__course__title"]
    ordering_fields = ["created_at", "enrolled_at"]
    # ordering = ['-created_at'] # Default ordering
    pagination_class = MyPageNumberPagination


@extend_schema(
    tags=["Session Course Student"],
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
    permission_classes = [IsAdminOrTeacher]


