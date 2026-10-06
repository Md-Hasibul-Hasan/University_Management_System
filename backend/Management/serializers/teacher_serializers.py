from django.contrib.auth.models import Group
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from ..models import *


class TeacherInvitationSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(validators=[])
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
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)


    def validate(self, data):
        password = data.get('password')
        password2 = data.get('confirm_password')
        if password != password2:
            raise serializers.ValidationError('Passwords do not match')
        data.pop('confirm_password')
        return data
    

class TeacherSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    image = serializers.ImageField(source="user.image", read_only=True)
    # Writable, but only Admin requesters may change it (enforced in update()).
    is_admin = serializers.BooleanField(required=False)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user",
            "name",
            "email",
            "department",
            "department_name",
            "employee_id",
            "designation",
            "is_head",
            "is_admin",
            "phone",
            "address",
            "image",
        ]

    def create(self, validated_data):
        validated_data.pop("is_admin", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        is_admin = validated_data.pop("is_admin", None)
        teacher = super().update(instance, validated_data)

        if is_admin is None:
            return teacher

        request = self.context.get("request")
        actor = getattr(request, "user", None)

        is_actor_admin = bool(
            actor
            and actor.is_authenticated
            and (
                actor.is_staff
                or actor.is_superuser
                or actor.groups.filter(name="Admin").exists()
            )
        )

        if not is_actor_admin:
            raise PermissionDenied("Only admin users can change admin status.")

        if actor == instance.user:
            raise PermissionDenied("You cannot change your own admin status.")

        group, _ = Group.objects.get_or_create(name="Admin")

        if is_admin:
            teacher.user.groups.add(group)
        else:
            teacher.user.groups.remove(group)

        return teacher