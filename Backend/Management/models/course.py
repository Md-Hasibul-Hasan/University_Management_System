from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from ..models import *

User = get_user_model()




class Course(models.Model):
    class CourseType(models.TextChoices):
        THEORY = "theory", _("Theory")
        LAB = "lab", _("Lab")
        VIVA = "viva", _("Viva")
        PROJECT = "project", _("Project")

    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    credit = models.DecimalField(max_digits=3, decimal_places=1)

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="courses",
    )

    year_semester = models.ForeignKey(
        YearSemester,
        on_delete=models.CASCADE,
        related_name="courses",
    )

    course_type = models.CharField(
        max_length=20,
        choices=CourseType.choices,
        default=CourseType.THEORY,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(
                fields=["department", "code"],
                name="unique_course_code_per_department"
            )
        ]

    def __str__(self):
        return f"{self.code} - {self.title}"


class SessionCourse(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="session_courses")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="session_courses")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "course"],
                name="unique_session_course"
            )
        ]

    def __str__(self):
        return f"{self.session} - {self.course}"
    


class CourseAssessment(models.Model):
    class CalculationType(models.TextChoices):
        INDIVIDUAL = "individual", _("Individual")
        AVERAGE = "average", _("Average")


    class AssessmentGroup(models.TextChoices):
        NONE = "none", _("No Group")
        INCOURSE = "incourse", _("Incourse")
        EVALUATION = "evaluation", _("Evaluation")
        QUIZ = "quiz", _("Quiz")
        ASSIGNMENT = "assignment", _("Assignment")
        PRESENTATION = "presentation", _("Presentation")
        VIVA = "viva", _("Viva")
        ATTENDANCE = "attendance", _("Attendance")

    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="assessments",
    )

    title = models.CharField(max_length=100)

    max_marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    calculation_type = models.CharField(
        max_length=20,
        choices=CalculationType.choices,
        default=CalculationType.INDIVIDUAL,
    )

    group = models.CharField(
        max_length=30,
        choices=AssessmentGroup.choices,
        default=AssessmentGroup.NONE,
    )

    display_order = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.session_course.course.code} - {self.title}"





class SessionCourseTeacher(models.Model):
    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="teacher_assignments"
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="teacher_assignments"
    )


    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="teacher_course_assignments"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session_course", "teacher"],
                name="unique_teacher_assignment"
            )
        ]

    def __str__(self):
        return f"{self.session_course} - {self.teacher}"
    


class StudentCourse(models.Model):
    class Status(models.TextChoices):
        ENROLLED = "enrolled", _("Enrolled")
        COMPLETED = "completed", _("Completed")
        DROPPED = "dropped", _("Dropped")
        FAILED = "failed", _("Failed")

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="student_courses",
    )

    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="student_courses",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ENROLLED,
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student", "session_course"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "session_course"],
                name="unique_student_session_course",
            )
        ]

    def __str__(self):
        return f"{self.student} - {self.session_course.course.code}"
    


class StudentAssessmentMark(models.Model):
    student_course = models.ForeignKey(
        StudentCourse,
        on_delete=models.CASCADE,
        related_name="assessment_marks",
    )

    assessment = models.ForeignKey(
        CourseAssessment,
        on_delete=models.CASCADE,
        related_name="student_marks",
    )

    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entered_student_marks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "student_course",
            "assessment__display_order",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["student_course", "assessment"],
                name="unique_student_assessment_mark",
            )
        ]

    def __str__(self):
        return (
            f"{self.student_course.student.student_id} - "
            f"{self.assessment.title} ({self.marks})"
        )