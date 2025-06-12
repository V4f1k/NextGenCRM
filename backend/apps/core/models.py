import uuid
from django.db import models
from django.utils import timezone


class UUIDModel(models.Model):
    """
    Abstract base class that provides a UUID primary key field.
    Similar to EspoCRM's ID generation system.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    """
    Abstract base class that provides timestamp fields.
    Similar to EspoCRM's created_at and modified_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstract base class that provides soft delete functionality.
    Similar to EspoCRM's deleted field.
    """
    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """Soft delete the object."""
        self.deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted', 'deleted_at'])
    
    def hard_delete(self, using=None, keep_parents=False):
        """Permanently delete the object."""
        super().delete(using=using, keep_parents=keep_parents)
    
    def restore(self):
        """Restore a soft-deleted object."""
        self.deleted = False
        self.deleted_at = None
        self.save(update_fields=['deleted', 'deleted_at'])


class BaseModel(UUIDModel, TimestampedModel, SoftDeleteModel):
    """
    Base model that combines UUID, timestamps, and soft delete functionality.
    This is the base for most CRM entities, similar to EspoCRM's base entity.
    """
    
    class Meta:
        abstract = True


class AddressModel(models.Model):
    """
    Abstract model for address fields.
    Reusable across multiple entities like Account, Contact, etc.
    """
    address_street = models.CharField(max_length=255, blank=True)
    address_city = models.CharField(max_length=100, blank=True)
    address_state = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, blank=True)
    address_postal_code = models.CharField(max_length=20, blank=True)
    
    class Meta:
        abstract = True


class BillingAddressModel(models.Model):
    """Abstract model for billing address fields."""
    billing_address_street = models.CharField(max_length=255, blank=True)
    billing_address_city = models.CharField(max_length=100, blank=True)
    billing_address_state = models.CharField(max_length=100, blank=True)
    billing_address_country = models.CharField(max_length=100, blank=True)
    billing_address_postal_code = models.CharField(max_length=20, blank=True)
    
    class Meta:
        abstract = True


class ShippingAddressModel(models.Model):
    """Abstract model for shipping address fields."""
    shipping_address_street = models.CharField(max_length=255, blank=True)
    shipping_address_city = models.CharField(max_length=100, blank=True)
    shipping_address_state = models.CharField(max_length=100, blank=True)
    shipping_address_country = models.CharField(max_length=100, blank=True)
    shipping_address_postal_code = models.CharField(max_length=20, blank=True)
    
    class Meta:
        abstract = True


class ContactInfoModel(models.Model):
    """
    Abstract model for contact information fields.
    Includes email and phone number with validation flags.
    """
    email_address = models.EmailField(blank=True)
    email_address_is_opted_out = models.BooleanField(default=False)
    email_address_is_invalid = models.BooleanField(default=False)
    
    phone_number = models.CharField(max_length=50, blank=True)
    phone_number_is_opted_out = models.BooleanField(default=False)
    phone_number_is_invalid = models.BooleanField(default=False)
    
    class Meta:
        abstract = True


class AssignmentModel(models.Model):
    """
    Abstract model for assignment fields.
    Tracks who created, modified, and is assigned to the record.
    """
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='%(class)s_created'
    )
    modified_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='%(class)s_modified'
    )
    assigned_user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='%(class)s_assigned'
    )
    assigned_team = models.ForeignKey(
        'users.Team', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='%(class)s_assigned'
    )
    
    class Meta:
        abstract = True


class TaggableModel(models.Model):
    """
    Abstract model for entities that can be tagged.
    """
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        abstract = True
    
    def add_tag(self, tag):
        """Add a tag to the entity."""
        if tag not in self.tags:
            self.tags.append(tag)
            self.save(update_fields=['tags'])
    
    def remove_tag(self, tag):
        """Remove a tag from the entity."""
        if tag in self.tags:
            self.tags.remove(tag)
            self.save(update_fields=['tags'])


class Setting(TimestampedModel):
    """
    System settings model similar to EspoCRM's Settings.
    Stores key-value configuration data.
    """
    key = models.CharField(max_length=255, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'settings'
        verbose_name = 'Setting'
        verbose_name_plural = 'Settings'
    
    def __str__(self):
        return self.key


class SystemData(models.Model):
    """
    System data storage similar to EspoCRM's SystemData.
    For internal system state and configuration.
    """
    key = models.CharField(max_length=255, unique=True)
    value = models.JSONField()
    
    class Meta:
        db_table = 'system_data'
        verbose_name = 'System Data'
        verbose_name_plural = 'System Data'
    
    def __str__(self):
        return self.key
