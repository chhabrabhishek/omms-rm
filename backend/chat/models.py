import uuid
from django.db import models
from django_enumfield import enum
from app.utils.models import AppModel
from accounts.models import Roles


class ChatSession(AppModel):
    """
    Represents a chat session
    """

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_by = models.ForeignKey(
        "accounts.Account", on_delete=models.PROTECT, related_name="chat_created_by"
    )
    title_truncated = models.CharField(max_length=2048)


class ChatMessage(AppModel):
    """
    Represents a chat message tied to a session
    """

    class SenderType(enum.Enum):
        User = 0
        Agent = 1

    sender_type = enum.EnumField(SenderType)
    text = models.TextField()
    chat_session = models.ForeignKey(
        ChatSession, on_delete=models.PROTECT, related_name="messages"
    )
