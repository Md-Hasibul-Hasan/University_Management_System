# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Management', '0006_sessioncourseteacher_created_at_and_more'),
    ]

    operations = [
        # Remove old course FK
        migrations.RemoveField(
            model_name='courseassessment',
            name='course',
        ),
        # Add new session_course FK
        migrations.AddField(
            model_name='courseassessment',
            name='session_course',
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='assessments',
                to='Management.sessioncourse',
            ),
            preserve_default=False,
        ),
    ]