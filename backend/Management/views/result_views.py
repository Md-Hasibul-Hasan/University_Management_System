from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework import status

from ..serializers import (
    SemesterResultRequestSerializer,
    StudentCourseResultSerializer,
    StudentSemesterResultSerializer,
    StudentProgressionRequestSerializer,
    StudentDemotionRequestSerializer,
)
from ..models import Student, YearSemester
from ..permissions import IsAdminOrChairman
from ..services import ResultServices
from drf_spectacular.utils import extend_schema








@extend_schema(
    tags=["Results"],
    summary="List all publishable semester results for the chairman",
    description=(
        "Returns every (session, year_semester) combination of the chairman's "
        "department along with whether its semester result is publishable "
        "(all course results published) and whether it has already been "
        "published. Requires no request body."
    ),
)
class AllPublishableSemesterResultsView(APIView): # Used
    """List all of the chairman's publishable semester results at once."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        department = ResultServices.get_chairman_department(request.user)

        if department is None:
            raise PermissionDenied(
                "Only a Department Chairman can view publishable semester results."
            )

        return Response(
            {
                "is_chairman": True,
                "department": department.id,
                "department_name": str(department),
                "publishable_semester_results": (
                    ResultServices.list_publishable_semester_results(department)
                ),
            }
        )






@extend_schema(
    tags=["Results"],
    summary="Calculate department semester results",
    request=SemesterResultRequestSerializer,
)
class DepartmentSemesterResultCalculateView(APIView): # Used
    """ পাবলিশ করার আগে চেয়ারম্যান একবার রিভিউ করে নিবেন । 
    Calculate (without publishing) the department's semester results."""

    permission_classes = [IsAuthenticated]
    serializer_class = SemesterResultRequestSerializer

    def post(self, request):
        serializer = SemesterResultRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        year_semester = serializer.validated_data["year_semester"]

        department = ResultServices.get_chairman_department(request.user)

        if department is None:
            raise PermissionDenied(
                "Only a Department Chairman can calculate semester results."
            )

        if not ResultServices.all_courses_published(department, session, year_semester):
            raise ValidationError(
                {
                    "detail": (
                        "All course results must be published before semester "
                        "results can be calculated."
                    )
                }
            )

        results = ResultServices.calculate_department_semester_results(
            department, session, year_semester
        )

        payload = []

        for r in results:
            data = {
                "student_id": r["student_id"],
                "student_name": r["student_name"],
                "gpa": str(r["gpa"]),
            }

            data["courses"] = StudentCourseResultSerializer(
                r["courses"],
                many=True
            ).data

            payload.append(data)

        return Response({"results": payload})




@extend_schema(
    tags=["Results"],
    summary="Publish department semester results",
    request=SemesterResultRequestSerializer,
)
class DepartmentSemesterResultPublishView(APIView): # Used
    """Calculate and publish the department's semester results (PASS/FAIL)."""

    permission_classes = [IsAuthenticated]
    serializer_class = SemesterResultRequestSerializer

    def post(self, request):
        serializer = SemesterResultRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = serializer.validated_data["session"]
        year_semester = serializer.validated_data["year_semester"]

        department = ResultServices.get_chairman_department(request.user)

        if department is None:
            raise PermissionDenied(
                "Only a Department Chairman can publish semester results."
            )

        published = ResultServices.publish_department_semester_results(
            department, session, year_semester
        )

        # Notify each affected student that their semester result was published.
        from ..models import Notification

        Notification.objects.bulk_create(
            Notification(
                user=semester_result.student.user,
                notification_type=Notification.Type.RESULT_PUBLISHED,
                title="Semester Result Published",
                message=(
                    f"Your {year_semester} semester result has been published. "
                    "Please review your published result."
                ),
            )
            for semester_result in published
        )

        return Response(
            {
                "detail": "Semester results published successfully.",
                "results": StudentSemesterResultSerializer(
                    published, many=True
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Results"],
    summary="Student's published semester result",
    description=(
        "Returns the logged-in student's published semester result (semester "
        "GPA and status) for a given year_semester, along with each course's "
        "letter grade, grade point and total marks."
    ),
)
class MySemesterResultView(APIView): # Used
    """Get the logged-in student's published semester result (by year_semester)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        year_semester_id = request.query_params.get("year_semester")

        if not year_semester_id:
            raise ValidationError(
                {"year_semester": "This query parameter is required."}
            )

        student = getattr(request.user, "student_profile", None)

        if student is None:
            raise PermissionDenied("Only students can view semester results.")

        year_semester = YearSemester.objects.filter(pk=year_semester_id).first()

        if year_semester is None:
            raise ValidationError({"year_semester": "Invalid year_semester."})

        result = ResultServices.get_student_semester_result(
            student, year_semester
        )

        if result is None:
            return Response(
                {
                    "published": False,
                    "year_semester": year_semester.id,
                    "year_semester_name": str(year_semester),
                    "detail": (
                        "Semester result has not been published yet for this semester."
                    ),
                }
            )

        return Response(result)



@extend_schema(
    tags=["Results"],
    summary="Student's CGPA",
    description=(
        "Returns the logged-in student's credit-weighted CGPA computed from "
        "all completed (passed) course enrollments. Retaken courses count "
        "once, using the best grade point."
    ),
)
class MyCgpaView(APIView): # Used
    """Get the logged-in student's computed CGPA."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, "student_profile", None)

        if student is None:
            raise PermissionDenied("Only students can view their CGPA.")

        completed_courses = student.student_courses.filter(
            status="completed",
        ).select_related("session_course__course")
        credits_by_course = {
            course.session_course.course_id: course.session_course.course.credit
            for course in completed_courses
        }

        return Response(
            {
                "cgpa": str(student.cgpa),
                "credits_completed": str(sum(credits_by_course.values(), 0)),
                "courses_completed": len(credits_by_course),
            }
        )


class _StudentProgressionActionView(APIView):
    permission_classes = [IsAdminOrChairman]

    def get_students(self, request, student_ids):
        queryset = Student.objects.select_related("department", "session", "year_semester")
        teacher = getattr(request.user, "teacher_profile", None)
        if teacher and teacher.is_head and teacher.department:
            queryset = queryset.filter(department=teacher.department)

        students = list(queryset.filter(id__in=student_ids))
        if len(students) != len(set(student_ids)):
            raise PermissionDenied(
                "You can only manage students within your permitted scope."
            )
        return students


@extend_schema(
    tags=["Student Progression"],
    summary="Promote students manually",
    request=StudentProgressionRequestSerializer,
)
class StudentProgressionPromoteView(_StudentProgressionActionView):
    def post(self, request):
        serializer = StudentProgressionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        students = self.get_students(request, serializer.validated_data["student_ids"])
        results = [ResultServices.manually_promote_student(student) for student in students]
        return Response({"results": results})


@extend_schema(
    tags=["Student Progression"],
    summary="Demote students manually",
    request=StudentDemotionRequestSerializer,
)
class StudentProgressionDemoteView(_StudentProgressionActionView):
    def post(self, request):
        serializer = StudentDemotionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        students = self.get_students(request, serializer.validated_data["student_ids"])
        results = [
            ResultServices.manually_demote_student(
                student,
                serializer.validated_data["target_session"],
                serializer.validated_data["target_year_semester"],
            )
            for student in students
        ]
        return Response({"results": results})








