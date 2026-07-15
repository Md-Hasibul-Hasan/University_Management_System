import uuid
from datetime import timedelta
from .helpers import Helpers
from django.contrib.auth.models import Group
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password

from ..models import *
from ..utils import Util


class TeacherServices:


    @staticmethod
    @transaction.atomic
    def create_teacher_invitation(
        invited_by: User,
        name: str,
        email: str,
        employee_id: str,
        department: Department,
        designation: str,
    ) -> TeacherInvitation:

        email = email.lower().strip()
        name = name.strip()

        if User.objects.filter(email=email).exists():
            raise ValidationError({
                "email": "A user with this email already exists."
            })

        if employee_id and Teacher.objects.filter(employee_id=employee_id).exists():
            raise ValidationError({
                "employee_id": "This employee ID is already assigned."
            })

        invitation = TeacherInvitation.objects.filter(
            email=email,
            is_used=False,
        ).first()

        if invitation:

            if (
                employee_id
                and invitation.employee_id != employee_id
                and TeacherInvitation.objects.filter(
                    employee_id=employee_id,
                    is_used=False,
                ).exclude(pk=invitation.pk).exists()
            ):
                raise ValidationError({
                    "employee_id": "An active invitation already exists for this employee ID."
                })

            invitation.name = name
            invitation.employee_id = employee_id
            invitation.department = department
            invitation.designation = designation
            invitation.invited_by = invited_by
            invitation.token = uuid.uuid4()
            invitation.expires_at = timezone.now() + timedelta(
                days=settings.TEACHER_INVITATION_EXPIRE_DAYS
            )

            invitation.save()

        else:

            if employee_id and TeacherInvitation.objects.filter(
                employee_id=employee_id,
                is_used=False,
            ).exists():
                raise ValidationError({
                    "employee_id": "An active invitation already exists for this employee ID."
                })

            invitation = TeacherInvitation.objects.create(
                name=name,
                email=email,
                employee_id=employee_id,
                department=department,
                designation=designation,
                invited_by=invited_by,
                expires_at=timezone.now() + timedelta(
                    days=settings.TEACHER_INVITATION_EXPIRE_DAYS
                ),
            )

        invitation_link = (
            f"{settings.FRONTEND_URL}/teacher/register/{invitation.token}/"
        )

        email_data = {
            "email_subject": "Teacher Invitation",
            "to_email": invitation.email,
            "context": {
                "subject": "Teacher Invitation",
                "body": (
                    "You have been invited to register as a teacher.\n\n"
                    f"Department: {department.name}\n"
                    f"Designation: {designation.replace('_', ' ').title()}"
                ),
                "cta_url": invitation_link,
                "cta_text": "Complete Registration",
            },
        }

        Util.send_email(email_data)

        return invitation



    @staticmethod
    def _validate_teacher_invitation(token: str) -> TeacherInvitation:

        try:
            invitation = TeacherInvitation.objects.get(token=token)

        except TeacherInvitation.DoesNotExist:
            raise ValidationError({
                "detail": "Invalid invitation link."
            })

        if invitation.is_used:
            raise ValidationError({
                "detail": "This invitation has already been used."
            })

        if invitation.expires_at < timezone.now():
            raise ValidationError({
                "detail": "This invitation has expired."
            })

        if User.objects.filter(email=invitation.email).exists():
            raise ValidationError({
                "detail": "A user with this email already exists."
            })

        return invitation

    @staticmethod
    @transaction.atomic
    def register_teacher(
        token: str,
        name: str,
        email: str,
        password: str,
    ) -> User:

        invitation = TeacherServices._validate_teacher_invitation(token)

        if invitation.email.lower() != email.lower().strip():
            raise ValidationError({
                "email": "Email does not match the invitation."
            })

        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise ValidationError({
                "password": e.messages
            })

        user = Helpers.register_user(
            name=name,
            email=email,
            password=password,
        )

        Teacher.objects.create(
            user=user,
            employee_id=invitation.employee_id ,
            department=invitation.department,
            designation=invitation.designation,
        )

        teacher_group = Group.objects.get(name="Teacher")
        user.groups.add(teacher_group)

        invitation.is_used = True
        invitation.save(update_fields=["is_used"])

        user.is_active = True
        user.save(update_fields=["is_active"])

        return user