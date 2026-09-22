from rest_framework import serializers
from ..models import *

class StudentRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all()
    )

    session = serializers.PrimaryKeyRelatedField(
        queryset=Session.objects.all()
    )

    year_semester = serializers.PrimaryKeyRelatedField(
        queryset=YearSemester.objects.all()
    )


    def validate_email(self, value):
        return value.lower().strip()

    def validate_name(self, value):
        return value.strip()

    def validate(self, data):
        password = data.get('password')
        password2 = data.get('confirm_password')
        if password != password2:
            raise serializers.ValidationError('Passwords do not match')
        data.pop('confirm_password')
        return data
    

    
class VerifyEmailByOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('OTP must contain only digits')
        return value
    

class ResendVerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()




class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    session_name = serializers.CharField(source="session.academic_year", read_only=True)
    year = serializers.CharField(source="year_semester.year", read_only=True)
    semester = serializers.CharField(source="year_semester.semester", read_only=True)
    image = serializers.ImageField(source="user.image", read_only=True)
    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "name",
            "email",
            "department",
            "department_name",
            "student_id",
            "session",
            "session_name",
            "year_semester",
            "year",
            "semester",
            "cgpa",
            "phone",
            "father_name",
            "father_phone",
            "mother_name",
            "mother_phone",
            "approval_status",
            "address",
            "image",
        ]


class StudentProgressionSerializer(StudentSerializer):
    """Student list for the progression page.

    Adds the GPA of the student's CURRENT semester, exposed only when that
    semester result has been published. When unpublished, ``gpa`` is null and
    ``published`` is False so the UI can show a "Not published" placeholder.
    """

    current_semester_gpa = serializers.SerializerMethodField()
    current_semester_published = serializers.SerializerMethodField()

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + [
            "current_semester_gpa",
            "current_semester_published",
        ]

    def _current_semester_result(self, student):
        """The StudentSemesterResult for the student's current semester.

        Uses the prefetched ``semester_results`` when available to avoid an
        extra query per student. When a semester was retaken, the latest
        attempt wins.
        """
        results = getattr(student, "_prefetched_objects_cache", {}).get(
            "semester_results"
        )

        if results is None:
            results = student.semester_results.all()

        current = None

        for result in results:
            if (
                result.session_id != student.session_id
                or result.year_semester_id != student.year_semester_id
            ):
                continue

            if current is None or (result.attempt or 1) >= (current.attempt or 1):
                current = result

        return current

    def get_current_semester_published(self, student):
        result = self._current_semester_result(student)

        return bool(result and result.published)

    def get_current_semester_gpa(self, student):
        result = self._current_semester_result(student)

        if result is None or not result.published:
            return None

        return result.gpa