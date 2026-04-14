"""Authentication and authorization schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class SessionUser(BaseModel):
    user_id: str
    account_id: str
    email: str
    name: str
    role: str
    active: bool
    profile_image_url: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: SessionUser


class InviteRequest(BaseModel):
    email: str
    role: str


class InviteResponse(BaseModel):
    invite_code: str
    email: str
    role: str
    status: str


class AcceptInviteRequest(BaseModel):
    invite_code: str
    name: str
    password: str = Field(min_length=8)


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str = Field(min_length=8)
    role: str


class AccountSettingsResponse(BaseModel):
    account_id: str
    provider: str
    model: str
    fallback_providers: list[str]
    provider_by_domain: dict[str, str]
    model_by_domain: dict[str, str]


class UpdateAccountSettingsRequest(BaseModel):
    provider: str
    model: str
    fallback_providers: list[str] = []
    provider_by_domain: dict[str, str] = {}
    model_by_domain: dict[str, str] = {}


class AiConnectionsPayload(BaseModel):
    """Account-scoped ASR + LLM config used by admin model-connections UI."""

    asr_provider: str = ""
    asr_model: str = ""
    asr_base_url: str = ""
    asr_api_key: str | None = None
    asr_timeout_seconds: int | None = Field(default=None, ge=1, le=600)
    deployment_mode: str = "cloud"
    document_llm_provider: str = ""
    document_llm_model_name: str = ""
    document_llm_model_value: str = ""
    transcription_llm_model_name: str = ""
    transcription_llm_model_value: str = ""
    document_llm_base_url: str = ""
    document_llm_api_key: str | None = None
    rollout_mode: str = "stable"
    canary_percentage: int = Field(default=0, ge=0, le=100)


class AiConnectionsResponse(BaseModel):
    asr_provider: str = ""
    asr_model: str = ""
    asr_base_url: str = ""
    asr_timeout_seconds: int | None = None
    deployment_mode: str = "cloud"
    document_llm_provider: str = ""
    document_llm_model_name: str = ""
    document_llm_model_value: str = ""
    transcription_llm_model_name: str = ""
    transcription_llm_model_value: str = ""
    document_llm_base_url: str = ""
    rollout_mode: str = "stable"
    canary_percentage: int = 0
    has_asr_api_key: bool = False
    has_document_llm_api_key: bool = False


class AiConnectionHealthCheckResult(BaseModel):
    target: str
    valid: bool
    message: str


class AiConnectionsHealthCheckResponse(BaseModel):
    document_llm: AiConnectionHealthCheckResult
    asr: AiConnectionHealthCheckResult


class UserSummary(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    active: bool
    profile_image_url: str | None = None


class UpdateUserRoleRequest(BaseModel):
    role: str


class UpdateUserStatusRequest(BaseModel):
    active: bool


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    profile_image_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)


class AuditLogEntry(BaseModel):
    id: int
    actor_user_id: str
    action: str
    target_type: str
    target_id: str
    details: dict[str, object]
    created_at: str
