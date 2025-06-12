from rest_framework import generics, status, permissions, filters, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, transaction
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta

from .models import Account, Contact, Lead, Opportunity, Task, Call
from .serializers import (
    AccountSerializer, AccountListSerializer,
    ContactSerializer, ContactListSerializer,
    LeadSerializer, LeadListSerializer,
    OpportunitySerializer, OpportunityListSerializer,
    TaskSerializer, TaskListSerializer,
    CallSerializer, CallListSerializer
)
from .filters import (
    AccountFilter, ContactFilter, LeadFilter, 
    OpportunityFilter, TaskFilter, CallFilter
)


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
            'qualified': Lead.objects.filter(deleted=False, status='qualified').count(),
            'converted': Lead.objects.filter(deleted=False, status='converted').count(),
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
        
        # Check if already converted
        if lead.converted:
            return Response(
                {'error': 'Lead has already been converted'},
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
                lead.save()
                
                return Response({
                    'message': 'Lead converted successfully',
                    'account_id': str(account.id),
                    'contact_id': str(contact.id),
                    'opportunity_id': str(opportunity.id) if opportunity else None,
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to convert lead: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
