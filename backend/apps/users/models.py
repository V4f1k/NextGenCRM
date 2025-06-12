from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from apps.core.models import TimestampedModel, UUIDModel, SoftDeleteModel
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, TimestampedModel, UUIDModel, SoftDeleteModel):
    """
    Custom User model similar to EspoCRM's User entity.
    Extends Django's AbstractBaseUser with CRM-specific fields.
    """
    
    # Basic Info
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # CRM-specific fields
    title = models.CharField(max_length=100, blank=True)
    salutation_name = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    phone_number_mobile = models.CharField(max_length=50, blank=True)
    
    # Address
    address_street = models.CharField(max_length=255, blank=True)
    address_city = models.CharField(max_length=100, blank=True)
    address_state = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, blank=True)
    address_postal_code = models.CharField(max_length=20, blank=True)
    
    # Work Info
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    
    # Avatar
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Preferences
    default_team = models.ForeignKey(
        'Team', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='default_users'
    )
    
    # Authentication
    last_access = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    auth_method = models.CharField(
        max_length=20, 
        choices=[
            ('standard', 'Standard'),
            ('ldap', 'LDAP'),
            ('oauth', 'OAuth'),
        ],
        default='standard'
    )
    
    # 2FA
    auth_2fa_enabled = models.BooleanField(default=False)
    auth_2fa_method = models.CharField(
        max_length=20,
        choices=[
            ('totp', 'TOTP'),
            ('email', 'Email'),
            ('sms', 'SMS'),
        ],
        blank=True
    )
    
    # Portal access
    is_portal_user = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.username
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.username
    
    def update_last_access(self):
        """Update the last access timestamp."""
        self.last_access = timezone.now()
        self.save(update_fields=['last_access'])


class Team(TimestampedModel, UUIDModel, SoftDeleteModel):
    """
    Team model similar to EspoCRM's Team entity.
    Users can belong to multiple teams for organization and access control.
    """
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Team settings
    position_list = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'teams'
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'
    
    def __str__(self):
        return self.name


class TeamUser(TimestampedModel):
    """
    Many-to-many relationship between Users and Teams with additional fields.
    """
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=50,
        choices=[
            ('member', 'Member'),
            ('leader', 'Leader'),
            ('manager', 'Manager'),
        ],
        default='member'
    )
    
    class Meta:
        db_table = 'team_users'
        unique_together = ('user', 'team')
        verbose_name = 'Team User'
        verbose_name_plural = 'Team Users'
    
    def __str__(self):
        return f"{self.user.username} - {self.team.name} ({self.role})"


class Role(TimestampedModel, UUIDModel, SoftDeleteModel):
    """
    Role model for permission management similar to EspoCRM's Role entity.
    """
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Role data stored as JSON for flexibility like EspoCRM
    data = models.JSONField(default=dict)
    field_data = models.JSONField(default=dict)
    
    # Assignment
    users = models.ManyToManyField(User, through='UserRole', related_name='roles')
    teams = models.ManyToManyField(Team, through='TeamRole', related_name='roles')
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return self.name


class UserRole(TimestampedModel):
    """Many-to-many relationship between Users and Roles."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = ('user', 'role')


class TeamRole(TimestampedModel):
    """Many-to-many relationship between Teams and Roles."""
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'team_roles'
        unique_together = ('team', 'role')
