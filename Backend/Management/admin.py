from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models.academic import (
    Course,
    Faculty,
    Department,
    ExamCommittee,
    ExamCommitteeMember,
    Session,
    Student,
    Teacher,
    TeacherInvitation,
    YearSemester,
)
from .models.auth import EmailChangeRequest, OTP, User, UserSecurity


class UserSecurityInline(admin.StackedInline):
    model = UserSecurity
    extra = 0
    can_delete = False


class OTPInline(admin.TabularInline):
    model = OTP
    extra = 0
    fields = ("purpose", "otp_hash", "attempts", "locked_until", "expires_at", "last_otp_sent_at")


class EmailChangeRequestInline(admin.StackedInline):
    model = EmailChangeRequest
    extra = 0
    can_delete = False
    fields = ("new_email", "status", "verification_otp", "completed_at")


class StudentProfileInline(admin.StackedInline):
    model = Student
    extra = 0
    can_delete = False
    fields = ("student_id", "department", "session", "year_semester", "cgpa", "is_approved")


class TeacherProfileInline(admin.StackedInline):
    model = Teacher
    extra = 0
    can_delete = False
    fields = ("employee_id", "department", "designation", "is_head")


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0
    fields = ("code", "title", "credits", "year_semester")


class ExamCommitteeMemberInline(admin.TabularInline):
    model = ExamCommitteeMember
    extra = 0
    fields = ("teacher", "role")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "is_active", "is_staff", "is_superuser", "created_at")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("email", "name")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "last_login")
    inlines = [UserSecurityInline, OTPInline, EmailChangeRequestInline, StudentProfileInline, TeacherProfileInline]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "image")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "password1", "password2"),
            },
        ),
    )


@admin.register(UserSecurity)
class UserSecurityAdmin(admin.ModelAdmin):
    list_display = ("user", "failed_login_attempts", "locked_until", "last_login_ip", "updated_at")
    list_filter = ("locked_until",)
    search_fields = ("user__email", "user__name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "attempts", "locked_until", "expires_at", "created_at")
    list_filter = ("purpose", "locked_until")
    search_fields = ("user__email", "user__name", "purpose")
    readonly_fields = ("created_at",)
    raw_id_fields = ("user",)


@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "new_email", "status", "completed_at", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "user__name", "new_email")
    readonly_fields = ("created_at", "completed_at")
    raw_id_fields = ("user", "verification_otp")

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id","code", "name", "created_at")
    search_fields = ("code", "name")
    inlines = [CourseInline]


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id","session_no", "academic_year", "created_at")
    search_fields = ("session_no", "academic_year")


@admin.register(YearSemester)
class YearSemesterAdmin(admin.ModelAdmin):
    list_display = ("year", "semester", "created_at")
    search_fields = ("year", "semester")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "credits", "department", "year_semester")
    list_filter = ("department", "year_semester")
    search_fields = ("code", "title", "department__name")
    raw_id_fields = ("department", "year_semester")


@admin.register(TeacherInvitation)
class TeacherInvitationAdmin(admin.ModelAdmin):
    list_display = ("name","email", "employee_id", "department", "designation")


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "user", "department", "designation", "is_head", "created_at")
    list_filter = ("designation", "is_head", "department")
    search_fields = ("employee_id", "user__email", "user__name", "department__name")
    raw_id_fields = ("user", "department")


@admin.register(ExamCommittee)
class ExamCommitteeAdmin(admin.ModelAdmin):
    list_display = ("session", "year_semester",  "created_at")
    list_filter = ("session", "year_semester")
    search_fields = ("session__academic_year", "year_semester__year")
    raw_id_fields = ("session", "year_semester",)
    inlines = [ExamCommitteeMemberInline]


@admin.register(ExamCommitteeMember)
class ExamCommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ("committee", "teacher", "role", "created_at")
    list_filter = ("role", "committee")
    search_fields = ("teacher__employee_id", "teacher__user__email", "committee__session__academic_year")
    raw_id_fields = ("committee", "teacher")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_id", "user", "department", "session", "year_semester", "cgpa", "is_approved", "created_at")
    list_filter = ("department", "session", "year_semester", "is_approved")
    search_fields = ("student_id", "user__email", "user__name", "department__name")
    raw_id_fields = ("user", "department", "session", "year_semester")
