from django.contrib import admin
from releases.models import Approver
from releases.models import Constant
from releases.models import Release
from releases.models import ReleaseItem


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "uuid",
        "name",
        "created_at",
        "updated_at",
    )


@admin.register(ReleaseItem)
class ReleaseItemAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "repo",
        "service",
        "release_branch",
        "hotfix_branch",
        "tag",
        "special_notes",
        "created_at",
        "updated_at",
        "release",
    )


@admin.register(Constant)
class ConstantAdmin(admin.ModelAdmin):
    list_display = ("pk", "repo", "service", "name")


@admin.register(Approver)
class ApproverAdmin(admin.ModelAdmin):
    list_display = ("user", "release", "approved")
