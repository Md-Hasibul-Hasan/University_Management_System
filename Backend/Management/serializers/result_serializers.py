from rest_framework import serializers


class StudentResultSerializer(serializers.Serializer):

    student_course = serializers.IntegerField()
    student_id = serializers.CharField()
    student_name = serializers.CharField()

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


class SessionCourseResultSerializer(
    StudentResultSerializer
):
    pass