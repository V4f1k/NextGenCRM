from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('leads', views.LeadViewSet, basename='lead')
router.register('prospects', views.ProspectViewSet, basename='prospect')

app_name = 'crm'

urlpatterns = [
    # Dashboard and statistics
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('dashboard/activities/', views.recent_activities, name='recent_activities'),
    
    # Account endpoints
    path('accounts/', views.AccountListCreateView.as_view(), name='account_list'),
    path('accounts/<uuid:pk>/', views.AccountDetailView.as_view(), name='account_detail'),
    path('accounts/<uuid:pk>/enrich-ico/', views.account_enrich_from_ico, name='account_enrich_ico'),
    
    # Contact endpoints
    path('contacts/', views.ContactListCreateView.as_view(), name='contact_list'),
    path('contacts/<uuid:pk>/', views.ContactDetailView.as_view(), name='contact_detail'),
    
    # Lead ICO enrichment endpoint (ViewSet handles CRUD)
    path('leads/<pk>/enrich-ico/', views.lead_enrich_from_ico, name='lead_enrich_ico'),
    
    # Opportunity endpoints
    path('opportunities/', views.OpportunityListCreateView.as_view(), name='opportunity_list'),
    path('opportunities/<uuid:pk>/', views.OpportunityDetailView.as_view(), name='opportunity_detail'),
    path('opportunities/<uuid:pk>/enrich-ico/', views.opportunity_enrich_from_ico, name='opportunity_enrich_ico'),
    
    # Task endpoints
    path('tasks/', views.TaskListCreateView.as_view(), name='task_list'),
    path('tasks/<uuid:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    
    # Call endpoints
    path('calls/', views.CallListCreateView.as_view(), name='call_list'),
    path('calls/<uuid:pk>/', views.CallDetailView.as_view(), name='call_detail'),
    
    # Prospect endpoints
    path('prospects/', views.ProspectListCreateView.as_view(), name='prospect_list'),
    path('prospects/<uuid:pk>/', views.ProspectDetailView.as_view(), name='prospect_detail'),
    path('prospects/<uuid:pk>/enrich/', views.enrich_prospect, name='prospect_enrich'),
    path('prospects/bulk-enrich/', views.bulk_enrich_prospects, name='prospects_bulk_enrich'),
    
    # Lead Generation API endpoints
    path('lead-generation/campaign/', views.generate_prospects_campaign, name='generate_prospects_campaign'),
    path('lead-generation/search-businesses/', views.search_businesses_maps, name='search_businesses_maps'),
    path('lead-generation/analyze-website/', views.analyze_website, name='analyze_website'),
    path('lead-generation/lookup-business/', views.lookup_czech_business, name='lookup_czech_business'),
    path('lead-generation/analyze-quality/', views.analyze_prospect_quality, name='analyze_prospect_quality'),
    path('lead-generation/check-duplicates/', views.check_prospect_duplicates, name='check_prospect_duplicates'),
    
    # Include router URLs for ViewSets
    path('', include(router.urls)),
]