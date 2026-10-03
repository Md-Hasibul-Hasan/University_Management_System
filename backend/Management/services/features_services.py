from django.db import models, transaction
from ..models import (
    StudentCourse,
    Notification,
    YearSemester,
    Newsfeed,
    ComplainBox,
)


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


# ============================================================
# COMPLAIN BOX
# ============================================================

class ComplainBoxServices:

    @staticmethod
    def get_user_department_id(user):
        """Department of the user from student/teacher profile (None if any)."""
        profile = getattr(user, "student_profile", None) or getattr(
            user, "teacher_profile", None
        )
        return getattr(profile, "department_id", None)

    @staticmethod
    def is_admin(user):
        return (
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name="Admin").exists()
        )

    @staticmethod
    def is_chairman(user):
        """Department chairman = teacher profile with is_head=True."""
        teacher = getattr(user, "teacher_profile", None)
        return bool(teacher and teacher.is_head and teacher.department_id)

    @staticmethod
    def visible_to(user, queryset=None):
        """
        Complaints a user is allowed to see:

        - own complaints: always visible
        - Admin / staff: everything
        - dept_chairman -> department chairman (is_head teacher) + Admin
        - dept_teacher  -> all teachers of that department + Admin
        - dept_all      -> all students + teachers of that department
        - all           -> every authenticated user
        """
        qs = (
            queryset
            if queryset is not None
            else ComplainBox.objects.all()
        )

        from django.db.models import Q

        visible = Q(user=user)

        if ComplainBoxServices.is_admin(user):
            return qs  # admins see everything

        dept_id = ComplainBoxServices.get_user_department_id(user)
        is_teacher = user.groups.filter(name="Teacher").exists()

        if dept_id is not None:
            same_dept = Q(department_id=dept_id)

            # dept_all: students + teachers of the department
            visible |= same_dept & Q(
                complain_to=ComplainBox.ComplainTo.DEPT_ALL
            )

            if is_teacher:
                # dept_teacher: every teacher of the department
                visible |= same_dept & Q(
                    complain_to=ComplainBox.ComplainTo.DEPT_TEACHER
                )

                # dept_chairman: only the chairman (is_head) of the department
                if ComplainBoxServices.is_chairman(user):
                    visible |= same_dept & Q(
                        complain_to=ComplainBox.ComplainTo.DEPT_CHAIRMAN
                    )

        # all: anyone can see
        visible |= Q(complain_to=ComplainBox.ComplainTo.ALL)

        return qs.filter(visible).distinct()

    @staticmethod
    def get_audience_users(complaint):
        """
        Resolve the users a complaint is addressed to
        (the people who should be notified), excluding the sender.
        """
        User = complaint.user._meta.model

        if complaint.complain_to == ComplainBox.ComplainTo.DEPT_CHAIRMAN:
            users = User.objects.filter(
                teacher_profile__is_head=True,
                teacher_profile__department=complaint.department,
            )
        elif complaint.complain_to == ComplainBox.ComplainTo.DEPT_TEACHER:
            users = User.objects.filter(
                groups__name="Teacher",
                teacher_profile__department=complaint.department,
            )
        elif complaint.complain_to == ComplainBox.ComplainTo.DEPT_ALL:
            users = User.objects.filter(
                models.Q(
                    groups__name__in=["Teacher", "Student"],
                    teacher_profile__department=complaint.department,
                )
                | models.Q(
                    groups__name__in=["Teacher", "Student"],
                    student_profile__department=complaint.department,
                )
            )
        else:  # ALL -> every teacher + student
            users = User.objects.filter(
                groups__name__in=["Teacher", "Student"]
            )

        return users.exclude(id=complaint.user_id).distinct()

    @staticmethod
    @transaction.atomic
    def notify_complainbox(complaint):
        """Notify everyone in the complaint's audience."""
        recipients = ComplainBoxServices.get_audience_users(complaint)

        notifications = [
            Notification(
                user=user,
                notification_type=Notification.Type.COMPLAINT,
                title=f"New complaint: {complaint.title}",
                message=(
                    f"{complaint.user.name} submitted a complaint"
                    f" ({complaint.get_complain_to_display()}): "
                    f"\"{complaint.message[:80]}\""
                ),
                link=f"/ComplaintBox/{complaint.id}",
            )
            for user in recipients
        ]

        Notification.objects.bulk_create(notifications)
        return len(notifications)

# ComplainBoxServices.visible_to(request.user)
# ComplainBoxServices.notify_complainbox(complaint)


        