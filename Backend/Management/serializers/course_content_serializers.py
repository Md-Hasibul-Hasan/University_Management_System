from rest_framework import serializers

from ..models import *


class CourseMaterialFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterialFile
        fields = ["id", "file"]

class CourseMaterialSerializer(serializers.ModelSerializer):
    files = CourseMaterialFileSerializer(many=True, read_only=True)

    class Meta:
        model = CourseMaterial
        fields = [
            "id",
            "session_course",
            "title",
            "description",
            "uploaded_by",
            "uploaded_at",
            "updated_at",
            "files",
        ]

class CourseMaterialCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = CourseMaterial
        fields = [
            "session_course",
            "title",
            "description",
            "files",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        files = validated_data.pop("files", [])

        material = CourseMaterial.objects.create(
            uploaded_by=request.user,
            **validated_data,
        )

        CourseMaterialFile.objects.bulk_create([
            CourseMaterialFile(
                material=material,
                file=file,
            )
            for file in files
        ])

        return material