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