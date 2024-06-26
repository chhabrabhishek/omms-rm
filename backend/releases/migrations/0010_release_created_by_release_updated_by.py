# Generated by Django 4.2.3 on 2023-10-04 07:26

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("releases", "0009_remove_revokeapproval_uuid_alter_revokeapproval_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="release",
            name="created_by",
            field=models.OneToOneField(
                default=9,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="release_created_by",
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="release",
            name="updated_by",
            field=models.OneToOneField(
                default=9,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="release_updated_by",
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,
        ),
    ]
