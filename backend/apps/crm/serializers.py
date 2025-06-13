from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Account, Contact, Lead, Opportunity, Task, Call, Prospect

User = get_user_model()


class AccountSerializer(serializers.ModelSerializer):
    """Account serializer with all fields"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    
    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')


class AccountListSerializer(serializers.ModelSerializer):
    """Simplified Account serializer for list views"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    
    class Meta:
        model = Account
        fields = (
            'id', 'name', 'type', 'industry', 'website', 'phone_number',
            'email_address', 'billing_address_city', 'billing_address_country',
            'created_at', 'assigned_user_name', 'created_by_name'
        )


class ContactSerializer(serializers.ModelSerializer):
    """Contact serializer with all fields"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')


class ContactListSerializer(serializers.ModelSerializer):
    """Simplified Contact serializer for list views"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Contact
        fields = (
            'id', 'salutation_name', 'first_name', 'last_name', 'full_name',
            'account_name', 'title', 'email_address', 'phone_number',
            'created_at', 'assigned_user_name'
        )


class LeadSerializer(serializers.ModelSerializer):
    """Lead serializer with all fields"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')


class LeadListSerializer(serializers.ModelSerializer):
    """Simplified Lead serializer for list views"""
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Lead
        fields = (
            'id', 'salutation_name', 'first_name', 'last_name', 'full_name',
            'account_name', 'title', 'email_address', 'phone_number',
            'status', 'source', 'created_at', 'assigned_user_name'
        )


class OpportunitySerializer(serializers.ModelSerializer):
    """Opportunity serializer with all fields"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    
    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')


class OpportunityListSerializer(serializers.ModelSerializer):
    """Simplified Opportunity serializer for list views"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    primary_contact_name = serializers.SerializerMethodField()
    
    def get_primary_contact_name(self, obj):
        """Get the name of the first contact associated with this opportunity"""
        first_contact = obj.contacts.first()
        if first_contact:
            return f"{first_contact.first_name} {first_contact.last_name}"
        return None
    
    class Meta:
        model = Opportunity
        fields = (
            'id', 'name', 'account_name', 'stage', 'amount', 'probability',
            'close_date', 'created_at', 'assigned_user_name', 'primary_contact_name', 'type'
        )


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer with all fields"""
    parent_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')
    
    def get_parent_name(self, obj):
        """Get the name of the parent object"""
        if obj.parent_type and obj.parent_id:
            try:
                if obj.parent_type == 'Account':
                    return Account.objects.get(id=obj.parent_id).name
                elif obj.parent_type == 'Contact':
                    contact = Contact.objects.get(id=obj.parent_id)
                    return contact.full_name
                elif obj.parent_type == 'Lead':
                    lead = Lead.objects.get(id=obj.parent_id)
                    return lead.full_name
                elif obj.parent_type == 'Opportunity':
                    return Opportunity.objects.get(id=obj.parent_id).name
            except:
                pass
        return None


class TaskListSerializer(serializers.ModelSerializer):
    """Simplified Task serializer for list views"""
    parent_name = serializers.SerializerMethodField()
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    
    class Meta:
        model = Task
        fields = (
            'id', 'name', 'status', 'priority', 'date_start', 'date_end',
            'parent_type', 'parent_name', 'assigned_user_name', 'created_at'
        )
    
    def get_parent_name(self, obj):
        """Get the name of the parent object"""
        if obj.parent_type and obj.parent_id:
            try:
                if obj.parent_type == 'Account':
                    return Account.objects.get(id=obj.parent_id).name
                elif obj.parent_type == 'Contact':
                    contact = Contact.objects.get(id=obj.parent_id)
                    return contact.full_name
                elif obj.parent_type == 'Lead':
                    lead = Lead.objects.get(id=obj.parent_id)
                    return lead.full_name
                elif obj.parent_type == 'Opportunity':
                    return Opportunity.objects.get(id=obj.parent_id).name
            except:
                pass
        return None


class CallSerializer(serializers.ModelSerializer):
    """Call serializer with all fields"""
    parent_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    contacts_names = serializers.SerializerMethodField()
    users_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Call
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')
    
    def get_parent_name(self, obj):
        """Get the name of the parent object"""
        if obj.parent_type and obj.parent_id:
            try:
                if obj.parent_type == 'Account':
                    return Account.objects.get(id=obj.parent_id).name
                elif obj.parent_type == 'Contact':
                    contact = Contact.objects.get(id=obj.parent_id)
                    return contact.full_name
                elif obj.parent_type == 'Lead':
                    lead = Lead.objects.get(id=obj.parent_id)
                    return lead.full_name
                elif obj.parent_type == 'Opportunity':
                    return Opportunity.objects.get(id=obj.parent_id).name
            except:
                pass
        return None
    
    def get_contacts_names(self, obj):
        """Get names of associated contacts"""
        return [contact.full_name for contact in obj.contacts.all()]
    
    def get_users_names(self, obj):
        """Get names of associated users"""
        return [user.get_full_name() for user in obj.users.all()]


class CallListSerializer(serializers.ModelSerializer):
    """Simplified Call serializer for list views"""
    parent_name = serializers.SerializerMethodField()
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    
    class Meta:
        model = Call
        fields = (
            'id', 'name', 'status', 'direction', 'date_start', 'date_end',
            'parent_type', 'parent_name', 'assigned_user_name', 'created_at'
        )
    
    def get_parent_name(self, obj):
        """Get the name of the parent object"""
        if obj.parent_type and obj.parent_id:
            try:
                if obj.parent_type == 'Account':
                    return Account.objects.get(id=obj.parent_id).name
                elif obj.parent_type == 'Contact':
                    contact = Contact.objects.get(id=obj.parent_id)
                    return contact.full_name
                elif obj.parent_type == 'Lead':
                    lead = Lead.objects.get(id=obj.parent_id)
                    return lead.full_name
                elif obj.parent_type == 'Opportunity':
                    return Opportunity.objects.get(id=obj.parent_id).name
            except:
                pass
        return None

class ProspectSerializer(serializers.ModelSerializer):
    """Prospect serializer with all fields"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    assigned_team_name = serializers.CharField(source='assigned_team.name', read_only=True)
    full_contact_name = serializers.CharField(read_only=True)
    should_send_followup = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Prospect
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'modified_at', 'created_by', 'modified_by')


class ProspectListSerializer(serializers.ModelSerializer):
    """Simplified Prospect serializer for list views"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_user.get_full_name', read_only=True)
    full_contact_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Prospect
        fields = (
            'id', 'company_name', 'contact_name', 'full_contact_name', 'email_address',
            'phone_number', 'status', 'sequence_position', 'niche', 'location',
            'validated', 'auto_validation_score', 'next_followup_date',
            'created_at', 'assigned_user_name', 'created_by_name'
        )