from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from ..models import *
from ..serializers import *
from ..services import *


@extend_schema(tags=["Faculty"])
class FacultyViewSet(ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=["Department"])
class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.select_related("faculty")
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=["Session"])
class SessionViewSet(ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    # def perform_create(self, serializer):
    #     CourseServices.create_session(serializer)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = CourseServices.create_session(serializer)

        output = self.get_serializer(course)
        return Response(output.data, status=status.HTTP_201_CREATED)

@extend_schema(tags=["Year & Semester"])
class YearSemesterViewSet(ModelViewSet):
    queryset = YearSemester.objects.all()
    serializer_class = YearSemesterSerializer
    permission_classes = [IsAuthenticated]



