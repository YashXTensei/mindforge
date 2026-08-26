from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TopicViewSet, DailyReviewView, SubmitAnswerView

router = DefaultRouter()
router.register(r'topics', TopicViewSet, basename='topic')

urlpatterns = [
    path('', include(router.urls)),
    path('daily-review/', DailyReviewView.as_view(), name='daily-review'),
    path('daily-review/items/<int:item_id>/submit/', SubmitAnswerView.as_view(), name='submit-answer'),
]
