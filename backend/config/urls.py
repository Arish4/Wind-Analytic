from django.urls import include, path

urlpatterns = [
    path("api/", include("forecasting.api.urls")),
]
