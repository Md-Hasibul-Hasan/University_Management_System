from ..models import *
from .helpers import Helpers
from django.conf import settings
from ..utils import Util
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group
from django.utils.encoding import force_bytes, smart_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from django.db.models import Count

import time
from django.utils import timezone



class StudentServices:
    @staticmethod
    @transaction.atomic
    def register_student(
        name: str,
        email: str,
        password: str,
        department: Department,
        session: Session,
    ) -> User:
        
        if(User.objects.filter(email=email,is_active=True).exists()):
            raise ValidationError({"email": "A verified user with this email already exists."})
        
        elif(User.objects.filter(email=email,is_active=False).exists()):
            StudentServices.resend_verification_email(email)
            return None
        
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

        Student.objects.create(
            user=user,
            department=department,
            session=session,
            year_semester=YearSemester.objects.get(year=YearSemester.Year.FIRST,semester=YearSemester.Semester.FIRST),
        )


        student_group = Group.objects.get(name="Student")
        user.groups.add(student_group)

        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        otp = Helpers.generate_verification_otp(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"


        email_data = {
            "email_subject": "Verify your email",
            "to_email": user.email,
            "context": {
                "subject": "Verify your email",
                "body": "Use the OTP below or click the button to verify your account.",
                "otp": otp,
                "cta_url": verify_link,
                "cta_text": "Verify Email",
            },
        }


        print("before sending email")
        start_time = time.perf_counter()

        Util.send_email(email_data)

        end_time = time.perf_counter()
        print("after sending email")

        execution_time = end_time - start_time
        print(f"Email sent in: {execution_time:.6f} seconds")


        return user
    
    @staticmethod
    @transaction.atomic
    def resend_verification_email(email):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValidationError({
                "detail": "User not found!!."
            })

        if user.is_active:
            raise ValidationError({
                "detail": "Account already verified."
            })

        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        otp = Helpers.generate_verification_otp(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        email_data = {
            "email_subject": "Verify your email",
            "to_email": user.email,
            "context": {
                "subject": "Verify your email",
                "body": (
                    "Use the OTP below or click the button to verify your account.\n\n"
                    "This OTP is valid for 10 minutes."
                ),
                "otp": otp,
                "cta_url": verify_link,
                "cta_text": "Verify Email",
            },
        }

        print("before sending email")
        start_time = time.perf_counter()

        Util.send_email(email_data)

        end_time = time.perf_counter()
        print("after sending email")

        execution_time = end_time - start_time
        print(f"Email sent in: {execution_time:.6f} seconds")

        return user
    

    @staticmethod
    def verify_email_by_link(uid, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uid))
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise ValidationError({"detail": "Invalid verification link."})

        if not PasswordResetTokenGenerator().check_token(user, token):
            raise ValidationError({"detail": "Verification link is invalid or expired."})

        if user.is_active:
            raise ValidationError({"detail": "Account is already verified."})

        user.is_active = True
        user.save(update_fields=["is_active"])

        return user
    


    @staticmethod
    def verify_email_by_otp(email, otp):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValidationError({
                "detail": "User not found!!."
            })

        if user.is_active:
            raise ValidationError({
                "detail": "Account already verified."
            })

        result = Helpers.verify_verification_otp(user, otp)

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


        user.is_active = True
        user.save(update_fields=["is_active"])

        return user



    @staticmethod
    def generate_student_id(student):
        print("generate student id called")
        last_student = (
            Student.objects.filter(
                session=student.session,
                department=student.department,
                student_id__isnull=False,
            )
            .order_by("-student_id")
            .first()
        )

        if last_student:
            next_number = int(last_student.student_id[-3:]) + 1
        else:
            next_number = 1

        session_prefix = student.session.academic_year.replace("-", "")
        department_code = str(student.department.code)

        return f"{session_prefix}{department_code}{next_number:03d}"

    @staticmethod
    @transaction.atomic
    def approve_student(student, approved_by):
        if student.approval_status == Student.ApprovalStatus.APPROVED:
            raise ValidationError("Student is already approved.")
        
        if student.approval_status == Student.ApprovalStatus.REJECTED:
            raise ValidationError("Student is already rejected.")
        
        # Generate only if student_id was not provided
        if not student.student_id:
            student.student_id = StudentServices.generate_student_id(student)

        student.approval_status = Student.ApprovalStatus.APPROVED
        student.approved_by = approved_by
        student.approved_at = timezone.now()

        student.save(
            update_fields=[
                "student_id",
                "approval_status",
                "approved_by",
                "approved_at",
            ]
        )

        session_courses = SessionCourse.objects.filter(
            session=student.session,
            course__department=student.department,
            course__year_semester=student.year_semester,
        )

        StudentCourse.objects.bulk_create(
            [
                StudentCourse(
                    student=student,
                    session_course=session_course,
                )
                for session_course in session_courses
            ]
        )

    @staticmethod
    @transaction.atomic
    def reject_student(student):
        if student.approval_status == Student.ApprovalStatus.APPROVED:
            raise ValidationError(
                "Approved student cannot be rejected."
            )
        if student.approval_status == Student.ApprovalStatus.REJECTED:
            raise ValidationError("Student is already rejected.")

        student.approval_status = Student.ApprovalStatus.REJECTED
        student.save(update_fields=["approval_status"])
        
