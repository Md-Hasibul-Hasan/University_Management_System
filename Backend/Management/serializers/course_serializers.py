from rest_framework import serializers

from ..models import *


class CourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = ["id", "code", "title", "credit", "department", "year_semester", "course_type", "is_active"]


class CourseAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAssessment
        fields = ["id", "course", "title", "max_marks", "calculation_type", "group", "display_order"]
        extra_kwargs = {
            "calculation_type": {"required": True},
            "group": {"required": True},
        }

    def validate(self, attrs):
        calculation_type = attrs.get(
            "calculation_type",
            getattr(self.instance, "calculation_type", None),
        )

        group = attrs.get(
            "group",
            getattr(self.instance, "group", None),
        )

        if (
            calculation_type == CourseAssessment.CalculationType.AVERAGE
            and group == CourseAssessment.AssessmentGroup.NONE
        ):
            raise serializers.ValidationError(
                {
                    "group": (
                        "Average calculation requires an assessment group."
                    )
                }
            )

        if (
            calculation_type == CourseAssessment.CalculationType.INDIVIDUAL
            and group != CourseAssessment.AssessmentGroup.NONE
        ):
            raise serializers.ValidationError(
                {
                    "group": (
                        "Individual calculation must use 'No Group'."
                    )
                }
            )

        return attrs
    






class SessionCourseSerializer(serializers.ModelSerializer):
    session_name = serializers.CharField(
        source="session.academic_year",
        read_only=True
    )
    course_code = serializers.CharField(
        source="course.code",
        read_only=True
    )
    course_title = serializers.CharField(
        source="course.title",
        read_only=True
    )

    class Meta:
        model = SessionCourse
        fields = [
            "id",
            "session",
            "session_name",
            "course",
            "course_code",
            "course_title",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
        ]


class SessionCourseTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True
    )

    class Meta:
        model = SessionCourseTeacher
        fields = [
            "id",
            "session_course",
            "teacher",
            "teacher_name",
        ]




