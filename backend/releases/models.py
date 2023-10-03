import uuid
from django.db import models
from app.utils.models import AppModel


class Constant(AppModel):
    """
    Represents the model to hold the constant data
    """

    repo = models.URLField(max_length=1024)
    service = models.CharField(max_length=1024)
    name = models.CharField(max_length=1024)


class Release(AppModel):
    """
    Represents a release
    """

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=1024)


class ReleaseItem(AppModel):
    """
    Represents a release item
    """

    repo = models.URLField(max_length=1024)
    service = models.CharField(max_length=1024)
    release_branch = models.CharField(
        max_length=1024, null=True, default=None, blank=True
    )
    hotfix_branch = models.CharField(
        max_length=1024, null=True, default=None, blank=True
    )
    tag = models.CharField(max_length=1024, null=True, default=None, blank=True)
    special_notes = models.TextField(null=True, default=None)
    release = models.ForeignKey(Release, on_delete=models.PROTECT, related_name="items")


class Approver(AppModel):
    """
    Represents a release approver
    """

    approved = models.BooleanField(default=False)
    user = models.OneToOneField(
        "accounts.Account", on_delete=models.PROTECT, related_name="approver"
    )
    release = models.ForeignKey(
        Release, on_delete=models.PROTECT, related_name="approvers"
    )
