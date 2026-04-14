"""Versioned HTTP routes."""

from __future__ import annotations

import logging
from typing import Annotated, Any, cast
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from fastapi.encoders import jsonable_encoder

from app.api.deps import (
    DomainStoreDep,
    SessionTokenDep,
    SessionUserDep,
    require_role,
)
from app.api.exceptions import BadRequestError, PayloadTooLargeError
from app.config.settings import Settings, get_settings
from app.schemas.auth import (
    AcceptInviteRequest,
    AiConnectionsHealthCheckResponse,
    AiConnectionsPayload,
    ChangePasswordRequest,
    CreateUserRequest,
    InviteRequest,
    InviteResponse,
    LoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    UpdateAccountSettingsRequest,
    UpdateProfileRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
)
from app.schemas.document import (
    DocumentProcessResponse,
    LlmKeyValidationRequest,
    LlmKeyValidationResponse,
)
from app.schemas.job import JobResponse
from app.schemas.output import ResultEnvelope
from app.schemas.upload import UploadMetadata
from app.services.auth_service import get_auth_service
from app.services.document_processing import get_document_processing_service
from app.services.job_service import JobService, get_job_service, job_to_response
from app.services.observability import snapshot as metrics_snapshot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")


async def _read_upload_with_limit(upload: UploadFile, max_bytes: int) -> bytes:
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise PayloadTooLargeError(max_bytes)
        chunks.append(chunk)
    return b"".join(chunks)


ALLOWED_SUFFIXES = {".wav", ".mp3"}


@router.post("/upload", status_code=201)
async def upload_audio(
    file: Annotated[UploadFile, File(..., description="Audio file (.wav or .mp3)")],
    settings: Annotated[Settings, Depends(get_settings)],
    jobs: Annotated[JobService, Depends(get_job_service)],
    domains: DomainStoreDep,
    metadata: str | None = Form(default=None),
    domain: str = Form(default="courtsense"),
    x_mock_failure: Annotated[str | None, Header(alias="X-Mock-Failure")] = None,
    x_idempotency_key: Annotated[str | None, Header(alias="X-Idempotency-Key")] = None,
) -> JobResponse:
    """Accept multipart upload; optional JSON `metadata` and `domain` form fields."""
    filename = file.filename or "audio"
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_SUFFIXES:
        raise BadRequestError(
            "invalid_file_type",
            "Only .wav and .mp3 files are accepted",
            {"filename": filename},
        )

    try:
        meta = UploadMetadata.parse_json(metadata)
    except ValueError as e:
        raise BadRequestError("invalid_metadata", str(e)) from e

    cfg = domains.get(domain)
    if cfg is None:
        raise BadRequestError("unknown_domain", f"Unknown domain: {domain}", {"domain": domain})

    audio_bytes = await _read_upload_with_limit(file, settings.max_upload_bytes)
    force_failure = (x_mock_failure or "").strip().lower() in ("1", "true", "yes")

    record = await jobs.create_job(
        cfg,
        meta,
        audio_bytes=audio_bytes,
        force_failure=force_failure,
        idempotency_key=x_idempotency_key,
    )
    return job_to_response(record)


@router.get("/job/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    jobs: Annotated[JobService, Depends(get_job_service)],
) -> JobResponse:
    record = await jobs.get_job(job_id)
    if record is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="job_not_found")
    return job_to_response(record)


@router.get("/result/{job_id}", response_model=ResultEnvelope)
async def get_result(
    job_id: UUID,
    jobs: Annotated[JobService, Depends(get_job_service)],
) -> ResultEnvelope:
    record = await jobs.get_job(job_id)
    if record is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="job_not_found")
    if record.status.value == "failed":
        from fastapi import HTTPException

        raise HTTPException(status_code=409, detail="job_failed")
    if record.output is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="result_not_ready")
    return ResultEnvelope(job_id=str(record.job_id), domain=record.domain, output=record.output)


@router.get("/config/domain/{domain_id}")
async def get_domain_config(
    domain_id: str,
    domains: DomainStoreDep,
) -> dict[str, Any]:
    cfg = domains.get(domain_id)
    if cfg is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="domain_not_found")
    return cast(dict[str, Any], jsonable_encoder(cfg.model_dump_public()))


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "verbasense-backend"}


@router.get("/ops/metrics")
async def ops_metrics(
    user: SessionUserDep,
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    return metrics_snapshot()


@router.post("/documents/process", response_model=DocumentProcessResponse)
async def process_document(
    file: Annotated[UploadFile, File(..., description="Document PDF")],
    user: SessionUserDep,
    prompt: str = Form(...),
    provider: str = Form(default=""),
    model: str = Form(default=""),
    api_key: str = Form(default=""),
    base_url: str = Form(default=""),
) -> DocumentProcessResponse:
    require_role(user, allowed={"admin", "clerk", "judge"})
    filename = (file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise BadRequestError("invalid_file_type", "Only PDF documents are supported")
    content = await _read_upload_with_limit(file, 10 * 1024 * 1024)
    auth = get_auth_service(get_settings())
    connections = auth.get_ai_connections_raw(account_id=user.account_id)
    effective_provider = provider or connections.document_llm_provider or "mock"
    effective_model = model or connections.document_llm_model_value or "mock-doc-v1"
    effective_base_url = base_url or connections.document_llm_base_url or "https://api.openai.com/v1"
    effective_api_key = api_key or (connections.document_llm_api_key or "")
    svc = get_document_processing_service()
    return svc.process(
        pdf_bytes=content,
        prompt=prompt,
        provider=effective_provider,
        model=effective_model,
        api_key=effective_api_key,
        base_url=effective_base_url,
    )


@router.post("/documents/validate-key", response_model=LlmKeyValidationResponse)
async def validate_document_llm_key(
    payload: LlmKeyValidationRequest,
    user: SessionUserDep,
) -> LlmKeyValidationResponse:
    require_role(user, allowed={"admin"})
    svc = get_document_processing_service()
    return svc.validate_api_key(
        provider=payload.provider,
        base_url=payload.base_url,
        api_key=payload.api_key,
    )


@router.get("/admin/ai-connections")
async def get_ai_connections(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    return auth.get_ai_connections(account_id=user.account_id).model_dump(mode="json")


@router.put("/admin/ai-connections")
async def update_ai_connections(
    payload: AiConnectionsPayload,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    out = auth.update_ai_connections(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        payload=payload,
    )
    return out.model_dump(mode="json")


@router.post("/admin/ai-connections/health-check", response_model=AiConnectionsHealthCheckResponse)
async def validate_ai_connections(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AiConnectionsHealthCheckResponse:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    cfg = auth.get_ai_connections_raw(account_id=user.account_id)
    svc = get_document_processing_service()
    llm = svc.validate_api_key(
        provider=cfg.document_llm_provider or "mock",
        base_url=cfg.document_llm_base_url or "https://api.openai.com/v1",
        api_key=cfg.document_llm_api_key or "",
    )
    asr = svc.validate_api_key(
        provider=cfg.asr_provider or "mock",
        base_url=cfg.asr_base_url or "https://api.openai.com/v1",
        api_key=cfg.asr_api_key or "",
    )
    return AiConnectionsHealthCheckResponse(
        document_llm={
            "target": "document_llm",
            "valid": llm.valid,
            "message": llm.message,
        },
        asr={"target": "asr", "valid": asr.valid, "message": asr.message},
    )


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest, settings: Annotated[Settings, Depends(get_settings)]
) -> LoginResponse:
    auth = get_auth_service(settings)
    try:
        token, user = auth.login(email=payload.email, password=payload.password)
    except ValueError as exc:
        raise BadRequestError("auth_failed", str(exc)) from exc
    return LoginResponse(access_token=token, user=user)


@router.post("/auth/invite/accept")
async def accept_invite(
    payload: AcceptInviteRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    auth = get_auth_service(settings)
    try:
        auth.accept_invite(
            invite_code=payload.invite_code, name=payload.name, password=payload.password
        )
    except ValueError as exc:
        raise BadRequestError("invite_error", str(exc)) from exc
    return {"status": "accepted"}


@router.post("/auth/refresh")
async def refresh_session(
    token: SessionTokenDep,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    auth = get_auth_service(settings)
    next_token = auth.refresh(token=token, actor_user_id=user.user_id, account_id=user.account_id)
    return {"access_token": next_token, "token_type": "bearer"}


@router.post("/auth/logout")
async def logout(
    token: SessionTokenDep,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    auth = get_auth_service(settings)
    auth.logout(token=token, actor_user_id=user.user_id, account_id=user.account_id)
    return {"status": "ok"}


@router.get("/admin/users")
async def list_users(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    rows = auth.list_users(account_id=user.account_id)
    return {"items": [r.model_dump(mode="json") for r in rows]}


@router.post("/admin/invites", response_model=InviteResponse)
async def create_invite(
    payload: InviteRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> InviteResponse:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    invite = auth.create_invite(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        email=payload.email,
        role=payload.role,
    )
    return InviteResponse(
        invite_code=invite.invite_code,
        email=invite.email,
        role=invite.role,
        status=invite.status,
    )


@router.post("/admin/users")
async def admin_create_user(
    payload: CreateUserRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    try:
        created = auth.create_user(
            account_id=user.account_id,
            actor_user_id=user.user_id,
            email=payload.email,
            name=payload.name,
            password=payload.password,
            role=payload.role,
        )
    except ValueError as exc:
        raise BadRequestError("user_create_error", str(exc)) from exc
    return created.model_dump(mode="json")


@router.patch("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    auth.update_role(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        user_id=user_id,
        role=payload.role,
    )
    return {"status": "ok"}


@router.patch("/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    auth.update_user_status(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        user_id=user_id,
        active=payload.active,
    )
    return {"status": "ok"}


@router.get("/admin/account-settings")
async def get_account_settings(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    out = auth.get_account_settings(account_id=user.account_id)
    return out.model_dump(mode="json")


@router.put("/admin/account-settings")
async def update_account_settings(
    payload: UpdateAccountSettingsRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    out = auth.update_account_settings(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        provider=payload.provider,
        model=payload.model,
        fallback_providers=payload.fallback_providers,
        provider_by_domain=payload.provider_by_domain,
        model_by_domain=payload.model_by_domain,
    )
    return out.model_dump(mode="json")


@router.get("/admin/audit-logs")
async def list_audit_logs(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    items = auth.list_audit_logs(account_id=user.account_id, limit=100)
    return {"items": [x.model_dump(mode="json") for x in items]}


@router.get("/me")
async def me(
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    auth = get_auth_service(settings)
    current = auth.get_user(account_id=user.account_id, user_id=user.user_id)
    return current.model_dump(mode="json")


@router.patch("/me/profile")
async def update_my_profile(
    payload: UpdateProfileRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    auth = get_auth_service(settings)
    current = auth.update_profile(
        account_id=user.account_id,
        actor_user_id=user.user_id,
        name=payload.name,
        profile_image_url=payload.profile_image_url,
    )
    return current.model_dump(mode="json")


@router.patch("/me/password")
async def change_my_password(
    payload: ChangePasswordRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    auth = get_auth_service(settings)
    try:
        auth.change_password(
            account_id=user.account_id,
            actor_user_id=user.user_id,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
    except ValueError as exc:
        raise BadRequestError("password_change_error", str(exc)) from exc
    return {"status": "ok"}


@router.patch("/admin/users/{user_id}/password")
async def admin_reset_user_password(
    user_id: str,
    payload: ResetPasswordRequest,
    user: SessionUserDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, str]:
    require_role(user, allowed={"admin"})
    auth = get_auth_service(settings)
    try:
        auth.reset_password(
            account_id=user.account_id,
            actor_user_id=user.user_id,
            user_id=user_id,
            new_password=payload.new_password,
        )
    except ValueError as exc:
        raise BadRequestError("password_reset_error", str(exc)) from exc
    return {"status": "ok"}
