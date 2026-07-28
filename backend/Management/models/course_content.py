from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from ..models import *

User = get_user_model()



class CourseMaterial(models.Model):
    session_course = models.ForeignKey(SessionCourse,on_delete=models.CASCADE,related_name="materials",)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True,)
    uploaded_by = models.ForeignKey(User,on_delete=models.PROTECT,related_name="uploaded_course_materials",)

    uploaded_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title
    
class CourseMaterialFile(models.Model):
    material = models.ForeignKey(CourseMaterial,on_delete=models.CASCADE,related_name="files",)
    file = models.FileField(upload_to="course_materials/%Y/%m/",)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.file.name
    

class CourseAnnouncement(models.Model):
    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="announcements",
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="course_announcements",
    )

    is_pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

class CourseAnnouncementFile(models.Model):
    announcement = models.ForeignKey(
        CourseAnnouncement,
        on_delete=models.CASCADE,
        related_name="files",
    )

    file = models.FileField(
        upload_to="course_announcements/%Y/%m/",
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.file.name   
    



# ===================== Assignments =====================

class Assignment(models.Model):
    session_course = models.ForeignKey(
        SessionCourse,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    title = models.CharField(max_length=255)

    description = models.TextField(
        blank=True,
    )

    due_at = models.DateTimeField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="created_assignments",
    )


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
    


class AssignmentFile(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="files",
    )

    file = models.FileField(
        upload_to="assignments/%Y/%m/",
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.file.name
    

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions",
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )

    note = models.TextField(
        blank=True,
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        unique_together = ("assignment", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.assignment} - {self.student}"
    

class AssignmentSubmissionFile(models.Model):
    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name="files",
    )

    file = models.FileField(
        upload_to="assignment_submissions/%Y/%m/",
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.file.name


