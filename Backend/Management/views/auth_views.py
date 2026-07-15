from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenRefreshView


from ..serializers import *
from ..services import AuthServices
from ..renderers import CustomJSONRenderer
from drf_spectacular.utils import extend_schema


@extend_schema(tags=["Authentication"], summary="User Login")
class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = AuthServices.login(
            ip_address=request.META.get("REMOTE_ADDR"),
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Login successful.",
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Authentication"], summary="Refresh Token")
class RefreshTokenView(TokenRefreshView):
    pass


@extend_schema(tags=["Authentication"], summary="Change Password")
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthServices.change_password(
            user=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Authentication"], summary="Forgot Password")
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthServices.forgot_password(
            **serializer.validated_data
        )

        return Response(
            {
                "message": "Password reset OTP has been sent to your email."
            },
            status=status.HTTP_200_OK,
        )
    



@extend_schema(tags=["Authentication"], summary="Reset Password")
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthServices.reset_password(
            **serializer.validated_data
        )

        return Response(
            {
                "message": "Password reset successfully."
            },
            status=status.HTTP_200_OK,
        )
    

@extend_schema(tags=["Authentication"],summary="Change Email",)
class ChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangeEmailSerializer

    def post(self, request):

        serializer = self.serializer_class(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        AuthServices.change_email(
            user=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Verification OTP has been sent to your new email."
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Authentication"], summary="Verify Changed Email")
class VerifyChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VerifyChangeEmailSerializer

    def post(self, request):

        serializer = self.serializer_class(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        AuthServices.verify_change_email(
            user=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Email changed successfully."
            },
            status=status.HTTP_200_OK,
        )