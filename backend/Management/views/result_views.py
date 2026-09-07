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
)
from ..models import YearSemester
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
class AllPublishableSemesterResultsView(APIView):
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
    summary="Department semester result publish status",
    description=(
        "Determines the chairman's department and whether all of that "
        "department's courses, for the given session + semester, have had "
        "their course results published."
    ),
    request=SemesterResultRequestSerializer,
)
class DepartmentSemesterResultStatusView(GenericAPIView):
    """Check, for the logged-in chairman, whether all course results are published."""

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
                "Only a Department Chairman can check semester result status."
            )

        unpublished = ResultServices.get_unpublished_courses(
            department, session, year_semester
        )
        total_courses = ResultServices.count_department_courses(
            department, session, year_semester
        )

        return Response(
            {
                "is_chairman": True,
                "department": department.id,
                "department_name": str(department),
                "session": session.id,
                "session_name": session.academic_year,
                "year_semester": year_semester.id,
                "year_semester_name": str(year_semester),
                "total_courses": total_courses,
                "published_courses": total_courses - len(unpublished),
                "all_courses_published": (
                    total_courses > 0 and len(unpublished) == 0
                ),
                "unpublished_courses": [
                    {
                        "id": sc.id,
                        "course_code": sc.course.code,
                        "course_title": sc.course.title,
                    }
                    for sc in unpublished
                ],
                "existing_published_result": (
                    department.students.filter(
                        semester_results__session=session,
                        semester_results__year_semester=year_semester,
                        semester_results__published=True,
                    ).exists()
                ),
            }
)



@extend_schema(
    tags=["Results"],
    summary="Calculate department semester results",
    request=SemesterResultRequestSerializer,
)
class DepartmentSemesterResultCalculateView(APIView):
    """Calculate (without publishing) the department's semester results."""

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

        payload = [
            {
                "student_id": r["student_id"],
                "student_name": r["student_name"],
                "gpa": str(r["gpa"]),
                "status": r["status"],
                "courses": StudentCourseResultSerializer(
                    r["courses"], many=True
                ).data,
            }
            for r in results
        ]

        return Response({"results": payload})




@extend_schema(
    tags=["Results"],
    summary="Publish department semester results",
    request=SemesterResultRequestSerializer,
)
class DepartmentSemesterResultPublishView(APIView):
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
                    f"Status: {semester_result.get_status_display()}"
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
class MySemesterResultView(APIView):
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
    summary="Session course results (all students)",
    description=(
        "Returns every enrolled student's computed result (total marks, "
        "letter grade and grade point) for a session course."
    ),
)
class SessionCourseResultsView(APIView):
    """Per-student results (total marks / letter grade / grade point) for a
    session course."""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_course_id: int):
        from ..serializers import StudentCourseResultSerializer

        results = ResultServices.get_session_course_results(session_course_id)
        data = StudentCourseResultSerializer(results, many=True).data

        # Serializer fields on a plain Serializer return the raw input values
        # (Decimals / model objects), so coerce to JSON-safe primitives here.
        for row in data:
            row["total_marks"] = str(row["total_marks"]) if row.get("total_marks") is not None else None
            row["grade_point"] = str(row["grade_point"]) if row.get("grade_point") is not None else None
            row["session"] = str(row["session"])
            row["year_semester"] = str(row["year_semester"])

            # The assessments child list is a raw ListField — its Decimals are
            # not coerced by DRF, so stringify marks / max_marks explicitly.
            for assessment in row.get("assessments") or []:
                if "marks" in assessment and assessment["marks"] is not None:
                    assessment["marks"] = str(assessment["marks"])
                if "max_marks" in assessment and assessment["max_marks"] is not None:
                    assessment["max_marks"] = str(assessment["max_marks"])

        return Response(data)


@extend_schema(
    tags=["Results"],
    summary="Student's CGPA",
    description=(
        "Returns the logged-in student's credit-weighted CGPA computed from "
        "all completed (passed) course enrollments. Retaken courses count "
        "once, using the best grade point."
    ),
)
class MyCgpaView(APIView):
    """Get the logged-in student's computed CGPA."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, "student_profile", None)

        if student is None:
            raise PermissionDenied("Only students can view their CGPA.")

        return Response(ResultServices.get_student_cgpa(student))








