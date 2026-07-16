from rest_framework import serializers
from ..models import (
    Faculty,
    Department,
    Session,
    YearSemester,
)


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ["id", "name"]


class DepartmentSerializer(serializers.ModelSerializer):
    faculty = serializers.SlugRelatedField(
        slug_field="name", 
        queryset=Faculty.objects.all()
    )
    class Meta:
        model = Department
        fields = ["id", "code",  "name", "faculty"]


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "session_no", "academic_year"]


class YearSemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = YearSemester
        fields = ["id", "year", "semester"]





