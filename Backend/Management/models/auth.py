from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import FileExtensionValidator
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, name, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")

        name = name.strip()
        email = self.normalize_email(email)

        user = self.model(name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, name, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(name, email, password, **extra_fields)


class OTPPurpose(models.TextChoices):
    EMAIL_VERIFICATION = "email_verification", "Email Verification"
    PASSWORD_RESET = "password_reset", "Password Reset"
    EMAIL_CHANGE = "email_change", "Email Change"


class EmailChangeStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"




class User(AbstractBaseUser, PermissionsMixin):
    """Represents the core identity and profile information for an account."""

    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    image = models.ImageField(
        upload_to="profile_images/",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"])],
    )
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [models.Index(fields=["is_active"])]

    @property
    def username(self):
        return self.email

    @property
    def is_admin(self):
        return self.groups.filter(name="Admin").exists()

    @property
    def is_teacher(self):
        return self.groups.filter(name="Teacher").exists()

    @property
    def is_student(self):
        return self.groups.filter(name="Student").exists()

    def __str__(self):
        return self.email




class UserSecurity(models.Model):
    """Stores account security state for a user (lockout, failed attempts)."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="security")
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User Security"
        verbose_name_plural = "User Security"

    def __str__(self):
        return self.user.email


class OTP(models.Model):
    """Stores one-time passcodes for distinct authentication purposes."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otps")
    purpose = models.CharField(max_length=30, choices=OTPPurpose.choices)
    otp_hash = models.CharField(max_length=128, null=True, blank=True)
    attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_otp_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "OTP"
        verbose_name_plural = "OTPs"
        indexes = [
            models.Index(fields=["user", "purpose"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.purpose}"


class EmailChangeRequest(models.Model):
    """Tracks pending email-address change requests for auditability."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_change_request")
    new_email = models.EmailField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=EmailChangeStatus.choices,
        default=EmailChangeStatus.PENDING,
    )
    verification_otp = models.ForeignKey(
        OTP, on_delete=models.SET_NULL, null=True, blank=True, related_name="email_change_requests"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Email Change Request"
        verbose_name_plural = "Email Change Requests"
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self):
        return f"{self.user.email} - {self.status}"

