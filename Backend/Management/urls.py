from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()

# router.register(r"permissions", views.PermissionViewSet, basename="permission")
# router.register(r"groups", views.GroupViewSet, basename="group")
# router.register(r"user-access", views.UserGroupPermissionViewSet, basename="user-access")


# Master Data
router.register("faculties", FacultyViewSet, basename="faculty")
router.register("departments", DepartmentViewSet, basename="department")
router.register("sessions", SessionViewSet, basename="session")
router.register("year-semesters", YearSemesterViewSet, basename="year-semester")


# Course
router.register("course", CourseViewSet, basename="course")
router.register("session-course",SessionCourseViewSet,basename="session-course")
router.register("session-course-teacher",SessionCourseTeacherViewSet,basename="session-course-teacher")
router.register("course-assessments",CourseAssessmentViewSet,basename="course-assessment")

# Course Content
router.register("course-material",CourseMaterialViewSet,basename="course-material")
router.register("course-announcement",CourseAnnouncementViewSet,basename="course-announcement")
router.register("course-assignment",AssignmentViewSet,basename="course-assignment")
router.register("course-assignment-submission",AssignmentSubmissionViewSet,basename="course-assignment-submission")

urlpatterns = [

    # auth
    path('login/', LoginView.as_view(), name="login"),
    path('refresh-token/', RefreshTokenView.as_view(), name="refresh-token" ),
    path("change-password/",ChangePasswordView.as_view(),name="change-password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(),name="reset-password"),
    path('change-email/', ChangeEmailView.as_view(), name="change-email"),
    path('verify-change-email/', VerifyChangeEmailView.as_view(), name="verify-change-email"),


    # Teacher
    path('teacher/invitation/', TeacherInvitationView.as_view(), name="teacher-invitation"),
    path("teacher/register/<uuid:token>/", TeacherRegisterView.as_view(), name="teacher-register" ),
    path("teacher/", TeacherListView.as_view(), name="teacher"),
    path("teacher/<int:pk>/", TeacherDetailView.as_view(), name="teacher"),

    #Student
    path("student/register/", StudentRegisterView.as_view(), name="student-register"),
    path("verify-email-link/<uid>/<token>/", VerifyEmailByLinkView.as_view(), name="verify-email-link"),
    path("verify-email-otp/", VerifyEmailByOTPView.as_view(), name="verify-email-otp"),
    path("resend-verification-email/", ResendVerificationEmailView.as_view(), name="resend-verification-email"),
    path("student/", StudentListView.as_view(), name="student"),
    path("student/<int:pk>/", StudentDetailView.as_view(), name="student"),
    path("student/<int:pk>/approve/",StudentApproveView.as_view(),name="student-approve",),
    path("student/<int:pk>/reject/",StudentRejectView.as_view(),name="student-reject",),


    #profile
    path('profile/', ProfileView.as_view(), name="profile"),


    # Course
    path("student-courses/", StudentCourseListView.as_view(), name="student-courses"),
    path("student-courses/<int:pk>/", StudentCourseDetailView.as_view(), name="student-courses"),

    path("", include(router.urls)),


    # Marks & Attendance
    # path("assessments/<int:assessment_id>/marks/",AssessmentMarksView.as_view(),name="assessment-marks",),
    # path("session-courses/<int:session_course_id>/attendance/",AttendanceSessionView.as_view(),name="attendance-session",),
    # path("attendance-sessions/<int:attendance_session_id>/records/",AttendanceRecordView.as_view(),name="attendance-records",),

    # path("student-courses/<int:student_course_id>/result/",StudentResultAPIView.as_view(),name="student-course-result",),
    # path("session-courses/<int:session_course_id>/results/",SessionCourseResultAPIView.as_view(),name="session-course-results",),






]

