"""add account ai_connections and optional job account_id

Revision ID: 0005_account_ai_connections_job_account
Revises: 0004_user_credentials_profile
Create Date: 2026-04-13 18:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_account_ai_connections_job_account"
down_revision: str | Sequence[str] | None = "0004_user_credentials_profile"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name if bind is not None else ""
    op.add_column("accounts", sa.Column("ai_connections", sa.JSON(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("account_id", sa.String(length=36), nullable=True),
    )
    if dialect != "sqlite":
        op.create_foreign_key(
            "fk_jobs_account_id_accounts",
            "jobs",
            "accounts",
            ["account_id"],
            ["id"],
            ondelete="SET NULL",
        )
    op.create_index("ix_jobs_account_id", "jobs", ["account_id"])


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name if bind is not None else ""
    op.drop_index("ix_jobs_account_id", table_name="jobs")
    if dialect != "sqlite":
        op.drop_constraint("fk_jobs_account_id_accounts", "jobs", type_="foreignkey")
    op.drop_column("jobs", "account_id")
    op.drop_column("accounts", "ai_connections")
