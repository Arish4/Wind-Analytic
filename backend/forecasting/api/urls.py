from django.urls import path

from . import views

urlpatterns = [
    path("health", views.HealthView.as_view()),
    path("meta", views.MetaView.as_view()),
    path("reports/day-ahead", views.DayAheadReportView.as_view()),
    path("reports/horizon", views.HorizonReportView.as_view()),
]
