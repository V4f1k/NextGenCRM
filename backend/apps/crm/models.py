from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from apps.core.models import (
    BaseModel, AddressModel, BillingAddressModel, ShippingAddressModel,
    ContactInfoModel, AssignmentModel, TaggableModel
)


class Account(BaseModel, BillingAddressModel, ShippingAddressModel, ContactInfoModel, AssignmentModel, TaggableModel):
    """
    Account model similar to EspoCRM's Account entity.
    Represents companies, organizations, or business entities.
    """
    
    TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('partner', 'Partner'),
        ('reseller', 'Reseller'),
        ('competitor', 'Competitor'),
        ('supplier', 'Supplier'),
        ('investor', 'Investor'),
    ]
    
    INDUSTRY_CHOICES = [
        ('agriculture', 'Agriculture'),
        ('automotive', 'Automotive'),
        ('banking', 'Banking'),
        ('construction', 'Construction'),
        ('consulting', 'Consulting'),
        ('education', 'Education'),
        ('electronics', 'Electronics'),
        ('energy', 'Energy'),
        ('finance', 'Finance'),
        ('healthcare', 'Healthcare'),
        ('hospitality', 'Hospitality'),
        ('insurance', 'Insurance'),
        ('manufacturing', 'Manufacturing'),
        ('media', 'Media'),
        ('nonprofit', 'Non-profit'),
        ('real_estate', 'Real Estate'),
        ('retail', 'Retail'),
        ('technology', 'Technology'),
        ('telecommunications', 'Telecommunications'),
        ('transportation', 'Transportation'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    
    # Business info
    type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default='customer'
    )
    industry = models.CharField(max_length=100, choices=INDUSTRY_CHOICES, blank=True)
    sic_code = models.CharField(max_length=20, blank=True)
    
    # Financial
    annual_revenue = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    employees = models.IntegerField(null=True, blank=True)
    
    # Tax info
    vat_id = models.CharField(max_length=50, blank=True)
    vat_id_is_valid = models.BooleanField(default=False)
    
    # Czech Business Registry (ICO/ARES)
    ico = models.CharField(max_length=20, blank=True, help_text="Czech business ID")
    ico_enriched = models.BooleanField(default=False, help_text="Data enriched from Czech ARES registry")
    ico_enriched_at = models.DateTimeField(null=True, blank=True)
    legal_form = models.CharField(max_length=100, blank=True, help_text="Legal form from ARES")
    legal_form_code = models.CharField(max_length=10, blank=True)
    registration_date = models.DateField(null=True, blank=True, help_text="Company registration date")
    business_activities = models.JSONField(default=list, blank=True, help_text="NACE codes and descriptions")
    
    # Additional info
    description = models.TextField(blank=True)
    
    # Relationships
    parent_account = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='child_accounts'
    )
    
    class Meta:
        db_table = 'accounts'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['ico']),
            models.Index(fields=['ico_enriched']),
        ]
    
    def __str__(self):
        return self.name
    
    def enrich_from_ico(self):
        """Enrich account data using Czech business registry (ARES)."""
        if not self.ico:
            return False
        # Allow re-enrichment to update data
        
        from .services.czech_registry import czech_registry_service
        from django.utils import timezone
        
        # Convert model instance to dict for enrichment
        account_data = {
            'ico': self.ico,
            'company_name': self.name,
            'industry': self.industry,
            'address_street': self.billing_address_street,
            'address_city': self.billing_address_city,
            'address_state': self.billing_address_state,
            'address_postal_code': self.billing_address_postal_code,
            'address_country': self.billing_address_country,
        }
        
        # Perform enrichment
        enriched_data = czech_registry_service.enrich_prospect_data(account_data)
        
        # Check if data was enriched
        if not enriched_data.get('ico_enriched'):
            return False
        
        # Update model fields - always overwrite company name and address
        if enriched_data.get('company_name'):
            self.name = enriched_data.get('company_name')
        if enriched_data.get('industry'):
            # Map industry from NACE to our choices
            self.industry = self._map_industry(enriched_data.get('industry'))
        if enriched_data.get('address_street'):
            self.billing_address_street = enriched_data.get('address_street')
        if enriched_data.get('address_city'):
            self.billing_address_city = enriched_data.get('address_city')
        if enriched_data.get('address_state'):
            self.billing_address_state = enriched_data.get('address_state')
        if enriched_data.get('address_postal_code'):
            self.billing_address_postal_code = enriched_data.get('address_postal_code')
        if enriched_data.get('address_country'):
            self.billing_address_country = enriched_data.get('address_country')
        
        # Update enrichment fields
        self.legal_form = enriched_data.get('legal_form', '')
        self.legal_form_code = enriched_data.get('legal_form_code', '')
        self.business_activities = enriched_data.get('business_activities', [])
        
        # Handle registration date
        if enriched_data.get('registration_date'):
            try:
                from datetime import datetime
                if isinstance(enriched_data['registration_date'], str):
                    self.registration_date = datetime.fromisoformat(
                        enriched_data['registration_date']
                    ).date()
                else:
                    self.registration_date = enriched_data['registration_date']
            except (ValueError, TypeError):
                pass
        
        # Mark as enriched
        self.ico_enriched = True
        self.ico_enriched_at = timezone.now()
        
        # Save changes
        self.save()
        return True
    
    def _map_industry(self, nace_industry):
        """Map NACE industry description to our industry choices"""
        industry_mapping = {
            'výroba motorových vozidel': 'automotive',
            'stavební': 'construction',
            'malířské': 'construction',
            'účetní': 'finance',
            'poštovní': 'telecommunications',
            'technolog': 'technology',
            'zdravot': 'healthcare',
            'vzdělá': 'education',
            'hotel': 'hospitality',
            'restaura': 'hospitality',
            'pojišť': 'insurance',
            'banka': 'banking',
            'tisk': 'media',
        }
        
        if not nace_industry:
            return ''
            
        nace_lower = nace_industry.lower()
        for keyword, industry in industry_mapping.items():
            if keyword in nace_lower:
                return industry
        
        return 'other'


class Contact(BaseModel, AddressModel, ContactInfoModel, AssignmentModel, TaggableModel):
    """
    Contact model similar to EspoCRM's Contact entity.
    Represents individual people associated with accounts.
    """
    
    SALUTATION_CHOICES = [
        ('mr', 'Mr.'),
        ('mrs', 'Mrs.'),
        ('ms', 'Ms.'),
        ('dr', 'Dr.'),
        ('prof', 'Prof.'),
    ]
    
    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    salutation_name = models.CharField(
        max_length=20,
        choices=SALUTATION_CHOICES,
        blank=True
    )
    
    # Professional info
    title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    
    # Contact preferences
    do_not_call = models.BooleanField(default=False)
    
    # Social media
    twitter = models.CharField(max_length=100, blank=True)
    linkedin = models.CharField(max_length=100, blank=True)
    
    # Relationships
    account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='contacts'
    )
    reports_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='direct_reports'
    )
    
    # Portal access
    portal_user = models.OneToOneField(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='contact_profile'
    )
    
    # Additional info
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'contacts'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def full_name(self):
        """Return the full name of the contact."""
        return f"{self.first_name} {self.last_name}".strip()


class Lead(BaseModel, AddressModel, ContactInfoModel, AssignmentModel, TaggableModel):
    """
    Lead model similar to EspoCRM's Lead entity.
    Represents potential customers or prospects.
    """
    
    SALUTATION_CHOICES = [
        ('mr', 'Mr.'),
        ('mrs', 'Mrs.'),
        ('ms', 'Ms.'),
        ('dr', 'Dr.'),
        ('prof', 'Prof.'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('in_qualification', 'In Qualification'),
        ('disqualified', 'Disqualified'),
        ('converted_to_opportunity', 'Converted to Opportunity'),
    ]
    
    SOURCE_CHOICES = [
        ('call', 'Call'),
        ('email', 'Email'),
        ('existing_customer', 'Existing Customer'),
        ('partner', 'Partner'),
        ('public_relations', 'Public Relations'),
        ('web_site', 'Web Site'),
        ('campaign', 'Campaign'),
        ('other', 'Other'),
    ]
    
    INDUSTRY_CHOICES = [
        ('agriculture', 'Agriculture'),
        ('automotive', 'Automotive'),
        ('banking', 'Banking'),
        ('construction', 'Construction'),
        ('consulting', 'Consulting'),
        ('education', 'Education'),
        ('electronics', 'Electronics'),
        ('energy', 'Energy'),
        ('finance', 'Finance'),
        ('healthcare', 'Healthcare'),
        ('hospitality', 'Hospitality'),
        ('insurance', 'Insurance'),
        ('manufacturing', 'Manufacturing'),
        ('media', 'Media'),
        ('nonprofit', 'Non-profit'),
        ('real_estate', 'Real Estate'),
        ('retail', 'Retail'),
        ('technology', 'Technology'),
        ('telecommunications', 'Telecommunications'),
        ('transportation', 'Transportation'),
        ('other', 'Other'),
    ]
    
    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    salutation_name = models.CharField(
        max_length=20,
        choices=SALUTATION_CHOICES,
        blank=True
    )
    
    # Business info
    title = models.CharField(max_length=100, blank=True)
    account_name = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, choices=INDUSTRY_CHOICES, blank=True)
    
    # Lead qualification
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='new'
    )
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        blank=True
    )
    
    # Opportunity info
    opportunity_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    opportunity_amount_currency = models.CharField(max_length=3, default='USD')
    
    # Contact preferences
    do_not_call = models.BooleanField(default=False)
    
    # Czech Business Registry (ICO/ARES) - for business leads
    ico = models.CharField(max_length=20, blank=True, help_text="Czech business ID")
    ico_enriched = models.BooleanField(default=False, help_text="Data enriched from Czech ARES registry")
    ico_enriched_at = models.DateTimeField(null=True, blank=True)
    legal_form = models.CharField(max_length=100, blank=True, help_text="Legal form from ARES")
    legal_form_code = models.CharField(max_length=10, blank=True)
    registration_date = models.DateField(null=True, blank=True, help_text="Company registration date")
    business_activities = models.JSONField(default=list, blank=True, help_text="NACE codes and descriptions")
    
    # Conversion tracking
    converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)
    created_account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_from_leads'
    )
    created_contact = models.ForeignKey(
        Contact, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_from_leads'
    )
    created_opportunity = models.ForeignKey(
        'Opportunity', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_from_leads'
    )
    
    # Additional info
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'leads'
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['ico']),
            models.Index(fields=['ico_enriched']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def full_name(self):
        """Return the full name of the lead."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def enrich_from_ico(self):
        """Enrich lead data using Czech business registry (ARES)."""
        if not self.ico:
            return False
        # Allow re-enrichment to update data
        
        from .services.czech_registry import czech_registry_service
        from django.utils import timezone
        
        # Convert model instance to dict for enrichment
        lead_data = {
            'ico': self.ico,
            'company_name': self.account_name,
            'industry': self.industry,
            'address_street': self.address_street,
            'address_city': self.address_city,
            'address_state': self.address_state,
            'address_postal_code': self.address_postal_code,
            'address_country': self.address_country,
        }
        
        # Perform enrichment
        enriched_data = czech_registry_service.enrich_prospect_data(lead_data)
        
        # Check if data was enriched
        if not enriched_data.get('ico_enriched'):
            return False
        
        # Update model fields - always overwrite company name and address
        if enriched_data.get('company_name'):
            self.account_name = enriched_data.get('company_name')
        if enriched_data.get('industry'):
            self.industry = enriched_data.get('industry')
        if enriched_data.get('address_street'):
            self.address_street = enriched_data.get('address_street')
        if enriched_data.get('address_city'):
            self.address_city = enriched_data.get('address_city')
        if enriched_data.get('address_state'):
            self.address_state = enriched_data.get('address_state')
        if enriched_data.get('address_postal_code'):
            self.address_postal_code = enriched_data.get('address_postal_code')
        if enriched_data.get('address_country'):
            self.address_country = enriched_data.get('address_country')
        
        # Update enrichment fields
        self.legal_form = enriched_data.get('legal_form', '')
        self.legal_form_code = enriched_data.get('legal_form_code', '')
        self.business_activities = enriched_data.get('business_activities', [])
        
        # Handle registration date
        if enriched_data.get('registration_date'):
            try:
                from datetime import datetime
                if isinstance(enriched_data['registration_date'], str):
                    self.registration_date = datetime.fromisoformat(
                        enriched_data['registration_date']
                    ).date()
                else:
                    self.registration_date = enriched_data['registration_date']
            except (ValueError, TypeError):
                pass
        
        # Mark as enriched
        self.ico_enriched = True
        self.ico_enriched_at = timezone.now()
        
        # Save changes
        self.save()
        return True


class Opportunity(BaseModel, AssignmentModel, TaggableModel):
    """
    Opportunity model similar to EspoCRM's Opportunity entity.
    Represents potential sales deals.
    """
    
    STAGE_CHOICES = [
        ('prospecting', 'Prospecting'),
        ('qualification', 'Qualification'),
        ('proposal', 'Proposal'),
        ('negotiation', 'Negotiation'),
        ('closed_won', 'Closed - Won'),
        ('closed_lost', 'Closed - Lost'),
    ]
    
    TYPE_CHOICES = [
        ('existing_business', 'Existing Business'),
        ('new_business', 'New Business'),
    ]
    
    LEAD_SOURCE_CHOICES = [
        ('call', 'Call'),
        ('email', 'Email'),
        ('existing_customer', 'Existing Customer'),
        ('partner', 'Partner'),
        ('public_relations', 'Public Relations'),
        ('web_site', 'Web Site'),
        ('campaign', 'Campaign'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    
    # Opportunity type
    type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        blank=True
    )
    
    # Financial info
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    amount_currency = models.CharField(max_length=3, default='USD')
    
    # Sales process
    stage = models.CharField(
        max_length=50,
        choices=STAGE_CHOICES,
        default='prospecting'
    )
    probability = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Timeline
    close_date = models.DateField()
    last_stage = models.CharField(max_length=50, blank=True)
    
    # Source
    lead_source = models.CharField(
        max_length=50,
        choices=LEAD_SOURCE_CHOICES,
        blank=True
    )
    
    # Relationships
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE,
        related_name='opportunities'
    )
    contacts = models.ManyToManyField(
        Contact, through='OpportunityContact',
        related_name='opportunities'
    )
    
    # Campaign tracking (will be added after creating emails app)
    # campaign = models.ForeignKey(
    #     'emails.Campaign', on_delete=models.SET_NULL, null=True, blank=True,
    #     related_name='opportunities'
    # )
    
    # Czech Business Registry (ICO/ARES) - additional company reference
    ico = models.CharField(max_length=20, blank=True, help_text="Czech business ID (if different from account)")
    ico_enriched = models.BooleanField(default=False, help_text="Data enriched from Czech ARES registry")
    ico_enriched_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    description = models.TextField(blank=True)
    next_step = models.TextField(blank=True)
    
    class Meta:
        db_table = 'opportunities'
        verbose_name = 'Opportunity'
        verbose_name_plural = 'Opportunities'
        ordering = ['-close_date']
        indexes = [
            models.Index(fields=['stage']),
            models.Index(fields=['close_date']),
            models.Index(fields=['ico']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def weighted_amount(self):
        """Calculate weighted amount based on probability."""
        if self.amount and self.probability:
            return self.amount * (Decimal(self.probability) / 100)
        return Decimal('0.00')
    
    def enrich_from_ico(self):
        """Enrich opportunity's account data using Czech business registry (ARES)."""
        if not self.ico:
            return False
        
        # If we have an associated account, enrich it instead
        if self.account and not self.account.ico:
            self.account.ico = self.ico
            return self.account.enrich_from_ico()
        elif self.account and self.account.ico == self.ico:
            return self.account.enrich_from_ico()
        
        # Mark this opportunity as enriched
        from django.utils import timezone
        self.ico_enriched = True
        self.ico_enriched_at = timezone.now()
        self.save()
        return True


class OpportunityContact(BaseModel):
    """
    Many-to-many relationship between Opportunities and Contacts.
    Tracks contact roles in opportunities.
    """
    
    ROLE_CHOICES = [
        ('decision_maker', 'Decision Maker'),
        ('evaluator', 'Evaluator'),
        ('influencer', 'Influencer'),
        ('other', 'Other'),
    ]
    
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default='other'
    )
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'opportunity_contacts'
        unique_together = ('opportunity', 'contact')
        verbose_name = 'Opportunity Contact'
        verbose_name_plural = 'Opportunity Contacts'
    
    def __str__(self):
        return f"{self.opportunity.name} - {self.contact.full_name}"


class Task(BaseModel, AssignmentModel, TaggableModel):
    """
    Task model similar to EspoCRM's Task entity.
    Represents action items and to-do items.
    """
    
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
        ('deferred', 'Deferred'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    name = models.CharField(max_length=255)
    
    # Status and priority
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='normal'
    )
    
    # Timeline
    date_start = models.DateTimeField(null=True, blank=True)
    date_end = models.DateTimeField(null=True, blank=True)
    date_completed = models.DateTimeField(null=True, blank=True)
    
    # Relationships - Generic foreign key to link to any entity
    parent_type = models.CharField(max_length=100, blank=True)
    parent_id = models.UUIDField(null=True, blank=True)
    
    # Additional info
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-date_start']
        indexes = [
            models.Index(fields=['parent_type', 'parent_id']),
        ]
    
    def __str__(self):
        return self.name


class Call(BaseModel, AssignmentModel, TaggableModel):
    """
    Call model similar to EspoCRM's Call entity.
    Represents phone calls and meetings.
    """
    
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('held', 'Held'),
        ('not_held', 'Not Held'),
    ]
    
    DIRECTION_CHOICES = [
        ('outbound', 'Outbound'),
        ('inbound', 'Inbound'),
    ]
    
    name = models.CharField(max_length=255)
    
    # Call details
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='planned'
    )
    direction = models.CharField(
        max_length=20,
        choices=DIRECTION_CHOICES,
        default='outbound'
    )
    
    # Timeline
    date_start = models.DateTimeField()
    date_end = models.DateTimeField()
    duration = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    
    # Relationships - Generic foreign key to link to any entity
    parent_type = models.CharField(max_length=100, blank=True)
    parent_id = models.UUIDField(null=True, blank=True)
    
    # Participants
    contacts = models.ManyToManyField(
        Contact, through='CallContact',
        related_name='calls'
    )
    users = models.ManyToManyField(
        'users.User', through='CallUser',
        related_name='calls'
    )
    
    # Additional info
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'calls'
        verbose_name = 'Call'
        verbose_name_plural = 'Calls'
        ordering = ['-date_start']
        indexes = [
            models.Index(fields=['parent_type', 'parent_id']),
        ]
    
    def __str__(self):
        return self.name


class CallContact(BaseModel):
    """Many-to-many relationship between Calls and Contacts."""
    
    STATUS_CHOICES = [
        ('none', 'None'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('tentative', 'Tentative'),
    ]
    
    call = models.ForeignKey(Call, on_delete=models.CASCADE)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='none'
    )
    
    class Meta:
        db_table = 'call_contacts'
        unique_together = ('call', 'contact')


class CallUser(BaseModel):
    """Many-to-many relationship between Calls and Users."""
    
    STATUS_CHOICES = [
        ('none', 'None'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('tentative', 'Tentative'),
    ]
    
    call = models.ForeignKey(Call, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='none'
    )
    
    class Meta:
        db_table = 'call_users'
        unique_together = ('call', 'user')


class Prospect(BaseModel, ContactInfoModel, AssignmentModel, TaggableModel):
    """
    Prospect model for cold email automation workflow.
    Represents potential leads generated through automated research.
    Bridge between raw lead generation and qualified CRM entities.
    """
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('validated', 'Validated'),
        ('email_generated', 'Email Generated'),
        ('sent', 'Sent'),
        ('follow_up_1', 'Follow-up 1'),
        ('follow_up_2', 'Follow-up 2'),
        ('follow_up_3', 'Follow-up 3'),
        ('responded', 'Responded'),
        ('converted', 'Converted'),
        ('dead', 'Dead'),
        ('disqualified', 'Disqualified'),
    ]
    
    SEQUENCE_POSITION_CHOICES = [
        (0, 'Initial Email'),
        (1, 'Follow-up 1'),
        (2, 'Follow-up 2'),
        (3, 'Follow-up 3'),
        (4, 'Completed'),
    ]
    
    # Company Information
    company_name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    ico = models.CharField(max_length=20, blank=True, help_text="Czech business ID")
    industry = models.CharField(max_length=100, blank=True)
    
    # Contact Information
    contact_name = models.CharField(max_length=255, blank=True)
    contact_first_name = models.CharField(max_length=100, blank=True)
    contact_last_name = models.CharField(max_length=100, blank=True)
    contact_title = models.CharField(max_length=100, blank=True)
    
    # Additional contacts (CEO, directors from Czech registry)
    additional_contacts = models.JSONField(default=list, blank=True, help_text="Additional contact info from business registry")
    
    # Lead Generation Source
    niche = models.CharField(max_length=100, help_text="Target market/industry keyword")
    location = models.CharField(max_length=100, help_text="Geographic search location")
    keyword = models.CharField(max_length=100, blank=True, help_text="Original search keyword")
    campaign_id = models.CharField(max_length=100, blank=True, help_text="Campaign identifier")
    
    # Address Information
    address_street = models.CharField(max_length=255, blank=True)
    address_city = models.CharField(max_length=100, blank=True)
    address_state = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, blank=True)
    address_postal_code = models.CharField(max_length=20, blank=True)
    
    # Email Automation
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='new'
    )
    sequence_position = models.IntegerField(
        choices=SEQUENCE_POSITION_CHOICES,
        default=0
    )
    next_followup_date = models.DateTimeField(null=True, blank=True)
    email_subject = models.CharField(max_length=255, blank=True)
    email_body = models.TextField(blank=True)
    email_sent = models.BooleanField(default=False)
    email_status = models.CharField(max_length=50, blank=True)
    
    # Validation and Quality
    validated = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True)
    auto_validation_score = models.FloatField(null=True, blank=True, help_text="AI-generated quality score")
    
    # Tracking
    last_email_sent = models.DateTimeField(null=True, blank=True)
    response_received = models.BooleanField(default=False)
    response_date = models.DateTimeField(null=True, blank=True)
    
    # Conversion tracking
    converted_to_lead = models.BooleanField(default=False)
    converted_to_contact = models.BooleanField(default=False)
    converted_to_organization = models.BooleanField(default=False)
    lead_id = models.UUIDField(null=True, blank=True)
    contact_id = models.UUIDField(null=True, blank=True)
    organization_id = models.UUIDField(null=True, blank=True)
    
    # ICO Enrichment (Czech Business Registry)
    ico_enriched = models.BooleanField(default=False, help_text="Data enriched from Czech ARES registry")
    ico_enriched_at = models.DateTimeField(null=True, blank=True)
    legal_form = models.CharField(max_length=100, blank=True, help_text="Legal form from ARES")
    legal_form_code = models.CharField(max_length=10, blank=True)
    registration_date = models.DateField(null=True, blank=True, help_text="Company registration date")
    employee_count_range = models.CharField(max_length=50, blank=True)
    business_activities = models.JSONField(default=list, blank=True, help_text="NACE codes and descriptions")
    
    class Meta:
        db_table = 'prospects'
        verbose_name = 'Prospect'
        verbose_name_plural = 'Prospects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['niche', 'location']),
            models.Index(fields=['next_followup_date']),
            models.Index(fields=['campaign_id']),
            models.Index(fields=['validated']),
            models.Index(fields=['ico']),
            models.Index(fields=['ico_enriched']),
        ]
    
    def __str__(self):
        return f"{self.company_name} - {self.contact_name or 'No Contact'}"
    
    @property
    def full_contact_name(self):
        """Get the full contact name."""
        if self.contact_first_name and self.contact_last_name:
            return f"{self.contact_first_name} {self.contact_last_name}"
        return self.contact_name or ""
    
    @property
    def should_send_followup(self):
        """Check if it's time to send a follow-up email."""
        from django.utils import timezone
        return (
            self.next_followup_date and 
            self.next_followup_date <= timezone.now() and
            self.sequence_position < 4 and
            self.status not in ['responded', 'converted', 'dead', 'disqualified']
        )
    
    def advance_sequence(self):
        """Move to the next step in the email sequence."""
        from django.utils import timezone
        from datetime import timedelta
        
        if self.sequence_position < 4:
            self.sequence_position += 1
            
            # Update status based on sequence position
            status_map = {
                0: 'new',
                1: 'sent',
                2: 'follow_up_1',
                3: 'follow_up_2',
                4: 'follow_up_3'
            }
            
            if self.sequence_position in status_map:
                self.status = status_map[self.sequence_position]
            
            # Schedule next follow-up (3 days later)
            if self.sequence_position < 4:
                self.next_followup_date = timezone.now() + timedelta(days=3)
            else:
                self.next_followup_date = None
                self.status = 'dead'  # End of sequence
            
            self.save(update_fields=['sequence_position', 'status', 'next_followup_date'])
    
    def mark_as_responded(self):
        """Mark prospect as responded."""
        from django.utils import timezone
        self.status = 'responded'
        self.response_received = True
        self.response_date = timezone.now()
        self.next_followup_date = None
        self.save(update_fields=['status', 'response_received', 'response_date', 'next_followup_date'])
    
    def enrich_from_ico(self):
        """Enrich prospect data using Czech business registry (ARES)."""
        if not self.ico:
            return False
        # Allow re-enrichment to update data
        
        from .services.czech_registry import czech_registry_service
        from django.utils import timezone
        
        # Convert model instance to dict for enrichment
        prospect_data = {
            'ico': self.ico,
            'company_name': self.company_name,
            'industry': self.industry,
            'address_street': self.address_street,
            'address_city': self.address_city,
            'address_state': self.address_state,
            'address_postal_code': self.address_postal_code,
            'address_country': self.address_country,
        }
        
        # Perform enrichment
        enriched_data = czech_registry_service.enrich_prospect_data(prospect_data)
        
        # Check if data was enriched
        if not enriched_data.get('ico_enriched'):
            return False
        
        # Update model fields - always overwrite company name and address
        if enriched_data.get('company_name'):
            self.company_name = enriched_data.get('company_name')
        if enriched_data.get('industry'):
            self.industry = enriched_data.get('industry')
        if enriched_data.get('address_street'):
            self.address_street = enriched_data.get('address_street')
        if enriched_data.get('address_city'):
            self.address_city = enriched_data.get('address_city')
        if enriched_data.get('address_state'):
            self.address_state = enriched_data.get('address_state')
        if enriched_data.get('address_postal_code'):
            self.address_postal_code = enriched_data.get('address_postal_code')
        if enriched_data.get('address_country'):
            self.address_country = enriched_data.get('address_country')
        
        # Update enrichment fields
        self.legal_form = enriched_data.get('legal_form', '')
        self.legal_form_code = enriched_data.get('legal_form_code', '')
        self.employee_count_range = enriched_data.get('employee_count_range', '')
        self.business_activities = enriched_data.get('business_activities', [])
        
        # Update contact information if CEO found
        if enriched_data.get('contact_name'):
            self.contact_name = enriched_data.get('contact_name')
        if enriched_data.get('contact_first_name'):
            self.contact_first_name = enriched_data.get('contact_first_name')
        if enriched_data.get('contact_last_name'):
            self.contact_last_name = enriched_data.get('contact_last_name')
        if enriched_data.get('ceo_name'):
            self.contact_title = 'CEO/Jednatel'  # Set appropriate title
        
        # Handle registration date
        if enriched_data.get('registration_date'):
            try:
                from datetime import datetime
                if isinstance(enriched_data['registration_date'], str):
                    self.registration_date = datetime.fromisoformat(
                        enriched_data['registration_date']
                    ).date()
                else:
                    self.registration_date = enriched_data['registration_date']
            except (ValueError, TypeError):
                pass
        
        # Mark as enriched
        self.ico_enriched = True
        self.ico_enriched_at = timezone.now()
        
        # Save changes
        self.save()
        return True
