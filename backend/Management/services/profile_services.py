from django.db import transaction

from ..models import User
from ..utils import Util

class ProfileServices:

    @staticmethod
    def get_profile(user: User) -> dict:
        profile = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "image": user.image,
            "role": "Student" if user.is_student else "Teacher",
            "is_admin": user.is_admin,
        }

        if user.is_student:
            student = user.student_profile

            profile["student"] = {
                "id": student.id,
                "student_id": student.student_id,
                "department": student.department.name if student.department else None,
                "session": student.session.academic_year if student.session else None,
                "year_semester": str(student.year_semester) if student.year_semester else None,
                "cgpa": student.cgpa,
                "phone": student.phone,
                "father_name": student.father_name,
                "father_phone": student.father_phone,
                "mother_name": student.mother_name,
                "mother_phone": student.mother_phone,
            }

        else:
            teacher = user.teacher_profile

            profile["teacher"] = {
                "id": teacher.id,
                "employee_id": teacher.employee_id,
                "department": teacher.department.name if teacher.department else None,
                "designation": teacher.get_designation_display(),
                "is_head": teacher.is_head,
                "phone": teacher.phone,
                "address": teacher.address,
            }

        return profile

    @staticmethod
    @transaction.atomic
    def update_student_profile(user: User, **data) -> User:

        if "name" in data:
            user.name = data["name"]

        if "image" in data:
            optimized_image = Util.optimize_image(data["image"])

            user.image.save(
                optimized_image.name,
                optimized_image,
                save=False,
            )

        user.save()

        student = user.student_profile

        student.phone = data.get("phone", student.phone)
        student.father_name = data.get("father_name", student.father_name)
        student.father_phone = data.get("father_phone", student.father_phone)
        student.mother_name = data.get("mother_name", student.mother_name)
        student.mother_phone = data.get("mother_phone", student.mother_phone)
        student.address = data.get("address", student.address)

        student.save()

        return user

    @staticmethod
    @transaction.atomic
    def update_teacher_profile(user: User, **data) -> User:

        if "name" in data:
            user.name = data["name"]

        if "image" in data:
            optimized_image = Util.optimize_image(data["image"])

            user.image.save(
                optimized_image.name,
                optimized_image,
                save=False,
            )

        user.save()

        teacher = user.teacher_profile

        teacher.phone = data.get("phone", teacher.phone)
        teacher.address = data.get("address", teacher.address)

        teacher.save()

        return user