# Generated manually

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('Management', '0004_sessioncourse_sessioncourseteacher_and_more'),
    ]

    operations = [
        # Remove is_approved from Student
        migrations.RemoveField(
            model_name='student',
            name='is_approved',
        ),
        # Add approval_status to Student
        migrations.AddField(
            model_name='student',
            name='approval_status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                default='pending',
                max_length=20,
            ),
        ),
        # Add approved_by to Student
        migrations.AddField(
            model_name='student',
            name='approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_students',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Add approved_at to Student
        migrations.AddField(
            model_name='student',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]