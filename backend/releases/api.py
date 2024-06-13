import logging
import re
import requests
import urllib.parse
import uuid
from base64 import b64encode
from typing import Optional
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
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
from releases.models import TalendReleaseItem
from releases.models import Target

router = Router(auth=CommonBearerTokenAuth())
logger = logging.getLogger("django.server")

headers = {
    "user-agent": "release-api",
    "Authorization": "Bearer token",
}

JENKINS_URL = "https://jenkins-omms-sgs.optum.com/view/GitHub_Organizations/job/"


class SimpleConstantSchema(ModelSchema):
    class Config:
        model = Constant
        include = ("repo", "service", "name")


@response_schema
class ConstantResponse(Schema):
    constants: list[SimpleConstantSchema]


@router.post("/constant", response=ConstantResponse)
def post_constant(request, service_options: list[str]):
    constants = Constant.objects.filter(service__in=service_options).all()

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


class SimpleReleaseItemModelSchema(ModelSchema):
    repo: str

    class Config:
        model = ReleaseItem
        include = (
            "repo",
            "service",
            "release_branch",
            "feature_number",
            "tag",
            "special_notes",
            "devops_notes",
            "platform",
            "azure_env",
            "azure_tenant",
            "job_status",
            "job_logs",
        )


class SimpleTalendReleaseItemModelSchema(ModelSchema):
    class Config:
        model = TalendReleaseItem
        include = ("job_name", "package_location", "feature_number", "special_notes")


class SimpleAllConstantReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]

    class Config:
        model = Release
        include = (
            "uuid",
            "name",
        )


@response_schema
class ConstantUserResponse(Schema):
    constants: list[SimpleConstantSchema]
    users: list[SimpleUserSchema]
    release_list: list[SimpleAllConstantReleaseModelSchema]


@router.get("/constant", response=ConstantUserResponse)
def get_constant_and_users(request):
    constants = Constant.objects.all()

    users = Account.objects.filter(~Q(first_name=""))
    release_list = Release.objects.all()

    return {
        "ok": True,
        "result": {
            "constants": list(constants),
            "users": list(users),
            "release_list": list(release_list),
        },
    }


class SimpleReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]
    talend_items: list[SimpleTalendReleaseItemModelSchema]

    class Config:
        model = Release
        include = ("name", "start_window", "end_window")


class CreateReleaseRequest(Schema):
    release: SimpleReleaseModelSchema
    approvers: list[int]
    targets: list[str]


# TODO: Add audit fields
@router.post("/create", response=AckResponse)
def create_release(request, form: CreateReleaseRequest):
    user = request.auth
    false_branches = []
    try:
        for role in user.roles.all():
            if role.role == Roles.Role.ReleaseAdmin:
                with transaction.atomic():
                    for item in form.release.items:
                        if not item.release_branch:
                            continue
                        git_response = requests.get(
                            f"https://api.github.com/repos/{item.repo}/branches/{item.release_branch}",
                            headers=headers,
                        )
                        if git_response.status_code == 404:
                            false_branches.append(item.repo)
                    if len(false_branches):
                        return {
                            "ok": False,
                            "error": {
                                "detail": ", ".join(false_branches),
                                "reason": "branch_not_found",
                            },
                        }
                    else:
                        release = Release.objects.create(
                            name=form.release.name,
                            created_by=user,
                            updated_by=user,
                            start_window=form.release.start_window,
                            end_window=form.release.end_window,
                        )
                        for item in form.release.items:
                            ReleaseItem.objects.create(
                                repo=item.repo,
                                service=item.service,
                                release_branch=item.release_branch,
                                feature_number=item.feature_number,
                                tag=item.tag,
                                special_notes=item.special_notes,
                                devops_notes=item.devops_notes,
                                release=release,
                            )
                        for item in form.release.talend_items:
                            TalendReleaseItem.objects.create(
                                job_name=item.job_name,
                                package_location=item.package_location,
                                feature_number=item.feature_number,
                                special_notes=item.special_notes,
                                release=release,
                            )
                        for item in form.approvers:
                            Approver.objects.create(group=item, release=release)
                        Approver.objects.create(group=2, release=release)
                        Approver.objects.create(group=4, release=release)
                        for item in form.targets:
                            Target.objects.create(target=item, release=release)

                        from_email_string = settings.EMAIL_FROM

                        subject = f"{user} created a release, {form.release.name}"

                        context = {"user": user, "release": form.release.name}

                        html_content = render_to_string(
                            "release/release_creation.html", context
                        )

                        text_content = strip_tags(html_content)

                        msg = EmailMultiAlternatives(
                            subject,
                            text_content,
                            from_email_string,
                            (
                                [
                                    "gopal_shakti@optum.com",
                                    "mubaid@optum.com",
                                    "shubham.singh@optum.com",
                                ]
                                if [
                                    x for x in form.targets if x.lower() == "salesforce"
                                ]
                                else [
                                    "OMMSDevOpsTeam_DL@ds.uhc.com",
                                    "OMMSDevLeads_DL@ds.uhc.com",
                                    "OMMS_RM@ds.uhc.com",
                                ]
                            ),
                        )
                        msg.attach_alternative(html_content, "text/html")
                        msg.send()

                return {"ok": True}
    except Exception as e:
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }
    return {
        "ok": False,
        "error": {
            "reason": "user_not_authorized",
        },
    }


class SimpleUpdateReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]
    talend_items: list[SimpleTalendReleaseItemModelSchema]
    deployment_status: int

    class Config:
        model = Release
        include = (
            "name",
            "start_window",
            "end_window",
            "deployment_status",
            "deployment_comment",
        )


class UpdateReleaseRequest(Schema):
    release: SimpleUpdateReleaseModelSchema
    targets: list[str]
    uuid: uuid.UUID


# TODO: Add audit fields
@router.post("/update", response=AckResponse)
def update_release(request, form: UpdateReleaseRequest):
    user = request.auth
    false_branches = []
    release = Release.objects.get(uuid=form.uuid)

    for approver in list(release.approvers.all()):
        if approver.approved and Roles.Role.DevOps not in [
            role.role for role in list(user.roles.all())
        ]:
            continue
        else:
            with transaction.atomic():
                for item in form.release.items:
                    if not item.release_branch:
                        continue
                    git_response = requests.get(
                        f"https://api.github.com/repos/{item.repo}/branches/{item.release_branch}",
                        headers=headers,
                    )
                    if git_response.status_code == 404:
                        false_branches.append(item.repo)
                if len(false_branches):
                    return {
                        "ok": False,
                        "error": {
                            "detail": ", ".join(false_branches),
                            "reason": "branch_not_found",
                        },
                    }
                else:
                    release.updated_by = user
                    release.start_window = form.release.start_window
                    release.end_window = form.release.end_window
                    release.deployment_status = form.release.deployment_status
                    release.deployment_comment = form.release.deployment_comment
                    release.save()
                    for item in form.release.items:
                        release_item = ReleaseItem.objects.get(
                            release=release,
                            repo=item.repo,
                            service=item.service,
                        )
                        release_item.release_branch = item.release_branch
                        release_item.feature_number = item.feature_number
                        release_item.tag = item.tag
                        release_item.special_notes = item.special_notes
                        if Roles.Role.DevOps in [
                            role.role for role in list(user.roles.all())
                        ]:
                            release_item.devops_notes = item.devops_notes
                        release_item.save()
                    talend_release_items = TalendReleaseItem.objects.filter(
                        release=release
                    )
                    talend_release_items.delete()
                    for item in form.release.talend_items:
                        TalendReleaseItem.objects.create(
                            release=release,
                            job_name=item.job_name,
                            package_location=item.package_location,
                            feature_number=item.feature_number,
                            special_notes=item.special_notes,
                        )
                    targets = Target.objects.filter(release=release)
                    targets.delete()
                    for item in form.targets:
                        Target.objects.create(target=item, release=release)

            return {"ok": True}
    return {
        "ok": False,
        "error": {
            "reason": "release_approved",
        },
    }


class DeleteReleaseRequest(Schema):
    uuid: uuid.UUID


@router.post("/delete", response=AckResponse)
def delete_release(request, form: DeleteReleaseRequest):
    release = Release.objects.get(uuid=form.uuid)
    with transaction.atomic():
        Target.objects.filter(release=release).delete()
        TalendReleaseItem.objects.filter(release=release).delete()
        RevokeApproval.objects.filter(release=release).delete()
        ReleaseItem.objects.filter(release=release).delete()
        Approver.objects.filter(release=release).delete()
        release.delete()

    return {"ok": True}


class SimpleApproverModelSchema(ModelSchema):
    group: int
    approved_by: Optional[SimpleUserSchema]

    class Config:
        model = Approver
        include = ("approved", "group", "approved_by", "approved_at")


class SimpleTargetModelSchema(ModelSchema):
    class Config:
        model = Target
        include = ("target",)


class SimpleAllReleaseModelSchema(ModelSchema):
    approvers: list[SimpleApproverModelSchema]
    created_by: SimpleUserSchema
    updated_by: SimpleUserSchema
    deployed_by: Optional[SimpleUserSchema]
    targets: list[SimpleTargetModelSchema]
    deployment_status: int

    class Config:
        model = Release
        include = (
            "uuid",
            "name",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deployed_by",
            "start_window",
            "end_window",
            "deployment_status",
            "deployment_comment",
        )


@response_schema
class AllReleaseResponse(Schema):
    release_list: list[SimpleAllReleaseModelSchema]


@router.get("/all", response=AllReleaseResponse)
def get_all_releases(request):
    try:
        releases_list = Release.objects.order_by("-updated_at").all()

        return {
            "ok": True,
            "result": {"release_list": list(releases_list)},
        }
    except Exception as e:
        print(e)
        return {
            "ok": False,
            "error": {
                "reason": "internal_server_error",
            },
        }


class SimpleGetReleaseModelSchema(ModelSchema):
    items: list[SimpleReleaseItemModelSchema]
    talend_items: list[SimpleTalendReleaseItemModelSchema]
    approvers: list[SimpleApproverModelSchema]
    targets: list[SimpleTargetModelSchema]
    deployment_status: int
    deployed_by: Optional[SimpleUserSchema]

    class Config:
        model = Release
        include = (
            "name",
            "start_window",
            "end_window",
            "deployment_comment",
            "deployed_by",
        )


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

    return {
        "ok": True,
        "result": {
            "release_data": release_data,
            "constants": list(constants),
        },
    }


@response_schema
class ApprovedByResponse(Schema):
    approved_by: list[SimpleApproverModelSchema]


@router.post("/approve", response=ApprovedByResponse)
def approve_release(request, uuid: uuid.UUID):
    user = request.auth
    release = Release.objects.get(uuid=uuid)
    for role in list(user.roles.all()):
        if role.role in [1, 3]:
            continue
        else:
            approver = Approver.objects.filter(release=release, group=role.role).first()
            if approver and not approver.approved:
                approver.approved = True
                approver.approved_by = user
                approver.save()

    return {
        "ok": True,
        "result": {
            "approved_by": list(
                Approver.objects.filter(release=release, approved=True).all()
            )
        },
    }


@router.post("/deleteReleaseItems", response=AckResponse)
def delete_pending_release_items(request, uuid: uuid.UUID):
    release = Release.objects.get(uuid=uuid)
    release_items = ReleaseItem.objects.filter(release=release)
    for item in release_items:
        if not item.release_branch:
            item.delete()

    return {"ok": True}


@router.post("/revoke", response=AckResponse)
def revoke_approval(request, uuid: uuid.UUID, reason: str):
    user = request.auth
    release = Release.objects.get(uuid=uuid)

    with transaction.atomic():
        RevokeApproval.objects.create(user=user, release=release, reason=reason)

        approver = Approver.objects.get(release=release, group=2)
        approver.approved = False
        approver.save()

    return {"ok": True}


class SimpleDeployReleaseItemModelSchema(ModelSchema):
    repo: str

    class Config:
        model = ReleaseItem
        include = (
            "repo",
            "service",
            "release_branch",
            "platform",
            "azure_env",
            "azure_tenant",
        )


class SimpleDeployModelSchema(ModelSchema):
    items: list[SimpleDeployReleaseItemModelSchema]
    uuid: uuid.UUID


@router.post("/deploy", response=AckResponse)
def deploy_release(request, form: SimpleDeployModelSchema):
    user = request.auth
    release = Release.objects.get(uuid=form.uuid)
    jenkins_url = None
    for approver in list(release.approvers.all()):
        if not approver.approved:
            return {
                "ok": False,
                "error": {
                    "reason": "release_not_approved",
                },
            }
    if release.deployed_by:
        return {
            "ok": False,
            "error": {
                "reason": "deployment_already_started",
            },
        }
    if Roles.Role.DevOps in [role.role for role in list(user.roles.all())]:
        with transaction.atomic():
            release.deployed_by = user
            release.deployment_status = 4
            release.save()
            for item in form.items:
                release_item = ReleaseItem.objects.get(
                    release=release, repo=item.repo, service=item.service
                )
                release_item.platform = item.platform
                release_item.azure_env = item.azure_env
                release_item.azure_tenant = item.azure_tenant

                try:

                    def basic_auth():
                        token = b64encode("achhabr9:token".encode("utf-8")).decode(
                            "ascii"
                        )
                        return f"Basic {token}"

                    headers = {"Authorization": basic_auth()}
                    if item.platform == "azure":
                        jenkins_url = f"{JENKINS_URL}PEP-Azure/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/buildWithParameters?azure_env={item.azure_env}&azure_tenant={item.azure_tenant}"
                    elif item.platform == "onprem":
                        jenkins_url = f"{JENKINS_URL}PEP-MT/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/buildWithParameters?releaseenv={item.azure_env}"
                    else:
                        jenkins_url = f"{JENKINS_URL}OIL/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/buildWithParameters?environment={item.azure_env}&tenant={item.azure_tenant}"

                    r = requests.post(
                        jenkins_url,
                        headers=headers,
                        verify=False,
                    )
                    queue_id = re.match(
                        r"http.+(queue.+)\/", r.headers["Location"]
                    ).group(1)
                    release_item.queue_id = str(queue_id).split("/")[-1]
                    release_item.job_status = "Started"
                except Exception as e:
                    print(e)
                release_item.save()
            return {"ok": True}
    return {
        "ok": False,
        "error": {
            "reason": "devops_role_not_found",
        },
    }


@router.get("/jobstatus", response=AckResponse)
def get_deployment_status(request, uuid: uuid.UUID):
    release = Release.objects.get(uuid=uuid)
    jenkins_url = None

    for item in list(release.items.all()):
        if item.platform == "azure":
            jenkins_url = f"{JENKINS_URL}PEP-Azure/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/api/json?tree=builds[number,timestamp,queueId]&depth=2"
        elif item.platform == "onprem":
            jenkins_url = f"{JENKINS_URL}PEP-MT/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/api/json?tree=builds[number,timestamp,queueId]&depth=2"
        else:
            jenkins_url = f"{JENKINS_URL}OIL/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/api/json?tree=builds[number,timestamp,queueId]&depth=2"

        try:
            r = requests.get(
                jenkins_url,
                headers=headers,
                verify=False,
            )
        except Exception as e:
            return {"ok": True}

        if r.status_code == 404:
            return {"ok": True}

        builds_list = list(
            filter(
                lambda build: str(build["queueId"]) == item.queue_id, r.json()["builds"]
            )
        )

        if not builds_list:
            return {"ok": True}

        build_number = builds_list[0]["number"]

        if item.platform == "azure":
            jenkins_url = f"{JENKINS_URL}PEP-Azure/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/{build_number}/wfapi/describe"
        elif item.platform == "onprem":
            jenkins_url = f"{JENKINS_URL}PEP-MT/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/{build_number}/wfapi/describe"
        else:
            jenkins_url = f"{JENKINS_URL}OIL/job/{item.repo.split('/')[1]}/job/{urllib.parse.quote_plus(item.release_branch)}/{build_number}/wfapi/describe"

        try:
            response = requests.get(
                jenkins_url,
                headers=headers,
                verify=False,
            )
        except Exception as e:
            return {"ok": True}

        if response.status_code == 404:
            return {"ok": True}

        item.job_status = response.json()["status"]

        if item.job_status == "FAILED":
            for stage in response.json()["stages"]:
                if stage["status"] == "FAILED":
                    item.job_logs = f"{stage['error']['message']}. Please go to Jenkins for further information. CURRENT_STAGE={stage['name']}"
                    break

        if item.job_status != "FAILED":
            if response.json()["stages"]:
                item.job_logs = f"CURRENT_STAGE={response.json()['stages'][-1]['name']}"
            else:
                item.job_logs = f"CURRENT_STAGE=Jenkins"

        item.save()
    return {"ok": True}


class SimpleGetDeploymentSnapshotSchema(Schema):
    azure_repo: str
    commit_hash: str
    deployed_by: str
    deployment_date: str
    docker_tag: str
    repo_name: str
    target_env: str
    tenant_id: str


@response_schema
class GetDeploymentSnapshotResponse(Schema):
    snapshot_data: list[SimpleGetDeploymentSnapshotSchema]


@router.get("/snapshots", response=GetDeploymentSnapshotResponse)
def deployment_snapshot(request):
    try:
        snapshot_response = requests.get("http://rn000133847:3000/snapshots")
    except Exception as e:
        print(e)

    return {
        "ok": True,
        "result": {"snapshot_data": snapshot_response.json()["data"]},
    }


class DeleteSnapshotRequest(Schema):
    docker_tag: str


@router.post("/delete-snapshot", response=AckResponse)
def delete_snapshot(request, form: DeleteSnapshotRequest):
    try:
        requests.get(f"http://rn000133847:3000/delete?dockerTag={form.docker_tag}")
    except Exception as e:
        print(e)

    return {
        "ok": True,
    }
