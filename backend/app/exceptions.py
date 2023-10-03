from ninja import NinjaAPI
from ninja.errors import HttpError
from ninja.errors import ValidationError


def init_exception_handlers(api: NinjaAPI):
    """
    Register custom exception handlers.
    """

    @api.exception_handler(ValidationError)
    def handle_validation_error(request, error):
        # Response structure should match that of response_schema.
        response = {
            "ok": False,
            "error": {
                "reason": "validation_failed",
                "detail": error.errors,
            },
        }
        return api.create_response(request, response, status=400)

    @api.exception_handler(HttpError)
    def handle_http_error(request, error: HttpError):
        (message,) = error.args
        # If the message is a dictionary, we assume it is trying to fill
        # the error field of the structured response.
        if isinstance(message, dict):
            response = {
                "ok": False,
                "error": message,
            }
        else:
            response = {
                "detail": str(error),
            }

        return api.create_response(request, response, status=error.status_code)
