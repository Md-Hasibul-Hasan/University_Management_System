from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser

from ..serializers import *
from ..services import TeacherServices
from ..renderers import CustomJSONRenderer
from drf_spectacular.utils import extend_schema





@extend_schema(tags=["Teacher"], summary="Teacher Inivitation")
class TeacherInvitationView(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = TeacherInvitationSerializer

    def post(self, request):

        serializer = TeacherInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        TeacherServices.create_teacher_invitation(
            invited_by=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Teacher invitation sent successfully."
            },
            status=status.HTTP_201_CREATED,
        )
    

@extend_schema(tags=["Teacher"], summary="Teacher Register")
class TeacherRegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = TeacherRegisterSerializer

    def post(self, request, token):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        TeacherServices.register_teacher(
            token=token,
            **serializer.validated_data,
        )

        return Response(
            {
                "message": "Teacher account created successfully."
            },
            status=status.HTTP_201_CREATED,
        )