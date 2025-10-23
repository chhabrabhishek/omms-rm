"""
URL configuration for app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from accounts.api import router as accounts_router
from app.api import router as general_router
from releases.api import router as releases_router
from chat.api import router as chat_router
from tickets.api import router as tickets_router
from app.exceptions import init_exception_handlers
from releases.views import export_release_csv
from releases.views import export_release_json

api = NinjaAPI()

init_exception_handlers(api)
api.add_router("/accounts/", accounts_router)
api.add_router("/general/", general_router)
api.add_router("/tickets/", tickets_router)
api.add_router("/releases/", releases_router)
api.add_router("/chat/", chat_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path("export/", export_release_csv, name="export_release_csv"),
    path("exportjson/", export_release_json, name="export_release_json"),
]
