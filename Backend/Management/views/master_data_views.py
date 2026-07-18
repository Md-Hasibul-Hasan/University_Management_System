from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from ..models import (
    Faculty,
    Department,
    Session,
    YearSemester,
)

from ..serializers import (
    FacultySerializer,
    DepartmentSerializer,
    SessionSerializer,
    YearSemesterSerializer,
)


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


@extend_schema(tags=["Year & Semester"])
class YearSemesterViewSet(ModelViewSet):
    queryset = YearSemester.objects.all()
    serializer_class = YearSemesterSerializer
    permission_classes = [IsAuthenticated]



