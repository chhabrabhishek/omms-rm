# Generated by Django 4.2.3 on 2023-11-14 12:44

import accounts.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_alter_account_id_alter_authtoken_id_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="account",
            name="first_name",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="account",
            name="last_name",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="account",
            name="password",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="account",
            name="team_name",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="authtoken",
            name="token",
            field=models.CharField(
                default=accounts.models.generate_auth_token,
                editable=False,
                max_length=150,
                unique=True,
            ),
        ),
    ]