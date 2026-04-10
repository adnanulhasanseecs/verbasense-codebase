"""FastAPI dependencies."""

from typing import Annotated, cast

from fastapi import Depends, Request

from app.config.loader import DomainConfigStore


def get_domain_store(request: Request) -> DomainConfigStore:
    return cast(DomainConfigStore, request.app.state.domains)


DomainStoreDep = Annotated[DomainConfigStore, Depends(get_domain_store)]
