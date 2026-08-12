from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from ..paginations import MyPageNumberPagination

from ..models import *
from ..serializers import *
from ..services import *


class PublicReadPrivateWriteMixin:
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAuthenticated()]


@extend_schema(tags=["Faculty"])
class FacultyViewSet(PublicReadPrivateWriteMixin, ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]


    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    # ordering = ['-created_at']
    pagination_class = MyPageNumberPagination


@extend_schema(tags=["Department"])
class DepartmentViewSet(PublicReadPrivateWriteMixin, ModelViewSet):
    queryset = Department.objects.select_related("faculty")
    serializer_class = DepartmentSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['code', 'name', 'faculty__name']
    ordering_fields = ['code', 'name', 'created_at']
    pagination_class = MyPageNumberPagination


@extend_schema(tags=["Session"])
class SessionViewSet(PublicReadPrivateWriteMixin, ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['session_no', 'academic_year']
    ordering_fields = ['session_no', 'academic_year', 'created_at']
    pagination_class = MyPageNumberPagination

    # def perform_create(self, serializer):
    #     CourseServices.create_session(serializer)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = CourseServices.create_session(serializer)

        output = self.get_serializer(course)
        return Response(output.data, status=status.HTTP_201_CREATED)

@extend_schema(tags=["Year & Semester"])
class YearSemesterViewSet(PublicReadPrivateWriteMixin, ModelViewSet):
    queryset = YearSemester.objects.all()
    serializer_class = YearSemesterSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['year', 'semester']
    ordering_fields = ['year', 'semester', 'created_at']
    pagination_class = MyPageNumberPagination



