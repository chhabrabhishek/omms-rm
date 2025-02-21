import csv
import json
from django.http import HttpResponse
from releases.models import Release
from releases.models import ReleaseItem
from releases.models import TalendReleaseItem


def export_release_csv(request):
    uuid = request.GET.get("uuid")
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="releases.csv"'
    writer = csv.writer(response)
    if uuid is None:
        writer.writerow(
            [
                "UUID",
                "Name",
                "Start Window",
                "End Window",
                "Deployment Status",
                "Deployment Comment",
            ]
        )

        releases = Release.objects.all().values_list(
            "uuid",
            "name",
            "start_window",
            "end_window",
            "deployment_status",
            "deployment_comment",
        )
        for release in releases:
            writer.writerow(release)

        return response
    else:
        response["Content-Disposition"] = f'attachment; filename="release_{uuid}.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "Name",
                "Repo",
                "Service",
                "Release Branch",
                "Feature Number",
                "Tag",
                "Special Notes",
                "Devops Notes",
            ]
        )
        try:
            release = Release.objects.get(uuid=uuid)
            release_items = ReleaseItem.objects.filter(release=release).values_list(
                "release",
                "repo",
                "service",
                "release_branch",
                "feature_number",
                "tag",
                "special_notes",
                "devops_notes",
            )
            for release_item in release_items:
                release_item = list(release_item)
                release_item[0] = release.name
                writer.writerow(release_item)

            return response
        except Exception as e:
            response_data = {}
            response_data["error"] = (
                "Can't find a release with the provided UUID. Please fix the UUID."
            )
            return HttpResponse(
                json.dumps(response_data), content_type="application/json"
            )


def export_release_json(request):
    uuid = request.GET.get("uuid")
    response = HttpResponse(content_type="text/json")
    response["Content-Disposition"] = f'attachment; filename="release_{uuid}.json"'
    try:
        release = Release.objects.get(uuid=uuid)
        release_items = ReleaseItem.objects.filter(release=release).values(
            "repo",
            "service",
            "release_branch",
            "feature_number",
            "tag",
            "special_notes",
            "devops_notes",
        )
        talend_release_items = TalendReleaseItem.objects.filter(release=release).values(
            "job_name",
            "package_location",
            "feature_number",
            "special_notes",
        )
        data = {
            "release_details": {
                "uuid": str(release.uuid),
                "name": release.name,
                "created_by": release.created_by.email,
                "updated_by": release.updated_by.email,
            },
            "release_items": list(release_items),
            "talend_items": list(talend_release_items),
        }

        response.write(json.dumps(data, indent=4))
        return response
    except Exception as e:
        print(e)
        response_data = {}
        response_data["error"] = (
            "Can't find a release with the provided UUID. Please fix the UUID."
        )
        return HttpResponse(json.dumps(response_data), content_type="application/json")
