from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.profile_serializers import (
    ProfileSerializer,
    UpdateStudentProfileSerializer,
    UpdateTeacherProfileSerializer,
)
from ..services.profile_services import ProfileServices


@extend_schema(tags=["Profile"])
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        profile = ProfileServices.get_profile(request.user)

        serializer = ProfileSerializer(profile)

        return Response(serializer.data)

    @extend_schema(
        request=UpdateStudentProfileSerializer,
        responses={200: None},
    )
    def patch(self, request):

        if request.user.is_student:

            serializer = UpdateStudentProfileSerializer(
                data=request.data,
                partial=True,
            )

            serializer.is_valid(raise_exception=True)

            ProfileServices.update_student_profile(
                request.user,
                **serializer.validated_data,
            )

        else:
            serializer = UpdateTeacherProfileSerializer(
                data=request.data,
                partial=True,
            )

            serializer.is_valid(raise_exception=True)

            ProfileServices.update_teacher_profile(
                request.user,
                **serializer.validated_data,
            )

        return Response(
            {
                "message": "Profile updated successfully."
            },
            status=status.HTTP_200_OK,
        )