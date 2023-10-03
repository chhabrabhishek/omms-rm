import logging
from django.db import transaction
from ninja import Router
from ninja_schema import ModelSchema
from ninja_schema import Schema
from accounts.models import Account
from accounts.security import CommonBearerTokenAuth
from app.utils.api import response_schema
from tickets.models import Ticket

router = Router(auth=CommonBearerTokenAuth())
logger = logging.getLogger("django.server")


class CreateTicketRequest(ModelSchema):
    impact: int
    priority: int

    class Config:
        model = Ticket
        include = (
            "name",
            "impact",
            "priority",
            "assigned_to",
            "description",
        )


@response_schema
class CreateTicketResponse(ModelSchema):
    class Config:
        model = Ticket
        include = ("uuid",)


@router.post("/create", response=CreateTicketResponse)
def create_ticket(request, form: CreateTicketRequest):
    with transaction.atomic():
        ticket = Ticket.objects.create(
            opened_by=request.auth,
            **form.dict(),
        )

    return {
        "ok": True,
        "result": ticket,
    }


class SimpleAccountSchema(ModelSchema):
    class Config:
        model = Account
        include = ("email", "first_name", "last_name")


class SimpleTicketSchema(ModelSchema):
    impact: int
    priority: int
    opened_by: SimpleAccountSchema

    class Config:
        model = Ticket
        include = (
            "uuid",
            "opened_by",
            "name",
            "impact",
            "priority",
            "assigned_to",
            "description",
            "created_at",
        )


@response_schema
class AllTicketsResponse(Schema):
    tickets: list[SimpleTicketSchema]


@router.get("/all", response=AllTicketsResponse)
def get_all_tickets(request):
    user = request.auth
    tickets = Ticket.objects.filter(opened_by=user).order_by("-created_at")
    tickets = tickets.select_related("opened_by")

    return {
        "ok": True,
        "result": {
            "tickets": list(tickets),
        },
    }
