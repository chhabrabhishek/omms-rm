from django.contrib import admin
from releases.models import Approver
from releases.models import Constant
from releases.models import Release
from releases.models import ReleaseItem
from releases.models import RevokeApproval
from releases.models import TalendReleaseItem
from releases.models import Target


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "uuid",
        "name",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "start_window",
        "end_window",
        "deployment_status",
        "deployment_comment",
        "deployed_by",
    )


@admin.register(ReleaseItem)
class ReleaseItemAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "repo",
        "service",
        "release_branch",
        "feature_number",
        "tag",
        "special_notes",
        "devops_notes",
        "platform",
        "azure_env",
        "azure_tenant",
        "queue_id",
        "job_status",
        "job_logs",
        "created_at",
        "updated_at",
        "release",
    )


@admin.register(TalendReleaseItem)
class ReleaseItemAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "job_name",
        "package_location",
        "feature_number",
        "special_notes",
        "release",
    )


@admin.register(Constant)
class ConstantAdmin(admin.ModelAdmin):
    list_display = ("pk", "repo", "service", "name")


@admin.register(Approver)
class ApproverAdmin(admin.ModelAdmin):
    list_display = ("group", "release", "approved")


@admin.register(Target)
class TargetAdmin(admin.ModelAdmin):
    list_display = ("target", "release", "created_at", "updated_at")


@admin.register(RevokeApproval)
class RevokeApprovalAdmin(admin.ModelAdmin):
    list_display = ("user", "release", "reason")
