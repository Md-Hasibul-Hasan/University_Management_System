from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Management", "0008_remove_studentsemesterresult_gpa"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="student",
            name="cgpa",
        ),
    ]