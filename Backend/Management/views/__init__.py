from .student_views import StudentRegisterView, VerifyEmailByLinkView, VerifyEmailByOTPView, ResendVerificationEmailView
from .teacher_views import TeacherInvitationView, TeacherRegisterView
from .auth_views import LoginView, RefreshTokenView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, ChangeEmailView, VerifyChangeEmailView
from .master_data_views import FacultyViewSet, DepartmentViewSet, SessionViewSet, YearSemesterViewSet
from .profile_views import ProfileView