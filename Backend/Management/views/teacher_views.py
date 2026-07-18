from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAdminUser

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from ..serializers import *
from ..models import *
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
    


@extend_schema(tags=["Teacher"], summary="All Techers Info")
class TeacherListView(ListAPIView):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAdminUser]


    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["department", "is_head"]
    search_fields = ["user__name",  "department__name", "employee_id"]
    ordering_fields = ["created_at"]
    # ordering = ['-created_at'] # Default ordering
    # pagination_class = MyPageNumberPagination



@extend_schema(tags=["Teacher"], summary="Techer Info")
class TeacherDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Teacher.objects.select_related("user", "department")
    serializer_class = TeacherSerializer
    permission_classes = [IsAdminUser]