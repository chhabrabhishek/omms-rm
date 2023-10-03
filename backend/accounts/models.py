import datetime
import secrets
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager
from django.db import models
from django_enumfield import enum
from django.utils import timezone
from app.utils.models import AppModel


class AccountManager(UserManager):
    """
    Becase the default manager does not supoprt username-free users.
    """

    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        """
        Create and save a user with the given email, and password.
        Takes a username argument for backward compatibility reasons.
        """
        if not email:
            raise ValueError("The given email must be set")

        email = self.normalize_email(email)
        password = make_password(password)

        user = self.model(email=email, **extra_fields)
        user.password = password
        user.save(using=self._db)

        return user

    def create_user(self, **extra_fields):
        return super().create_user(username=None, **extra_fields)

    def create_superuser(self, **extra_fields):
        return super().create_superuser(username=None, **extra_fields)


class Account(AbstractUser):
    """
    Represents a general account on the platform.

    TODO: Manage auth specific fields.
    """

    class Type(enum.Enum):
        Member = 1

    # Emails are also the primary identity of the users on the
    # platform. So, drop the username field.
    username = None
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=64)
    msid = models.CharField(max_length=8)
    team_name = models.CharField(max_length=64)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = AccountManager()


# This function needs to be globally addressable, so
# it cannot be part of the AuthToken class.
def generate_auth_token():
    return secrets.token_urlsafe(32)


class AuthToken(AppModel):
    """
    The long-term token that can be used to access resources on behalf
    on an account.
    """

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="auth_tokens",
    )
    token = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
        default=generate_auth_token,
    )
    active = models.BooleanField(default=True)

    def valid_until(self) -> datetime:
        return self.created_at + datetime.timedelta(days=30)

    def is_valid(self) -> bool:
        return self.active and timezone.now() <= self.valid_until()

class Roles(AppModel):
    """
    Roles for authorization
    """

    class Role(enum.Enum):
        Admin = 1
        ReleaseAdmin = 2
        User = 3

    role = enum.EnumField(Role)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="roles")

class PendingRoles(AppModel):
    """
    Pending requested roles
    """

    requested_role = enum.EnumField(Roles.Role)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="requested_roles")