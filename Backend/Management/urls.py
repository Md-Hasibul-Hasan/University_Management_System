from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import *

# router = DefaultRouter()
# router.register(r"permissions", views.PermissionViewSet, basename="permission")
# router.register(r"groups", views.GroupViewSet, basename="group")
# router.register(r"user-access", views.UserGroupPermissionViewSet, basename="user-access")

urlpatterns = [

    path('login/', LoginView.as_view(), name="login"),
    path('refresh-token/', RefreshTokenView.as_view(), name="refresh-token" ),
    path("change-password/",ChangePasswordView.as_view(),name="change-password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(),name="reset-password"),
    path('change-email/', ChangeEmailView.as_view(), name="change-email"),
    path('verify-change-email/', VerifyChangeEmailView.as_view(), name="verify-change-email"),

    path("student/register/", StudentRegisterView.as_view(), name="student-register"),
    path("verify-email-link/<uid>/<token>/", VerifyEmailByLinkView.as_view(), name="verify-email-link"),
    path("verify-email-otp/", VerifyEmailByOTPView.as_view(), name="verify-email-otp"),
    path("resend-verification-email/", ResendVerificationEmailView.as_view(), name="resend-verification-email"),

    path('teacher/invitation/', TeacherInvitationView.as_view(), name="teacher-invitation"),
    path("teacher/register/<uuid:token>/", TeacherRegisterView.as_view(), name="teacher-register" )
]
    # # Registration & Email Verification
    # path("register/", views.RegisterView.as_view(), name="register"),
    # # Google Login
    # path("google-login/", views.GoogleLoginView.as_view(), name="google-login"),
    # # Login
    # path("login/", views.LoginView.as_view(), name="login"),
    # # 2FA
    # path("2fa/verify/", views.Verify2FAView.as_view(), name="verify-2fa"),
    # path("2fa/setup/", views.Setup2FAView.as_view(), name="setup-2fa"),
    # path("2fa/enable/", views.Enable2FAView.as_view(), name="enable-2fa"),
    # path("2fa/disable/", views.Disable2FAView.as_view(), name="disable-2fa"),
    # path("2fa/status/", views.Get2FAStatusView.as_view(), name="2fa-status"),
    # # Login History & Sessions
    # path("login-history/", views.LoginHistoryView.as_view(), name="login-history"),
    # path("active-sessions/", views.ActiveSessionsView.as_view(), name="active-sessions"),
    # path("delete-session/<int:session_id>/", views.DeleteSessionView.as_view(), name="delete-session"),
    # path("logout/", views.LogoutView.as_view(), name="logout"),
    # path("logout-all/", views.LogoutAllDevicesView.as_view(), name="logout-all"),
    # # Password Management
    # path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    # path("reset-password/request/", views.SendResetPasswordEmailView.as_view(), name="reset-password-request"),
    # path("reset-password/by-link/<uid>/<token>/", views.ResetPasswordView.as_view(), name="reset-password-by-link"),
    # path("reset-password/by-otp/", views.ResetPasswordWithOTPView.as_view(), name="reset-password-by-otp"),
    # # Profile
    # path("profile/", views.ProfileView.as_view(), name="profile"),
    # # Email Change
    # path("change-email/request/", views.ChangeEmailView.as_view(), name="request-change-email"),
    # path("change-email/confirm/", views.ConfirmChangeEmailView.as_view(), name="confirm-change-email"),
    # # Account Deletion
    # path("delete-account/", views.DeleteAccountView.as_view(), name="delete-account"),
    # # Token Management
    # path("token/verify/", views.CustomTokenVerifyView.as_view(), name="token_verify"),
    # path("token/refresh/", views.SessionTokenRefreshView.as_view(), name="token_refresh"),
