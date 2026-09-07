from ..models import StudentSemesterResult, Session, YearSemester
from rest_framework import serializers


class SemesterResultRequestSerializer(serializers.Serializer):
    """Request payload for a department's semester result calculation/publish."""

    session = serializers.PrimaryKeyRelatedField(queryset=Session.objects.all())
    year_semester = serializers.PrimaryKeyRelatedField(queryset=YearSemester.objects.all())


class StudentCourseResultSerializer(serializers.Serializer):

    student_id = serializers.CharField()
    student_name = serializers.CharField()
    student_course = serializers.IntegerField()

    course_code = serializers.CharField()
    course_title = serializers.CharField()
    year_semester = serializers.CharField()
    session = serializers.CharField()
    session_course = serializers.IntegerField()


    assessments = serializers.ListField()

    total_marks = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
    )

    letter_grade = serializers.CharField()

    grade_point = serializers.DecimalField(
        max_digits=3,
        decimal_places=2,
    )



class StudentSemesterResultSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.user.name",
        read_only=True
    )

    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True
    )

    session_name = serializers.CharField(
        source="session.academic_year",
        read_only=True
    )

    year = serializers.CharField(
        source="year_semester.get_year_display",
        read_only=True,
    )

    semester = serializers.CharField(
        source="year_semester.get_semester_display",
        read_only=True,
    )

    class Meta:
        model = StudentSemesterResult
        fields = [
            "id","student","student_name","student_id","session","session_name","year_semester","year","semester","gpa","status","promoted","published","published_at",
        ]

        read_only_fields = [
            "id","student_name","student_id","session_name","year","semester","gpa","status","promoted","published","published_at",
        ]