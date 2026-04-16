from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *

class UserSerializer(serializers.ModelSerializer):
    task_stats = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'task_stats']

    def get_task_stats(self, obj):
        return {
            'pending': obj.assigned_tasks.filter(status='pending').count(),
            'in_progress': obj.assigned_tasks.filter(status='in_progress').count(),
            'completed': obj.assigned_tasks.filter(status='completed').count(),
        }

class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=(('admin', 'Admin'), ('user', 'User')), default='user')
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    members = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)
    member_details = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_by', 'members', 'member_details']

    def create(self, validated_data):
        user = self.context['request'].user
        members_data = validated_data.pop('members', [])
        project = Project.objects.create(created_by=user, **validated_data)
        
        ProjectMember.objects.get_or_create(project=project, user=user, defaults={'role': 'admin'})
        
        for member_user in members_data:
            if member_user != user:
                ProjectMember.objects.get_or_create(project=project, user=member_user, defaults={'role': 'user'})
        return project

    def update(self, instance, validated_data):
        members_data = validated_data.pop('members', None)
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if members_data is not None:
            current_members = set(instance.members.all())
            new_members = set(members_data)

            to_remove = current_members - new_members
            for user in to_remove:
                if user != instance.created_by:
                    ProjectMember.objects.filter(project=instance, user=user).delete()

            to_add = new_members - current_members
            for user in to_add:
                ProjectMember.objects.get_or_create(project=instance, user=user, defaults={'role': 'user'})
        
        return instance

class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    class Meta:
        model = TaskHistory
        fields = '__all__'

class TaskFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskFile
        fields = '__all__'
        extra_kwargs = {'uploaded_by': {'read_only': True}}


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'text', 'created_at', 'updated_at', 'user_name']
        extra_kwargs = {'user': {'read_only': True}}

class TaskSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {'created_by': {'read_only': True}}



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['user_id'] = self.user.id
        return data