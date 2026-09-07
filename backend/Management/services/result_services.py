from collections import defaultdict
from rest_framework.exceptions import ValidationError
from decimal import Decimal, ROUND_HALF_UP
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from ..models import *


class ResultServices:
    """Service layer for calculating student results and grades."""

    # Ordered from highest minimum marks to lowest. The first entry whose
    # minimum is met/exceeded by the total marks determines the grade.
    GRADING_SCALE = [
        (80, "A+", Decimal("4.00")),
        (75, "A", Decimal("3.75")),
        (70, "A-", Decimal("3.50")),
        (65, "B+", Decimal("3.25")),
        (60, "B", Decimal("3.00")),
        (55, "B-", Decimal("2.75")),
        (50, "C+", Decimal("2.50")),
        (45, "C", Decimal("2.25")),
        (40, "D", Decimal("2.00")),
    ]

    # Minimum overall CGPA required to be promoted to the NEXT academic year,
    # keyed by the year the student is currently finishing.
    YEAR_PROMOTION_MINIMUM_CGPA = {
        "first": "2.00",   # 1st Year -> 2nd Year
        "second": "2.25",  # 2nd Year -> 3rd Year
        "third": "2.50",   # 3rd Year -> 4th Year
    }


    # ------------------------------------------------------------------
    # Private helpers — data fetching / grouping
    # ------------------------------------------------------------------

    @staticmethod
    def _build_marks_lookup(session_course: SessionCourse) -> dict:
        """Build an O(1) lookup of {(student_course_id, assessment_id): marks}."""
        marks_qs = StudentAssessmentMark.objects.filter(
            student_course__session_course=session_course,
        )
        return {
            (mark.student_course_id, mark.assessment_id): mark.marks
            for mark in marks_qs
        }

    @staticmethod
    def _group_marks(
        student_course: StudentCourse,
        assessments: list[CourseAssessment],
        marks_lookup: dict,
    ) -> defaultdict:
        """Group assessments by their `assessment_type` and attach obtained marks.

        Uses the O(1) marks_lookup instead of hitting the database.
        """
        grouped = defaultdict(list)

        for assessment in assessments:
            key = (student_course.id, assessment.id)
            obtained_marks = marks_lookup.get(key, Decimal("0.00"))

            grouped[assessment.assessment_type].append(
                {
                    "assessment": assessment,
                    "marks": obtained_marks,
                }
            )

        return grouped

    @staticmethod
    def _validate_group(items: list[dict]) -> None:
        """Validate that all assessments in a group have:
        - The same calculation_type.
        - If AVERAGE, identical max_marks.

        Not currently called (kept for future use, matching original code).
        """
        first = items[0]["assessment"]

        for item in items[1:]:
            assessment = item["assessment"]

            if assessment.calculation_type != first.calculation_type:
                raise ValueError(
                    "All assessments in the same group must have the "
                    "same calculation type. "
                    f"Expected '{first.calculation_type}', "
                    f"got '{assessment.calculation_type}'."
                )

        if first.calculation_type == CourseAssessment.CalculationType.AVERAGE:
            first_max = first.max_marks
            for item in items[1:]:
                if item["assessment"].max_marks != first_max:
                    raise ValueError(
                        "All assessments in an AVERAGE group must have "
                        "identical max_marks. "
                        f"Expected {first_max}, "
                        f"got {item['assessment'].max_marks}."
                    )

    # ------------------------------------------------------------------
    # Private helpers — breakdown building
    # ------------------------------------------------------------------

    @staticmethod
    def _build_assessment_breakdown(grouped_assessments: defaultdict) -> tuple[list[dict], Decimal]:
        """Build the per-group breakdown list and the running total marks.

        Returns a tuple of (assessment_breakdown, total_marks).
        """
        assessment_breakdown = []
        total_marks = Decimal("0.00")

        for assessment_type, items in grouped_assessments.items():
            ResultServices._validate_group(items)
            group_marks = ResultServices._calculate_group_marks(items)
            group_max_marks = ResultServices._calculate_group_max_marks(items)
            group_name = ResultServices._get_group_name(assessment_type, items)

            total_marks += group_marks

            assessment_breakdown.append(
                {
                    "id": items[0]["assessment"].id,
                    "title": items[0]["assessment"].title,
                    "name": group_name,
                    "assessment_type": assessment_type,
                    "calculation_type": items[0]["assessment"].calculation_type,
                    "marks": ResultServices._round(group_marks),
                    "max_marks": ResultServices._round(group_max_marks),
                }
            )

        return assessment_breakdown, total_marks

    @staticmethod
    def _calculate_group_marks(items: list[dict]) -> Decimal:
        """Calculate total (or averaged) marks for a group of assessments."""
        calculation_type = items[0]["assessment"].calculation_type
        total = sum(item["marks"] for item in items)

        if calculation_type == CourseAssessment.CalculationType.AVERAGE:
            return total / len(items)

        return total

    @staticmethod
    def _calculate_group_max_marks(items: list[dict]) -> Decimal:
        """Calculate the max marks achievable for a group."""
        calculation_type = items[0]["assessment"].calculation_type

        if calculation_type == CourseAssessment.CalculationType.AVERAGE:
            return items[0]["assessment"].max_marks

        return sum(item["assessment"].max_marks for item in items)

    @staticmethod
    def _get_group_name(assessment_type: str, items: list[dict]) -> str:
        """Return a human-readable name for the assessment group."""
        assessment = items[0]["assessment"]

        if assessment_type == CourseAssessment.AssessmentType.ATTENDANCE:
            return "Attendance"

        if assessment_type == CourseAssessment.AssessmentType.FINAL:
            return assessment.title

        return assessment.get_assessment_type_display()

    @staticmethod
    def _round(value: Decimal) -> Decimal:
        """Round a Decimal to 2 decimal places using HALF_UP rounding."""
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)



    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_session_course_result(session_course: SessionCourse) -> list[dict]:
        """Calculate results for every enrolled student in a session course.

        Executes only 3 DB queries regardless of student count.
        """
        student_courses = list(
            StudentCourse.objects.filter(
                session_course=session_course,
                status__in=[
                    StudentCourse.Status.ENROLLED,
                    StudentCourse.Status.COMPLETED,
                    StudentCourse.Status.FAILED,
                    StudentCourse.Status.INCOMPLETE,
                    StudentCourse.Status.DROPPED,
                ],
            ).select_related("student")
        )

        assessments = list(session_course.assessments.all())

        marks_lookup = ResultServices._build_marks_lookup(session_course)

        return [
            ResultServices.calculate_student_result(
                student_course=student_course,
                assessments=assessments,
                marks_lookup=marks_lookup,
            )
            for student_course in student_courses
        ]

    @staticmethod
    def calculate_student_result(
        student_course: StudentCourse,
        assessments: list[CourseAssessment],
        marks_lookup: dict,
    ) -> dict:
        """Calculate the result for a single student.

        Performs ZERO database queries — all data is passed in.
        """
        grouped_assessments = ResultServices._group_marks(
            student_course=student_course,
            assessments=assessments,
            marks_lookup=marks_lookup,
        )

        assessment_breakdown, total_marks = (
            ResultServices._build_assessment_breakdown(grouped_assessments)
        )

        total_marks = ResultServices._round(total_marks)
        grade = ResultServices.calculate_grade(total_marks)

        return {
            "student_id": student_course.student.student_id,
            "student_name": str(student_course.student.user.name),
            "student_course": student_course.id,
            "course_code": student_course.session_course.course.code,
            "course_title": student_course.session_course.course.title,
            "session": student_course.session_course.session,
            "session_course": student_course.session_course.id,
            "year_semester": str(student_course.session_course.course.year_semester),
            "assessments": assessment_breakdown,
            "total_marks": total_marks,
            "letter_grade": grade["letter_grade"],
            "grade_point": grade["grade_point"],
        }


    # ------------------------------------------------------------------
    # Public grading
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_grade(total_marks: Decimal) -> dict:
        """Return the letter grade and grade point for given total marks."""
        for minimum_marks, letter_grade, grade_point in ResultServices.GRADING_SCALE:
            if total_marks >= Decimal(str(minimum_marks)):
                return {
                    "letter_grade": letter_grade,
                    "grade_point": grade_point,
                }

        return {
            "letter_grade": "F",
            "grade_point": Decimal("0.00"),
        }

    # Non-marks grades: Incomplete (I) and Withdrawn (W). These carry no grade
    # point and are excluded from GPA calculations.
    DEFERRED_GRADES = {
        StudentCourse.Status.INCOMPLETE: {"letter_grade": "I", "grade_point": None},
        StudentCourse.Status.DROPPED: {"letter_grade": "W", "grade_point": None},
    }

    @staticmethod
    def is_deferred_status(status: str) -> bool:
        """True for enrollment statuses graded I (Incomplete) or W (Withdrawn)."""
        return status in ResultServices.DEFERRED_GRADES

    @staticmethod
    def deferred_grade(status: str) -> dict:
        """Return the letter grade (I / W) with no grade point."""
        return dict(ResultServices.DEFERRED_GRADES[status])
    



    @staticmethod
    def get_student_result(student_course_id: int) -> dict:
        student_course = get_object_or_404(
            StudentCourse.objects.select_related(
                "student",
                "session_course",
            ),
            pk=student_course_id,
        )

        assessments = list(
            student_course.session_course.assessments.all()
        )

        marks_lookup = ResultServices._build_marks_lookup(
            student_course.session_course
        )

        return ResultServices.calculate_student_result(
            student_course=student_course,
            assessments=assessments,
            marks_lookup=marks_lookup,
        )

    @staticmethod
    def get_session_course_results(session_course_id: int) -> list[dict]:

        session_course = get_object_or_404(
            SessionCourse,
            pk=session_course_id,
        )

        return ResultServices.calculate_session_course_result(
            session_course
        )
    

    @staticmethod
    def get_session_all_students_results(
        session_id: int,
        student_courses=None,
    ) -> list[dict]:
        """Get results for all students in a session across all their courses.

        Optionally accepts a pre-filtered ``StudentCourse`` QuerySet (e.g. one
        that has already been run through the view's filter/search/ordering
        backends). When omitted it defaults to every enrolled student course in
        the session. The rows are computed in the order of the provided
        queryset, so any ordering applied upstream is preserved.
        """
        if student_courses is None:
            student_courses = StudentCourse.objects.filter(
                session_course__session_id=session_id,
                status=StudentCourse.Status.ENROLLED,
            )
        else:
            student_courses = student_courses.select_related(
                "student", "student__user"
            )

        course_ids = set(
            student_courses.values_list("session_course_id", flat=True)
        )

        courses = {
            course.id: course
            for course in SessionCourse.objects.filter(id__in=course_ids)
            .prefetch_related("assessments")
        }

        assessments_cache = {}
        marks_lookup_cache = {}

        all_results = []
        for sc in student_courses.select_related("session_course").iterator():
            course_id = sc.session_course_id
            if course_id not in assessments_cache:
                assessments_cache[course_id] = list(
                    courses[course_id].assessments.all()
                )
                marks_lookup_cache[course_id] = (
                    ResultServices._build_marks_lookup(courses[course_id])
                )

            all_results.append(
                ResultServices.calculate_student_result(
                    student_course=sc,
                    assessments=assessments_cache[course_id],
                    marks_lookup=marks_lookup_cache[course_id],
                )
            )

        return all_results


    # ------------------------------------------------------------------
    # Department-level / semester result workflow
    # ------------------------------------------------------------------

    @staticmethod
    def get_chairman_department(user: User) -> Department | None:
        """Return the Department the user chairs, or None if not a chairman.

        A user is a Department Chairman when they have a Teacher profile with
        ``is_head=True`` and a linked department.
        """
        teacher = getattr(user, "teacher_profile", None)

        if (teacher and teacher.is_head and teacher.department):
            return teacher.department

        return None


    @staticmethod
    def _department_session_courses(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ):
        """All SessionCourse rows for a department, session and year/semester."""
        return SessionCourse.objects.filter(
            course__department=department,
            session=session,
            course__year_semester=year_semester,
        )


    @staticmethod
    def get_unpublished_courses(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> list[SessionCourse]:
        """Return the department's session courses whose result is not published."""
        return list(
            ResultServices._department_session_courses(
                department, session, year_semester
            ).filter(publish_course_result=False)
        )


    @staticmethod
    def count_department_courses(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> int:
        """Total number of session courses for a department + session + semester."""
        return ResultServices._department_session_courses(
            department, session, year_semester
        ).count()


    @staticmethod
    def all_courses_published(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> bool:
        """Return True when every course of the department (session+semester) is published."""
        unpublished = ResultServices.get_unpublished_courses(
            department, session, year_semester
        )

        if unpublished:
            return False

        # There must be at least one course published in that semester.
        return ResultServices._department_session_courses(
            department, session, year_semester
        ).exists()


    @staticmethod
    def calculate_department_semester_results(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> list[dict]:
        """Calculate semester results (GPA + PASS/FAIL) for every enrolled student.

        Only counts courses whose result has been published. Raises a
        ValidationError when not all of the department's courses (for the given
        session + semester) have been published yet.
        """
        total_courses = ResultServices.count_department_courses(
            department, session, year_semester
        )

        if total_courses == 0:
            raise ValidationError(
                {
                    "detail": (
                        "No courses found for this department / session / "
                        "semester. Semester results cannot be calculated."
                    )
                }
            )

        if not ResultServices.all_courses_published(
            department, session, year_semester
        ):
            raise ValidationError(
                {
                    "detail": (
                        "All course results must be published before the "
                        "department's semester results can be calculated."
                    )
                }
            )

        session_courses = list(
            ResultServices._department_session_courses(
                department, session, year_semester
            ).prefetch_related("course")
        )

        if not session_courses:
            return []

        # Cache assessments + marks once per course to keep the number of
        # queries constant regardless of the number of students.
        assessments_cache = {}
        marks_cache = {}
        credit_by_sc = {}

        for sc in session_courses:
            assessments_cache[sc.id] = list(sc.assessments.all())
            marks_cache[sc.id] = ResultServices._build_marks_lookup(sc)
            credit_by_sc[sc.id] = sc.course.credit

        enrolled = list(
            StudentCourse.objects.filter(
                session_course__in=session_courses,
                status__in=[
                    StudentCourse.Status.ENROLLED,
                    StudentCourse.Status.RETAKEN,
                    StudentCourse.Status.INCOMPLETE,
                    StudentCourse.Status.DROPPED,
                ],
            ).select_related("student__user")
        )

        # Aggregate per student (keyed by primary key so retakers merge).
        agg = defaultdict(
            lambda: {
                "student": None,
                "total_credit": Decimal("0.00"),
                "total_grade_points": Decimal("0.00"),
                "all_passed": True,
                "courses": [],
            }
        )

        for student_course in enrolled:
            entry = agg[student_course.student_id]
            entry["student"] = student_course.student

            sc_id = student_course.session_course_id

            # Incomplete (I) / Withdrawn (W): no marks, no grade point and no
            # credit — they simply appear on the result sheet.
            if ResultServices.is_deferred_status(student_course.status):
                course = student_course.session_course.course
                grade = ResultServices.deferred_grade(student_course.status)
                entry["courses"].append(
                    {
                        "student_id": student_course.student.student_id,
                        "student_name": str(student_course.student.user.name),
                        "student_course": student_course.id,
                        "course_code": course.code,
                        "course_title": course.title,
                        "year_semester": str(course.year_semester),
                        "session": str(
                            student_course.session_course.session
                        ),
                        "session_course": sc_id,
                        "assessments": [],
                        "total_marks": None,
                        "letter_grade": grade["letter_grade"],
                        "grade_point": None,
                        "status": student_course.status,
                    }
                )
                continue

            result = ResultServices.calculate_student_result(
                student_course=student_course,
                assessments=assessments_cache[sc_id],
                marks_lookup=marks_cache[sc_id],
            )

            credit = credit_by_sc[sc_id]
            grade_point = result["grade_point"]

            entry["total_credit"] += credit
            entry["total_grade_points"] += grade_point * credit

            # A grade below "D" (i.e. "F") means the course was failed.
            if grade_point < Decimal("2.00"):
                entry["all_passed"] = False

            entry["courses"].append(result)

        results = []
        for entry in agg.values():
            total_credit = entry["total_credit"]

            gpa = (
                entry["total_grade_points"] / total_credit
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if total_credit else Decimal("0.00")

            student = entry["student"]

            results.append(
                {
                    "student": student,
                    "student_id": student.student_id,
                    "student_name": str(student.user.name),
                    "gpa": gpa,
                    "status": (
                        StudentSemesterResult.Status.PASS
                        if entry["all_passed"]
                        else StudentSemesterResult.Status.FAIL
                    ),
                    "session": session,
                    "year_semester": year_semester,
                    "courses": entry["courses"],
                }
            )

        results.sort(key=lambda r: (r["student"].student_id or ""))

        return results


    @staticmethod
    @transaction.atomic
    def publish_department_semester_results(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> list[StudentSemesterResult]:
        """Calculate and persist the department's semester results as published."""
        calculated = ResultServices.calculate_department_semester_results(
            department, session, year_semester
        )

        published_rows = []
        now = timezone.now()

        for item in calculated:
            # The attempt number = how many published results this student
            # already has for this year_semester, + 1 (1 = first try).
            existing_attempts = StudentSemesterResult.objects.filter(
                student=item["student"],
                year_semester=year_semester,
            ).count()

            semester_result, _ = StudentSemesterResult.objects.update_or_create(
                student=item["student"],
                session=session,
                year_semester=year_semester,
                defaults={
                    "gpa": item["gpa"],
                    "status": item["status"],
                    "attempt": existing_attempts + 1,
                    "promoted": item["status"] == StudentSemesterResult.Status.PASS,
                    "published": True,
                    "published_at": now,
                },
            )
            # Advance the student (promote on pass, demote on fail) and
            # auto-enroll them into their next courses.
            progression = ResultServices.process_student_progression(semester_result)
            semester_result.progression = progression
            published_rows.append(semester_result)

        return published_rows


    # ------------------------------------------------------------------
    # Promotion / demotion (auto-enrollment after results are published)
    # ------------------------------------------------------------------

    @staticmethod
    def _next_year_semester(current: YearSemester) -> YearSemester | None:
        """Return the following YearSemester in academic order, or None if the
        student has finished (passed the final semester)."""
        yr_order = [
            YearSemester.Year.FIRST,
            YearSemester.Year.SECOND,
            YearSemester.Year.THIRD,
            YearSemester.Year.FOURTH,
        ]
        sem_order = [
            YearSemester.Semester.FIRST,
            YearSemester.Semester.SECOND,
        ]

        y_idx = yr_order.index(current.year)
        s_idx = sem_order.index(current.semester)

        if s_idx + 1 < len(sem_order):
            year, semester = current.year, sem_order[s_idx + 1]
        elif y_idx + 1 < len(yr_order):
            year, semester = yr_order[y_idx + 1], sem_order[0]
        else:
            return None  # Graduated

        return YearSemester.objects.filter(year=year, semester=semester).first()


    @staticmethod
    def _get_or_create_next_session(session: Session) -> "tuple[Session, bool]":
        """Return the next session (session_no + 1), auto-creating it (with a
        derived academic_year) if it does not already exist."""
        import re

        next_no = session.session_no + 1
        existing = Session.objects.filter(session_no=next_no).first()
        if existing:
            return existing, False

        raw = (session.academic_year or "").strip()
        next_year = None
        start_match = re.match(r"(\d{4})", raw)

        if start_match:
            start = int(start_match.group(1)) + 1
            if re.match(r"^\d{4}-\d{2}$", raw):
                next_year = f"{start}-{str((start + 1) % 100).zfill(2)}"
            elif re.match(r"^\d{4}-\d{4}$", raw):
                next_year = f"{start}-{start + 1}"
            else:
                next_year = str(start)
        else:
            next_year = f"Session {next_no}"

        return Session.objects.create(
            session_no=next_no,
            academic_year=next_year,
        ), True


    @staticmethod
    def _set_course_statuses(
        student: Student,
        session: Session,
        year_semester: YearSemester,
        status: str,
    ) -> int:
        """Mark every enrollment of the student for a session + year_semester
        with the given status. Returns the number of rows updated."""
        if student.department is None:
            return 0

        course_ids = SessionCourse.objects.filter(
            session=session,
            course__department=student.department,
            course__year_semester=year_semester,
        ).values_list("id", flat=True)

        return StudentCourse.objects.filter(
            student=student,
            session_course_id__in=course_ids,
        ).update(status=status)


    @staticmethod
    def _ensure_session_offerings(
        session: Session,
        department: Department,
        year_semester: YearSemester,
    ) -> int:
        """Create the missing SessionCourse rows for a session's department
        courses in the given year_semester (mirrors CourseServices.create_session).
        Returns the number of SessionCourse rows created."""
        if department is None:
            return 0

        existing_ids = set(
            SessionCourse.objects.filter(
                session=session,
                course__department=department,
                course__year_semester=year_semester,
                course__is_active=True,
            ).values_list("course_id", flat=True)
        )

        courses = Course.objects.filter(
            department=department,
            year_semester=year_semester,
            is_active=True,
        ).exclude(id__in=existing_ids)

        if courses.exists():
            SessionCourse.objects.bulk_create(
                (SessionCourse(session=session, course=course) for course in courses),
                ignore_conflicts=True,
            )

        return courses.count()


    @staticmethod
    def _enroll_student_in_courses(
        student: Student,
        session: Session,
        year_semester: YearSemester,
        status: str = None,
    ) -> int:
        """Enroll a student in the department's session courses for the given
        session + year_semester. Existing enrollments are left untouched unless
        ``status`` is given, in which case they are updated. Returns the number
        of enrollments created."""
        if student.department is None:
            return 0

        session_courses = SessionCourse.objects.filter(
            session=session,
            course__department=student.department,
            course__year_semester=year_semester,
        )

        created = 0
        for sc in session_courses:
            _, was_created = StudentCourse.objects.get_or_create(
                student=student,
                session_course=sc,
                defaults={"status": StudentCourse.Status.ENROLLED},
            )
            created += int(was_created)

        if status is not None:
            StudentCourse.objects.filter(
                student=student,
                session_course_id__in=session_courses.values_list("id", flat=True),
            ).update(status=status)

        return created


    @staticmethod
    @transaction.atomic
    def process_student_progression(
        semester_result: StudentSemesterResult,
    ) -> dict:
        """After a semester result is published, advance the student:

        - PASS → promote to the next year_semester (same session) and auto
          enroll the student into that semester's departmental courses.
        - FAIL → retake the same year_semester in the next session
          (session_no + 1, created if missing) and auto enroll the student in
          that session's same-semester courses.
        """
        student = semester_result.student

        if semester_result.status == StudentSemesterResult.Status.PASS:
            next_ys = ResultServices._next_year_semester(
                semester_result.year_semester
            )

            # Mark the passed semester's courses as COMPLETED.
            ResultServices._set_course_statuses(
                student,
                semester_result.session,
                semester_result.year_semester,
                StudentCourse.Status.COMPLETED,
            )

            if next_ys is None:
                return {"outcome": "graduated", "enrolled": 0}

            # Year-boundary promotion gate: moving to the next ACADEMIC YEAR
            # requires a minimum overall CGPA (1st->2nd: 2.00, 2nd->3rd: 2.25,
            # 3rd->4th: 2.50). Semester promotion within the same year (e.g.
            # 1st sem -> 2nd sem) has no CGPA requirement beyond PASS.
            promoted_year = next_ys.year
            current_year = semester_result.year_semester.year
            if promoted_year != current_year:
                required = ResultServices.YEAR_PROMOTION_MINIMUM_CGPA.get(
                    str(current_year)
                )
                if required is not None:
                    cgpa_info = ResultServices.get_student_cgpa(student)
                    cgpa = Decimal(str(cgpa_info["cgpa"]))
                    if cgpa < Decimal(str(required)):
                        return {
                            "outcome": "held",
                            "reason": (
                                f"Minimum CGPA {required} required for "
                                f"promotion from {current_year} year; "
                                f"current CGPA {cgpa}."
                            ),
                            "required_cgpa": str(required),
                            "current_cgpa": str(cgpa),
                            "enrolled": 0,
                        }

            if student.year_semester != next_ys:
                student.year_semester = next_ys
                student.save(update_fields=["year_semester"])

            enrolled = ResultServices._enroll_student_in_courses(
                student, semester_result.session, next_ys
            )
            return {"outcome": "promoted", "completed": True, "enrolled": enrolled}

        # FAIL -> retake the same semester in the NEXT session's courses, but
        # keep the student's original session unchanged.
        next_session, created_session = ResultServices._get_or_create_next_session(
            semester_result.session
        )

        # Ensure the next session has SessionCourse rows for the retaken
        # department + semester, then enroll the student into them.
        ResultServices._ensure_session_offerings(
            next_session,
            student.department,
            semester_result.year_semester,
        )

        # Mark the failed semester's courses as FAILED.
        ResultServices._set_course_statuses(
            student,
            semester_result.session,
            semester_result.year_semester,
            StudentCourse.Status.FAILED,
        )

        # Enroll the retake in the next session, marked as RETAKEN.
        enrolled = ResultServices._enroll_student_in_courses(
            student,
            next_session,
            semester_result.year_semester,
            status=StudentCourse.Status.RETAKEN,
        )

        return {
            "outcome": "demoted",
            "original_session": semester_result.session.id,
            "courses_session": next_session.id,
            "courses_session_created": created_session,
            "enrolled": enrolled,
        }


    @staticmethod
    def list_publishable_semester_results(
        department: Department,
    ) -> list[dict]:
        """Return the (session, year_semester) combos of a department whose
        semester result is publishable — i.e. every course of that
        session + year_semester has had its result published."""
        from django.db.models import Count, F, Q

        combos = (
            SessionCourse.objects.filter(course__department=department)
            .order_by("session", "course__year_semester")
            .values("session", "course__year_semester")
            .annotate(
                total=Count("id"),
                published=Count("id", filter=Q(publish_course_result=True)),
            )
            .filter(total__gt=0, published=F("total"))
        )

        session_ids = {row["session"] for row in combos}
        ys_ids = {row["course__year_semester"] for row in combos}

        sessions = {
            s.id: s for s in Session.objects.filter(id__in=session_ids)
        }
        year_semesters = {
            y.id: y for y in YearSemester.objects.filter(id__in=ys_ids)
        }

        entries = []
        for row in combos:
            session = sessions.get(row["session"])
            year_semester = year_semesters.get(row["course__year_semester"])
            if session is None or year_semester is None:
                continue

            # Skip combos whose semester result has already been published.
            if StudentSemesterResult.objects.filter(
                student__department=department,
                session=session,
                year_semester=year_semester,
                published=True,
            ).exists():
                continue

            entries.append(
                {
                    "session": session.id,
                    "session_name": session.academic_year,
                    "year_semester": year_semester.id,
                    "year_semester_name": str(year_semester),
                }
            )

        return entries


    @staticmethod
    def get_student_semester_result(
        student: Student,
        year_semester: YearSemester,
    ) -> dict | None:
        """Return the student's published semester result for a given
        year_semester, including per-course grades.

        Returns None when the semester result has not been published yet.
        """
        semester_result = (
            StudentSemesterResult.objects.select_related(
                "student__user", "session", "year_semester"
            )
            .filter(
                student=student,
                year_semester=year_semester,
                published=True,
            )
            .order_by("-attempt", "-published_at")
            .first()
        )

        if semester_result is None:
            return None

        # Per-course data for the student's enrollments in that semester.
        # Enrollments are separated into graded courses (this published attempt)
        # and RETAKEN courses (fresh retake — no grade computed yet).
        enrolled = list(
            StudentCourse.objects.filter(
                student=student,
                session_course__course__year_semester=year_semester,
            ).select_related(
                "student__user",
                "session_course__course",
                "session_course__session",
            )
            .order_by("session_course__session__session_no", "id")
        )

        assessments_cache = {}
        marks_cache = {}
        courses = []
        failed_courses = []
        retakes = []
        deferred = []

        for student_course in enrolled:
            sc = student_course.session_course

            if student_course.status == StudentCourse.Status.RETAKEN:
                # Retake is fresh — do not compute a grade yet.
                retakes.append(
                    {
                        "course_code": sc.course.code,
                        "course_title": sc.course.title,
                        "credit": str(sc.course.credit),
                        "status": student_course.status,
                        "session": sc.session_id,
                        "session_name": sc.session.academic_year,
                        "attempt": (semester_result.attempt or 1) + 1,
                    }
                )
                continue

            if ResultServices.is_deferred_status(student_course.status):
                # Incomplete (I) / Withdrawn (W) — no marks-based grade.
                grade = ResultServices.deferred_grade(student_course.status)
                deferred.append(
                    {
                        "session_course": student_course.session_course_id,
                        "course_code": sc.course.code,
                        "course_title": sc.course.title,
                        "credit": str(sc.course.credit),
                        "total_marks": None,
                        "letter_grade": grade["letter_grade"],
                        "grade_point": None,
                        "status": student_course.status,
                        "session": sc.session_id,
                        "session_name": sc.session.academic_year,
                    }
                )
                continue

            if sc.id not in assessments_cache:
                assessments_cache[sc.id] = list(sc.assessments.all())
                marks_cache[sc.id] = ResultServices._build_marks_lookup(sc)

            result = ResultServices.calculate_student_result(
                student_course=student_course,
                assessments=assessments_cache[sc.id],
                marks_lookup=marks_cache[sc.id],
            )
            entry = {
                "session_course": student_course.session_course_id,
                "course_code": result["course_code"],
                "course_title": result["course_title"],
                "credit": str(sc.course.credit),
                "total_marks": str(result["total_marks"]),
                "letter_grade": result["letter_grade"],
                "grade_point": str(result["grade_point"]),
                "status": student_course.status,
                "session": sc.session_id,
                "session_name": sc.session.academic_year,
            }

            if student_course.status == StudentCourse.Status.FAILED:
                failed_courses.append(entry)
            else:
                courses.append(entry)

        return {
            "student_id": student.student_id,
            "student_name": str(student.user.name),
            "session": semester_result.session_id,
            "session_name": semester_result.session.academic_year,
            "year_semester": year_semester.id,
            "year_semester_name": str(year_semester),
            "attempt": semester_result.attempt or 1,
            "gpa": str(semester_result.gpa),
            "status": semester_result.status,
            "published": semester_result.published,
            "published_at": semester_result.published_at,
            "courses": courses,
            "failed_courses": failed_courses,
            "retakes": retakes,
            "deferred": deferred,
        }

    @staticmethod
    def get_student_cgpa(student: Student) -> dict:
        """Compute the student's CGPA from all COMPLETED (passed) course
        enrollments, credit-weighted.

        For retaken courses the best (latest passing) grade point wins —
        enrollments are ordered oldest-first and deduplicated by course,
        keeping the higher grade point.
        """
        completed = list(
            StudentCourse.objects.filter(
                student=student,
                status=StudentCourse.Status.COMPLETED,
            )
            .select_related(
                "session_course__course",
                "session_course__session",
            )
            .order_by("session_course__session__session_no", "id")
        )

        assessments_cache = {}
        marks_cache = {}
        best_by_course = {}

        for student_course in completed:
            sc = student_course.session_course
            if sc.id not in assessments_cache:
                assessments_cache[sc.id] = list(sc.assessments.all())
                marks_cache[sc.id] = ResultServices._build_marks_lookup(sc)

            result = ResultServices.calculate_student_result(
                student_course=student_course,
                assessments=assessments_cache[sc.id],
                marks_lookup=marks_cache[sc.id],
            )

            grade_point = result["grade_point"]
            existing = best_by_course.get(sc.course_id)
            if existing is None or grade_point > existing["grade_point"]:
                best_by_course[sc.course_id] = {
                    "grade_point": grade_point,
                    "credit": sc.course.credit,
                }

        total_credit = sum(
            Decimal(str(item["credit"])) for item in best_by_course.values()
        )
        total_points = sum(
            item["grade_point"] * Decimal(str(item["credit"]))
            for item in best_by_course.values()
        )

        cgpa = (
            (total_points / total_credit).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            if total_credit
            else Decimal("0.00")
        )

        return {
            "cgpa": str(cgpa),
            "credits_completed": str(total_credit),
            "courses_completed": len(best_by_course),
        }

