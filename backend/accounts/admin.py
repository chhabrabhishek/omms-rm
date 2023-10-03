from django.contrib import admin
from accounts.models import Account
from accounts.models import AuthToken
from accounts.models import PendingRoles
from accounts.models import Roles


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("pk", "first_name", "last_name", "email", "last_login")


@admin.register(AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
    list_display = ("pk", "account", "token", "created_at", "active")

@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ("pk", "role", "account")

@admin.register(PendingRoles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ("pk", "requested_role", "account")