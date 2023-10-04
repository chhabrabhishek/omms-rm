import git
import logging
import subprocess
import uuid
from django.db import transaction
from django.db.models import Q
from ninja import Router
from ninja_schema import ModelSchema
from ninja_schema import Schema
from accounts.models import Account
from accounts.models import Roles
from accounts.security import CommonBearerTokenAuth
from app.api import AckResponse
from app.utils.api import response_schema
from releases.models import Approver
from releases.models import Constant
from releases.models import Release
from releases.models import ReleaseItem
from releases.models import RevokeApproval

router = Router(auth=CommonBearerTokenAuth())
logger = logging.getLogger("django.server")


class SimpleConstantSchema(ModelSchema):
    tags: list[str]
    branches: list[str]

    class Config:
        model = Constant
        include = ("repo", "service", "name")


@response_schema
class ConstantResponse(Schema):
    constants: list[SimpleConstantSchema]


@router.post("/constant", response=ConstantResponse)
def post_constant(request, service_options: list[str]):
    constants = Constant.objects.filter(service__in=service_options).all()

    for item in list(constants):
        tags_result = subprocess.run(
            ["git", "ls-remote", "--tags", item.repo], stdout=subprocess.PIPE, text=True
        )
        output_tags = tags_result.stdout.splitlines()
        item.tags = [
            line.split("refs/tags/")[-1]
            for line in output_tags
            if "refs/tags/" in line and "^{}" not in line
        ]

        branches_result = subprocess.run(
            ["git", "ls-remote", "--heads", item.repo],
            stdout=subprocess.PIPE,
            text=True,
        )
        output_branches = branches_result.stdout.splitlines()
        item.branches = [
            line.split("refs/heads/")[-1]
            for line in output_branches
            if "refs/heads/" in line and "^{}" not in line
        ]

    return {
        "ok": True,
        "result": {
            "constants": list(constants),
        },
    }


class SimpleUserSchema(ModelSchema):
    class Config:
        model = Account
        include = ("first_name", "last_name", "email")


@response_schema
class ConstantUserResponse(Schema):
    constants: list[SimpleConstantSchema]
    users: list[SimpleUserSchema]


@router.get("/constant", response=ConstantUserResponse)
def get_constant_and_users(request):
    constants = Constant.objects.all()

    for item in list(constants):
        tags_result = subprocess.run(
            ["git", "ls-remote", "--tags", item.repo], stdout=subprocess.PIPE, text=True
        )
        output_tags = tags_result.stdout.splitlines()
        item.tags = [
            line.split("refs/tags/")[-1]
            for line in output_tags
            if "refs/tags/" in line and "^{}" not in line
        ]

        branches_result = subprocess.run(
            ["git", "ls-remote", "--heads", item.repo],
            stdout=subprocess.PIPE,
            text=True,
        )
        output_branches = branches_result.stdout.splitlines()
        item.branches = [
            line.split("refs/heads/")[-1]
            for line in output_branches
            if "refs/heads/" in line and "^{}" not in line
        ]

    users = Account.objects.filter(~Q(first_name=""))

    return {
        "ok": True,
        "result": {"constants": list(constants), "users": list(users)},
    }


class SimpleReleaseItemModelSchema(ModelSchema):
    class Config:
        model = ReleaseItem
        include = (
            "repo",
            "service",
            "release_branch",
            "hotfix_branch",
            "tag",
            "special_notes",
        )


class SimpleReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]

    class Config:
        model = Release
        include = ("name",)


class CreateReleaseRequest(Schema):
    release: SimpleReleaseModelSchema
    approvers: list[str]


# TODO: Add audit fields
@router.post("/create", response=AckResponse)
def create_release(request, form: CreateReleaseRequest):
    user = request.auth
    for role in user.roles.all():
        if role.role == Roles.Role.ReleaseAdmin:
            with transaction.atomic():
                release = Release.objects.create(
                    name=form.release.name, created_by=user, updated_by=user
                )
                for item in form.release.items:
                    ReleaseItem.objects.create(
                        repo=item.repo,
                        service=item.service,
                        release_branch=item.release_branch,
                        hotfix_branch=item.hotfix_branch,
                        tag=item.tag,
                        special_notes=item.special_notes,
                        release=release,
                    )
                for item in form.approvers:
                    user = Account.objects.get(email=item)
                    Approver.objects.create(user=user, release=release)

            return {"ok": True}
    return {
        "ok": False,
        "error": {
            "reason": "user_not_authorized",
        },
    }


class UpdateReleaseRequest(Schema):
    release: SimpleReleaseModelSchema
    uuid: uuid.UUID


# TODO: Add audit fields
@router.post("/update", response=AckResponse)
def update_release(request, form: UpdateReleaseRequest):
    user = request.auth
    release = Release.objects.get(uuid=form.uuid)

    for approver in list(release.approvers.all()):
        if approver.approved:
            continue
        else:
            with transaction.atomic():
                release.updated_by = user
                release.save()
                ReleaseItem.objects.filter(release=release).delete()
                for item in form.release.items:
                    ReleaseItem.objects.create(
                        repo=item.repo,
                        service=item.service,
                        release_branch=item.release_branch,
                        hotfix_branch=item.hotfix_branch,
                        tag=item.tag,
                        special_notes=item.special_notes,
                        release=release,
                    )

            return {"ok": True}
    return {
        "ok": False,
        "error": {
            "reason": "release_approved",
        },
    }


class SimpleApproverModelSchema(ModelSchema):
    user: SimpleUserSchema

    class Config:
        model = Approver
        include = ("approved", "user")


class SimpleAllReleaseModelSchema(ModelSchema):
    approvers: list[SimpleApproverModelSchema]
    created_by: SimpleUserSchema
    updated_by: SimpleUserSchema

    class Config:
        model = Release
        include = (
            "uuid",
            "name",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )


@response_schema
class AllReleaseResponse(Schema):
    release_list: list[SimpleAllReleaseModelSchema]


@router.get("/all", response=AllReleaseResponse)
def get_all_releases(request):
    releases_list = Release.objects.order_by("-updated_at").all()

    return {
        "ok": True,
        "result": {"release_list": list(releases_list)},
    }


class SimpleGetReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]
    approvers: list[SimpleApproverModelSchema]

    class Config:
        model = Release
        include = ("name",)


@response_schema
class GetReleaseResponse(Schema):
    release_data: SimpleGetReleaseModelSchema
    constants: list[SimpleConstantSchema]


@router.get("/release", response=GetReleaseResponse)
def get_release_with_uuid(request, uuid: uuid.UUID):
    release_data = Release.objects.get(uuid=uuid)

    service_options = {}
    for item in list(release_data.items.all()):
        service_options[item.service] = True

    constants = Constant.objects.filter(service__in=service_options.keys()).all()

    for item in list(constants):
        tags_result = subprocess.run(
            ["git", "ls-remote", "--tags", item.repo], stdout=subprocess.PIPE, text=True
        )
        output_tags = tags_result.stdout.splitlines()
        item.tags = [
            line.split("refs/tags/")[-1]
            for line in output_tags
            if "refs/tags/" in line and "^{}" not in line
        ]

        branches_result = subprocess.run(
            ["git", "ls-remote", "--heads", item.repo],
            stdout=subprocess.PIPE,
            text=True,
        )
        output_branches = branches_result.stdout.splitlines()
        item.branches = [
            line.split("refs/heads/")[-1]
            for line in output_branches
            if "refs/heads/" in line and "^{}" not in line
        ]

    return {
        "ok": True,
        "result": {
            "release_data": release_data,
            "constants": list(constants),
        },
    }


@router.post("/approve", response=AckResponse)
def approve_release(request, uuid: uuid.UUID):
    user = request.auth
    release = Release.objects.get(uuid=uuid)

    approver = Approver.objects.get(release=release, user=user)
    approver.approved = True
    approver.save()

    return {"ok": True}


@router.post("/revoke", response=AckResponse)
def revoke_approval(request, uuid: uuid.UUID, reason: str):
    user = request.auth
    release = Release.objects.get(uuid=uuid)

    with transaction.atomic():
        RevokeApproval.objects.create(user=user, release=release, reason=reason)

        approver = Approver.objects.get(release=release, user=user)
        approver.approved = False
        approver.save()

    return {"ok": True}
