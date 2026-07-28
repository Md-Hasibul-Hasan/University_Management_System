from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to users in the Admin group."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="Admin").exists()
        )


class IsTeacherUser(BasePermission):
    """Allow access only to users in the Teacher group."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="Teacher").exists()
        )


class IsStudentUser(BasePermission):
    """Allow access only to users in the Student group."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="Student").exists()
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level permission — only allow owners or admins to edit."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "email"):
            return obj == request.user
        return False


class IsAccountOwner(BasePermission):
    """Allow access only if the user is accessing their own account."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user