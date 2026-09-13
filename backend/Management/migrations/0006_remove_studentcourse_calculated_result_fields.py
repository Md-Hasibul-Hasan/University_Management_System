from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Management", "0005_studentcourse_grade_point_studentcourse_letter_grade_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="studentcourse",
            name="grade_point",
        ),
        migrations.RemoveField(
            model_name="studentcourse",
            name="letter_grade",
        ),
        migrations.RemoveField(
            model_name="studentcourse",
            name="total_marks",
        ),
    ]
