from rest_framework import generics, status, permissions, filters, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, transaction
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta

from .models import Account, Contact, Lead, Opportunity, Task, Call, Prospect
from .serializers import (
    AccountSerializer, AccountListSerializer,
    ContactSerializer, ContactListSerializer,
    LeadSerializer, LeadListSerializer,
    OpportunitySerializer, OpportunityListSerializer,
    TaskSerializer, TaskListSerializer,
    CallSerializer, CallListSerializer,
    ProspectSerializer, ProspectListSerializer
)
from .filters import (
    AccountFilter, ContactFilter, LeadFilter, 
    OpportunityFilter, TaskFilter, CallFilter
)
from .services.lead_generation_service import lead_generation_service
from .services.maps_service import maps_service
from .services.scraping_service import scraping_service
from .services.czech_business_service import czech_business_service
from .services.ai_analysis_service import ai_analysis_service
from .services.deduplication_service import deduplication_service


# Account Views
class AccountListCreateView(generics.ListCreateAPIView):
    """Account list and create view"""
    queryset = Account.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AccountFilter
    search_fields = ['name', 'website', 'email_address', 'phone_number']
    ordering_fields = ['name', 'type', 'industry', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AccountListSerializer
        return AccountSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class AccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Account detail view"""
    queryset = Account.objects.filter(deleted=False)
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        account = self.get_object()
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def account_enrich_from_ico(request, pk):
    """Enrich account data using Czech business registry (ARES)"""
    try:
        account = Account.objects.get(pk=pk, deleted=False)
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not account.ico:
        return Response(
            {'error': 'No ICO provided for enrichment'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = account.enrich_from_ico()
        if success:
            return Response({
                'message': 'Account successfully enriched from Czech business registry',
                'ico': account.ico,
                'enriched_fields': {
                    'name': account.name,
                    'industry': account.industry,
                    'legal_form': account.legal_form,
                    'billing_address_city': account.billing_address_city,
                    'billing_address_street': account.billing_address_street,
                    'billing_address_postal_code': account.billing_address_postal_code,
                    'business_activities': account.business_activities,
                }
            })
        else:
            return Response(
                {'error': 'Failed to enrich account from ICO. Company may not be found in registry.'},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        return Response(
            {'error': f'Enrichment failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lead_enrich_from_ico(request, pk):
    """Enrich lead data using Czech business registry (ARES)"""
    try:
        lead = Lead.objects.get(pk=pk, deleted=False)
    except Lead.DoesNotExist:
        return Response(
            {'error': 'Lead not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not lead.ico:
        return Response(
            {'error': 'No ICO provided for enrichment'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = lead.enrich_from_ico()
        if success:
            return Response({
                'message': 'Lead successfully enriched from Czech business registry',
                'ico': lead.ico,
                'enriched_fields': {
                    'account_name': lead.account_name,
                    'industry': lead.industry,
                    'legal_form': lead.legal_form,
                    'address_city': lead.address_city,
                    'address_street': lead.address_street,
                    'address_postal_code': lead.address_postal_code,
                    'business_activities': lead.business_activities,
                }
            })
        else:
            return Response(
                {'error': 'Failed to enrich lead from ICO. Company may not be found in registry.'},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        return Response(
            {'error': f'Enrichment failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def opportunity_enrich_from_ico(request, pk):
    """Enrich opportunity's account data using Czech business registry (ARES)"""
    try:
        opportunity = Opportunity.objects.get(pk=pk, deleted=False)
    except Opportunity.DoesNotExist:
        return Response(
            {'error': 'Opportunity not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not opportunity.ico:
        return Response(
            {'error': 'No ICO provided for enrichment'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success = opportunity.enrich_from_ico()
        if success:
            # If we enriched the account, return those fields
            if opportunity.account and opportunity.account.ico == opportunity.ico:
                return Response({
                    'message': 'Opportunity\'s account successfully enriched from Czech business registry',
                    'ico': opportunity.ico,
                    'enriched_fields': {
                        'account_name': opportunity.account.name,
                        'industry': opportunity.account.industry,
                        'legal_form': opportunity.account.legal_form,
                        'address_city': opportunity.account.billing_address_city,
                        'address_street': opportunity.account.billing_address_street,
                        'address_postal_code': opportunity.account.billing_address_postal_code,
                        'business_activities': opportunity.account.business_activities,
                    }
                })
            else:
                return Response({
                    'message': 'Opportunity marked as enriched from Czech business registry',
                    'ico': opportunity.ico,
                    'enriched_fields': {}
                })
        else:
            return Response(
                {'error': 'Failed to enrich opportunity from ICO. Company may not be found in registry.'},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        return Response(
            {'error': f'Enrichment failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Contact Views
class ContactListCreateView(generics.ListCreateAPIView):
    """Contact list and create view"""
    queryset = Contact.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContactFilter
    search_fields = ['first_name', 'last_name', 'email_address', 'phone_number']
    ordering_fields = ['first_name', 'last_name', 'title', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ContactListSerializer
        return ContactSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class ContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Contact detail view"""
    queryset = Contact.objects.filter(deleted=False)
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        contact = self.get_object()
        contact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Lead Views
class LeadListCreateView(generics.ListCreateAPIView):
    """Lead list and create view"""
    queryset = Lead.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LeadFilter
    search_fields = ['first_name', 'last_name', 'account_name', 'email_address', 'phone_number']
    ordering_fields = ['first_name', 'last_name', 'status', 'source', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return LeadListSerializer
        return LeadSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class LeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Lead detail view"""
    queryset = Lead.objects.filter(deleted=False)
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        lead = self.get_object()
        lead.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Opportunity Views
class OpportunityListCreateView(generics.ListCreateAPIView):
    """Opportunity list and create view"""
    queryset = Opportunity.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OpportunityFilter
    search_fields = ['name', 'account__name']
    ordering_fields = ['name', 'stage', 'amount', 'probability', 'close_date', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return OpportunityListSerializer
        return OpportunitySerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class OpportunityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Opportunity detail view"""
    queryset = Opportunity.objects.filter(deleted=False)
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        opportunity = self.get_object()
        opportunity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Task Views
class TaskListCreateView(generics.ListCreateAPIView):
    """Task list and create view"""
    queryset = Task.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'status', 'priority', 'date_start', 'date_due', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TaskListSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Task detail view"""
    queryset = Task.objects.filter(deleted=False)
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        task = self.get_object()
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Call Views
class CallListCreateView(generics.ListCreateAPIView):
    """Call list and create view"""
    queryset = Call.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CallFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'status', 'direction', 'date_start', 'date_end', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CallListSerializer
        return CallSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class CallDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Call detail view"""
    queryset = Call.objects.filter(deleted=False)
    serializer_class = CallSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        call = self.get_object()
        call.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Statistics and Dashboard Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics view"""
    stats = {
        'accounts': {
            'total': Account.objects.filter(deleted=False).count(),
            'recent': Account.objects.filter(deleted=False, created_at__gte=timezone.now() - timezone.timedelta(days=30)).count(),
        },
        'contacts': {
            'total': Contact.objects.filter(deleted=False).count(),
            'recent': Contact.objects.filter(deleted=False, created_at__gte=timezone.now() - timezone.timedelta(days=30)).count(),
        },
        'leads': {
            'total': Lead.objects.filter(deleted=False).count(),
            'new': Lead.objects.filter(deleted=False, status='new').count(),
            'contacted': Lead.objects.filter(deleted=False, status='contacted').count(),
            'in_qualification': Lead.objects.filter(deleted=False, status='in_qualification').count(),
            'converted': Lead.objects.filter(deleted=False, status='converted_to_opportunity').count(),
        },
        'opportunities': {
            'total': Opportunity.objects.filter(deleted=False).count(),
            'open': Opportunity.objects.filter(deleted=False, stage__in=['prospecting', 'qualification', 'proposal', 'negotiation']).count(),
            'won': Opportunity.objects.filter(deleted=False, stage='closed_won').count(),
            'lost': Opportunity.objects.filter(deleted=False, stage='closed_lost').count(),
            'total_amount': Opportunity.objects.filter(deleted=False).aggregate(Sum('amount'))['amount__sum'] or 0,
            'won_amount': Opportunity.objects.filter(deleted=False, stage='closed_won').aggregate(Sum('amount'))['amount__sum'] or 0,
        },
        'tasks': {
            'total': Task.objects.filter(deleted=False).count(),
            'pending': Task.objects.filter(deleted=False, status='not_started').count(),
            'in_progress': Task.objects.filter(deleted=False, status='in_progress').count(),
            'completed': Task.objects.filter(deleted=False, status='completed').count(),
            'overdue': Task.objects.filter(
                deleted=False, 
                status__in=['not_started', 'in_progress'],
                date_end__lt=timezone.now()
            ).count(),
        },
        'calls': {
            'total': Call.objects.filter(deleted=False).count(),
            'planned': Call.objects.filter(deleted=False, status='planned').count(),
            'held': Call.objects.filter(deleted=False, status='held').count(),
            'not_held': Call.objects.filter(deleted=False, status='not_held').count(),
        }
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_activities(request):
    """Recent activities view"""
    limit = int(request.query_params.get('limit', 10))
    
    # Get recent records from all entities
    recent_accounts = Account.objects.filter(deleted=False).order_by('-created_at')[:limit]
    recent_contacts = Contact.objects.filter(deleted=False).order_by('-created_at')[:limit]
    recent_leads = Lead.objects.filter(deleted=False).order_by('-created_at')[:limit]
    recent_opportunities = Opportunity.objects.filter(deleted=False).order_by('-created_at')[:limit]
    recent_tasks = Task.objects.filter(deleted=False).order_by('-created_at')[:limit]
    recent_calls = Call.objects.filter(deleted=False).order_by('-created_at')[:limit]
    
    activities = []
    
    # Add accounts
    for account in recent_accounts:
        activities.append({
            'type': 'Account',
            'id': str(account.id),
            'name': account.name,
            'created_at': account.created_at,
            'created_by': account.created_by.get_full_name() if account.created_by else None,
        })
    
    # Add contacts
    for contact in recent_contacts:
        activities.append({
            'type': 'Contact',
            'id': str(contact.id),
            'name': contact.full_name,
            'created_at': contact.created_at,
            'created_by': contact.created_by.get_full_name() if contact.created_by else None,
        })
    
    # Add leads
    for lead in recent_leads:
        activities.append({
            'type': 'Lead',
            'id': str(lead.id),
            'name': lead.full_name,
            'created_at': lead.created_at,
            'created_by': lead.created_by.get_full_name() if lead.created_by else None,
        })
    
    # Add opportunities
    for opportunity in recent_opportunities:
        activities.append({
            'type': 'Opportunity',
            'id': str(opportunity.id),
            'name': opportunity.name,
            'created_at': opportunity.created_at,
            'created_by': opportunity.created_by.get_full_name() if opportunity.created_by else None,
        })
    
    # Add tasks
    for task in recent_tasks:
        activities.append({
            'type': 'Task',
            'id': str(task.id),
            'name': task.name,
            'created_at': task.created_at,
            'created_by': task.created_by.get_full_name() if task.created_by else None,
        })
    
    # Add calls
    for call in recent_calls:
        activities.append({
            'type': 'Call',
            'id': str(call.id),
            'name': call.name,
            'created_at': call.created_at,
            'created_by': call.created_by.get_full_name() if call.created_by else None,
        })
    
    # Sort by created_at and limit
    activities.sort(key=lambda x: x['created_at'], reverse=True)
    activities = activities[:limit]
    
    return Response(activities)


# Lead ViewSet with conversion functionality
class LeadViewSet(viewsets.ModelViewSet):
    """Lead ViewSet with conversion functionality"""
    queryset = Lead.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LeadFilter
    search_fields = ['first_name', 'last_name', 'email_address', 'account_name']
    ordering_fields = ['first_name', 'last_name', 'status', 'created_at', 'modified_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        return LeadSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Soft delete
        lead = self.get_object()
        lead.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Convert lead to account, contact and opportunity"""
        lead = self.get_object()
        
        # Check if already converted and records still exist
        if lead.converted:
            # Check if any records created from this lead still exist
            from .models import Account, Contact, Opportunity
            
            # Look for existing records that might have been created from this lead
            existing_accounts = Account.objects.filter(
                deleted=False,
                name__icontains=lead.account_name or f"{lead.first_name} {lead.last_name}"
            ).exists() if lead.account_name or (lead.first_name and lead.last_name) else False
            
            existing_contacts = Contact.objects.filter(
                deleted=False,
                first_name=lead.first_name,
                last_name=lead.last_name,
                email_address=lead.email_address
            ).exists() if lead.first_name and lead.last_name else False
            
            # If no related records exist, allow re-conversion
            if not existing_accounts and not existing_contacts:
                # Reset conversion status to allow re-conversion
                lead.converted = False
                lead.converted_at = None
                lead.status = 'new'  # Reset to original status
                lead.save()
            else:
                return Response(
                    {'error': 'Lead has already been converted and records still exist'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            with transaction.atomic():
                # Create Account
                account = Account.objects.create(
                    name=lead.account_name or f"{lead.first_name} {lead.last_name} Company",
                    website=lead.website,
                    industry=lead.industry,
                    phone_number=lead.phone_number,
                    email_address=lead.email_address,
                    billing_address_street=lead.address_street,
                    billing_address_city=lead.address_city,
                    billing_address_state=lead.address_state,
                    billing_address_postal_code=lead.address_postal_code,
                    billing_address_country=lead.address_country,
                    created_by=request.user,
                    modified_by=request.user,
                    assigned_user=lead.assigned_user,
                    assigned_team=lead.assigned_team,
                )
                
                # Create Contact
                contact = Contact.objects.create(
                    salutation_name=lead.salutation_name,
                    first_name=lead.first_name,
                    last_name=lead.last_name,
                    account=account,
                    title=lead.title,
                    email_address=lead.email_address,
                    phone_number=lead.phone_number,
                    description=lead.description,
                    do_not_call=lead.do_not_call,
                    created_by=request.user,
                    modified_by=request.user,
                    assigned_user=lead.assigned_user,
                    assigned_team=lead.assigned_team,
                )
                
                # Create Opportunity if there's an amount
                opportunity = None
                if lead.opportunity_amount and lead.opportunity_amount > 0:
                    opportunity = Opportunity.objects.create(
                        name=f"{lead.account_name or account.name} - Opportunity",
                        account=account,
                        amount=lead.opportunity_amount,
                        stage='prospecting',
                        probability=10,
                        lead_source=lead.source,
                        close_date=timezone.now().date() + timedelta(days=30),  # 30 days from now
                        description=lead.description,
                        created_by=request.user,
                        modified_by=request.user,
                        assigned_user=lead.assigned_user,
                        assigned_team=lead.assigned_team,
                    )
                    # Link contact to opportunity
                    opportunity.contacts.add(contact)
                
                # Mark lead as converted
                lead.converted = True
                lead.converted_at = timezone.now()
                lead.status = 'converted_to_opportunity'
                lead.save()
                
                return Response({
                    'message': 'Lead converted successfully',
                    'organization_id': str(account.id),
                    'contact_id': str(contact.id),
                    'opportunity_id': str(opportunity.id) if opportunity else None,
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to convert lead: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Prospect Views
class ProspectListCreateView(generics.ListCreateAPIView):
    """Prospect list and create view"""
    queryset = Prospect.objects.filter(deleted=False).order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'contact_name', 'email_address', 'phone_number', 'niche', 'location']
    ordering_fields = ['company_name', 'contact_name', 'status', 'created_at', 'modified_at', 'next_followup_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProspectListSerializer
        return ProspectSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)


class ProspectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Prospect detail view"""
    queryset = Prospect.objects.filter(deleted=False)
    serializer_class = ProspectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)


class ProspectViewSet(viewsets.ModelViewSet):
    """Prospect ViewSet with custom actions for email automation"""
    queryset = Prospect.objects.filter(deleted=False)
    serializer_class = ProspectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'contact_name', 'email_address', 'niche', 'location']
    ordering_fields = ['company_name', 'status', 'created_at', 'next_followup_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProspectListSerializer
        return ProspectSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, modified_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def validate_prospect(self, request, pk=None):
        """Validate a prospect manually"""
        prospect = self.get_object()
        prospect.validated = True
        prospect.validation_notes = request.data.get('notes', '')
        prospect.save()
        return Response({'message': 'Prospect validated successfully'})
    
    @action(detail=True, methods=['post'])
    def advance_sequence(self, request, pk=None):
        """Advance prospect to next email sequence step"""
        prospect = self.get_object()
        prospect.advance_sequence()
        return Response({
            'message': 'Sequence advanced successfully',
            'new_position': prospect.sequence_position,
            'status': prospect.status
        })
    
    @action(detail=True, methods=['post'])
    def mark_responded(self, request, pk=None):
        """Mark prospect as responded"""
        prospect = self.get_object()
        prospect.mark_as_responded()
        return Response({'message': 'Prospect marked as responded'})
    
    @action(detail=False, methods=['get'])
    def pending_followups(self, request):
        """Get prospects that need follow-up emails"""
        from django.utils import timezone
        prospects = self.queryset.filter(
            next_followup_date__lte=timezone.now(),
            status__in=['sent', 'follow_up_1', 'follow_up_2'],
            validated=True
        )
        serializer = self.get_serializer(prospects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def enrich_from_ico(self, request, pk=None):
        """Enrich prospect data using Czech business registry (ARES)"""
        prospect = self.get_object()
        
        if not prospect.ico:
            return Response(
                {'error': 'No ICO provided for enrichment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Allow re-enrichment to update data
        # if prospect.ico_enriched:
        #     return Response(
        #         {'message': 'Prospect already enriched from ICO'},
        #         status=status.HTTP_200_OK
        #     )
        
        try:
            success = prospect.enrich_from_ico()
            if success:
                return Response({
                    'message': 'Prospect successfully enriched from Czech business registry',
                    'ico': prospect.ico,
                    'enriched_fields': {
                        'company_name': prospect.company_name,
                        'industry': prospect.industry,
                        'legal_form': prospect.legal_form,
                        'address_city': prospect.address_city,
                        'address_street': prospect.address_street,
                        'address_postal_code': prospect.address_postal_code,
                        'business_activities': prospect.business_activities,
                        'contact_name': prospect.contact_name,
                        'contact_first_name': prospect.contact_first_name,
                        'contact_last_name': prospect.contact_last_name,
                        'contact_title': prospect.contact_title,
                    }
                })
            else:
                return Response(
                    {'error': 'Failed to enrich prospect from ICO. Company may not be found in registry.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': f'Enrichment failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_enrich_ico(self, request):
        """Bulk enrich multiple prospects from ICO"""
        prospect_ids = request.data.get('prospect_ids', [])
        
        if not prospect_ids:
            return Response(
                {'error': 'No prospect IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prospects = self.queryset.filter(
            id__in=prospect_ids,
            ico__isnull=False,
            ico_enriched=False
        ).exclude(ico='')
        
        enriched_count = 0
        failed_count = 0
        results = []
        
        for prospect in prospects:
            try:
                success = prospect.enrich_from_ico()
                if success:
                    enriched_count += 1
                    results.append({
                        'id': str(prospect.id),
                        'company_name': prospect.company_name,
                        'ico': prospect.ico,
                        'status': 'enriched'
                    })
                else:
                    failed_count += 1
                    results.append({
                        'id': str(prospect.id),
                        'company_name': prospect.company_name,
                        'ico': prospect.ico,
                        'status': 'failed'
                    })
            except Exception as e:
                failed_count += 1
                results.append({
                    'id': str(prospect.id),
                    'company_name': prospect.company_name,
                    'ico': prospect.ico,
                    'status': 'error',
                    'error': str(e)
                })
        
        return Response({
            'message': f'Bulk enrichment completed: {enriched_count} enriched, {failed_count} failed',
            'enriched_count': enriched_count,
            'failed_count': failed_count,
            'results': results
        })
    
    @action(detail=True, methods=['post'])
    def convert_to_lead(self, request, pk=None):
        """Convert prospect to lead"""
        prospect = self.get_object()
        
        # Create lead from prospect data
        lead_data = {
            'first_name': prospect.contact_first_name or prospect.contact_name.split()[0] if prospect.contact_name else '',
            'last_name': prospect.contact_last_name or ' '.join(prospect.contact_name.split()[1:]) if prospect.contact_name else '',
            'organization_name': prospect.company_name,
            'email_address': prospect.email_address,
            'phone_number': prospect.phone_number,
            'website': prospect.website,
            'industry': prospect.industry,
            'description': prospect.description,
            'status': 'contacted',
            'source': 'cold_email',
            'assigned_user': prospect.assigned_user,
            'created_by': request.user,
            'modified_by': request.user,
        }
        
        lead = Lead.objects.create(**lead_data)
        
        # Update prospect
        prospect.converted_to_lead = True
        prospect.lead_id = lead.id
        prospect.status = 'converted'
        prospect.save()
        
        return Response({
            'message': 'Prospect converted to lead successfully',
            'lead_id': str(lead.id)
        })


# Lead Generation API Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_prospects_campaign(request):
    """
    Generate prospects campaign using integrated lead generation services
    
    Expected payload:
    {
        "keyword": "restaurace",
        "location": "Praha", 
        "max_results": 20,
        "radius": 5000,
        "enable_ai_analysis": true,
        "enable_website_scraping": true,
        "enable_deduplication": true
    }
    """
    try:
        # Validate campaign configuration
        validation_result = lead_generation_service.validate_campaign_config(request.data)
        if not validation_result['is_valid']:
            return Response(
                {'errors': validation_result['errors']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate prospects
        campaign_results = lead_generation_service.generate_prospects_campaign(request.data)
        
        if not campaign_results.get('success'):
            return Response(
                {'error': campaign_results.get('error', 'Campaign failed')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(campaign_results, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Campaign generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_businesses_maps(request):
    """
    Search for businesses using Google Maps API
    
    Expected payload:
    {
        "keyword": "autoservisy",
        "location": "Brno",
        "radius": 5000,
        "max_results": 20
    }
    """
    try:
        keyword = request.data.get('keyword')
        location = request.data.get('location')
        
        if not keyword or not location:
            return Response(
                {'error': 'Keyword and location are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        businesses = maps_service.search_businesses(
            keyword=keyword,
            location=location,
            radius=request.data.get('radius', 5000),
            max_results=request.data.get('max_results', 20)
        )
        
        return Response({
            'businesses': businesses,
            'count': len(businesses)
        })
        
    except Exception as e:
        return Response(
            {'error': f'Business search failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_website(request):
    """
    Analyze website content and extract information
    
    Expected payload:
    {
        "url": "https://example.com"
    }
    """
    try:
        url = request.data.get('url')
        
        if not url:
            return Response(
                {'error': 'URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analysis = scraping_service.analyze_website(url)
        
        return Response(analysis)
        
    except Exception as e:
        return Response(
            {'error': f'Website analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lookup_czech_business(request):
    """
    Lookup Czech business information using ARES
    
    Expected payload:
    {
        "ico": "12345678"
    } or {
        "company_name": "Company Name"
    }
    """
    try:
        ico = request.data.get('ico')
        company_name = request.data.get('company_name')
        
        if not ico and not company_name:
            return Response(
                {'error': 'Either ICO or company name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company_details = czech_business_service.get_company_details(
            ico=ico,
            company_name=company_name
        )
        
        if not company_details:
            return Response(
                {'error': 'Company not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(company_details)
        
    except Exception as e:
        return Response(
            {'error': f'Business lookup failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_prospect_quality(request):
    """
    Analyze prospect quality using AI
    
    Expected payload: prospect data dictionary
    """
    try:
        prospect_data = request.data
        
        if not prospect_data.get('company_name'):
            return Response(
                {'error': 'Company name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analysis = ai_analysis_service.analyze_prospect_quality(prospect_data)
        
        return Response(analysis)
        
    except Exception as e:
        return Response(
            {'error': f'AI analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_prospect_duplicates(request):
    """
    Check for duplicate prospects
    
    Expected payload: prospect data dictionary
    """
    try:
        prospect_data = request.data
        
        dedup_results = deduplication_service.check_for_duplicates(prospect_data, Prospect)
        
        return Response(dedup_results)
        
    except Exception as e:
        return Response(
            {'error': f'Duplicate check failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enrich_prospect(request, pk):
    """
    Enrich existing prospect with additional data from all services
    """
    try:
        prospect = Prospect.objects.get(pk=pk, deleted=False)
        
        # Convert prospect to dictionary
        prospect_data = {
            'company_name': prospect.company_name,
            'website': prospect.website,
            'phone_number': prospect.phone_number,
            'email_address': prospect.email_address,
            'location': prospect.location,
            'ico': prospect.ico,
            'industry': prospect.industry,
            'description': prospect.description,
            'contact_name': prospect.contact_name
        }
        
        # Enrich the prospect
        enriched_data = lead_generation_service.enrich_existing_prospect(prospect_data)
        
        # Update prospect with enriched data
        for field, value in enriched_data.items():
            if hasattr(prospect, field) and value:
                setattr(prospect, field, value)
        
        # Update enrichment status
        prospect.validation_notes = f"Enriched on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        prospect.auto_validation_score = enriched_data.get('quality_score', prospect.auto_validation_score)
        prospect.save()
        
        return Response({
            'message': 'Prospect enriched successfully',
            'enriched_fields': list(enriched_data.keys()),
            'quality_score': enriched_data.get('quality_score', 0)
        })
        
    except Prospect.DoesNotExist:
        return Response(
            {'error': 'Prospect not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Enrichment failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_enrich_prospects(request):
    """
    Bulk enrich multiple prospects
    
    Expected payload:
    {
        "prospect_ids": ["uuid1", "uuid2", ...]
    }
    """
    try:
        prospect_ids = request.data.get('prospect_ids', [])
        
        if not prospect_ids:
            return Response(
                {'error': 'Prospect IDs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prospects = Prospect.objects.filter(
            id__in=prospect_ids,
            deleted=False
        )
        
        if not prospects.exists():
            return Response(
                {'error': 'No valid prospects found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Convert prospects to dictionaries
        prospect_data_list = []
        for prospect in prospects:
            prospect_data_list.append({
                'id': str(prospect.id),
                'company_name': prospect.company_name,
                'website': prospect.website,
                'phone_number': prospect.phone_number,
                'email_address': prospect.email_address,
                'location': prospect.location,
                'ico': prospect.ico,
                'industry': prospect.industry,
                'description': prospect.description,
                'contact_name': prospect.contact_name
            })
        
        # Bulk enrich
        enriched_prospects = lead_generation_service.bulk_enrich_prospects(prospect_data_list)
        
        # Update database records
        enriched_count = 0
        for enriched in enriched_prospects:
            try:
                prospect_id = enriched.get('id')
                if prospect_id:
                    prospect = prospects.get(id=prospect_id)
                    
                    # Update fields
                    for field, value in enriched.items():
                        if hasattr(prospect, field) and value and field != 'id':
                            setattr(prospect, field, value)
                    
                    # Update enrichment status
                    prospect.validation_notes = f"Bulk enriched on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
                    prospect.auto_validation_score = enriched.get('quality_score', prospect.auto_validation_score)
                    prospect.save()
                    
                    enriched_count += 1
                    
            except Exception as e:
                logger.error(f"Error updating prospect {prospect_id}: {str(e)}")
                continue
        
        return Response({
            'message': f'{enriched_count} prospects enriched successfully',
            'total_processed': len(prospect_data_list),
            'enriched_count': enriched_count
        })
        
    except Exception as e:
        return Response(
            {'error': f'Bulk enrichment failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )