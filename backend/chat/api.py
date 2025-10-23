from django.db import transaction
import logging
from typing import Optional
import uuid
from ninja import Router
from ninja_schema import ModelSchema
from ninja_schema import Schema
from accounts.security import CommonBearerTokenAuth
from accounts.models import Account
from app.utils.api import response_schema
from chat.models import ChatSession
from chat.models import ChatMessage

router = Router(auth=CommonBearerTokenAuth())
logger = logging.getLogger("django.server")


class SimpleUserSchema(ModelSchema):
    class Config:
        model = Account
        include = ("first_name", "last_name", "email")


class SimpleAllChatModelSchema(ModelSchema):
    created_by: SimpleUserSchema

    class Config:
        model = ChatSession
        include = (
            "session_id",
            "title_truncated",
            "created_at",
            "updated_at",
            "created_by",
        )


class SimpleChatMessageModelSchema(ModelSchema):
    sender_type: int

    class Config:
        model = ChatMessage
        include = (
            "sender_type",
            "text",
            "created_at",
        )


class SimpleGetChatModelSchema(ModelSchema):
    messages: list[SimpleChatMessageModelSchema]

    class Config:
        model = ChatSession
        include = ("session_id",)


@response_schema
class ChatResponse(Schema):
    agent_response: str
    session_id: uuid.UUID


class ChatRequest(Schema):
    session_id: Optional[uuid.UUID] = None
    user_query: str


@router.post("/chat", response=ChatResponse)
def chat(request, form: ChatRequest):
    user = request.auth

    try:
        with transaction.atomic():
            if not form.session_id:
                chat_session = ChatSession.objects.create(
                    created_by=user, title_truncated=form.user_query[:512]
                )
            else:
                chat_session = ChatSession.objects.get(session_id=form.session_id)

            ChatMessage.objects.create(
                sender_type=0, text=form.user_query, chat_session=chat_session
            )

            ChatMessage.objects.create(
                sender_type=1,
                text="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laborum, adipisci suscipit beatae earum eligendi cumque dignissimos, voluptate possimus excepturi totam enim amet consectetur exercitationem. Eveniet et ab saepe. Accusamus, aspernatur.",
                chat_session=chat_session,
            )

        return {
            "ok": True,
            "result": {
                "agent_response": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laborum, adipisci suscipit beatae earum eligendi cumque dignissimos, voluptate possimus excepturi totam enim amet consectetur exercitationem. Eveniet et ab saepe. Accusamus, aspernatur.",
                "session_id": chat_session.session_id,
            },
        }

    except Exception as e:
        print(e)
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }


@response_schema
class GetAllChatSessionsResponse(Schema):
    chat_session_list: list[SimpleAllChatModelSchema]


@router.get("/all", response=GetAllChatSessionsResponse)
def get_all_chat_sessions(request):
    try:
        chat_session_list = ChatSession.objects.order_by("-updated_at")

        return {
            "ok": True,
            "result": {"chat_session_list": list(chat_session_list)},
        }
    except Exception as e:
        print(e)
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }


@response_schema
class GetChatResponse(Schema):
    chat_data: SimpleGetChatModelSchema


class GetChatRequest(Schema):
    session_id: uuid.UUID


@router.post("/get-chat", response=GetChatResponse)
def get_chat(request, form: GetChatRequest):
    try:
        chat_data = ChatSession.objects.get(session_id=form.session_id)

        return {"ok": True, "result": {"chat_data": chat_data}}

    except Exception as e:
        print(e)
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }


class DeleteChatRequest(Schema):
    session_id: uuid.UUID


@response_schema
class DeleteChatResponse(Schema):
    session_id: uuid.UUID


@router.post("/delete", response=DeleteChatResponse)
def delete_chat(request, form: DeleteChatRequest):
    try:
        chat_session = ChatSession.objects.get(session_id=form.session_id)
        session_id = chat_session.session_id

        with transaction.atomic():
            ChatMessage.objects.filter(chat_session=chat_session).delete()

            chat_session.delete()

        return {"ok": True, "result": {"session_id": session_id}}

    except Exception as e:
        print(e)
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }
