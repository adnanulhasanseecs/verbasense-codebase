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
from app.config.settings import Settings, get_settings
from app.db import dispose_engine, init_db
from app.schemas.errors import ErrorResponse
from app.security.redaction import redact
from app.services.auth_service import get_auth_service
from app.services.observability import now_ms, record_request
from app.services.rate_limit import RateLimiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    init_db(settings)
    get_auth_service(settings).ensure_seed_data()
    app.state.domains = load_domain_configs(settings)
    logger.info("startup.complete domains=%s", sorted(app.state.domains.ids()))
    yield
    dispose_engine()
    logger.info("shutdown.complete")


app = FastAPI(title="VerbaSense API", version="0.1.0", lifespan=lifespan)

_settings = get_settings()
_rate_limiter = RateLimiter(_settings)
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
    started_ms = now_ms()
    rid = _parse_request_id(request.headers.get("X-Request-ID"))
    request.state.request_id = rid
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        if token:
            ctx = get_auth_service(get_settings()).get_context_from_token(token)
            if ctx is not None:
                request.state.session_user = ctx.user
                request.state.session_token = token
    limited = _rate_limit_response_if_needed(request, _settings, rid)
    if limited is not None:
        return limited
    response = await call_next(request)
    elapsed_ms = max(0, now_ms() - started_ms)
    if _settings.observability_metrics_enabled:
        record_request(request.url.path, response.status_code, elapsed_ms)
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
        details=redact(details),
        request_id=request_id,
    ).model_dump(mode="json")


def _rate_limit_response_if_needed(
    request: Request, settings: Settings, request_id: UUID
) -> JSONResponse | None:
    path = request.url.path
    bucket = ""
    if path.startswith("/api/v1/auth/"):
        bucket = "auth"
    elif path.startswith("/api/v1/admin/"):
        bucket = "admin"
    elif path.startswith("/api/v1/upload") or path.startswith("/api/v1/documents/"):
        bucket = "ai"
    if not bucket:
        return None
    client = request.client.host if request.client else "unknown"
    if not _rate_limiter.allow(client, bucket=bucket):
        return JSONResponse(
            status_code=429,
            content=_error_body(
                "rate_limited",
                "Too many requests; retry after rate limit window.",
                {"bucket": bucket, "window_seconds": settings.rate_limit_window_seconds},
                request_id,
            ),
        )
    return None


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
