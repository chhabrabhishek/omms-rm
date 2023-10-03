import uuid
from django.db import models
from django_enumfield import enum
from app.utils.models import AppModel


class Ticket(AppModel):
    """
    Represents a ticket
    """

    class Importance(enum.Enum):
        Low = 1
        Medium = 2
        High = 3

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    opened_by = models.ForeignKey("accounts.Account", on_delete=models.PROTECT)
    name = models.CharField(max_length=128)
    impact = enum.EnumField(Importance)
    priority = enum.EnumField(Importance)
    assigned_to = models.CharField(max_length=64)
    description = models.TextField(null=True, default=None)
