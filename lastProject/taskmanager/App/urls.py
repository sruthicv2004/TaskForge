
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='projects')
router.register('tasks', TaskViewSet, basename='tasks')
router.register('comments', CommentViewSet)
router.register('files', TaskFileViewSet)
router.register('users', UserViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('', include(router.urls)),
]