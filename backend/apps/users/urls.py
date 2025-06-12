from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    
    # User profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # User management endpoints
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/stats/', views.user_stats_view, name='user_stats'),
    
    # Team management endpoints
    path('teams/', views.TeamListCreateView.as_view(), name='team_list'),
    path('teams/<uuid:pk>/', views.TeamDetailView.as_view(), name='team_detail'),
    
    # Role management endpoints
    path('roles/', views.RoleListCreateView.as_view(), name='role_list'),
    path('roles/<uuid:pk>/', views.RoleDetailView.as_view(), name='role_detail'),
]