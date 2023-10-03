import time
from ninja import Router
from ninja import Schema
from accounts.security import CommonBearerTokenAuth
from app.utils.api import response_schema

router = Router()


@response_schema
class AckResponse(Schema):
    pass


@response_schema
class PingResponse(Schema):
    time: int


@router.get("/ping/public", response=PingResponse)
def public_ping_details(request):
    return {
        "ok": True,
        "result": {
            "time": int(time.time()),
        },
    }


@router.get("/ping/private", auth=CommonBearerTokenAuth(), response=PingResponse)
def private_ping_details(request):
    return {
        "ok": True,
        "result": {
            "time": int(time.time()),
        },
    }
