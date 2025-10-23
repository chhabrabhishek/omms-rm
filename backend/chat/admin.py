from django.contrib import admin
from chat.models import ChatSession
from chat.models import ChatMessage


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "session_id",
        "title_truncated",
        "created_by",
        "created_at",
        "updated_at",
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "sender_type",
        "text",
        "chat_session",
        "created_at",
        "updated_at",
    )
