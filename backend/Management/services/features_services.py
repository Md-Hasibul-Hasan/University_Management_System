from django.db import transaction
from ..models import StudentCourse, Notification, YearSemester, Newsfeed


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


class NewsfeedServices:

    # --------------------------------------------------------
    # NEWSFEED INTERACTION NOTIFICATIONS
    # --------------------------------------------------------

    @staticmethod
    def _preview(newsfeed, length=60):
        text = (newsfeed.content or "").strip()
        if not text:
            media = newsfeed.media.first()
            text = f"a {media.media_type}" if media else "a post"
        return text[:length]

    @staticmethod
    @transaction.atomic
    def notify_newsfeed_like(newsfeed, actor):
        """Notify post owner when someone likes their post."""
        if newsfeed.user_id == actor.id:
            return None

        return Notification.objects.create(
            user=newsfeed.user,
            notification_type=Notification.Type.NEWSFEED_LIKE,
            title="New like on your post",
            message=f"{actor.name} liked your post: \"{NewsfeedServices._preview(newsfeed)}\"",
            link=newsfeed.post_link,
        )

    @staticmethod
    @transaction.atomic
    def notify_newsfeed_comment(comment, actor):
        """Notify post owner when someone comments on their post."""
        parent = comment.parent
        if parent is None:
            return None

        if parent.user_id == actor.id:
            return None

        return Notification.objects.create(
            user=parent.user,
            notification_type=Notification.Type.NEWSFEED_COMMENT,
            title="New comment on your post",
            message=f"{actor.name} commented on your post: \"{comment.content[:80]}\"",
            link=parent.post_link,
        )

    @staticmethod
    @transaction.atomic
    def notify_newsfeed_reply(comment, replied_to, actor):
        """Notify a comment author when someone replies to their comment."""
        if replied_to.user_id == actor.id:
            return None

        parent = comment.parent
        return Notification.objects.create(
            user=replied_to.user,
            notification_type=Notification.Type.NEWSFEED_COMMENT,
            title="New reply to your comment",
            message=f'{actor.name} replied to your comment: "{comment.content[:80]}"',
            link=parent.post_link if parent else comment.post_link,
        )

    @staticmethod
    @transaction.atomic
    def notify_newsfeed_share(newsfeed, actor):
        """Notify post owner when someone shares their post."""
        if newsfeed.user_id == actor.id:
            return None

        return Notification.objects.create(
            user=newsfeed.user,
            notification_type=Notification.Type.NEWSFEED_SHARE,
            title="Your post was shared",
            message=f"{actor.name} shared your post: \"{NewsfeedServices._preview(newsfeed)}\"",
            link=newsfeed.post_link,
        )

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

# NewsfeedServices.notify_newsfeed_like(newsfeed, request.user)
# NewsfeedServices.notify_newsfeed_comment(comment, request.user)
# NewsfeedServices.notify_newsfeed_share(newsfeed, request.user)


        