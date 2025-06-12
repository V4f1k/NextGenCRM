from django.contrib.auth.models import BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """
    Custom user manager for the User model.
    Similar to EspoCRM's user management functionality.
    """
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        """
        Create and save a regular User with the given username, email, and password.
        """
        if not username:
            raise ValueError('The Username must be set')
        if not email:
            raise ValueError('The Email must be set')
        
        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given username, email, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)
    
    def get_by_natural_key(self, username):
        """
        Allow authentication using both username and email.
        """
        return self.get(
            models.Q(username__iexact=username) | models.Q(email__iexact=username)
        )
    
    def active_users(self):
        """Return only active users."""
        return self.filter(is_active=True, deleted=False)
    
    def staff_users(self):
        """Return only staff users."""
        return self.filter(is_staff=True, is_active=True, deleted=False)
    
    def portal_users(self):
        """Return only portal users."""
        return self.filter(is_portal_user=True, is_active=True, deleted=False)
    
    def regular_users(self):
        """Return only regular (non-portal) users."""
        return self.filter(is_portal_user=False, is_active=True, deleted=False)