"""Authentication, RBAC policy, invites, and admin operations."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import and_

from app.config.settings import Settings
from app.db.models import (
    AccountModel,
    AuditLogModel,
    InviteModel,
    MembershipModel,
    SessionModel,
    UserModel,
)
from app.db.session import session_scope
from app.schemas.auth import (
    AccountSettingsResponse,
    AiConnectionsPayload,
    AiConnectionsResponse,
    AuditLogEntry,
    SessionUser,
    UserSummary,
)
from app.security.secrets import decrypt_secret, encrypt_secret

ROLES = {"admin", "judge", "clerk", "viewer"}


@dataclass
class AuthContext:
    token: str
    user: SessionUser


class AuthService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000
        )
        return digest.hex()

    @classmethod
    def _make_password_hash(cls, password: str) -> tuple[str, str]:
        salt = secrets.token_hex(16)
        return cls._hash_password(password, salt), salt

    @classmethod
    def _verify_password(cls, password: str, expected_hash: str, salt: str) -> bool:
        if not expected_hash or not salt:
            return False
        probe = cls._hash_password(password, salt)
        return hmac.compare_digest(probe, expected_hash)

    @staticmethod
    def _to_session_user(user: UserModel, membership: MembershipModel) -> SessionUser:
        return SessionUser(
            user_id=user.id,
            account_id=membership.account_id,
            email=user.email,
            name=user.name,
            role=membership.role,
            active=bool(user.active and membership.active),
            profile_image_url=user.profile_image_url,
        )

    def ensure_seed_data(self) -> None:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).first()
            if account is None:
                account = AccountModel(
                    id=str(uuid4()),
                    name="VerbaSense Default Account",
                    provider=self._settings.output_provider,
                    model=self._settings.output_model,
                    fallback_providers=(
                        self._settings.output_fallback_providers.split(",")
                        if self._settings.output_fallback_providers
                        else []
                    ),
                    provider_by_domain={},
                    model_by_domain={},
                )
                session.add(account)
                session.flush()

            admin = (
                session.query(UserModel)
                .filter(UserModel.email == "admin@verbasense.local")
                .one_or_none()
            )
            if admin is None:
                password_hash, password_salt = self._make_password_hash("Admin@12345")
                admin = UserModel(
                    id=str(uuid4()),
                    email="admin@verbasense.local",
                    name="Platform Admin",
                    active=True,
                    password_hash=password_hash,
                    password_salt=password_salt,
                )
                session.add(admin)
                session.flush()
            elif not admin.password_hash or not admin.password_salt:
                password_hash, password_salt = self._make_password_hash("Admin@12345")
                admin.password_hash = password_hash
                admin.password_salt = password_salt
                session.add(admin)

            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account.id,
                        MembershipModel.user_id == admin.id,
                    )
                )
                .one_or_none()
            )
            if membership is None:
                session.add(
                    MembershipModel(
                        id=str(uuid4()),
                        account_id=account.id,
                        user_id=admin.id,
                        role="admin",
                        active=True,
                    )
                )
            session.commit()

    def login(self, *, email: str, password: str) -> tuple[str, SessionUser]:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).first()
            if account is None:
                raise ValueError("No account configured")

            user = session.query(UserModel).filter(UserModel.email == email).one_or_none()
            if user is None:
                raise ValueError("Invalid email or password")

            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account.id,
                        MembershipModel.user_id == user.id,
                    )
                )
                .one_or_none()
            )
            if membership is None:
                raise ValueError("Account membership missing")

            if not self._verify_password(password, user.password_hash, user.password_salt):
                raise ValueError("Invalid email or password")

            token = secrets.token_urlsafe(32)
            session.add(
                SessionModel(
                    token=token,
                    account_id=account.id,
                    user_id=user.id,
                    expires_at=datetime.now() + timedelta(hours=8),
                )
            )
            session.add(
                AuditLogModel(
                    account_id=account.id,
                    actor_user_id=user.id,
                    action="login",
                    target_type="session",
                    target_id=token,
                    details={"email": email},
                )
            )
            session.commit()
            return token, self._to_session_user(user, membership)

    def get_context_from_token(self, token: str) -> AuthContext | None:
        with session_scope(self._settings) as session:
            s = session.query(SessionModel).filter(SessionModel.token == token).one_or_none()
            if s is None:
                return None
            if s.expires_at < datetime.now():
                session.delete(s)
                session.commit()
                return None

            user = session.query(UserModel).filter(UserModel.id == s.user_id).one_or_none()
            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == s.account_id,
                        MembershipModel.user_id == s.user_id,
                    )
                )
                .one_or_none()
            )
            if user is None or membership is None:
                return None
            return AuthContext(token=token, user=self._to_session_user(user, membership))

    def list_users(self, *, account_id: str) -> list[UserSummary]:
        with session_scope(self._settings) as session:
            rows = (
                session.query(UserModel, MembershipModel)
                .join(MembershipModel, MembershipModel.user_id == UserModel.id)
                .filter(MembershipModel.account_id == account_id)
                .all()
            )
            return [
                UserSummary(
                    user_id=u.id,
                    email=u.email,
                    name=u.name,
                    role=m.role,
                    active=bool(u.active and m.active),
                    profile_image_url=u.profile_image_url,
                )
                for u, m in rows
            ]

    def create_user(
        self,
        *,
        account_id: str,
        actor_user_id: str,
        email: str,
        name: str,
        password: str,
        role: str,
    ) -> UserSummary:
        if role not in ROLES:
            raise ValueError(f"Unsupported role: {role}")
        with session_scope(self._settings) as session:
            existing = session.query(UserModel).filter(UserModel.email == email).one_or_none()
            if existing is not None:
                raise ValueError("Email already exists")
            password_hash, password_salt = self._make_password_hash(password)
            user = UserModel(
                id=str(uuid4()),
                email=email,
                name=name,
                password_hash=password_hash,
                password_salt=password_salt,
                active=True,
            )
            session.add(user)
            session.flush()
            membership = MembershipModel(
                id=str(uuid4()),
                account_id=account_id,
                user_id=user.id,
                role=role,
                active=True,
            )
            session.add(membership)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="user_created",
                    target_type="user",
                    target_id=user.id,
                    details={"email": email, "role": role},
                )
            )
            session.commit()
            return UserSummary(
                user_id=user.id,
                email=user.email,
                name=user.name,
                role=membership.role,
                active=True,
                profile_image_url=user.profile_image_url,
            )

    def create_invite(
        self, *, account_id: str, actor_user_id: str, email: str, role: str
    ) -> InviteModel:
        if role not in ROLES:
            raise ValueError(f"Unsupported role: {role}")
        with session_scope(self._settings) as session:
            invite = InviteModel(
                id=str(uuid4()),
                invite_code=secrets.token_urlsafe(18),
                account_id=account_id,
                email=email,
                role=role,
                status="pending",
                invited_by_user_id=actor_user_id,
            )
            session.add(invite)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="invite_created",
                    target_type="invite",
                    target_id=invite.id,
                    details={"email": email, "role": role},
                )
            )
            session.commit()
            session.refresh(invite)
            return invite

    def accept_invite(self, *, invite_code: str, name: str, password: str) -> SessionUser:
        with session_scope(self._settings) as session:
            invite = (
                session.query(InviteModel)
                .filter(InviteModel.invite_code == invite_code)
                .one_or_none()
            )
            if invite is None or invite.status != "pending":
                raise ValueError("Invite is invalid or already used")

            user = session.query(UserModel).filter(UserModel.email == invite.email).one_or_none()
            if user is None:
                password_hash, password_salt = self._make_password_hash(password)
                user = UserModel(
                    id=str(uuid4()),
                    email=invite.email,
                    name=name,
                    active=True,
                    password_hash=password_hash,
                    password_salt=password_salt,
                )
                session.add(user)
                session.flush()

            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == invite.account_id,
                        MembershipModel.user_id == user.id,
                    )
                )
                .one_or_none()
            )
            if membership is None:
                membership = MembershipModel(
                    id=str(uuid4()),
                    account_id=invite.account_id,
                    user_id=user.id,
                    role=invite.role,
                    active=True,
                )
                session.add(membership)
            else:
                membership.role = invite.role
                membership.active = True

            invite.status = "accepted"
            invite.accepted_at = datetime.now()
            session.add(invite)
            session.add(
                AuditLogModel(
                    account_id=invite.account_id,
                    actor_user_id=user.id,
                    action="invite_accepted",
                    target_type="invite",
                    target_id=invite.id,
                    details={"email": invite.email, "role": invite.role},
                )
            )
            session.commit()
            return self._to_session_user(user, membership)

    def update_role(self, *, account_id: str, actor_user_id: str, user_id: str, role: str) -> None:
        if role not in ROLES:
            raise ValueError(f"Unsupported role: {role}")
        with session_scope(self._settings) as session:
            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account_id, MembershipModel.user_id == user_id
                    )
                )
                .one_or_none()
            )
            if membership is None:
                raise ValueError("Membership not found")
            membership.role = role
            session.add(membership)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="role_updated",
                    target_type="user",
                    target_id=user_id,
                    details={"role": role},
                )
            )
            session.commit()

    def update_user_status(
        self, *, account_id: str, actor_user_id: str, user_id: str, active: bool
    ) -> None:
        with session_scope(self._settings) as session:
            user = session.query(UserModel).filter(UserModel.id == user_id).one_or_none()
            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account_id, MembershipModel.user_id == user_id
                    )
                )
                .one_or_none()
            )
            if user is None or membership is None:
                raise ValueError("User membership not found")
            user.active = active
            membership.active = active
            session.add(user)
            session.add(membership)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="user_status_updated",
                    target_type="user",
                    target_id=user_id,
                    details={"active": active},
                )
            )
            session.commit()

    def get_user(self, *, account_id: str, user_id: str) -> SessionUser:
        with session_scope(self._settings) as session:
            user = session.query(UserModel).filter(UserModel.id == user_id).one()
            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account_id, MembershipModel.user_id == user_id
                    )
                )
                .one()
            )
            return self._to_session_user(user, membership)

    def update_profile(
        self,
        *,
        account_id: str,
        actor_user_id: str,
        name: str | None,
        profile_image_url: str | None,
    ) -> SessionUser:
        with session_scope(self._settings) as session:
            user = session.query(UserModel).filter(UserModel.id == actor_user_id).one()
            membership = (
                session.query(MembershipModel)
                .filter(
                    and_(
                        MembershipModel.account_id == account_id,
                        MembershipModel.user_id == actor_user_id,
                    )
                )
                .one()
            )
            if name is not None:
                user.name = name
            if profile_image_url is not None:
                user.profile_image_url = profile_image_url
            session.add(user)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="profile_updated",
                    target_type="user",
                    target_id=actor_user_id,
                    details={"name": name, "profile_image_url": profile_image_url},
                )
            )
            session.commit()
            return self._to_session_user(user, membership)

    def change_password(
        self, *, account_id: str, actor_user_id: str, current_password: str, new_password: str
    ) -> None:
        with session_scope(self._settings) as session:
            user = session.query(UserModel).filter(UserModel.id == actor_user_id).one()
            if not self._verify_password(current_password, user.password_hash, user.password_salt):
                raise ValueError("Current password is incorrect")
            password_hash, password_salt = self._make_password_hash(new_password)
            user.password_hash = password_hash
            user.password_salt = password_salt
            session.add(user)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="password_changed",
                    target_type="user",
                    target_id=actor_user_id,
                    details={},
                )
            )
            session.commit()

    def reset_password(
        self, *, account_id: str, actor_user_id: str, user_id: str, new_password: str
    ) -> None:
        with session_scope(self._settings) as session:
            user = session.query(UserModel).filter(UserModel.id == user_id).one_or_none()
            if user is None:
                raise ValueError("User not found")
            password_hash, password_salt = self._make_password_hash(new_password)
            user.password_hash = password_hash
            user.password_salt = password_salt
            session.add(user)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="password_reset",
                    target_type="user",
                    target_id=user_id,
                    details={},
                )
            )
            session.commit()

    def get_ai_connections(self, *, account_id: str) -> AiConnectionsResponse:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).filter(AccountModel.id == account_id).one()
            raw = account.ai_connections or {}
            payload = AiConnectionsPayload.model_validate(raw)
            return AiConnectionsResponse(
                asr_provider=payload.asr_provider,
                asr_model=payload.asr_model,
                asr_base_url=payload.asr_base_url,
                asr_timeout_seconds=payload.asr_timeout_seconds,
                deployment_mode=payload.deployment_mode,
                document_llm_provider=payload.document_llm_provider,
                document_llm_model_name=payload.document_llm_model_name,
                document_llm_model_value=payload.document_llm_model_value,
                transcription_llm_model_name=payload.transcription_llm_model_name,
                transcription_llm_model_value=payload.transcription_llm_model_value,
                document_llm_base_url=payload.document_llm_base_url,
                rollout_mode=payload.rollout_mode,
                canary_percentage=payload.canary_percentage,
                has_asr_api_key=bool((payload.asr_api_key or "").strip()),
                has_document_llm_api_key=bool((payload.document_llm_api_key or "").strip()),
            )

    def get_ai_connections_raw(self, *, account_id: str) -> AiConnectionsPayload:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).filter(AccountModel.id == account_id).one()
            payload = AiConnectionsPayload.model_validate(account.ai_connections or {})
            payload.asr_api_key = decrypt_secret(payload.asr_api_key, self._settings)
            payload.document_llm_api_key = decrypt_secret(
                payload.document_llm_api_key, self._settings
            )
            return payload

    def update_ai_connections(
        self, *, account_id: str, actor_user_id: str, payload: AiConnectionsPayload
    ) -> AiConnectionsResponse:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).filter(AccountModel.id == account_id).one()
            existing = AiConnectionsPayload.model_validate(account.ai_connections or {})
            next_payload = AiConnectionsPayload(
                asr_provider=payload.asr_provider,
                asr_model=payload.asr_model,
                asr_base_url=payload.asr_base_url,
                asr_api_key=(payload.asr_api_key or existing.asr_api_key or ""),
                asr_timeout_seconds=payload.asr_timeout_seconds,
                deployment_mode=payload.deployment_mode,
                document_llm_provider=payload.document_llm_provider,
                document_llm_model_name=payload.document_llm_model_name,
                document_llm_model_value=payload.document_llm_model_value,
                transcription_llm_model_name=payload.transcription_llm_model_name,
                transcription_llm_model_value=payload.transcription_llm_model_value,
                document_llm_base_url=payload.document_llm_base_url,
                document_llm_api_key=(
                    payload.document_llm_api_key or existing.document_llm_api_key or ""
                ),
                rollout_mode=payload.rollout_mode,
                canary_percentage=payload.canary_percentage,
            )
            persisted = next_payload.model_copy()
            persisted.asr_api_key = encrypt_secret(next_payload.asr_api_key, self._settings)
            persisted.document_llm_api_key = encrypt_secret(
                next_payload.document_llm_api_key, self._settings
            )
            account.ai_connections = persisted.model_dump(mode="json")
            session.add(account)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="ai_connections_updated",
                    target_type="account",
                    target_id=account_id,
                    details={"keys": list(next_payload.model_dump(mode="json").keys())},
                )
            )
            session.commit()
        return self.get_ai_connections(account_id=account_id)

    def get_account_settings(self, *, account_id: str) -> AccountSettingsResponse:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).filter(AccountModel.id == account_id).one()
            return AccountSettingsResponse(
                account_id=account.id,
                provider=account.provider,
                model=account.model,
                fallback_providers=[str(x) for x in (account.fallback_providers or [])],
                provider_by_domain={
                    str(k): str(v) for k, v in (account.provider_by_domain or {}).items()
                },
                model_by_domain={
                    str(k): str(v) for k, v in (account.model_by_domain or {}).items()
                },
            )

    def update_account_settings(
        self,
        *,
        account_id: str,
        actor_user_id: str,
        provider: str,
        model: str,
        fallback_providers: list[str],
        provider_by_domain: dict[str, str],
        model_by_domain: dict[str, str],
    ) -> AccountSettingsResponse:
        with session_scope(self._settings) as session:
            account = session.query(AccountModel).filter(AccountModel.id == account_id).one()
            account.provider = provider
            account.model = model
            account.fallback_providers = fallback_providers
            account.provider_by_domain = provider_by_domain
            account.model_by_domain = model_by_domain
            session.add(account)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="account_settings_updated",
                    target_type="account",
                    target_id=account_id,
                    details={
                        "provider": provider,
                        "model": model,
                        "fallback_providers": fallback_providers,
                    },
                )
            )
            session.commit()
        return self.get_account_settings(account_id=account_id)

    def list_audit_logs(self, *, account_id: str, limit: int = 50) -> list[AuditLogEntry]:
        with session_scope(self._settings) as session:
            rows = (
                session.query(AuditLogModel)
                .filter(AuditLogModel.account_id == account_id)
                .order_by(AuditLogModel.id.desc())
                .limit(limit)
                .all()
            )
            return [
                AuditLogEntry(
                    id=r.id,
                    actor_user_id=r.actor_user_id,
                    action=r.action,
                    target_type=r.target_type,
                    target_id=r.target_id,
                    details=r.details or {},
                    created_at=r.created_at.isoformat() if r.created_at else "",
                )
                for r in rows
            ]

    def logout(self, *, token: str, actor_user_id: str, account_id: str) -> None:
        with session_scope(self._settings) as session:
            s = session.query(SessionModel).filter(SessionModel.token == token).one_or_none()
            if s is not None:
                session.delete(s)
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="logout",
                    target_type="session",
                    target_id=token,
                    details={},
                )
            )
            session.commit()

    def refresh(self, *, token: str, actor_user_id: str, account_id: str) -> str:
        with session_scope(self._settings) as session:
            s = session.query(SessionModel).filter(SessionModel.token == token).one_or_none()
            if s is None:
                raise ValueError("Session not found")
            new_token = secrets.token_urlsafe(32)
            session.delete(s)
            session.add(
                SessionModel(
                    token=new_token,
                    account_id=account_id,
                    user_id=actor_user_id,
                    expires_at=datetime.now() + timedelta(hours=8),
                )
            )
            session.add(
                AuditLogModel(
                    account_id=account_id,
                    actor_user_id=actor_user_id,
                    action="session_refreshed",
                    target_type="session",
                    target_id=new_token,
                    details={},
                )
            )
            session.commit()
            return new_token


_auth_service: AuthService | None = None


def get_auth_service(settings: Settings) -> AuthService:
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService(settings)
    return _auth_service
