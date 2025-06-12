from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('leads', views.LeadViewSet, basename='lead')

app_name = 'crm'

urlpatterns = [
    # Dashboard and statistics
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('dashboard/activities/', views.recent_activities, name='recent_activities'),
    
    # Account endpoints
    path('accounts/', views.AccountListCreateView.as_view(), name='account_list'),
    path('accounts/<uuid:pk>/', views.AccountDetailView.as_view(), name='account_detail'),
    
    # Contact endpoints
    path('contacts/', views.ContactListCreateView.as_view(), name='contact_list'),
    path('contacts/<uuid:pk>/', views.ContactDetailView.as_view(), name='contact_detail'),
    
    
    # Opportunity endpoints
    path('opportunities/', views.OpportunityListCreateView.as_view(), name='opportunity_list'),
    path('opportunities/<uuid:pk>/', views.OpportunityDetailView.as_view(), name='opportunity_detail'),
    
    # Task endpoints
    path('tasks/', views.TaskListCreateView.as_view(), name='task_list'),
    path('tasks/<uuid:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    
    # Call endpoints
    path('calls/', views.CallListCreateView.as_view(), name='call_list'),
    path('calls/<uuid:pk>/', views.CallDetailView.as_view(), name='call_detail'),
    
    # Include router URLs for ViewSets
    path('', include(router.urls)),
]