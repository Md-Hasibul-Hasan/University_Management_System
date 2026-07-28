from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from ..serializers import *
from ..services import *


class StudentResultAPIView(GenericAPIView):

    serializer_class = StudentResultSerializer

    @extend_schema(
        tags=["Results"],
        summary="ঐ student-এর result দেখায়",
        responses=StudentResultSerializer,
    )
    def get(self, request, student_course_id):

        result = ResultServices.get_student_result(
            student_course_id
        )

        serializer = self.get_serializer(result)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class SessionCourseResultAPIView(GenericAPIView):

    serializer_class = SessionCourseResultSerializer

    @extend_schema(
        tags=["Results"],
        summary="ঐ session course-এর সব student-এর result দেখায়",
        responses=SessionCourseResultSerializer(many=True),
    )
    def get(self, request, session_course_id):

        result = ResultServices.get_session_course_results(
            session_course_id
        )

        serializer = self.get_serializer(
            result,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    


