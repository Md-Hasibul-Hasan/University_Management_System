from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import *


# ============================================================
# INLINES
# ============================================================

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
    fk_name = "user"
    fields = ("student_id", "department", "session", "year_semester", "cgpa", "approval_status", "approved_by", "approved_at")
    readonly_fields = ("approved_at",)


class TeacherProfileInline(admin.StackedInline):
    model = Teacher
    extra = 0
    can_delete = False
    fields = ("employee_id", "department", "designation", "is_head")


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0
    fields = ("code", "title", "credit", "year_semester", "course_type", "is_active")


class ExamCommitteeMemberInline(admin.TabularInline):
    model = ExamCommitteeMember
    extra = 0
    fields = ("teacher", "role")


class SessionCourseInline(admin.TabularInline):
    model = SessionCourse
    extra = 0
    fields = ("course",)
    autocomplete_fields = ("course",)


class SessionCourseTeacherInline(admin.TabularInline):
    model = SessionCourseTeacher
    extra = 0
    fields = ("teacher", "assigned_by")
    autocomplete_fields = ("teacher", "assigned_by")


class StudentCourseInline(admin.TabularInline):
    model = StudentCourse
    extra = 0
    fields = ("session_course", "status", "enrolled_at")
    readonly_fields = ("enrolled_at",)
    autocomplete_fields = ("session_course",)


# ============================================================
# USER
# ============================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "email", "name", "is_active", "is_staff", "is_superuser", "created_at")
    list_display_links = ("id", "email")
    list_filter = ("is_active", "is_staff", "is_superuser", "groups")
    search_fields = ("email", "name")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "last_login")
    inlines = [UserSecurityInline, OTPInline, EmailChangeRequestInline, StudentProfileInline, TeacherProfileInline]
    list_select_related = True

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


# ============================================================
# USER SECURITY
# ============================================================

@admin.register(UserSecurity)
class UserSecurityAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "failed_login_attempts", "locked_until", "last_login_ip", "updated_at")
    list_display_links = ("id", "user")
    list_filter = ("locked_until",)
    search_fields = ("user__email", "user__name")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("user",)


# ============================================================
# OTP
# ============================================================

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "purpose", "attempts", "locked_until", "expires_at", "created_at")
    list_display_links = ("id", "user")
    list_filter = ("purpose", "locked_until")
    search_fields = ("user__email", "user__name", "purpose")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user",)


# ============================================================
# EMAIL CHANGE REQUEST
# ============================================================

@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "new_email", "status", "completed_at", "created_at")
    list_display_links = ("id", "user")
    list_filter = ("status",)
    search_fields = ("user__email", "user__name", "new_email")
    readonly_fields = ("created_at", "completed_at")
    autocomplete_fields = ("user", "verification_otp")


# ============================================================
# FACULTY
# ============================================================

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "department_count", "created_at")
    list_display_links = ("id", "name")
    search_fields = ("name",)

    @admin.display(description="Departments")
    def department_count(self, obj):
        return obj.departments.count()


# ============================================================
# DEPARTMENT
# ============================================================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "faculty", "student_count", "teacher_count", "created_at")
    list_display_links = ("id", "code")
    list_filter = ("faculty",)
    search_fields = ("code", "name", "faculty__name")
    autocomplete_fields = ("faculty",)
    inlines = [CourseInline]

    @admin.display(description="Students")
    def student_count(self, obj):
        return obj.students.count()

    @admin.display(description="Teachers")
    def teacher_count(self, obj):
        return obj.teachers.count()


# ============================================================
# SESSION
# ============================================================

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "session_no", "academic_year", "student_count", "created_at")
    list_display_links = ("id", "session_no")
    search_fields = ("session_no", "academic_year")
    inlines = [SessionCourseInline]

    @admin.display(description="Students")
    def student_count(self, obj):
        return obj.student_session.count()


# ============================================================
# YEAR SEMESTER
# ============================================================

@admin.register(YearSemester)
class YearSemesterAdmin(admin.ModelAdmin):
    list_display = ("id", "year", "semester", "created_at")
    list_display_links = ("id", "year")
    list_filter = ("year", "semester")
    search_fields = ("year", "semester")


# ============================================================
# COURSE
# ============================================================

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "title", "credit", "department", "year_semester", "course_type", "is_active")
    list_display_links = ("id", "code")
    list_filter = ("department", "year_semester", "course_type", "is_active")
    search_fields = ("code", "title", "department__name")
    autocomplete_fields = ("department", "year_semester")
    inlines = [SessionCourseInline]


# ============================================================
# COURSE ASSESSMENT
# ============================================================

@admin.register(CourseAssessment)
class CourseAssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "title", "assessment_type", "max_marks", "calculation_type", "display_order", "created_at")
    list_display_links = ("id", "session_course")
    list_filter = ("assessment_type", "calculation_type", "session_course__course__department")
    search_fields = ("session_course__course__code", "session_course__course__title", "title")
    autocomplete_fields = ("session_course",)


# ============================================================
# SESSION COURSE
# ============================================================

@admin.register(SessionCourse)
class SessionCourseAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "course", "status", "teacher_count", "created_at")
    list_display_links = ("id", "session")
    list_filter = ("session", "course__department")
    search_fields = ("session__academic_year", "course__code", "course__title")
    autocomplete_fields = ("session", "course")
    inlines = [SessionCourseTeacherInline]

    @admin.display(description="Teachers")
    def teacher_count(self, obj):
        return obj.teacher_assignments.count()


# ============================================================
# SESSION COURSE TEACHER
# ============================================================

@admin.register(SessionCourseTeacher)
class SessionCourseTeacherAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "teacher", "assigned_by", "created_at")
    list_display_links = ("id", "session_course")
    list_filter = ("session_course__session", "session_course__course__department")
    search_fields = ("teacher__user__email", "teacher__employee_id", "session_course__course__code")
    autocomplete_fields = ("session_course", "teacher", "assigned_by")


# ============================================================
# STUDENT COURSE
# ============================================================

@admin.register(StudentCourse)
class StudentCourseAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "session_course", "status", "enrolled_at", "created_at")
    list_display_links = ("id", "student")
    list_filter = ("status", "session_course__session", "session_course__course__department")
    search_fields = ("student__student_id", "student__user__email", "session_course__course__code")
    autocomplete_fields = ("student", "session_course")
    readonly_fields = ("enrolled_at",)


# ============================================================
# STUDENT ASSESSMENT MARK
# ============================================================

@admin.register(StudentAssessmentMark)
class StudentAssessmentMarkAdmin(admin.ModelAdmin):
    list_display = ("id", "student_course", "assessment", "marks", "entered_by", "created_at")
    list_display_links = ("id", "student_course")
    list_filter = ("assessment__session_course__course__department", "assessment")
    search_fields = ("student_course__student__student_id", "student_course__student__user__email", "assessment__title")
    autocomplete_fields = ("student_course", "assessment", "entered_by")
    readonly_fields = ("created_at", "updated_at")


# ============================================================
# ATTENDANCE SESSION
# ============================================================

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "date", "taken_by", "is_locked", "created_at")
    list_display_links = ("id", "session_course")
    list_filter = ("is_locked", "session_course__session", "session_course__course__department")
    search_fields = ("session_course__course__code", "session_course__course__title", "taken_by__email")
    autocomplete_fields = ("session_course", "taken_by")
    readonly_fields = ("created_at",)
    date_hierarchy = "date"


# ============================================================
# STUDENT ATTENDANCE
# ============================================================

@admin.register(StudentAttendance)
class StudentAttendanceAdmin(admin.ModelAdmin):
    list_display = ("id", "attendance_session", "student_course", "status", "created_at")
    list_display_links = ("id", "attendance_session")
    list_filter = ("status", "attendance_session__session_course__course__department")
    search_fields = ("student_course__student__student_id", "student_course__student__user__email", "attendance_session__session_course__course__code")
    autocomplete_fields = ("attendance_session", "student_course")
    readonly_fields = ("created_at",)


# ============================================================
# TEACHER INVITATION
# ============================================================

@admin.register(TeacherInvitation)
class TeacherInvitationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "employee_id", "department", "designation", "is_used", "expires_at", "created_at")
    list_display_links = ("id", "name")
    list_filter = ("designation", "is_used", "department")
    search_fields = ("name", "email", "employee_id", "department__name")
    autocomplete_fields = ("department", "invited_by")
    readonly_fields = ("token",)


# ============================================================
# TEACHER
# ============================================================

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("id", "employee_id", "user", "department", "designation", "is_head", "created_at")
    list_display_links = ("id", "employee_id")
    list_filter = ("designation", "is_head", "department")
    search_fields = ("employee_id", "user__email", "user__name", "department__name")
    autocomplete_fields = ("user", "department")
    inlines = [SessionCourseTeacherInline]


# ============================================================
# STUDENT
# ============================================================

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "student_id", "user", "department", "session", "year_semester", "cgpa", "approval_status", "approved_by", "approved_at", "created_at")
    list_display_links = ("id", "student_id")
    list_filter = ("department", "session", "year_semester", "approval_status")
    search_fields = ("student_id", "user__email", "user__name", "department__name")
    autocomplete_fields = ("user", "department", "session", "year_semester", "approved_by")
    readonly_fields = ("approved_at",)
    inlines = [StudentCourseInline]

    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected students")
    def approve_selected(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(approval_status=Student.ApprovalStatus.PENDING).update(
            approval_status=Student.ApprovalStatus.APPROVED,
            approved_by=request.user,
            approved_at=timezone.now(),
        )
        self.message_user(request, f"{updated} student(s) approved.")

    @admin.action(description="Reject selected students")
    def reject_selected(self, request, queryset):
        updated = queryset.filter(
            approval_status=Student.ApprovalStatus.PENDING
        ).update(
            approval_status=Student.ApprovalStatus.REJECTED,
        )
        self.message_user(request, f"{updated} student(s) rejected.")


# ============================================================
# EXAM COMMITTEE
# ============================================================

@admin.register(ExamCommittee)
class ExamCommitteeAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "year_semester", "member_count", "created_at")
    list_display_links = ("id", "session")
    list_filter = ("session", "year_semester")
    search_fields = ("session__academic_year", "year_semester__year")
    autocomplete_fields = ("session", "year_semester")
    inlines = [ExamCommitteeMemberInline]

    @admin.display(description="Members")
    def member_count(self, obj):
        return obj.members.count()


# ============================================================
# EXAM COMMITTEE MEMBER
# ============================================================

@admin.register(ExamCommitteeMember)
class ExamCommitteeMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "committee", "teacher", "role", "created_at")
    list_display_links = ("id", "committee")
    list_filter = ("role", "committee__session")
    search_fields = ("teacher__employee_id", "teacher__user__email", "committee__session__academic_year")
    autocomplete_fields = ("committee", "teacher")


# ============================================================
# COURSE MATERIAL
# ============================================================

@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "title", "uploaded_by", "uploaded_at")
    list_display_links = ("id", "session_course")
    list_filter = ("session_course__session", "session_course__course__department")
    search_fields = ("title", "session_course__course__code", "session_course__course__title")
    autocomplete_fields = ("session_course", "uploaded_by")
    readonly_fields = ("uploaded_at", "updated_at")


@admin.register(CourseMaterialFile)
class CourseMaterialFileAdmin(admin.ModelAdmin):
    list_display = ("id", "material", "file")
    list_display_links = ("id", "material")
    search_fields = ("material__title",)
    autocomplete_fields = ("material",)


# ============================================================
# COURSE ANNOUNCEMENT
# ============================================================

@admin.register(CourseAnnouncement)
class CourseAnnouncementAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "title", "created_by", "created_at")
    list_display_links = ("id", "session_course")
    list_filter = ("session_course__session", "session_course__course__department")
    search_fields = ("title", "session_course__course__code", "session_course__course__title")
    autocomplete_fields = ("session_course", "created_by")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CourseAnnouncementFile)
class CourseAnnouncementFileAdmin(admin.ModelAdmin):
    list_display = ("id", "announcement", "file")
    list_display_links = ("id", "announcement")
    search_fields = ("announcement__title",)
    autocomplete_fields = ("announcement",)


# ============================================================
# ASSIGNMENT
# ============================================================

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "session_course", "title", "created_by", "due_at", "created_at")
    list_display_links = ("id", "session_course")
    list_filter = ("session_course__session", "session_course__course__department")
    search_fields = ("title", "session_course__course__code", "session_course__course__title")
    autocomplete_fields = ("session_course", "created_by")
    readonly_fields = ("created_at", "updated_at")


# ============================================================
# ASSIGNMENT SUBMISSION
# ============================================================

@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "assignment", "student", "submitted_at")
    list_display_links = ("id", "assignment")
    list_filter = ("assignment__session_course__session", "assignment__session_course__course__department")
    search_fields = ("student__student_id", "student__user__email", "assignment__title")
    autocomplete_fields = ("assignment", "student")
    readonly_fields = ("submitted_at",)


@admin.register(AssignmentSubmissionFile)
class AssignmentSubmissionFileAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "file")
    list_display_links = ("id", "submission")
    search_fields = ("submission__assignment__title",)
    autocomplete_fields = ("submission",)