"""FastAPI dependencies."""

from typing import Annotated, cast

from fastapi import Depends, Request
from starlette import status

from app.api.exceptions import AppError
from app.config.loader import DomainConfigStore
from app.schemas.auth import SessionUser


def get_domain_store(request: Request) -> DomainConfigStore:
    return cast(DomainConfigStore, request.app.state.domains)


DomainStoreDep = Annotated[DomainConfigStore, Depends(get_domain_store)]


def get_session_user(request: Request) -> SessionUser:
    user = getattr(request.state, "session_user", None)
    if user is None:
        raise AppError(status.HTTP_401_UNAUTHORIZED, "unauthorized", "Login required")
    if not user.active:
        raise AppError(status.HTTP_403_FORBIDDEN, "account_inactive", "User account is inactive")
    return cast(SessionUser, user)


SessionUserDep = Annotated[SessionUser, Depends(get_session_user)]


def require_role(user: SessionUser, *, allowed: set[str]) -> None:
    if user.role not in allowed:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Insufficient permissions")


def get_session_token(request: Request) -> str:
    token = getattr(request.state, "session_token", None)
    if token is None:
        raise AppError(status.HTTP_401_UNAUTHORIZED, "unauthorized", "Login required")
    return cast(str, token)


SessionTokenDep = Annotated[str, Depends(get_session_token)]


def get_optional_session_user(request: Request) -> SessionUser | None:
    user = getattr(request.state, "session_user", None)
    if user is None:
        return None
    if not user.active:
        return None
    return cast(SessionUser, user)


OptionalSessionUserDep = Annotated[SessionUser | None, Depends(get_optional_session_user)]
