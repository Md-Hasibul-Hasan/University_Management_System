from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView, GenericAPIView
from django.db.models import Prefetch
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework import status

from ..models import *
from ..serializers import *
from ..services import *
from drf_spectacular.utils import extend_schema








# ======================== Assessment Marks===============


@extend_schema(tags=["Assessments"])
class AssessmentMarksView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_assessment(self, assessment_id):
        assessment = (
            CourseAssessment.objects.select_related("session_course__course")
            .filter(pk=assessment_id)
            .first()
        )

        if not assessment:
            raise NotFound("Assessment not found.")

        return assessment


    @extend_schema(
            responses=AssessmentStudentSerializer(many=True),
        )
    def get(self, request, assessment_id):

        assessment = self.get_assessment(
            assessment_id
        )

        students = list(
            StudentCourse.objects.filter(
                session_course=assessment.session_course,
            )
            .select_related(
                "student__user",
            )
            .prefetch_related(
                Prefetch(
                    "assessment_marks",
                    queryset=StudentAssessmentMark.objects.filter(
                        assessment=assessment,
                    ),
                    to_attr="assessment_marks_cache",
                )
            )
        )

        if assessment.assessment_type == CourseAssessment.AssessmentType.ATTENDANCE:
            students = Marks_Attendance_Services.populate_attendance_percentage(
                students=students,
                session_course=assessment.session_course,
            )

        serializer = AssessmentStudentSerializer(
            students,
            many=True,
            context={
                "assessment": assessment,
            },
        )




        return Response(serializer.data)



    @extend_schema(
        request=StudentAssessmentBulkSerializer,
        responses={200: None},
    )
    def post(self, request, assessment_id):

        serializer = StudentAssessmentBulkSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        assessment = self.get_assessment(
            assessment_id
        )

        Marks_Attendance_Services.save_marks(
            assessment=assessment,
            marks_data=serializer.validated_data["marks"],
            teacher=request.user.teacher_profile,
            entered_by=request.user,
            
        )

        return Response(
            {
                "detail": "Marks saved successfully."
            },
            status=status.HTTP_200_OK,
        )



# ===================================== Attendance Session =======================


@extend_schema(tags=["Attendances"])
class AttendanceSessionView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="নতুন Attendance Session তৈরি করে",
        request=AttendanceSessionSerializer,
        responses={201: None},
    )
    def post(self, request, session_course_id):

        serializer = AttendanceSessionSerializer(data=request.data,)

        serializer.is_valid(raise_exception=True,)

        session_course = (SessionCourse.objects.filter(pk=session_course_id,).first())

        if not session_course:
            raise NotFound(
                "Session course not found."
            )

        attendance_session = Marks_Attendance_Services.create_attendance_session(
            session_course=session_course,
            teacher=request.user.teacher_profile,
            date=serializer.validated_data["date"],
        )

        return Response(
            {
                "detail": "Attendance session created successfully.",
                "data": AttendanceSessionSerializer(attendance_session).data,
                
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Attendances"])
class AttendanceRecordView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_attendance_session(self,attendance_session_id,):

        attendance_session = (
            AttendanceSession.objects.select_related(
                "session_course",
            )
            .filter(
                pk=attendance_session_id,
            )
            .first()
        )

        if not attendance_session:
            raise NotFound(
                "Attendance session not found."
            )

        return attendance_session

    @extend_schema(
        tags=["Attendances"] , 
        summary="ঐ Attendance Session-এর সব student-এর attendance list দেখায়",
        responses=AttendanceStudentSerializer(
            many=True,
        ),
    )
    def get(self,request,attendance_session_id,):

        attendance_session = self.get_attendance_session(
            attendance_session_id,
        )

        students = (
            StudentCourse.objects.filter(
                session_course=attendance_session.session_course,
            )
            .select_related(
                "student__user",
            )
            .prefetch_related(
                Prefetch(
                    "attendance_records",
                    queryset=StudentAttendance.objects.filter(
                        attendance_session=attendance_session,
                    ),
                    to_attr="attendance_cache",
                )
            )
        )

        serializer = AttendanceStudentSerializer(
            students,
            many=True,
        )

        return Response(
            serializer.data,
        )

    @extend_schema(
        summary="Student-দের attendance save/update করে",
        request=AttendanceBulkSerializer,
        responses={200: None},
    )
    def post(
        self,
        request,
        attendance_session_id,
    ):

        serializer = AttendanceBulkSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        attendance_session = self.get_attendance_session(
            attendance_session_id,
        )

        Marks_Attendance_Services.save_attendance(
            attendance_session=attendance_session,
            attendance_data=serializer.validated_data["attendance"],
            teacher=request.user.teacher_profile,
        )

        return Response(
            {
                "detail": "Attendance saved successfully."
            },
            status=status.HTTP_200_OK,
        )

