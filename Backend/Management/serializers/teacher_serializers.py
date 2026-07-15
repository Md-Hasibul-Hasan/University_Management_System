from rest_framework import serializers
from ..models import *


class TeacherInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherInvitation
        fields = [
            "name",
            "email",
            "employee_id",
            "department",
            "designation",
        ]

    def validate_name(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.lower().strip()


class TeacherRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)


    def validate(self, data):
        password = data.get('password')
        password2 = data.get('confirm_password')
        if password != password2:
            raise serializers.ValidationError('Passwords do not match')
        data.pop('confirm_password')
        return data