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
    


# ====================== Announcement ======================

class CourseAnnouncementFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAnnouncementFile
        fields = ["id", "file"]


class CourseAnnouncementSerializer(serializers.ModelSerializer):
    files = CourseAnnouncementFileSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = CourseAnnouncement
        fields = [
            "id",
            "session_course",
            "title",
            "message",
            "is_pinned",
            "created_by",
            "created_at",
            "updated_at",
            "files",
        ]


class CourseAnnouncementCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = CourseAnnouncement
        fields = [
            "session_course",
            "title",
            "message",
            "is_pinned",
            "files",
        ]

    def create(self, validated_data):
        request = self.context["request"]

        files = validated_data.pop("files", [])

        announcement = CourseAnnouncement.objects.create(
            created_by=request.user,
            **validated_data,
        )

        CourseAnnouncementFile.objects.bulk_create(
            [
                CourseAnnouncementFile(
                    announcement=announcement,
                    file=file,
                )
                for file in files
            ]
        )

        return announcement
    

# =========================== Assignment ===========================





class AssignmentFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentFile
        fields = ["id", "file"]


class AssignmentSerializer(serializers.ModelSerializer):
    files = AssignmentFileSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Assignment
        fields = [
            "id",
            "session_course",
            "title",
            "description",
            "due_at",
            "created_by",
            "created_at",
            "updated_at",
            "files",
        ]


class AssignmentCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Assignment
        fields = [
            "session_course",
            "title",
            "description",
            "due_at",
            "files",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        files = validated_data.pop("files", [])

        assignment = Assignment.objects.create(
            created_by=request.user,
            **validated_data,
        )

        AssignmentFile.objects.bulk_create([
            AssignmentFile(
                assignment=assignment,
                file=file,
            )
            for file in files
        ])

        return assignment
    


class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmissionFile
        fields = ["id", "file"]


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    files = AssignmentSubmissionFileSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignment",
            "student",
            "note",
            "submitted_at",
            "updated_at",
            "files",
        ]


class AssignmentSubmissionCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = AssignmentSubmission
        fields = [
            "assignment",
            "note",
            "files",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        student = request.user.student_profile

        files = validated_data.pop("files", [])

        submission = AssignmentSubmission.objects.create(
            student=student,
            **validated_data,
        )

        AssignmentSubmissionFile.objects.bulk_create([
            AssignmentSubmissionFile(
                submission=submission,
                file=file,
            )
            for file in files
        ])

        return submission
    



    

















