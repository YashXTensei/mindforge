from django.urls import path
from .views import GraphNetworkView, TopicClaimsView, GapAnalysisView

urlpatterns = [
    path('network/', GraphNetworkView.as_view(), name='graph-network'),
    path('topics/<int:topic_id>/claims/', TopicClaimsView.as_view(), name='topic-claims'),
    path('analyze-gap/', GapAnalysisView.as_view(), name='gap-analysis'),
]
