"""Application-specific HTTP errors."""

from typing import Any


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


class PayloadTooLargeError(AppError):
    def __init__(self, max_bytes: int) -> None:
        super().__init__(
            status_code=413,
            code="payload_too_large",
            message="Uploaded file exceeds configured limit",
            details={"max_bytes": max_bytes},
        )


class BadRequestError(AppError):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(400, code, message, details)
