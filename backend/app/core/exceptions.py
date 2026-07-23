from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(str(x) for x in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})