from django.contrib import admin
from tickets.models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "uuid",
        "opened_by",
        "name",
        "impact",
        "priority",
        "assigned_to",
        "description",
    )
