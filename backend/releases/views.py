import csv
import json
from django.http import HttpResponse
from accounts.models import Account
from releases.models import Release
from releases.models import ReleaseItem


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
