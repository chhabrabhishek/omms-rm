# Generated by Django 4.2.3 on 2024-06-04 11:00

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("releases", "0026_release_deployed_by_releaseitem_azure_env_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="releaseitem",
            name="platform",
            field=models.CharField(blank=True, default=None, max_length=100, null=True),
        ),
    ]