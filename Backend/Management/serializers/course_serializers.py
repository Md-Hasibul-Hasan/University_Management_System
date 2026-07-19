from rest_framework import serializers

from ..models import *


class CourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = ["id", "code", "title", "credit", "department", "year_semester", "course_type", "is_active"]


class CourseAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAssessment
        fields = ["id", "session_course", "title", "max_marks", "calculation_type", "group", "display_order"]
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







class StudentMarkSerializer(serializers.Serializer):
    student_course = serializers.IntegerField()
    marks = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
    )      



class StudentAssessmentBulkSerializer(serializers.Serializer):
    marks = StudentMarkSerializer(many=True)




class AssessmentStudentSerializer(serializers.ModelSerializer):
    student_course = serializers.ReadOnlyField(source="id")

    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    student_name = serializers.CharField(
        source="student.user.name",
        read_only=True,
    )

    marks = serializers.SerializerMethodField()

    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = StudentCourse
        fields = [
            "student_course",
            "student_id",
            "student_name",
            "marks",
            "attendance_percentage",
        ]

    def get_marks(self, obj):
        marks = getattr(obj, "assessment_marks_cache", [])

        if marks:
            return marks[0].marks

        return None

    def get_attendance_percentage(self, obj):
        assessment = self.context["assessment"]

        if assessment.group != assessment.AssessmentGroup.ATTENDANCE:
            return None

        # Attendance module তৈরি হলে এখানে percentage return করবে
        return None

