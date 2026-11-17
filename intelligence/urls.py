from django.urls import path
from .views import ContradictionListView, ContradictionResolveView, ContradictionStatsView

urlpatterns = [
    path('contradictions/', ContradictionListView.as_view(), name='contradiction-list'),
    path('contradictions/<int:pk>/resolve/', ContradictionResolveView.as_view(), name='contradiction-resolve'),
    path('stats/', ContradictionStatsView.as_view(), name='intelligence-stats'),
]
