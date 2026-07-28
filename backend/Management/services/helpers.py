import secrets
from ..models import *
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.exceptions import ValidationError






class Helpers:
    @staticmethod
    def _generate_otp() -> str:
        return str(secrets.randbelow(900000) + 100000)
    
    @staticmethod
    def _check_otp(hash_otp: str, raw_otp: str) -> bool:
        if not hash_otp:
            return False
        return check_password(raw_otp, hash_otp)
    
    @staticmethod
    def _get_latest_otp(user: User, purpose: str) -> OTP | None:
        return (
            OTP.objects.filter(user=user, purpose=purpose)
            .order_by("-created_at")
            .first()
        )
    

    
    @staticmethod
    def _create_otp(user: User, purpose: str) -> tuple[str, OTP]:
        
        latest_otp = Helpers._get_latest_otp(user, purpose)

        if latest_otp and latest_otp.locked_until:
            if timezone.now() < latest_otp.locked_until:
                raise ValidationError({
                    "detail": "Too many incorrect OTP attempts. Please try again later."
                })

            latest_otp.locked_until = None
            latest_otp.attempts = 0
            latest_otp.save(update_fields=["locked_until", "attempts"])

        if latest_otp and latest_otp.last_otp_sent_at :
            elapsed = (timezone.now() - latest_otp.last_otp_sent_at).total_seconds()

            if elapsed < settings.OTP_RESEND_COOLDOWN:
                remaining = int(settings.OTP_RESEND_COOLDOWN - elapsed)
                raise ValidationError({
                    "detail": f"Please wait {remaining} seconds before requesting another OTP."
                })

        raw_otp = Helpers._generate_otp()

        otp_obj, _ = OTP.objects.update_or_create(
            user=user,
            purpose=purpose,
            defaults={
                "otp_hash": make_password(raw_otp),
                "expires_at": timezone.now() + timedelta(seconds=settings.OTP_EXPIRE_TIMEOUT),
                "attempts": 0,
                "locked_until": None,
                "last_otp_sent_at": timezone.now(),
            },
        )

        return raw_otp, otp_obj
        
    @staticmethod
    def _verify_otp_record(otp: OTP | None, raw_otp: str) -> str:
        if otp is None:
            return "not_found"

        if otp.locked_until:
            if timezone.now() < otp.locked_until:
                return "locked"

            otp.locked_until = None
            otp.attempts = 0
            otp.save(update_fields=["locked_until", "attempts"])

        if not otp.otp_hash or not otp.expires_at:
            return "invalid"

        if timezone.now() > otp.expires_at:
            return "expired"

        if not Helpers._check_otp(otp.otp_hash, raw_otp):
            otp.attempts += 1

            if otp.attempts >= settings.MAX_WRONG_OTP_ATTEMPTS:
                otp.locked_until = timezone.now() + timedelta(
                    seconds=settings.OTP_LOCKED_UNTIL
                )

            otp.save(update_fields=["attempts", "locked_until"])
            return "invalid"

        otp.otp_hash = None
        otp.attempts = 0
        otp.locked_until = None
        otp.expires_at = None
        otp.save(
            update_fields=[
                "otp_hash",
                "attempts",
                "locked_until",
                "expires_at",
            ]
        )

        return "success"
    
    @staticmethod
    def is_account_locked(user: User) -> bool:
        security, _ = UserSecurity.objects.get_or_create(user=user)
        if security.locked_until:
            if timezone.now() > security.locked_until:
                security.locked_until = None
                security.failed_login_attempts = 0
                security.save(update_fields=["locked_until", "failed_login_attempts"])
                return False
            return True
        return False
    

    @staticmethod
    def record_login_success(user: User, ip_address: str | None = None) -> None:
        security, _ = UserSecurity.objects.get_or_create(user=user)
        security.failed_login_attempts = 0
        security.locked_until = None
        if ip_address:
            security.last_login_ip = ip_address
        security.save(update_fields=["failed_login_attempts", "locked_until", "last_login_ip"])

    @staticmethod
    def record_login_failure(user: User, ip_address: str | None = None) -> bool:
        if Helpers.is_account_locked(user):
            return False
        security, _ = UserSecurity.objects.get_or_create(user=user)
        security.failed_login_attempts += 1
        if ip_address:
            security.last_login_ip = ip_address
        if security.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            security.locked_until = timezone.now() + timedelta(seconds=settings.ACCOUNT_LOCKOUT_DURATION)
        security.save(update_fields=["failed_login_attempts", "last_login_ip", "locked_until"])
        return True
    


    @staticmethod
    def register_user(name: str, email: str, password: str, **extra_fields) -> User:

        user = User.objects.create_user(
            name=name.strip(),
            email=email.lower().strip(),
            password=password,
            **extra_fields,
        )

        return user
    

    @staticmethod
    def generate_verification_otp(user: User) -> str:
        raw_otp, _ = Helpers._create_otp(user, OTPPurpose.EMAIL_VERIFICATION)
        return raw_otp

    @staticmethod
    def verify_verification_otp(user: User, raw_otp: str) -> str:
        otp = Helpers._get_latest_otp(user, OTPPurpose.EMAIL_VERIFICATION)
        return Helpers._verify_otp_record(otp, raw_otp)
    
    @staticmethod
    def generate_password_reset_otp(user: User) -> str:
        raw_otp, _ = Helpers._create_otp(user, OTPPurpose.PASSWORD_RESET)
        return raw_otp
    
    @staticmethod
    def verify_password_reset_otp(user: User, raw_otp: str) -> str:
        otp = Helpers._get_latest_otp(user, OTPPurpose.PASSWORD_RESET)
        return Helpers._verify_otp_record(otp, raw_otp)

        
    @staticmethod
    def generate_pending_email_otp(user: User, new_email: str) -> str:
        new_email = new_email.lower().strip()
        change_request, _ = EmailChangeRequest.objects.update_or_create(
            user=user,
            defaults={"new_email": new_email, "status": EmailChangeStatus.PENDING},
        )
        raw_otp, otp_record  = Helpers._create_otp(user, OTPPurpose.EMAIL_CHANGE)
        change_request.verification_otp = otp_record
        change_request.save(update_fields=["verification_otp"])
        return raw_otp
    
    @staticmethod
    def verify_pending_email_otp(user: User, raw_otp: str) -> str:
        otp = Helpers._get_latest_otp(user, OTPPurpose.EMAIL_CHANGE)
        result = Helpers._verify_otp_record(otp, raw_otp)
        if result != "success":
            return result
        change_request = getattr(user, "email_change_request", None)
        if change_request is None or change_request.status != EmailChangeStatus.PENDING:
            return "not_found"
        user.email = change_request.new_email
        user.save(update_fields=["email"])
        change_request.status = EmailChangeStatus.COMPLETED
        change_request.completed_at = timezone.now()
        change_request.save(update_fields=["status", "completed_at"])
        return "success"
        
    
    @staticmethod
    def cancel_pending_email_change(user: User) -> None:
   
        try:
            req = user.email_change_request
            if req.status == EmailChangeStatus.PENDING:
                req.status = EmailChangeStatus.CANCELLED
                req.save(update_fields=["status"])
        except EmailChangeRequest.DoesNotExist:
            pass

