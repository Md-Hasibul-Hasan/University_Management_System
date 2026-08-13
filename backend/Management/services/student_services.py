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

        year_semester, _ = YearSemester.objects.get_or_create(
            year=YearSemester.Year.FIRST,
            semester=YearSemester.Semester.FIRST,
        )

        Student.objects.create(
            user=user,
            department=department,
            session=session,
            year_semester=year_semester,
        )


        student_group, _ = Group.objects.get_or_create(name=Groups.STUDENT)
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
    def resend_verification_email(email: str) -> User:
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
    def verify_email_by_link(uid: str, token: str) -> User:
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
    def verify_email_by_otp(email: str, otp: str) -> User:
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
    def generate_student_id(student: Student) -> str:
        print("generate student id called")
        last_student = (
            Student.objects.filter(
                session=student.session,
                department=student.department,
            )
            .exclude(student_id__isnull=True)
            .exclude(student_id="")
            .order_by("-student_id")
            .first()
        )

        next_number = 1

        if last_student:
            try:
                next_number = int(last_student.student_id[-3:]) + 1
            except ValueError:
                next_number = 1

        session_prefix = student.session.academic_year.replace("-", "")
        department_code = str(student.department.code)

        return f"{session_prefix}{department_code}{next_number:03d}"

    @staticmethod
    @transaction.atomic
    def approve_student(student: Student, approved_by: User) -> None:
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

        # Notify the student that their registration was approved
        email_data = {
            "email_subject": "Your student registration has been approved",
            "to_email": student.user.email,
            "context": {
                "subject": "Registration Approved",
                "body": (
                    "Congratulations! Your student registration has been approved.\n\n"
                    f"Your Student ID: {student.student_id}\n\n"
                    "You can now log in to the university management system."
                ),
                "otp": "",
                "cta_url": f"{settings.FRONTEND_URL}/login",
                "cta_text": "Login",
            },
        }

        Util.send_email(email_data)

    # @staticmethod
    # @transaction.atomic
    # def reject_student(student: Student) -> None:
    #     if student.approval_status == Student.ApprovalStatus.APPROVED:
    #         raise ValidationError(
    #             "Approved student cannot be rejected."
    #         )
    #     if student.approval_status == Student.ApprovalStatus.REJECTED:
    #         raise ValidationError("Student is already rejected.")

    #     student.approval_status = Student.ApprovalStatus.REJECTED
    #     User.objects.filter(id=student.user_id).delete()
    #     student.save(update_fields=["approval_status"])
        
    @staticmethod
    @transaction.atomic
    def reject_student(student: Student) -> None:
        if student.approval_status == Student.ApprovalStatus.APPROVED:
            raise ValidationError(
                "Approved student cannot be rejected."
            )

        if student.approval_status == Student.ApprovalStatus.REJECTED:
            raise ValidationError(
                "Student is already rejected."
            )

        email = student.user.email

        email_data = {
            "email_subject": "Your student registration has been rejected",
            "to_email": email,
            "context": {
                "subject": "Registration Rejected",
                "body": (
                    "We regret to inform you that your student registration "
                    "has been rejected.\n\n"
                    "Please contact the university administration for more information."
                ),
                "otp": "",
                "cta_url": "",
                "cta_text": "",
            },
        }

        student.user.delete()

        Util.send_email(email_data)


