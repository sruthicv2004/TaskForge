from rest_framework import viewsets, generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count
from .models import *
from .serializers import *
from .permissions import IsJiraAdmin, IsProjectMember, IsTaskAssignee, IsCommentAuthorOrAdmin

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['created_by']

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Project.objects.all()
        return Project.objects.filter(members=self.request.user).distinct()



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsJiraAdmin()]
        return [IsAuthenticated()]

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'assigned_to', 'priority', 'project']
    search_fields = ['title', 'description']

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsTaskAssignee()]
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Task.objects.all()
        return Task.objects.filter(project__members=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        task = self.get_object()
        old_status = task.status
        updated_task = serializer.save()

        if old_status != updated_task.status:
            TaskHistory.objects.create(
                task=updated_task, changed_by=self.request.user,
                field="status", old_value=old_status, new_value=updated_task.status
            )

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsCommentAuthorOrAdmin()]
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Comment.objects.all()
        return Comment.objects.filter(task__project__members=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskFileViewSet(viewsets.ModelViewSet):
    queryset = TaskFile.objects.all()
    serializer_class = TaskFileSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsTaskAssignee()]
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return TaskFile.objects.all()
        return TaskFile.objects.filter(task__project__members=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

from rest_framework.views import APIView

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_projects = Project.objects.filter(members=request.user).distinct().count() if request.user.role != 'admin' else Project.objects.count()
        
        task_query = Task.objects.filter(project__members=request.user).distinct() if request.user.role != 'admin' else Task.objects.all()
        
        status_counts = task_query.values('status').annotate(count=Count('id'))
        priority_counts = task_query.values('priority').annotate(count=Count('id'))
        
        analytics_data = {
            'total_projects': total_projects,
            'total_tasks': task_query.count(),
            'tasks_by_status': {item['status']: item['count'] for item in status_counts},
            'tasks_by_priority': {item['priority']: item['count'] for item in priority_counts},
        }
        return Response(analytics_data)