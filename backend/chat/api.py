from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.models import VectorizedQuery
from django.db import transaction
import logging
from typing import Optional
import uuid
from ninja import Router
from ninja_schema import ModelSchema
from ninja_schema import Schema
from openai import AzureOpenAI
from accounts.security import CommonBearerTokenAuth
from accounts.models import Account
from app.utils.api import response_schema
from chat.models import ChatSession
from chat.models import ChatMessage

router = Router(auth=CommonBearerTokenAuth())
logger = logging.getLogger("django.server")

search_service_endpoint = "https://omms-chat-ai-search.search.windows.net"
search_api_key = "KEY"
index_name = "omms-chat-index"

embedding_model = "embedding-model"
chat_model = "gpt-model"

client = AzureOpenAI(
    api_key="KEY",
    api_version="2024-10-21",
    azure_endpoint="https://omms-chat-openai.openai.azure.com",
)

search_client = SearchClient(
    endpoint=search_service_endpoint,
    index_name=index_name,
    credential=AzureKeyCredential(search_api_key),
)


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
                chat_session.save()

            previous_chat_messages = list(
                ChatMessage.objects.filter(chat_session=chat_session).order_by(
                    "-created_at"
                )[:10]
            )

            ChatMessage.objects.create(
                sender_type=0, text=form.user_query, chat_session=chat_session
            )

            history_lines = [
                f"{'User' if chat_message.sender_type == 0 else 'Assistant'}: {chat_message.text}"
                for chat_message in previous_chat_messages
            ]

            conversation_history_str = "\n".join(history_lines)

            if len(previous_chat_messages):
                system_prompt_for_condensed = (
                    "You are an assistant that converts conversations into a single clear query for document search.\n"
                    "Given the conversation history and the latest user question, generate a concise query that reflects the user's intent considering prior dialogue.\n\n"
                    f"Conversation History:\n{conversation_history_str}\n\n"
                    f"New User Question:\n{form.user_query}\n\n"
                    "Condensed Search Query:"
                )

            else:
                system_prompt_for_condensed = (
                    "You are an assistant that converts user questions into a single clear query for document search.\n"
                    "Given only the latest user question below, generate a concise query that is optimized for finding the most relevant documents in a vector search index.\n\n"
                    f"User Question:\n{form.user_query}\n\n"
                    "Condensed Search Query:"
                )

            response_for_condensed = client.chat.completions.create(
                model=chat_model,
                messages=[
                    {"role": "system", "content": system_prompt_for_condensed},
                ],
                max_tokens=64,
                temperature=0.2,
            )

            condensed_query = response_for_condensed.choices[0].message.content.strip()

            query_embedding = (
                client.embeddings.create(
                    model=embedding_model,
                    input=condensed_query if condensed_query else form.user_query,
                )
                .data[0]
                .embedding
            )

            results = search_client.search(
                search_text="",
                vector_queries=[
                    VectorizedQuery(
                        vector=query_embedding,
                        k_nearest_neighbors=3,
                        fields="embedding",
                    )
                ],
                select=[
                    "issue_title",
                    "issue_description",
                    "comments",
                    "assignees",
                ],
                top=5,
            )

            context_docs = []

            for result in results:
                doc_text = f"Title: {result['issue_title']}\nDescription: {result['issue_description']}\nComments: {result['comments']}\nAssignees: {result['assignees']}"
                context_docs.append(doc_text)

            combined_context = "\n\n".join(context_docs)

            system_prompt = (
                "You are a helpful assistant that answers user questions based only on the provided documents. "
                "If the answer is not found in the documents, say you cannot find relevant information. "
                "Be concise but include all relevant details from the documents."
            )

            if len(previous_chat_messages):
                user_prompt = (
                    "Use the following conversation history, condensed query, and relevant documents to answer the user's latest question accurately and helpfully.\n\n"
                    "Conversation History:\n"
                    f"{conversation_history_str}\n\n"
                    "Original User Query:\n"
                    f"{form.user_query}\n\n"
                    "Condensed Search Query:\n"
                    f"{condensed_query}\n\n"
                    "Relevant Documents:\n"
                    f"{combined_context}\n\n"
                    "Answer:"
                )
            else:
                user_prompt = (
                    "Use the following condensed query, and relevant documents to answer the user's latest question accurately and helpfully.\n\n"
                    "Original User Query:\n"
                    f"{form.user_query}\n\n"
                    "Condensed Search Query:\n"
                    f"{condensed_query}\n\n"
                    "Relevant Documents:\n"
                    f"{combined_context}\n\n"
                    "Answer:"
                )

            response = client.chat.completions.create(
                model=chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=500,
                temperature=0.2,
            )

            ChatMessage.objects.create(
                sender_type=1,
                text=response.choices[0].message.content.strip(),
                chat_session=chat_session,
            )

        return {
            "ok": True,
            "result": {
                "agent_response": response.choices[0].message.content.strip(),
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
