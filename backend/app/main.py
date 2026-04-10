"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.api.exceptions import AppError
from app.api.v1.router import router as v1_router
from app.config.loader import load_domain_configs
from app.config.settings import get_settings
from app.schemas.errors import ErrorResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.domains = load_domain_configs(settings)
    logger.info("startup.complete domains=%s", sorted(app.state.domains.ids()))
    yield
    logger.info("shutdown.complete")


app = FastAPI(title="VerbaSense API", version="0.1.0", lifespan=lifespan)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _parse_request_id(raw: str | None) -> UUID:
    if not raw:
        return uuid4()
    try:
        return UUID(raw)
    except ValueError:
        return uuid4()


@app.middleware("http")
async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    rid = _parse_request_id(request.headers.get("X-Request-ID"))
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["X-Request-ID"] = str(rid)
    return response


def _error_body(
    code: str,
    message: str,
    details: dict[str, Any],
    request_id: UUID,
) -> dict[str, Any]:
    return ErrorResponse(
        code=code,
        message=message,
        details=details,
        request_id=request_id,
    ).model_dump(mode="json")


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    rid = getattr(request.state, "request_id", uuid4())
    if not isinstance(rid, UUID):
        rid = uuid4()
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.code, exc.message, exc.details, rid),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    rid = getattr(request.state, "request_id", uuid4())
    if not isinstance(rid, UUID):
        rid = uuid4()
    detail = exc.detail
    if isinstance(detail, dict):
        message = str(detail.get("message", exc.detail))
        code = str(detail.get("code", "http_error"))
    else:
        message = str(detail)
        code = "http_error"
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(code, message, {"detail": detail}, rid),
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    rid = getattr(request.state, "request_id", uuid4())
    if not isinstance(rid, UUID):
        rid = uuid4()
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_body(
            "validation_error",
            "Request validation failed",
            {"errors": exc.errors()},
            rid,
        ),
    )


app.include_router(v1_router)
