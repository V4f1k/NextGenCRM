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
    
    def __str__(self):
        return self.name


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
        ('assigned', 'Assigned'),
        ('in_process', 'In Process'),
        ('converted', 'Converted'),
        ('recycled', 'Recycled'),
        ('dead', 'Dead'),
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
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def full_name(self):
        """Return the full name of the lead."""
        return f"{self.first_name} {self.last_name}".strip()


class Opportunity(BaseModel, AssignmentModel, TaggableModel):
    """
    Opportunity model similar to EspoCRM's Opportunity entity.
    Represents potential sales deals.
    """
    
    STAGE_CHOICES = [
        ('prospecting', 'Prospecting'),
        ('qualification', 'Qualification'),
        ('needs_analysis', 'Needs Analysis'),
        ('value_proposition', 'Value Proposition'),
        ('id_decision_makers', 'Id. Decision Makers'),
        ('perception_analysis', 'Perception Analysis'),
        ('proposal_price_quote', 'Proposal/Price Quote'),
        ('negotiation_review', 'Negotiation/Review'),
        ('closed_won', 'Closed Won'),
        ('closed_lost', 'Closed Lost'),
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
    
    # Additional info
    description = models.TextField(blank=True)
    next_step = models.TextField(blank=True)
    
    class Meta:
        db_table = 'opportunities'
        verbose_name = 'Opportunity'
        verbose_name_plural = 'Opportunities'
        ordering = ['-close_date']
    
    def __str__(self):
        return self.name
    
    @property
    def weighted_amount(self):
        """Calculate weighted amount based on probability."""
        if self.amount and self.probability:
            return self.amount * (Decimal(self.probability) / 100)
        return Decimal('0.00')


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
