from rest_framework import serializers

from ..services import *
from ..models import *


class CourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = ["id", "code", "title", "credit", "department", "year_semester", "course_type", "is_active"]


class CourseAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAssessment
        fields = ["id", "session_course", "title", "assessment_type", "max_marks", "calculation_type", "display_order"]
        extra_kwargs = {
            "calculation_type": {"required": True},
            "assessment_type": {"required": True},
        }

    # def validate(self, attrs):
    #     session_course = attrs.get(
    #         "session_course",
    #         getattr(self.instance, "session_course", None),
    #     )

    #     assessment_type = attrs.get(
    #         "assessment_type",
    #         getattr(self.instance, "assessment_type", None),
    #     )

    #     calculation_type = attrs.get(
    #         "calculation_type",
    #         getattr(self.instance, "calculation_type", None),
    #     )


    #     if assessment_type in CourseAssessment.GROUPED_ASSESSMENT_TYPES:
    #         existing = (
    #             CourseAssessment.objects.filter(
    #                 session_course=session_course,
    #                 assessment_type=assessment_type,
    #             )
    #             .exclude(pk=getattr(self.instance, "pk", None))
    #             .first()
    #         )

    #         if (
    #             existing
    #             and existing.calculation_type != calculation_type
    #         ):
    #             raise serializers.ValidationError(
    #                 {
    #                     "calculation_type": (
    #                         f"All {existing.get_assessment_type_display()} "
    #                         "assessments in the same course must use the same "
    #                         "calculation type."
    #                     )
    #                 }
    #             )

    #     return attrs


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
            "status",
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



class StudentCourseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.name", read_only=True)
    student_id = serializers.CharField(source="student.student_id", read_only=True)

    course_code = serializers.CharField(
        source="session_course.course.code",
        read_only=True,
    )

    course_title = serializers.CharField(
        source="session_course.course.title",
        read_only=True,
    )

    session = serializers.CharField(
        source="session_course.session",
        read_only=True,
    )

    class Meta:
        model = StudentCourse
        fields = [
            "id",

            "student",
            "student_id",
            "student_name",

            "session_course",
            "course_code",
            "course_title",
            "session",

            "status",
            "enrolled_at",

            "created_at",
            "updated_at",
        ]