from rest_framework import serializers

from ..services import *
from ..models import *






# ================== Assessments ===================



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

        if assessment.assessment_type != CourseAssessment.AssessmentType.ATTENDANCE:
            return None

        return getattr(obj, "attendance_percentage", 0)



# ============================= ATTENDANCE =============================


class AttendanceSessionSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceSession
        fields = [
            "id",
            "date",
        ]


class StudentAttendanceSerializer(serializers.Serializer):
    student_course = serializers.IntegerField()

    status = serializers.ChoiceField(
        choices=StudentAttendance.AttendanceStatus.choices,
    )


class AttendanceBulkSerializer(serializers.Serializer):
    attendance = StudentAttendanceSerializer(
        many=True,
    )


class AttendanceStudentSerializer(serializers.ModelSerializer):

    student_course = serializers.ReadOnlyField(
        source="id",
    )

    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    student_name = serializers.CharField(
        source="student.user.name",
        read_only=True,
    )

    status = serializers.SerializerMethodField()

    class Meta:
        model = StudentCourse
        fields = [
            "student_course",
            "student_id",
            "student_name",
            "status",
        ]

    def get_status(self, obj):
        attendance = getattr(
            obj,
            "attendance_cache",
            [],
        )

        if attendance:
            return attendance[0].status

        return None