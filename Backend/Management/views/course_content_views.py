from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status 

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