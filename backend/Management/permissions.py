from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access to Admin users."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name="Admin").exists()
        )


class IsTeacherUser(BasePermission):
    """Allow access to Teacher users."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.groups.filter(name="Teacher").exists()


class IsAdminOrTeacher(BasePermission):
    """Allow access to Admin or Teacher users."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(
                name__in=["Admin", "Teacher"]
            ).exists()
        )


class IsStudentUser(BasePermission):
    """Allow access to Student users."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.groups.filter(name="Student").exists()


class IsDepartmentChairman(BasePermission):
    """Allow access only to Department Chairman."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        teacher = getattr(user, "teacher_profile", None)

        return bool(
            teacher
            and teacher.is_head
            and teacher.department
        )

from rest_framework.permissions import BasePermission


class IsAdminOrChairman(BasePermission):
    """Allow access to Admin users or Department Chairmen."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Admin
        if (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name="Admin").exists()
        ):
            return True

        # Department Chairman
        teacher = getattr(user, "teacher_profile", None)

        return bool(
            teacher
            and teacher.is_head
            and teacher.department
        )

class IsOwnerOrAdmin(BasePermission):
    """Allow object access to the owner or Admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Admin
        if (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name="Admin").exists()
        ):
            return True

        # Owner
        if hasattr(obj, "user"):
            return obj.user == user

        if hasattr(obj, "email"):
            return obj == user

        return False


class IsAccountOwner(BasePermission):
    """Allow access only to the user's own account."""

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and obj == request.user
        )


class IsAdminOrTeacherOrStudent(BasePermission):
    """Allow authenticated users in the supported academic portal groups."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name__in=["Admin", "Teacher", "Student"]).exists()
        )