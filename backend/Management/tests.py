from django.contrib.auth import get_user_model
from decimal import Decimal
from django.test import TestCase
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APIClient

from .models import (
    Faculty,
    Department,
    Session,
    YearSemester,
    Course,
    Teacher,
    Student,
    SessionCourse,
    StudentCourse,
    StudentSemesterResult,
)
from .services import ResultServices

User = get_user_model()


class DepartmentSemesterResultServiceTest(TestCase):
    def setUp(self):
        self.faculty = Faculty.objects.create(name="Faculty A")
        self.department = Department.objects.create(
            code="CSE", name="Computer Science", faculty=self.faculty
        )
        self.session = Session.objects.create(session_no=1, academic_year="2024-25")
        self.ys = YearSemester.objects.create(year="first", semester="first")

        self.course = Course.objects.create(
            code="CSE101",
            title="Intro to Programming",
            credit=3,
            department=self.department,
            year_semester=self.ys,
        )

        # Chairman
        chairman_user = User.objects.create_user("Chairman", "chairman@x.com", "pass1234")
        self.chairman = Teacher.objects.create(
            user=chairman_user,
            employee_id="T001",
            department=self.department,
            is_head=True,
        )

        # A non-chairman teacher
        other_user = User.objects.create_user("Other", "other@x.com", "pass1234")
        self.other = Teacher.objects.create(
            user=other_user,
            employee_id="T002",
            department=self.department,
            is_head=False,
        )

        # Students: pass and fail
        self.student_pass = Student.objects.create(
            user=User.objects.create_user("Pass S", "pass@x.com", "pass1234"),
            student_id="2024001",
            department=self.department,
            session=self.session,
            year_semester=self.ys,
        )
        self.student_fail = Student.objects.create(
            user=User.objects.create_user("Fail S", "fail@x.com", "pass1234"),
            student_id="2024002",
            department=self.department,
            session=self.session,
            year_semester=self.ys,
        )

    def _enroll_with_marks(self, session_course, marks_list):
        """Enroll students and create a single FINAL assessment with the given marks."""
        assessment = session_course.assessments.create(
            title="Final",
            max_marks=100,
            assessment_type="final",
        )
        for student, marks in marks_list:
            sc = StudentCourse.objects.create(
                student=student,
                session_course=session_course,
                status=StudentCourse.Status.ENROLLED,
            )
            sc.assessment_marks.create(assessment=assessment, marks=marks, entered_by=self.chairman.user)

    def test_chairman_department_detection(self):
        self.assertEqual(
            ResultServices.get_chairman_department(self.chairman.user), self.department
        )
        self.assertIsNone(ResultServices.get_chairman_department(self.other.user))

    def test_all_courses_published(self):
        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        # Not published
        self.assertFalse(
            ResultServices.all_courses_published(self.department, self.session, self.ys)
        )
        # Publish it
        sc.publish_course_result = True
        sc.save()
        self.assertTrue(
            ResultServices.all_courses_published(self.department, self.session, self.ys)
        )

    def test_calculation_and_publish(self):
        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(
            sc, [(self.student_pass, 85), (self.student_fail, 30)]
        )
        sc.publish_course_result = True
        sc.save()

        results = ResultServices.calculate_department_semester_results(
            self.department, self.session, self.ys
        )
        self.assertEqual(len(results), 2)
        by_id = {r["student"].student_id: r for r in results}

        # Passing student -> A+, PASS
        self.assertEqual(by_id["2024001"]["status"], StudentSemesterResult.Status.PASS)
        self.assertEqual(by_id["2024001"]["gpa"], 4)
        # Failing student -> FAIL, gpa 0
        self.assertEqual(by_id["2024002"]["status"], StudentSemesterResult.Status.FAIL)
        self.assertEqual(by_id["2024002"]["gpa"], 0)

        published = ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.assertEqual(len(published), 2)
        record = StudentSemesterResult.objects.get(
            student=self.student_pass, session=self.session, year_semester=self.ys
        )
        self.assertTrue(record.published)
        self.assertTrue(record.promoted)
        self.assertEqual(record.status, StudentSemesterResult.Status.PASS)

        fail_record = StudentSemesterResult.objects.get(
            student=self.student_fail, session=self.session, year_semester=self.ys
        )
        self.assertTrue(fail_record.published)
        self.assertFalse(fail_record.promoted)
        self.assertEqual(fail_record.status, StudentSemesterResult.Status.FAIL)

    def test_calculate_endpoint_json_safe(self):
        # Reproduces the reported 500: course results contained a raw Session
        # object that was not JSON serializable.
        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(
            sc, [(self.student_pass, 85), (self.student_fail, 30)]
        )
        sc.publish_course_result = True
        sc.save()

        client = APIClient()
        client.force_authenticate(user=self.chairman.user)
        resp = client.post(
            "/api/results/department-semester/calculate/",
            {"session": self.session.id, "year_semester": self.ys.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        # CustomJSONRenderer wraps success responses as {"status","data"}.
        results = resp.json()["data"]["results"]
        self.assertEqual(len(results), 2)
        # Each student's course breakdown must be plain JSON-safe data.
        for student in results:
            for course in student["courses"]:
                self.assertIsInstance(course["session"], str)
                self.assertIn("course_code", course)
                self.assertIn("total_marks", course)

    def test_publish_endpoint_json_safe(self):
        # Reproduces the reported 500: StudentSemesterResultSerializer coerced
        # the string choice keys (year/semester) into integers.
        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(
            sc, [(self.student_pass, 85), (self.student_fail, 30)]
        )
        sc.publish_course_result = True
        sc.save()

        client = APIClient()
        client.force_authenticate(user=self.chairman.user)
        resp = client.post(
            "/api/results/department-semester/publish/",
            {"session": self.session.id, "year_semester": self.ys.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        data = resp.json()["data"]
        self.assertEqual(len(data["results"]), 2)
        for result in data["results"]:
            # year / semester must be the readable choice display strings.
            self.assertIsInstance(result["year"], str)
            self.assertIsInstance(result["semester"], str)
            self.assertIsInstance(result["student_name"], str)

    def test_calculation_requires_all_published(self):
        SessionCourse.objects.create(session=self.session, course=self.course)
        # One course remains unpublished
        with self.assertRaises(DRFValidationError):
            ResultServices.calculate_department_semester_results(
                self.department, self.session, self.ys
            )

    def test_no_courses_scenario_consistent(self):
        # Reproduces the reported case: department+session+semester have ZERO
        # session courses -> all_courses_published is False with no unpublished.
        self.assertEqual(
            ResultServices.count_department_courses(
                self.department, self.session, self.ys
            ),
            0,
        )
        self.assertEqual(
            ResultServices.get_unpublished_courses(
                self.department, self.session, self.ys
            ),
            [],
        )
        self.assertFalse(
            ResultServices.all_courses_published(
                self.department, self.session, self.ys
            )
        )

        # Status endpoint reflects the same, with clear course counts.
        client = APIClient()
        client.force_authenticate(user=self.chairman.user)
        resp = client.post(
            "/api/results/department-semester/status/",
            {"session": self.session.id, "year_semester": self.ys.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        self.assertTrue(data["is_chairman"])
        self.assertEqual(data["total_courses"], 0)
        self.assertEqual(data["published_courses"], 0)
        self.assertFalse(data["all_courses_published"])
        self.assertEqual(data["unpublished_courses"], [])

        # Calculation raises the "no courses" message, not the generic one.
        with self.assertRaises(DRFValidationError) as ctx:
            ResultServices.calculate_department_semester_results(
                self.department, self.session, self.ys
            )
        self.assertIn("No courses", str(ctx.exception.detail["detail"]))

    def test_status_denied_for_non_chairman(self):
        client = APIClient()
        client.force_authenticate(user=self.other.user)
        resp = client.post(
            "/api/results/department-semester/status/",
            {"session": self.session.id, "year_semester": self.ys.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_publishable_list_only_all_published(self):
        # Two combos: (session 1, ys 1) fully published, (session 2, ys 2) not.
        session2 = Session.objects.create(session_no=2, academic_year="2025-26")
        ys2 = YearSemester.objects.create(year="second", semester="first")
        course2 = Course.objects.create(
            code="CSE201",
            title="Algorithms",
            credit=3,
            department=self.department,
            year_semester=ys2,
        )
        sc_done = SessionCourse.objects.create(session=self.session, course=self.course)
        sc_done.publish_course_result = True
        sc_done.save()
        SessionCourse.objects.create(session=session2, course=course2)  # unpublished

        entries = ResultServices.list_publishable_semester_results(self.department)
        # Only the session-1/ys-1 combo is publishable.
        self.assertEqual(
            [(e["session"], e["year_semester"]) for e in entries],
            [(self.session.id, self.ys.id)],
        )

        # Once a semester result is published, the combo disappears from the list.
        StudentSemesterResult.objects.create(
            student=self.student_pass,
            session=self.session,
            year_semester=self.ys,
            gpa=4,
            status=StudentSemesterResult.Status.PASS,
            published=True,
        )
        entries_after = ResultServices.list_publishable_semester_results(self.department)
        self.assertEqual(entries_after, [])

    def test_pass_promotes_to_next_semester(self):
        # Second semester with its own course.
        ys2 = YearSemester.objects.create(year="first", semester="second")
        course2 = Course.objects.create(
            code="CSE102",
            title="Data Structures",
            credit=3,
            department=self.department,
            year_semester=ys2,
        )
        sc_next = SessionCourse.objects.create(session=self.session, course=course2)

        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(sc, [(self.student_pass, 85)])
        sc.publish_course_result = True
        sc.save()

        published = ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.assertEqual(len(published), 1)
        self.assertEqual(published[0].progression["outcome"], "promoted")

        # Student advanced to the next year_semester and was auto-enrolled.
        self.student_pass.refresh_from_db()
        self.assertEqual(self.student_pass.year_semester, ys2)
        self.assertEqual(self.student_pass.session, self.session)
        self.assertTrue(
            StudentCourse.objects.filter(
                student=self.student_pass, session_course=sc_next
            ).exists()
        )
        # The passed semester's course was marked COMPLETED.
        self.assertEqual(
            StudentCourse.objects.get(
                student=self.student_pass, session_course=sc
            ).status,
            StudentCourse.Status.COMPLETED,
        )
        # The next-semester enrollment stays ENROLLED.
        self.assertEqual(
            StudentCourse.objects.get(
                student=self.student_pass, session_course=sc_next
            ).status,
            StudentCourse.Status.ENROLLED,
        )

    def test_fail_demotes_to_next_session_and_enrolls(self):
        # Next session + its course catalog already exist (admin setup).
        next_session = Session.objects.create(session_no=2, academic_year="2025-26")
        sc_next = SessionCourse.objects.create(session=next_session, course=self.course)

        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(sc, [(self.student_fail, 30)])
        sc.publish_course_result = True
        sc.save()

        result = ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.assertEqual(result[0].progression["outcome"], "demoted")
        self.assertFalse(result[0].progression["courses_session_created"])
        # Student was auto-enrolled into the next session's same-semester course.
        self.assertEqual(result[0].progression["enrolled"], 1)
        self.assertEqual(
            result[0].progression["courses_session"], next_session.id
        )

        # Original session is retained (only the courses session advances).
        self.student_fail.refresh_from_db()
        self.assertEqual(self.student_fail.session, self.session)
        self.assertEqual(self.student_fail.year_semester, self.ys)
        self.assertTrue(
            StudentCourse.objects.filter(
                student=self.student_fail, session_course=sc_next
            ).exists()
        )
        # The failed semester's course was marked FAILED.
        self.assertEqual(
            StudentCourse.objects.get(
                student=self.student_fail, session_course=sc
            ).status,
            StudentCourse.Status.FAILED,
        )
        # The next-session retake was marked RETAKEN.
        self.assertEqual(
            StudentCourse.objects.get(
                student=self.student_fail, session_course=sc_next
            ).status,
            StudentCourse.Status.RETAKEN,
        )

    def test_fail_auto_creates_next_session(self):
        # No session_no=2 exists -> publish must auto-create it.
        Session.objects.filter(session_no=2).delete()

        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(sc, [(self.student_fail, 30)])
        sc.publish_course_result = True
        sc.save()

        result = ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.assertEqual(result[0].progression["outcome"], "demoted")
        self.assertTrue(result[0].progression["courses_session_created"])

        # The newly created session derives its academic_year from session 1.
        new_session = Session.objects.get(session_no=2)
        self.assertEqual(new_session.academic_year, "2025-26")
        # Original session is retained.
        self.student_fail.refresh_from_db()
        self.assertEqual(self.student_fail.session, self.session)
        self.assertEqual(self.student_fail.year_semester, self.ys)

        # The new session's SessionCourse for the department+semester was
        # auto-created and the failed student was enrolled (as RETAKEN).
        new_sc = SessionCourse.objects.get(
            session=new_session, course=self.course
        )
        self.assertEqual(self.course.year_semester, self.ys)
        retake = StudentCourse.objects.get(
            student=self.student_fail, session_course=new_sc
        )
        self.assertEqual(retake.status, StudentCourse.Status.RETAKEN)

    def _setup_second_semester(self, ys2):
        return Course.objects.create(
            code="CSE102",
            title="Data Structures",
            credit=3,
            department=self.department,
            year_semester=ys2,
        )

    def test_year_boundary_promotion_with_sufficient_cgpa(self):
        # Pass 1st sem with A+ (GP 4.00) -> CGPA 4.00 >= 2.00 minimum.
        ys2 = YearSemester.objects.create(year="first", semester="second")
        course2 = self._setup_second_semester(ys2)

        sc1 = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(sc1, [(self.student_pass, 85)])
        sc1.publish_course_result = True
        sc1.save()

        ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.student_pass.refresh_from_db()
        self.assertEqual(self.student_pass.year_semester, ys2)

        # Pass 2nd sem -> crosses into 2nd YEAR (CGPA 4.00 >= 2.00).
        sc2 = SessionCourse.objects.create(session=self.session, course=course2)
        self._enroll_with_marks(sc2, [(self.student_pass, 80)])
        sc2.publish_course_result = True
        sc2.save()

        ys3 = YearSemester.objects.get_or_create(year="second", semester="first")[0]
        published = ResultServices.publish_department_semester_results(
            self.department, self.session, ys2
        )
        self.assertEqual(published[0].progression["outcome"], "promoted")

        self.student_pass.refresh_from_db()
        self.assertEqual(self.student_pass.year_semester, ys3)

    def test_year_boundary_held_when_cgpa_too_low(self):
        # Student passes both semesters with D (GP 2.00 each) -> CGPA 2.00.
        # Raise the required minimum to 2.50 so the gate clearly holds them.
        from unittest.mock import patch

        ys2 = YearSemester.objects.create(year="first", semester="second")
        course2 = self._setup_second_semester(ys2)

        sc1 = SessionCourse.objects.create(session=self.session, course=self.course)
        self._enroll_with_marks(sc1, [(self.student_pass, 40)])  # D
        sc1.publish_course_result = True
        sc1.save()

        ResultServices.publish_department_semester_results(
            self.department, self.session, self.ys
        )
        self.student_pass.refresh_from_db()
        self.assertEqual(self.student_pass.year_semester, ys2)

        sc2 = SessionCourse.objects.create(session=self.session, course=course2)
        self._enroll_with_marks(sc2, [(self.student_pass, 40)])  # D
        sc2.publish_course_result = True
        sc2.save()

        ys3 = YearSemester.objects.get_or_create(year="second", semester="first")[0]

        with patch.object(
            ResultServices,
            "YEAR_PROMOTION_MINIMUM_CGPA",
            {"first": "2.50", "second": "2.25", "third": "2.50"},
        ):
            published = ResultServices.publish_department_semester_results(
                self.department, self.session, ys2
            )

        progression = published[0].progression
        self.assertEqual(progression["outcome"], "held")
        self.assertEqual(progression["required_cgpa"], "2.50")
        self.assertIn("Minimum CGPA", progression["reason"])

        # Student stays at the same year_semester; no 2nd-year enrollment.
        self.student_pass.refresh_from_db()
        self.assertEqual(self.student_pass.year_semester, ys2)
        self.assertFalse(
            StudentCourse.objects.filter(
                student=self.student_pass,
                session_course__course__year_semester=ys3,
            ).exists()
        )

    def test_incomplete_and_withdrawn_get_I_and_W_grades(self):
        # Two more students: one incomplete, one withdrawn.
        student_inc = Student.objects.create(
            user=User.objects.create_user("Inc S", "inc@x.com", "pass1234"),
            student_id="2024003",
            department=self.department,
            session=self.session,
            year_semester=self.ys,
        )
        student_wd = Student.objects.create(
            user=User.objects.create_user("Wd S", "wd@x.com", "pass1234"),
            student_id="2024004",
            department=self.department,
            session=self.session,
            year_semester=self.ys,
        )

        sc = SessionCourse.objects.create(session=self.session, course=self.course)
        assessment = sc.assessments.create(
            title="Final", max_marks=100, assessment_type="final"
        )
        for student, marks, status in [
            (self.student_pass, 85, StudentCourse.Status.ENROLLED),
            (student_inc, None, StudentCourse.Status.INCOMPLETE),
            (student_wd, None, StudentCourse.Status.DROPPED),
        ]:
            row = StudentCourse.objects.create(
                student=student,
                session_course=sc,
                status=status,
            )
            if marks is not None:
                row.assessment_marks.create(
                    assessment=assessment, marks=marks, entered_by=self.chairman.user
                )
        sc.publish_course_result = True
        sc.save()

        calculated = ResultServices.calculate_department_semester_results(
            self.department, self.session, self.ys
        )
        by_id = {r["student"].student_id: r for r in calculated}

        # Normal student: graded normally, included in GPA credit.
        self.assertEqual(by_id["2024001"]["gpa"], Decimal("4.00"))
        self.assertEqual(len(by_id["2024001"]["courses"]), 1)

        # Incomplete student: grade "I", no grade point / no credit impact.
        inc = by_id["2024003"]
        self.assertEqual(inc["courses"][0]["letter_grade"], "I")
        self.assertIsNone(inc["courses"][0]["grade_point"])
        self.assertEqual(inc["gpa"], Decimal("0.00"))  # only deferred courses
        self.assertEqual(inc["status"], StudentSemesterResult.Status.PASS)

        # Withdrawn student: grade "W".
        wd = by_id["2024004"]
        self.assertEqual(wd["courses"][0]["letter_grade"], "W")
        self.assertIsNone(wd["courses"][0]["grade_point"])

