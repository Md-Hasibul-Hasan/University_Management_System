from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction

from ..models import *
from .helpers import Helpers
from ..utils import Util


class AuthServices:

    @staticmethod
    def login(
        email: str,
        password: str,
        ip_address: str | None = None,
    ):

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValidationError({
                "detail": "Invalid email or password."
            })

        if Helpers.is_account_locked(user):
            raise ValidationError({
                "detail": "Your account is temporarily locked. Please try again later."
            })

        if not user.check_password(password):
            Helpers.record_login_failure(
                user=user,
                ip_address=ip_address,
            )

            raise ValidationError({
                "detail": "Invalid email or password."
            })

        if not user.is_active:
            raise ValidationError({
                "detail": "Please verify your email first."
            })

        if hasattr(user, "student_profile"):
            if user.student_profile.approval_status != Student.ApprovalStatus.APPROVED:
                raise ValidationError({
                    "detail": "Your account is waiting for admin approval."
                })

        Helpers.record_login_success(
            user=user,
            ip_address=ip_address,
        )

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    

    @staticmethod
    @transaction.atomic
    def change_password(
        user: User,
        current_password: str,
        new_password: str,
    ) -> User:

        if not user.check_password(current_password):
            raise ValidationError({
                "current_password": "Current password is incorrect."
            })

        if current_password == new_password:
            raise ValidationError({
                "new_password": "New password cannot be the same as the current password."
            })
        
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            raise ValidationError({
                "new_password": e.messages
            })

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return user
    

    @staticmethod
    def forgot_password(email: str):

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValidationError({
                "email": "User not found."
            })

        if not user.is_active:
            raise ValidationError({
                "detail": "Please verify your email first."
            })

        otp = Helpers.generate_password_reset_otp(user)

        email_data = {
            "email_subject": "Reset Your Password",
            "to_email": user.email,
            "context": {
                "subject": "Reset Your Password",
                "body": "Use the OTP below to reset your password. This OTP is valid for 10 minutes.",
                "otp": otp,
            },
        }

        Util.send_email(email_data)

        return user

    @staticmethod
    @transaction.atomic
    def reset_password(
        email: str,
        otp: str,
        new_password: str,
    ):

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValidationError({
                "email": "User not found."
            })
        
        if not user.is_active:
            raise ValidationError({
                "detail": "Please verify your email first."
            })

        result = Helpers.verify_password_reset_otp(user, otp)

        if result == "locked":
            raise ValidationError({
                "detail": "Too many incorrect OTP attempts. Please try again later."
            })

        if result == "expired":
            raise ValidationError({
                "detail": "OTP has expired."
            })

        if result == "invalid":
            raise ValidationError({
                "detail": "Invalid OTP."
            })

        if result == "not_found":
            raise ValidationError({
                "detail": "OTP not found."
            })

        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            raise ValidationError({
                "new_password": e.messages
            })

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return user



    @staticmethod
    def change_email(
        user: User,
        new_email: str,
    ):

        new_email = new_email.lower().strip()

        if user.email == new_email:
            raise ValidationError({
                "new_email": "This is already your current email."
            })

        if User.objects.filter(email=new_email).exists():
            raise ValidationError({
                "new_email": "A user with this email already exists."
            })

        otp = Helpers.generate_pending_email_otp(
            user=user,
            new_email=new_email,
        )

        email_data = {
            "email_subject": "Verify Your New Email",
            "to_email": new_email,
            "context": {
                "subject": "Verify Your New Email",
                "body": "Use the OTP below to verify your new email. This OTP is valid for 10 minutes.",
                "otp": otp,
            },
        }

        Util.send_email(email_data)

        return user


    @staticmethod
    def verify_change_email(
        user: User,
        otp: str,
    ):

        result = Helpers.verify_pending_email_otp(
            user=user,
            raw_otp=otp,
        )


        if result == "locked":
            raise ValidationError({
                "detail": "Too many incorrect OTP attempts. Please try again later."
            })

        if result == "expired":
            raise ValidationError({
                "detail": "OTP has expired."
            })

        if result == "invalid":
            raise ValidationError({
                "detail": "Invalid OTP."
            })

        if result == "not_found":
            raise ValidationError({
                "detail": "OTP not found."
            })

        return user