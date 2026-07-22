from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models import *
from ..serializers import *


@extend_schema(tags=["Course Materials"])
@extend_schema_view(
    create=extend_schema(
        request=CourseMaterialCreateSerializer,
        responses={201: CourseMaterialSerializer},
    ),
    update=extend_schema(
        request=CourseMaterialCreateSerializer,
        responses={200: CourseMaterialSerializer},
    ),
    partial_update=extend_schema(
        request=CourseMaterialCreateSerializer,
        responses={200: CourseMaterialSerializer},
    ),
)
class CourseMaterialViewSet(ModelViewSet):
    queryset = (
        CourseMaterial.objects
        .select_related(
            "session_course",
            "uploaded_by",
        )
        .prefetch_related("files")
    )

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CourseMaterialCreateSerializer
        return CourseMaterialSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material = serializer.save()

        return Response(
            CourseMaterialSerializer(
                material,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Course Announcements"])
@extend_schema_view(
    create=extend_schema(
        request=CourseAnnouncementCreateSerializer,
        responses={201: CourseAnnouncementSerializer},
    ),
    update=extend_schema(
        request=CourseAnnouncementCreateSerializer,
        responses={200: CourseAnnouncementSerializer},
    ),
    partial_update=extend_schema(
        request=CourseAnnouncementCreateSerializer,
        responses={200: CourseAnnouncementSerializer},
    ),
)
class CourseAnnouncementViewSet(ModelViewSet):
    queryset = (
        CourseAnnouncement.objects
        .select_related(
            "session_course",
            "created_by",
        )
        .prefetch_related("files")
    )

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CourseAnnouncementCreateSerializer
        return CourseAnnouncementSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        announcement = serializer.save()

        return Response(
            CourseAnnouncementSerializer(
                announcement,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ==================== Assignment ====================


@extend_schema(tags=["Course Assignments"])
@extend_schema_view(
    create=extend_schema(
        request=AssignmentCreateSerializer,
        responses={201: AssignmentSerializer},
    ),
    update=extend_schema(
        request=AssignmentCreateSerializer,
        responses={200: AssignmentSerializer},
    ),
    partial_update=extend_schema(
        request=AssignmentCreateSerializer,
        responses={200: AssignmentSerializer},
    ),
)
class AssignmentViewSet(ModelViewSet):
    queryset = (
        Assignment.objects
        .select_related(
            "session_course",
            "created_by",
        )
        .prefetch_related("files")
    )

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AssignmentCreateSerializer
        return AssignmentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assignment = serializer.save()

        return Response(
            AssignmentSerializer(
                assignment,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Course Assignment Submissions"])
@extend_schema_view(
    create=extend_schema(
        request=AssignmentSubmissionCreateSerializer,
        responses={201: AssignmentSubmissionSerializer},
    ),
    update=extend_schema(
        request=AssignmentSubmissionCreateSerializer,
        responses={200: AssignmentSubmissionSerializer},
    ),
    partial_update=extend_schema(
        request=AssignmentSubmissionCreateSerializer,
        responses={200: AssignmentSubmissionSerializer},
    ),
)
class AssignmentSubmissionViewSet(ModelViewSet):
    queryset = (
        AssignmentSubmission.objects
        .select_related(
            "assignment",
            "student",
        )
        .prefetch_related("files")
    )

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AssignmentSubmissionCreateSerializer
        return AssignmentSubmissionSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        assignment = get_object_or_404(
            Assignment,
            pk=request.data["assignment"],
        )

        if assignment.due_at < timezone.now():
            return Response(
                {"detail": "Assignment deadline has passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = request.user.student_profile
        files = serializer.validated_data.pop("files", [])

        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment,
            student=student,
            defaults=serializer.validated_data,
        )

        if not created:
            submission.note = serializer.validated_data.get("note", "")
            submission.save()

            submission.files.all().delete()

        AssignmentSubmissionFile.objects.bulk_create([
            AssignmentSubmissionFile(
                submission=submission,
                file=file,
            )
            for file in files
        ])

        return Response(
            AssignmentSubmissionSerializer(
                submission,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )