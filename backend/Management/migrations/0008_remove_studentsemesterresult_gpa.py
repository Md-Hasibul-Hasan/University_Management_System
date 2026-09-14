from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Management", "0007_remove_studentsemesterresult_status"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="studentsemesterresult",
            name="gpa",
        ),
    ]