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



    # ------------------------------------------------------------------
    # Private helpers — data fetching / grouping
    # ------------------------------------------------------------------

    @staticmethod
    def _build_marks_lookup(session_course: SessionCourse) -> dict:
        """ঐ sessioncourse এর সব student এর assesment_id আর মার্কস দেখায় {(student_course_id, assessment_id): marks}."""
        marks_qs = StudentAssessmentMark.objects.filter(
            student_course__session_course=session_course,
        )

        marks_lookup = {}

        for mark in marks_qs:
            key = (mark.student_course_id, mark.assessment_id)
            value = mark.marks

            marks_lookup[key] = value

        return marks_lookup


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
                raise ValidationError(
                    "All assessments in the same group must have the "
                    "same calculation type. "
                    f"Expected '{first.calculation_type}', "
                    f"got '{assessment.calculation_type}'."
                )

        if first.calculation_type == CourseAssessment.CalculationType.AVERAGE:
            first_max = first.max_marks
            for item in items[1:]:
                if item["assessment"].max_marks != first_max:
                    raise ValidationError(
                        "All assessments in an AVERAGE group must have "
                        "identical max_marks. "
                        f"Expected {first_max}, "
                        f"got {item['assessment'].max_marks}."
                    )


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
    

    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

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
    def calculate_department_semester_results(
        department: Department,
        session: Session,
        year_semester: YearSemester,
    ) -> list[dict]:
        """Calculate semester GPA and course results for every enrolled student.

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

        calculated = ResultServices.calculate_department_semester_results(
            department,
            session,
            year_semester,
        )

        published_rows = []
        now = timezone.now()

        for item in calculated:

            existing_attempts = StudentSemesterResult.objects.filter(
                student=item["student"],
                year_semester=year_semester,
            ).count()

            semester_result, _ = StudentSemesterResult.objects.update_or_create(
                student=item["student"],
                session=session,
                year_semester=year_semester,
                defaults={
                    "attempt": existing_attempts + 1,
                    "published": True,
                    "published_at": now,
                },
            )

            # Update course status
            for course_result in item["courses"]:

                student_course = StudentCourse.objects.get(
                    id=course_result["student_course"]
                )

                student_course.status = student_course.calculated_status

                student_course.save(
                    update_fields=["status"]
                )

            published_rows.append(semester_result)

        return published_rows


    # ------------------------------------------------------------------
    # Promotion / demotion 
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
    def _year_semester_rank(year_semester: YearSemester) -> int:
        years = {
            YearSemester.Year.FIRST: 0,
            YearSemester.Year.SECOND: 1,
            YearSemester.Year.THIRD: 2,
            YearSemester.Year.FOURTH: 3,
        }
        semesters = {
            YearSemester.Semester.FIRST: 0,
            YearSemester.Semester.SECOND: 1,
        }
        return years[year_semester.year] * 2 + semesters[year_semester.semester]

    @staticmethod
    @transaction.atomic
    def manually_promote_student(student: Student) -> dict:
        if student.year_semester is None or student.session is None:
            raise ValidationError("Student has no current session or semester.")

        target_year_semester = ResultServices._next_year_semester(
            student.year_semester
        )
        if target_year_semester is None:
            raise ValidationError("Student has already completed the final semester.")

        ResultServices._ensure_session_offerings(
            student.session,
            student.department,
            target_year_semester,
        )
        created = ResultServices._enroll_student_in_courses(
            student,
            student.session,
            target_year_semester,
            status=StudentCourse.Status.ENROLLED,
        )
        student.year_semester = target_year_semester
        student.save(update_fields=["year_semester"])

        return {
            "student_id": student.id,
            "outcome": "promoted",
            "session": student.session_id,
            "year_semester": target_year_semester.id,
            "enrolled": created,
        }

    @staticmethod
    @transaction.atomic
    def manually_demote_student(
        student: Student,
        target_session: Session,
        target_year_semester: YearSemester,
    ) -> dict:

        if student.department is None:
            raise ValidationError("Student has no department.")

        target_rank = ResultServices._year_semester_rank(
            target_year_semester
        )

        # -------------------------------------------------
        # 1. Delete StudentCourse from target semester onward
        # -------------------------------------------------

        existing_courses = list(
            student.student_courses.select_related(
                "session_course__course",
            )
        )

        delete_course_ids = [
            course.id
            for course in existing_courses
            if ResultServices._year_semester_rank(
                course.session_course.course.year_semester
            ) >= target_rank
        ]

        deleted_courses = len(delete_course_ids)

        if delete_course_ids:
            StudentCourse.objects.filter(
                id__in=delete_course_ids
            ).delete()

        # -------------------------------------------------
        # 2. Delete Semester Results from target semester onward
        # -------------------------------------------------

        semester_results = StudentSemesterResult.objects.filter(
            student=student,
        )

        delete_result_ids = [
            result.id
            for result in semester_results
            if ResultServices._year_semester_rank(
                result.year_semester
            ) >= target_rank
        ]

        deleted_results = len(delete_result_ids)

        if delete_result_ids:
            StudentSemesterResult.objects.filter(
                id__in=delete_result_ids
            ).delete()

        # -------------------------------------------------
        # 3. Fresh enrollment in target semester
        # -------------------------------------------------

        created = ResultServices._enroll_student_in_courses(
            student,
            target_session,
            target_year_semester,
            status=StudentCourse.Status.RETAKEN,
        )

        # -------------------------------------------------
        # 4. Update student's current academic position
        # -------------------------------------------------

        student.session = target_session
        student.year_semester = target_year_semester

        student.save(
            update_fields=[
                "session",
                "year_semester",
            ]
        )

        return {
            "student_id": student.id,
            "outcome": "demoted",
            "session": target_session.id,
            "year_semester": target_year_semester.id,
            "deleted_courses": deleted_courses,
            "deleted_semester_results": deleted_results,
            "enrolled": created,
        }





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
            course_status = student_course.calculated_status

            if course_status == StudentCourse.Status.RETAKEN:
                # Retake is fresh — do not compute a grade yet.
                retakes.append(
                    {
                        "course_code": sc.course.code,
                        "course_title": sc.course.title,
                        "credit": str(sc.course.credit),
                        "status": course_status,
                        "session": sc.session_id,
                        "session_name": sc.session.academic_year,
                        "attempt": (semester_result.attempt or 1) + 1,
                    }
                )
                continue

            if ResultServices.is_deferred_status(course_status):
                # Incomplete (I) / Withdrawn (W) — no marks-based grade.
                grade = ResultServices.deferred_grade(course_status)
                deferred.append(
                    {
                        "session_course": student_course.session_course_id,
                        "course_code": sc.course.code,
                        "course_title": sc.course.title,
                        "credit": str(sc.course.credit),
                        "total_marks": None,
                        "letter_grade": grade["letter_grade"],
                        "grade_point": None,
                        "status": course_status,
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
                "status": course_status,
                "session": sc.session_id,
                "session_name": sc.session.academic_year,
            }

            if course_status == StudentCourse.Status.FAILED:
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
            "published": semester_result.published,
            "published_at": semester_result.published_at,
            "courses": courses,
            "failed_courses": failed_courses,
            "retakes": retakes,
            "deferred": deferred,
        }



