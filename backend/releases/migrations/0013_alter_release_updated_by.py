# Generated by Django 4.2.3 on 2023-11-03 06:35

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("releases", "0012_alter_approver_user"),
    ]

    operations = [
        migrations.AlterField(
            model_name="release",
            name="updated_by",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="release_updated_by",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
