from django.db import migrations


def backfill_mark_teacher(apps, schema_editor):
    """Attribute existing marks to the course teacher of their session course.

    Before per-teacher marks existed, every mark row was entered by the course
    teacher, so backfilling keeps historical results intact and prevents the new
    final-mark average from mixing in unrelated teachers.
    """
    StudentAssessmentMark = apps.get_model("Management", "StudentAssessmentMark")
    SessionCourseTeacher = apps.get_model("Management", "SessionCourseTeacher")
    CourseAssessment = apps.get_model("Management", "CourseAssessment")

    course_teacher = "course_teacher"

    # session_course_id -> course teacher id
    teacher_by_session_course = {
        row["session_course_id"]: row["teacher_id"]
        for row in SessionCourseTeacher.objects.filter(type=course_teacher).values(
            "session_course_id", "teacher_id"
        )
    }

    assessment_to_session_course = {
        row["id"]: row["session_course_id"]
        for row in CourseAssessment.objects.values("id", "session_course_id")
    }

    for mark in StudentAssessmentMark.objects.filter(teacher__isnull=True):
        session_course_id = assessment_to_session_course.get(mark.assessment_id)
        if session_course_id is None:
            continue

        teacher_id = teacher_by_session_course.get(session_course_id)
        if teacher_id is None:
            continue

        mark.teacher_id = teacher_id
        mark.save(update_fields=["teacher"])


class Migration(migrations.Migration):

    dependencies = [
        ("Management", "0011_remove_studentassessmentmark_unique_student_assessment_mark_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_mark_teacher, migrations.RunPython.noop),
    ]
