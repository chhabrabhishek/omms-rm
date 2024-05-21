import uuid
from django.db import models
from django_enumfield import enum
from app.utils.models import AppModel
from accounts.models import Roles


class Constant(AppModel):
    """
    Represents the model to hold the constant data
    """

    repo = models.CharField(max_length=1024)
    service = models.CharField(max_length=1024)
    name = models.CharField(max_length=1024)


class Release(AppModel):
    """
    Represents a release
    """

    class DeploymentStatus(enum.Enum):
        Unknown = 0
        Success = 1
        PartialSuccess = 2
        Fail = 3

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=1024)
    created_by = models.ForeignKey(
        "accounts.Account", on_delete=models.PROTECT, related_name="release_created_by"
    )
    updated_by = models.ForeignKey(
        "accounts.Account", on_delete=models.PROTECT, related_name="release_updated_by"
    )
    start_window = models.DateTimeField(null=True, default=None, blank=True)
    end_window = models.DateTimeField(null=True, default=None, blank=True)
    deployment_status = enum.EnumField(
        DeploymentStatus, default=DeploymentStatus.Unknown
    )
    deployment_comment = models.TextField(null=True, default=None, blank=True)


class ReleaseItem(AppModel):
    """
    Represents a release item
    """

    repo = models.CharField(max_length=1024)
    service = models.CharField(max_length=1024)
    release_branch = models.CharField(
        max_length=1024, null=True, default=None, blank=True
    )
    feature_number = models.CharField(
        max_length=2048, null=True, default=None, blank=True
    )
    tag = models.CharField(max_length=1024, null=True, default=None, blank=True)
    special_notes = models.TextField(null=True, default=None)
    devops_notes = models.TextField(null=True, default=None)
    release = models.ForeignKey(Release, on_delete=models.PROTECT, related_name="items")


class TalendReleaseItem(AppModel):
    """
    Represents a talend release item
    """

    job_name = models.CharField(max_length=1024)
    package_location = models.CharField(max_length=5120)
    feature_number = models.CharField(
        max_length=2048, null=True, default=None, blank=True
    )
    special_notes = models.TextField(null=True, default=None, blank=True)
    release = models.ForeignKey(
        Release, on_delete=models.PROTECT, related_name="talend_items"
    )


class Approver(AppModel):
    """
    Represents a release approver
    """

    approved = models.BooleanField(default=False)
    group = enum.EnumField(Roles.Role)
    release = models.ForeignKey(
        Release, on_delete=models.PROTECT, related_name="approvers"
    )


class Target(AppModel):
    """
    Represents all the target envs for a release
    """

    target = models.CharField(max_length=1024)
    release = models.ForeignKey(
        Release, on_delete=models.PROTECT, related_name="targets"
    )


class RevokeApproval(AppModel):
    """
    Represents a record created when approval needs to be revoked
    """

    reason = models.TextField()
    user = models.ForeignKey(
        "accounts.Account", on_delete=models.PROTECT, related_name="revoke_approver"
    )
    release = models.ForeignKey(
        Release, on_delete=models.PROTECT, related_name="revoke_approvers"
    )
