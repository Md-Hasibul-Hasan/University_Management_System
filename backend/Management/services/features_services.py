from django.db import transaction
from ..models import StudentCourse, Notification, YearSemester


YEAR_NUMBER = {
    YearSemester.Year.FIRST: 1,
    YearSemester.Year.SECOND: 2,
    YearSemester.Year.THIRD: 3,
    YearSemester.Year.FOURTH: 4,
}
SEMESTER_NUMBER = {
    YearSemester.Semester.FIRST: 1,
    YearSemester.Semester.SECOND: 2,
}




class NotificationServices:

    @staticmethod
    @transaction.atomic
    def notify_course_students(
        session_course,
        title,
        message,
        notification_type,
        link=None,
    ):
        student_courses = StudentCourse.objects.filter(
            session_course=session_course
        ).select_related("student__user")

        notifications = []

        for student_course in student_courses:
            notifications.append(
                Notification(
                    user=student_course.student.user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    link=link,
                )
            )


        Notification.objects.bulk_create(notifications)



    @staticmethod
    def year_semester_slug(year_semester):
        """Return the frontend '{year}-{semester}' route slug, e.g. '1-1'."""
        if year_semester is None:
            return "1-1"
        year = YEAR_NUMBER.get(year_semester.year, 1)
        semester = SEMESTER_NUMBER.get(year_semester.semester, 1)
        return f"{year}-{semester}"

# How to use 

# NotificationServices.notify_course_students(
#     session_course=material.session_course,
#     notification_type=Notification.Type.SYSTEM,
#     title="New Course Material",
#     message=f"New material has been uploaded for {material.session_course.course.title}.",
#     link=f"/Student/Materials/{material.id}",
# )

# Notification.objects.create(
#     user=request.user,
#     notification_type=Notification.Type.PASSWORD_CHANGE,
#     title="Password Changed",
#     message="Your password was changed successfully.",
# )


        