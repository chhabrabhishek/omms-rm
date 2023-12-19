# Generated by Django 4.2.3 on 2023-11-29 06:46

import accounts.models
from django.db import migrations
import django_enumfield.db.fields


class Migration(migrations.Migration):
    dependencies = [
        ("releases", "0015_target"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="approver",
            name="user",
        ),
        migrations.AddField(
            model_name="approver",
            name="group",
            field=django_enumfield.db.fields.EnumField(
                default=3, enum=accounts.models.Roles.Role
            ),
            preserve_default=False,
        ),
    ]