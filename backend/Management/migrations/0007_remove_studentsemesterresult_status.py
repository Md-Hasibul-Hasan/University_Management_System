from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Management", "0006_remove_studentcourse_calculated_result_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="studentsemesterresult",
            name="status",
        ),
    ]