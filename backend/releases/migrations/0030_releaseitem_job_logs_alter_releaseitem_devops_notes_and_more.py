# Generated by Django 4.2.3 on 2024-06-05 05:40

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("releases", "0029_alter_releaseitem_queue_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="releaseitem",
            name="job_logs",
            field=models.TextField(blank=True, default=None, null=True),
        ),
        migrations.AlterField(
            model_name="releaseitem",
            name="devops_notes",
            field=models.TextField(blank=True, default=None, null=True),
        ),
        migrations.AlterField(
            model_name="releaseitem",
            name="special_notes",
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]