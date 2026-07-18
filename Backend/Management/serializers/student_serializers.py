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
            "year_semester",
            "year",
            "semester",
            "cgpa",
            "phone",
            "father_name",
            "father_phone",
            "mother_name",
            "mother_phone",
            "is_approved",
            "address",
            "image",
        ]