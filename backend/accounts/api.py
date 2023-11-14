import logging
from django.contrib.auth.signals import user_logged_out
from django.db import transaction
from ninja import Field
from ninja import Router
from ninja import Schema
from ninja_schema import ModelSchema
from app.api import AckResponse
from accounts.models import Account
from accounts.models import AuthToken
from accounts.models import PendingRoles
from accounts.models import Roles
from accounts.security import CommonBearerTokenAuth
from app.utils.api import response_schema

router = Router()
logger = logging.getLogger("django.server")


class SimpleRolesSchema(ModelSchema):
    role: int

    class Config:
        model = Roles
        include = ("role",)


class SimplePendingRolesSchema(ModelSchema):
    requested_role: int

    class Config:
        model = PendingRoles
        include = ("requested_role", "account")


class LoginRequest(Schema):
    email: str
    password: str


@response_schema
class LoginResponse(Schema):
    token: str
    valid_until: int
    first_name: str
    last_name: str
    email: str
    roles: list[SimpleRolesSchema]


@router.post("/login", response=LoginResponse)
def login(request, login: LoginRequest):
    email = Account.objects.normalize_email(login.email)
    account = Account.objects.filter(email=email, password=login.password).first()
    # This actually does help much because the attacker can still
    # use the rate limit and response delay as a proxy indicator
    # if an account actually exists.
    if account is None:
        return {
            "ok": False,
            "error": {
                "reason": "no_account",
            },
        }

    with transaction.atomic():
        auth_token = AuthToken(account=account)
        auth_token.save()

    account = auth_token.account
    return {
        "ok": True,
        "result": {
            "token": auth_token.token,
            "valid_until": auth_token.valid_until().timestamp(),
            "first_name": account.first_name,
            "last_name": account.last_name,
            "email": account.email,
            "roles": list(account.roles.all()),
        },
    }


def length_validated_field(min_length=2, max_length=150):
    return Field(..., min_length=min_length, max_length=max_length)


class CreateAccountSchema(ModelSchema):
    first_name: str = length_validated_field()
    last_name: str = length_validated_field()

    class Config:
        model = Account
        include = ("first_name", "last_name", "email", "password")


class CreateAccountRequest(CreateAccountSchema):
    pass


@response_schema
class CreateAccountResponse(Schema):
    pass


@router.post("/create", response=CreateAccountResponse)
def create_account(request, form: CreateAccountRequest):
    email = Account.objects.normalize_email(form.email)
    existing_account = Account.objects.filter(email=email).first()
    if existing_account:
        return {
            "ok": False,
            "error": {
                "reason": "email_taken",
            },
        }

    with transaction.atomic():
        account = Account.objects.create_user(email=email)
        account.first_name = form.first_name
        account.last_name = form.last_name
        account.password = form.password

        account.save()

        Roles.objects.create(role=Roles.Role.User, account=account)

    return {
        "ok": True,
    }


@response_schema
class MeResponse(ModelSchema):
    first_name: str = length_validated_field()
    last_name: str = length_validated_field()
    roles: list[SimpleRolesSchema]
    requested_roles: list[SimplePendingRolesSchema]

    class Config:
        model = Account
        include = ("first_name", "last_name", "email", "msid", "team_name")


@router.get("/me", auth=CommonBearerTokenAuth(), response=MeResponse)
def me(request):
    account = request.auth

    return {
        "ok": True,
        "result": {
            "first_name": account.first_name,
            "last_name": account.last_name,
            "email": account.email,
            "msid": account.msid,
            "team_name": account.team_name,
            "roles": list(account.roles.all()),
            "requested_roles": list(account.requested_roles.all()),
        },
    }


class SimplePendingResponseSchema(Schema):
    role: int
    account: str


@response_schema
class PendingResponse(Schema):
    requested_roles: list[SimplePendingResponseSchema]


@router.get("/pending", auth=CommonBearerTokenAuth(), response=PendingResponse)
def all_pending(request):
    requested_roles = []
    pending_roles = list(PendingRoles.objects.all())
    for pending_role in pending_roles:
        requested_roles.append(
            {"role": pending_role.requested_role, "account": pending_role.account.email}
        )
    return {"ok": True, "result": {"requested_roles": requested_roles}}


class UpdateAccountRequest(ModelSchema):
    first_name: str = length_validated_field()
    last_name: str = length_validated_field()

    class Config:
        model = Account
        include = ("first_name", "last_name", "msid", "team_name")


@router.post("/update", auth=CommonBearerTokenAuth(), response=AckResponse)
def update_account(request, form: UpdateAccountRequest, roles: list[int]):
    existing_account = request.auth

    with transaction.atomic():
        existing_account.first_name = form.first_name
        existing_account.last_name = form.last_name
        existing_account.msid = form.msid
        existing_account.team_name = form.team_name
        existing_account.save()

        pending_roles = PendingRoles.objects.filter(account=existing_account)
        existing_roles = Roles.objects.filter(account=existing_account)

        for role in roles:
            if role == 3:
                continue
            for pending_role in pending_roles:
                if Roles.Role.get_label(role) == Roles.Role.get_label(
                    pending_role.requested_role
                ):
                    break
            else:
                for existing_role in existing_roles:
                    if Roles.Role.get_label(role) == Roles.Role.get_label(
                        existing_role.role
                    ):
                        break
                else:
                    PendingRoles.objects.create(
                        requested_role=role, account=existing_account
                    )

    return {
        "ok": True,
    }


class ManageApprovalRequest(Schema):
    role: int
    account: str
    status: bool


@router.post("/manage_approval", auth=CommonBearerTokenAuth(), response=AckResponse)
def manage_approval(request, approval_request: ManageApprovalRequest):
    user = request.auth
    for role in user.roles.all():
        if role.role == Roles.Role.Admin:
            account = Account.objects.get(email=approval_request.account)
            pending_role = PendingRoles.objects.get(
                account=account, requested_role=approval_request.role
            )

            if approval_request.status:
                with transaction.atomic():
                    pending_role.delete()
                    Roles.objects.create(role=approval_request.role, account=account)
                    auth_tokens = AuthToken.objects.filter(account=account)
                    for auth_token in auth_tokens:
                        auth_token.active = False
                        auth_token.save()

            else:
                pending_role.delete()

            return {"ok": True}
    return {
        "ok": False,
        "error": {
            "reason": "user_not_authorized",
        },
    }


@response_schema
class LogoutResponse(Schema):
    pass


@router.post("/logout", auth=CommonBearerTokenAuth(), response=LogoutResponse)
def logout(request):
    with transaction.atomic():
        auth_token = request.auth.auth_token
        auth_token.active = False
        auth_token.save()

    # It doesn't matter if processing any of the signal handler fails.
    try:
        account = request.auth
        user_logged_out.send(sender=Account, request=request, user=account)
    except:
        logger.exception()

    return {
        "ok": True,
    }
