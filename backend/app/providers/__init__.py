"""Provider abstraction layer for AI/model outputs."""

from app.providers.factory import get_output_provider
from app.providers.types import OutputProvider

__all__ = ["OutputProvider", "get_output_provider"]
