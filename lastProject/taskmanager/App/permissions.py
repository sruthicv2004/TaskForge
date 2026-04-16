from rest_framework import permissions
from .models import ProjectMember, Project, Task

class IsJiraAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsProjectMember(permissions.BasePermission):
    """
    Admins see everything. Users must be project members.
    Used for Projects, Tasks, Comments, and TaskFiles.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated and request.user.role == 'admin':
            return True
            
        project = obj if isinstance(obj, Project) else getattr(obj, 'project', None)
        
        if not project and hasattr(obj, 'task'):
            project = obj.task.project
            
        if not project:
            return False
            
        return project.members.filter(id=request.user.id).exists()

class IsTaskAssignee(permissions.BasePermission):
    """
    Strictly for the person assigned to the task, or global Admins.
    Used for status updates, file uploads, and reassignment.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated and request.user.role == 'admin':
            return True
            
        task = obj if isinstance(obj, Task) else getattr(obj, 'task', None)
        if not task:
            return False
        return task.assigned_to == request.user

class IsCommentAuthorOrAdmin(permissions.BasePermission):
    """
    Allow editing/deletion only if the user is the author or an Admin.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.user == request.user