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




  