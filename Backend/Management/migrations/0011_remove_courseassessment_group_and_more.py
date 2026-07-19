# Generated manually

from django.db import migrations, models


def migrate_group_to_assessment_type(apps, schema_editor):
    CourseAssessment = apps.get_model('Management', 'CourseAssessment')
    for assessment in CourseAssessment.objects.all():
        if assessment.is_attendance:
            assessment.assessment_type = 'attendance'
        elif assessment.group == 'none':
            assessment.assessment_type = 'final'
        elif assessment.group == 'incourse':
            assessment.assessment_type = 'incourse'
        elif assessment.group == 'evaluation':
            assessment.assessment_type = 'evaluation'
        elif assessment.group == 'quiz':
            assessment.assessment_type = 'quiz'
        elif assessment.group == 'assignment':
            assessment.assessment_type = 'assignment'
        elif assessment.group == 'presentation':
            assessment.assessment_type = 'presentation'
        elif assessment.group == 'viva':
            assessment.assessment_type = 'viva'
        else:
            assessment.assessment_type = 'final'
        assessment.save()


class Migration(migrations.Migration):

    dependencies = [
        ('Management', '0010_courseassessment_is_attendance_and_more'),
    ]

    operations = [
        # Step 1: Add assessment_type as nullable first
        migrations.AddField(
            model_name='courseassessment',
            name='assessment_type',
            field=models.CharField(
                choices=[
                    ('attendance', 'Attendance'),
                    ('quiz', 'Quiz'),
                    ('assignment', 'Assignment'),
                    ('incourse', 'Incourse'),
                    ('evaluation', 'Evaluation'),
                    ('presentation', 'Presentation'),
                    ('viva', 'Viva'),
                    ('final', 'Final'),
                ],
                max_length=20,
                null=True,
            ),
        ),
        # Step 2: Migrate data from old group + is_attendance to new assessment_type
        migrations.RunPython(migrate_group_to_assessment_type),
        # Step 3: Remove old fields
        migrations.RemoveField(
            model_name='courseassessment',
            name='group',
        ),
        migrations.RemoveField(
            model_name='courseassessment',
            name='is_attendance',
        ),
        # Step 4: Make assessment_type non-nullable
        migrations.AlterField(
            model_name='courseassessment',
            name='assessment_type',
            field=models.CharField(
                choices=[
                    ('attendance', 'Attendance'),
                    ('quiz', 'Quiz'),
                    ('assignment', 'Assignment'),
                    ('incourse', 'Incourse'),
                    ('evaluation', 'Evaluation'),
                    ('presentation', 'Presentation'),
                    ('viva', 'Viva'),
                    ('final', 'Final'),
                ],
                max_length=20,
            ),
        ),
    ]