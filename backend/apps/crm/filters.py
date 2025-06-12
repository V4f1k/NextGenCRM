import django_filters
from django.db import models
from .models import Account, Contact, Lead, Opportunity, Task, Call


class AccountFilter(django_filters.FilterSet):
    """Filter for Account model"""
    name = django_filters.CharFilter(lookup_expr='icontains')
    type = django_filters.ChoiceFilter(choices=Account.TYPE_CHOICES)
    industry = django_filters.ChoiceFilter(choices=Account.INDUSTRY_CHOICES)
    website = django_filters.CharFilter(lookup_expr='icontains')
    email_address = django_filters.CharFilter(lookup_expr='icontains')
    phone_number = django_filters.CharFilter(lookup_expr='icontains')
    
    # Address filters
    billing_address_city = django_filters.CharFilter(lookup_expr='icontains')
    billing_address_country = django_filters.CharFilter(lookup_expr='icontains')
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Date filters
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    class Meta:
        model = Account
        fields = [
            'name', 'type', 'industry', 'website', 'email_address', 'phone_number',
            'billing_address_city', 'billing_address_country',
            'assigned_user', 'assigned_team', 'created_by',
            'created_at', 'modified_at'
        ]


class ContactFilter(django_filters.FilterSet):
    """Filter for Contact model"""
    first_name = django_filters.CharFilter(lookup_expr='icontains')
    last_name = django_filters.CharFilter(lookup_expr='icontains')
    salutation_name = django_filters.ChoiceFilter(choices=Contact.SALUTATION_CHOICES)
    title = django_filters.CharFilter(lookup_expr='icontains')
    department = django_filters.CharFilter(lookup_expr='icontains')
    
    # Contact info filters
    email_address = django_filters.CharFilter(lookup_expr='icontains')
    phone_number = django_filters.CharFilter(lookup_expr='icontains')
    
    # Account relationship
    account = django_filters.UUIDFilter(field_name='account__id')
    account_name = django_filters.CharFilter(field_name='account__name', lookup_expr='icontains')
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Date filters
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    class Meta:
        model = Contact
        fields = [
            'first_name', 'last_name', 'salutation_name', 'title', 'department',
            'email_address', 'phone_number',
            'account', 'account_name',
            'assigned_user', 'assigned_team', 'created_by',
            'created_at', 'modified_at'
        ]


class LeadFilter(django_filters.FilterSet):
    """Filter for Lead model"""
    first_name = django_filters.CharFilter(lookup_expr='icontains')
    last_name = django_filters.CharFilter(lookup_expr='icontains')
    salutation_name = django_filters.ChoiceFilter(choices=Lead.SALUTATION_CHOICES)
    title = django_filters.CharFilter(lookup_expr='icontains')
    account_name = django_filters.CharFilter(lookup_expr='icontains')
    
    # Lead specific filters
    status = django_filters.ChoiceFilter(choices=Lead.STATUS_CHOICES)
    source = django_filters.ChoiceFilter(choices=Lead.SOURCE_CHOICES)
    industry = django_filters.ChoiceFilter(choices=Lead.INDUSTRY_CHOICES)
    
    # Contact info filters
    email_address = django_filters.CharFilter(lookup_expr='icontains')
    phone_number = django_filters.CharFilter(lookup_expr='icontains')
    website = django_filters.CharFilter(lookup_expr='icontains')
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Date filters
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'salutation_name', 'title', 'account_name',
            'status', 'source', 'industry',
            'email_address', 'phone_number', 'website',
            'assigned_user', 'assigned_team', 'created_by',
            'created_at', 'modified_at'
        ]


class OpportunityFilter(django_filters.FilterSet):
    """Filter for Opportunity model"""
    name = django_filters.CharFilter(lookup_expr='icontains')
    stage = django_filters.ChoiceFilter(choices=Opportunity.STAGE_CHOICES)
    type = django_filters.ChoiceFilter(choices=Opportunity.TYPE_CHOICES)
    lead_source = django_filters.ChoiceFilter(choices=Opportunity.LEAD_SOURCE_CHOICES)
    
    # Account relationship
    account = django_filters.UUIDFilter(field_name='account__id')
    account_name = django_filters.CharFilter(field_name='account__name', lookup_expr='icontains')
    
    # Amount filters
    amount = django_filters.RangeFilter()
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    
    # Probability filters
    probability = django_filters.RangeFilter()
    probability_min = django_filters.NumberFilter(field_name='probability', lookup_expr='gte')
    probability_max = django_filters.NumberFilter(field_name='probability', lookup_expr='lte')
    
    # Date filters
    close_date = django_filters.DateFromToRangeFilter()
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    class Meta:
        model = Opportunity
        fields = [
            'name', 'stage', 'type', 'lead_source',
            'account', 'account_name',
            'amount', 'amount_min', 'amount_max',
            'probability', 'probability_min', 'probability_max',
            'close_date', 'created_at', 'modified_at',
            'assigned_user', 'assigned_team', 'created_by'
        ]


class TaskFilter(django_filters.FilterSet):
    """Filter for Task model"""
    name = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.ChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    
    # Parent object filters
    parent_type = django_filters.CharFilter()
    parent_id = django_filters.UUIDFilter()
    
    # Date filters
    date_start = django_filters.DateFromToRangeFilter()
    date_due = django_filters.DateFromToRangeFilter()
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Special filters
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    my_tasks = django_filters.BooleanFilter(method='filter_my_tasks')
    
    class Meta:
        model = Task
        fields = [
            'name', 'status', 'priority',
            'parent_type', 'parent_id',
            'date_start', 'date_due', 'created_at', 'modified_at',
            'assigned_user', 'assigned_team', 'created_by',
            'overdue', 'my_tasks'
        ]
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue tasks"""
        if value:
            from django.utils import timezone
            return queryset.filter(
                date_due__lt=timezone.now(),
                status__in=['not_started', 'in_progress']
            )
        return queryset
    
    def filter_my_tasks(self, queryset, name, value):
        """Filter tasks assigned to current user"""
        if value and self.request and self.request.user:
            return queryset.filter(assigned_user=self.request.user)
        return queryset


class CallFilter(django_filters.FilterSet):
    """Filter for Call model"""
    name = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.ChoiceFilter(choices=Call.STATUS_CHOICES)
    direction = django_filters.ChoiceFilter(choices=Call.DIRECTION_CHOICES)
    
    # Parent object filters
    parent_type = django_filters.CharFilter()
    parent_id = django_filters.UUIDFilter()
    
    # Date filters
    date_start = django_filters.DateFromToRangeFilter()
    date_end = django_filters.DateFromToRangeFilter()
    created_at = django_filters.DateFromToRangeFilter()
    modified_at = django_filters.DateFromToRangeFilter()
    
    # Assignment filters
    assigned_user = django_filters.UUIDFilter(field_name='assigned_user__id')
    assigned_team = django_filters.UUIDFilter(field_name='assigned_team__id')
    created_by = django_filters.UUIDFilter(field_name='created_by__id')
    
    # Relationship filters
    contacts = django_filters.UUIDFilter(field_name='contacts__id')
    users = django_filters.UUIDFilter(field_name='users__id')
    
    # Special filters
    my_calls = django_filters.BooleanFilter(method='filter_my_calls')
    
    class Meta:
        model = Call
        fields = [
            'name', 'status', 'direction',
            'parent_type', 'parent_id',
            'date_start', 'date_end', 'created_at', 'modified_at',
            'assigned_user', 'assigned_team', 'created_by',
            'contacts', 'users', 'my_calls'
        ]
    
    def filter_my_calls(self, queryset, name, value):
        """Filter calls assigned to current user"""
        if value and self.request and self.request.user:
            return queryset.filter(assigned_user=self.request.user)
        return queryset