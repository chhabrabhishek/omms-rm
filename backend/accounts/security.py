import logging
from django.contrib.auth.signals import user_logged_in
from ninja.errors import HttpError
from ninja.security.http import HttpBearer
from accounts.models import Account
from accounts.models import AuthToken


logger = logging.getLogger("django.server")


class BearerTokenAuth(HttpBearer):
    """
    Authentication that is backed by AuthToken table.
    """

    def authenticate(self, request, token: str):
        auth_token = (
            AuthToken.objects.filter(active=True, token=token)
            .select_related("account", *self.select_related())
            .first()
        )
        if auth_token is None:
            raise HttpError(401, dict(reason="auth_token_not_found"))
        if not auth_token.is_valid():
            raise HttpError(401, dict(reason="auth_token_expired"))

        account = auth_token.account
        if not account.is_active:
            raise HttpError(401, dict(reason="auth_account_inactive"))

        if not self.authorize(request, account):
            raise HttpError(403, dict(reason="unauthorized"))

        # Add the token that was used to perform authentication to the account
        # instance that will be returned so it can be used if necessary later.
        account.auth_token = auth_token
        try:
            user_logged_in.send(sender=Account, request=request, user=account)
        except:
            logger.exception()

        return account

    def select_related(self):
        return []

    def authorize(self, request, account):
        raise NotImplementedError()


class CommonBearerTokenAuth(BearerTokenAuth):
    """
    An auth strategy that authorizes every logged in account.
    """

    def authorize(self, request, account):
        return True
