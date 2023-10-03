from typing import Optional
from typing import TypeVar
from ninja import Schema


R = TypeVar("R")


def response_schema(response: R):
    """
    Standardizes a given response schema by wrapping it so it
    has the standard nested fields.
    """

    class Error(Schema):
        reason: str
        detail: Optional[str]

    class Response(Schema):
        ok: bool
        error: Optional[Error] = None
        result: Optional[response] = None

    name = response.__name__
    assert name.endswith("Response")

    name = name.replace("Response", "StructuredResponse")
    Response.__name__ = name

    return Response


def err(reason: str):
    return {
        "ok": False,
        "error": {
            "reason": reason,
        },
    }
