

from django.db import models
import uuid
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from decimal import Decimal, ROUND_HALF_UP


User = get_user_model()



class Faculty(models.Model):
    name = models.CharField(max_length=255, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Faculty"
        verbose_name_plural = "Faculties"

    def __str__(self):
        return self.name


class Department(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name="departments")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Session(models.Model):
    session_no = models.PositiveIntegerField(unique=True)
    academic_year = models.CharField(max_length=20, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-session_no"]
        verbose_name = "Session"
        verbose_name_plural = "Sessions"

    def __str__(self):
        return f"Session: ({self.academic_year}) - Batch {self.session_no} "


class YearSemester(models.Model):
    class Year(models.TextChoices):
        FIRST = "first", "First"
        SECOND = "second", "Second"
        THIRD = "third", "Third"
        FOURTH = "fourth", "Fourth"

    class Semester(models.TextChoices):
        FIRST = "first", "First"
        SECOND = "second", "Second"

    year = models.CharField(max_length=20, choices=Year.choices)
    semester = models.CharField(max_length=20, choices=Semester.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("year", "semester")
        ordering = ["year", "semester"]
        verbose_name = "Year & Semester"
        verbose_name_plural = "Year & Semesters"

    def __str__(self):
        return f"{self.get_year_display()} Year - {self.get_semester_display()} Semester"


class Student(models.Model):
    """Student-specific profile information."""

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    student_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_session",
    )
    year_semester = models.ForeignKey(
        YearSemester,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_year_semester",
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    father_name = models.CharField(max_length=255, blank=True, null=True)
    father_phone = models.CharField(max_length=20, blank=True, null=True)
    mother_name = models.CharField(max_length=255, blank=True, null=True)
    mother_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )

    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_students",
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def cgpa(self):

        from ..models import StudentCourse

        # courses = self.student_courses.filter(
        #     status__in=[
        #         StudentCourse.Status.COMPLETED,
        #         StudentCourse.Status.FAILED,

        #     ],
        # ).select_related("session_course__course")

        courses = self.student_courses.filter(
            status__in=[
                "completed",
                "failed",
            ]
        ).select_related("session_course__course")

        # print("----------------------")
        # for i in courses:
        #     print(i.session_course.course.title)
        # print(courses.count())
        # print("----------------------")


        best_by_course = {}

        for student_course in courses:
            grade_point = student_course.grade_point

            if grade_point is None:
                continue

            course_id = student_course.session_course.course_id
            credit = student_course.session_course.course.credit

            current = best_by_course.get(course_id)

            if current is None or grade_point > current["grade_point"]:
                best_by_course[course_id] = {
                    "grade_point": grade_point,
                    "credit": credit,
                }

        total_credit = sum(
            (item["credit"] for item in best_by_course.values()),
            Decimal("0.00"),
        )

        total_grade_points = sum(
            (
                item["grade_point"] * item["credit"]
                for item in best_by_course.values()
            ),
            Decimal("0.00"),
        )

        if not total_credit:
            return Decimal("0.00")

        return (
            total_grade_points / total_credit
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

    
    class Meta:
        ordering = ["student_id"]
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"
        indexes = [models.Index(fields=["student_id"])]

    def __str__(self):
        return self.student_id or self.user.email
    



    
class Designation(models.TextChoices):
    PROFESSOR = "professor", "Professor"
    ASSISTANT_PROFESSOR = "assistant_professor", "Assistant Professor"
    ASSOCIATE_PROFESSOR = "associate_professor", "Associate Professor"
    LECTURER = "lecturer", "Lecturer"

class Teacher(models.Model):
    """Teacher-specific profile information."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teachers",
    )
    designation = models.CharField(max_length=50, choices=Designation.choices, default=Designation.LECTURER)
    is_head = models.BooleanField(default=False)

    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["employee_id"]
        verbose_name = "Teacher Profile"
        verbose_name_plural = "Teacher Profiles"
        indexes = [models.Index(fields=["employee_id"])]

    def __str__(self):
        return self.employee_id or self.user.email



class TeacherInvitation(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    employee_id = models.CharField(max_length=50, unique=True)

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="teacher_invitations",
    )

    designation = models.CharField(
        max_length=50,
        choices=Designation.choices,
    )

    token = models.UUIDField(unique=True, editable=False, default=uuid.uuid4)

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="teacher_invitations_sent",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Teacher Invitation"
        verbose_name_plural = "Teacher Invitations"


    def __str__(self):
        return f"{self.name} - {self.email}"


class ExamCommittee(models.Model):
    """Represents an exam committee for a specific session and year/semester."""

    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="exam_committees",
    )
    year_semester = models.ForeignKey(
        YearSemester,
        on_delete=models.CASCADE,
        related_name="exam_committees",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Exam Committee"
        verbose_name_plural = "Exam Committees"
        constraints = [
            models.UniqueConstraint(
                fields=["session", "year_semester"],
                name="unique_exam_committee",
            )
        ]

    def __str__(self):
        return f"{self.session} - {self.year_semester}"

class ExamCommitteeMember(models.Model):
    """Represents a teacher's role in an exam committee."""

    class Role(models.TextChoices):
        CHAIRMAN = "chairman", "Chairman"
        MEMBER = "member", "Member"
        TABULATOR = "tabulator", "Tabulator"
        EXTERNAL = "external", "External"

    committee = models.ForeignKey(
        ExamCommittee,
        on_delete=models.CASCADE,
        related_name="members",
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="exam_committee_memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["teacher__employee_id"]
        verbose_name = "Exam Committee Member"
        verbose_name_plural = "Exam Committee Members"
        constraints = [
            models.UniqueConstraint(
                fields=["committee", "teacher"],
                name="unique_teacher_per_committee",
            )
        ]

    def __str__(self):
        return f"{self.teacher} ({self.get_role_display()})"




        


