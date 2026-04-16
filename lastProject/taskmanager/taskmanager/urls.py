"""
URL configuration for taskmanager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.urls import include, path, get_resolver
from django.http import HttpResponse

def diagnostic_view(request):
    try:
        urls = [str(p.pattern) for p in get_resolver().url_patterns]
        return HttpResponse(f"Django backend is active!<br><br>Registered Root Patterns:<br>{urls}")
    except Exception as e:
        return HttpResponse(f"Error: {e}")

urlpatterns = [
    path('diagnostic/', diagnostic_view),
    path('admin/', admin.site.urls),
    path('api/', include('App.urls')),
]


from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)