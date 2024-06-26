# Generated by Django 4.2.3 on 2023-12-08 07:37

from django.db import migrations, models
import django_enumfield.db.fields
import releases.models


class Migration(migrations.Migration):
    dependencies = [
        ("releases", "0017_remove_approver_user_approver_group"),
    ]

    operations = [
        migrations.AddField(
            model_name="release",
            name="deployment_comment",
            field=models.TextField(blank=True, default=None, null=True),
        ),
        migrations.AddField(
            model_name="release",
            name="deployment_status",
            field=django_enumfield.db.fields.EnumField(
                default=1, enum=releases.models.Release.DeploymentStatus
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="release",
            name="end_window",
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
        migrations.AddField(
            model_name="release",
            name="start_window",
            field=models.DateTimeField(blank=True, default=None, null=True),
        ),
    ]
