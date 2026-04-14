"""add user password and profile columns

Revision ID: 0004_user_credentials_profile
Revises: 0003_auth_admin_tables
Create Date: 2026-04-13 13:05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_user_credentials_profile"
down_revision: str | Sequence[str] | None = "0003_auth_admin_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=128), nullable=False, server_default=""),
    )
    op.add_column(
        "users", sa.Column("password_salt", sa.String(length=64), nullable=False, server_default="")
    )
    op.add_column("users", sa.Column("profile_image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_image_url")
    op.drop_column("users", "password_salt")
    op.drop_column("users", "password_hash")
