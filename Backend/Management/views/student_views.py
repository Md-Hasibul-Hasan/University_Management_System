from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404 


from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from ..serializers import *
from ..models import *
from ..services import StudentServices
from ..renderers import CustomJSONRenderer
from drf_spectacular.utils import extend_schema





@extend_schema(tags=["Student"], summary="Student Registraion")
class StudentRegisterView(APIView):

    permission_classes = [AllowAny]
    serializer_class = StudentRegisterSerializer

    def post(self, request):

        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = StudentServices.register_student(
            **serializer.validated_data
        )

        if user is None:
            return Response(
                {
                    "message": "Your account is not verified. A new verification email has been sent."
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Registration successful. Please verify your email."},
            status=status.HTTP_201_CREATED,
        )
    

@extend_schema(tags=["Student"], summary="Verify Email with link")
class VerifyEmailByLinkView(APIView):
    permission_classes = [AllowAny]
    # renderer_classes = [CustomJSONRenderer]

    def post(self, request, uid, token):

        StudentServices.verify_email_by_link(uid,token)
        
        return Response(
            {"message": "Email verified successfully. Wait for admin approval."},
            status=status.HTTP_200_OK
        )



@extend_schema(tags=["Student"], summary="Verify Email with otp")
class VerifyEmailByOTPView(APIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailByOTPSerializer

    def post(self, request):
        serializer = VerifyEmailByOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        StudentServices.verify_email_by_otp(
            **serializer.validated_data
        )

        return Response(
            {"message": "Email verified successfully. Wait for admin approval."},
            status=status.HTTP_200_OK,
        )
    

@extend_schema(tags=["Student"], summary="Resend verification Link and Otp")
class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        StudentServices.resend_verification_email(
            **serializer.validated_data
        )

        return Response(
            {"message": "Verification email sent successfully."},
            status=status.HTTP_200_OK,
        )





@extend_schema(tags=["Student"], summary="All Student Info")
class StudentListView(ListAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdminUser]


    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["department", "approval_status"]
    search_fields = ["user__name",  "department__name", "student_id"]
    ordering_fields = ["created_at"]
    # ordering = ['-created_at'] # Default ordering
    # pagination_class = MyPageNumberPagination



@extend_schema(tags=["Student"], summary="Student Info")
class StudentDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.select_related("user", "department")
    serializer_class = StudentSerializer
    permission_classes = [IsAdminUser]



@extend_schema(
    tags=["Student"],
    summary="Approve Student",
)
class StudentApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        student = get_object_or_404(Student, pk=pk)

        StudentServices.approve_student(
            student=student,
            approved_by=request.user,
        )

        return Response(
            {"detail": "Student approved successfully."},
            status=status.HTTP_200_OK,
        )
    

@extend_schema(
    tags=["Student"],
    summary="Reject Student",
)
class StudentRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        student = get_object_or_404(Student, pk=pk)

        StudentServices.reject_student(student)

        return Response(
            {"detail": "Student rejected successfully."},
            status=status.HTTP_200_OK,
        )