from rest_framework import serializers


class StudentProfileSerializer(serializers.Serializer):
    student_id = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    session = serializers.CharField(allow_null=True)
    year_semester = serializers.CharField(allow_null=True)
    cgpa = serializers.DecimalField(max_digits=3, decimal_places=2)
    phone = serializers.CharField(allow_null=True)
    father_name = serializers.CharField(allow_null=True)
    father_phone = serializers.CharField(allow_null=True)
    mother_name = serializers.CharField(allow_null=True)
    mother_phone = serializers.CharField(allow_null=True)


class TeacherProfileSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    designation = serializers.CharField()
    is_head = serializers.BooleanField()
    phone = serializers.CharField(allow_null=True)
    address = serializers.CharField(allow_null=True)


class ProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    image = serializers.ImageField(allow_null=True)

    role = serializers.CharField()
    is_admin = serializers.BooleanField()

    student = StudentProfileSerializer(required=False)
    teacher = TeacherProfileSerializer(required=False)


class UpdateStudentProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)

    phone = serializers.CharField(required=False, allow_blank=True)
    father_name = serializers.CharField(required=False, allow_blank=True)
    father_phone = serializers.CharField(required=False, allow_blank=True)
    mother_name = serializers.CharField(required=False, allow_blank=True)
    mother_phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)


class UpdateTeacherProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    image = serializers.ImageField(required=False)

    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)