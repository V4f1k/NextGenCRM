"""
URL configuration for nextgencrm project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
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
from django.urls import path, include
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def api_root(request):
    """API root endpoint"""
    return Response({
        'message': 'NextGenCRM API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'users': '/api/v1/users/',
            'teams': '/api/v1/teams/',
            'roles': '/api/v1/roles/',
            'crm': '/api/v1/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", api_root, name='api_root'),
    path("api/v1/", include('apps.users.urls')),
    path("api/v1/", include('apps.crm.urls')),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
