"""Auth, RBAC, invite flow, and admin endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta

from app.config.settings import get_settings
from app.db.models import SessionModel
from app.db.session import session_scope
from fastapi.testclient import TestClient


def _login(
    client: TestClient,
    email: str = "admin@verbasense.local",
    password: str = "Admin@12345",
) -> tuple[str, dict]:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    payload = r.json()
    return payload["access_token"], payload["user"]


def test_admin_endpoints_require_auth(client: TestClient) -> None:
    r = client.get("/api/v1/admin/users")
    assert r.status_code == 401
    assert r.json()["code"] == "unauthorized"


def test_admin_endpoints_require_admin_role(client: TestClient) -> None:
    admin_token, _ = _login(client)
    created = client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "viewer1@verbasense.local",
            "name": "Viewer One",
            "password": "Viewer@123",
            "role": "viewer",
        },
    )
    assert created.status_code == 200

    token, _ = _login(client, email="viewer1@verbasense.local", password="Viewer@123")
    r = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403
    assert r.json()["code"] == "forbidden"


def test_login_and_list_users(client: TestClient) -> None:
    token, user = _login(client)
    r = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(i["user_id"] == user["user_id"] and i["role"] == "admin" for i in items)


def test_invite_accept_and_role_status_updates(client: TestClient) -> None:
    token, _ = _login(client)

    invite = client.post(
        "/api/v1/admin/invites",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "clerk1@verbasense.local", "role": "clerk"},
    )
    assert invite.status_code == 200, invite.text
    invite_code = invite.json()["invite_code"]

    accept = client.post(
        "/api/v1/auth/invite/accept",
        json={"invite_code": invite_code, "name": "Clerk One", "password": "Clerk@123"},
    )
    assert accept.status_code == 200, accept.text

    list_users = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    users = list_users.json()["items"]
    invited_user = next(u for u in users if u["email"] == "clerk1@verbasense.local")

    role_update = client.patch(
        f"/api/v1/admin/users/{invited_user['user_id']}/role",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "judge"},
    )
    assert role_update.status_code == 200

    status_update = client.patch(
        f"/api/v1/admin/users/{invited_user['user_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"active": False},
    )
    assert status_update.status_code == 200


def test_admin_create_user_and_password_management(client: TestClient) -> None:
    token, _ = _login(client)

    create_user = client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "clerk2@verbasense.local",
            "name": "Clerk Two",
            "password": "TempPass@123",
            "role": "clerk",
        },
    )
    assert create_user.status_code == 200, create_user.text
    user_id = create_user.json()["user_id"]

    clerk_token, _ = _login(client, email="clerk2@verbasense.local", password="TempPass@123")
    change_pw = client.patch(
        "/api/v1/me/password",
        headers={"Authorization": f"Bearer {clerk_token}"},
        json={"current_password": "TempPass@123", "new_password": "NextPass@123"},
    )
    assert change_pw.status_code == 200

    reset_pw = client.patch(
        f"/api/v1/admin/users/{user_id}/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_password": "ResetPass@123"},
    )
    assert reset_pw.status_code == 200

    relogin = client.post(
        "/api/v1/auth/login",
        json={"email": "clerk2@verbasense.local", "password": "ResetPass@123"},
    )
    assert relogin.status_code == 200


def test_profile_update_and_me(client: TestClient) -> None:
    admin_token, _ = _login(client)
    created = client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": "viewer2@verbasense.local",
            "name": "Viewer Two",
            "password": "Viewer@456",
            "role": "viewer",
        },
    )
    assert created.status_code == 200

    token, _ = _login(client, email="viewer2@verbasense.local", password="Viewer@456")
    update_profile = client.patch(
        "/api/v1/me/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Viewer Two Updated", "profile_image_url": "https://cdn.example.com/u2.png"},
    )
    assert update_profile.status_code == 200
    assert update_profile.json()["name"] == "Viewer Two Updated"

    me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["profile_image_url"] == "https://cdn.example.com/u2.png"


def test_account_settings_and_audit_logs(client: TestClient) -> None:
    token, _ = _login(client)

    get_settings_resp = client.get(
        "/api/v1/admin/account-settings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_settings_resp.status_code == 200

    put_settings = client.put(
        "/api/v1/admin/account-settings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "provider": "mock",
            "model": "mock-v2",
            "fallback_providers": ["mock"],
            "provider_by_domain": {"courtsense": "mock"},
            "model_by_domain": {"courtsense": "mock-v2"},
        },
    )
    assert put_settings.status_code == 200
    assert put_settings.json()["model"] == "mock-v2"

    logs = client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logs.status_code == 200
    items = logs.json()["items"]
    assert len(items) >= 1
    assert any(i["action"] == "account_settings_updated" for i in items)


def test_session_refresh_logout_and_expiry(client: TestClient) -> None:
    token, _ = _login(client)
    refresh = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert refresh.status_code == 200
    next_token = refresh.json()["access_token"]
    assert next_token != token

    with session_scope(get_settings()) as session:
        s = session.query(SessionModel).filter(SessionModel.token == next_token).one()
        s.expires_at = datetime.now() - timedelta(minutes=5)
        session.add(s)
        session.commit()

    expired = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {next_token}"})
    assert expired.status_code == 401

    token2, _ = _login(client)
    logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token2}"})
    assert logout.status_code == 200

    after_logout = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token2}"})
    assert after_logout.status_code == 401
