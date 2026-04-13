"""add retry and idempotency fields to jobs

Revision ID: 0002_job_retry_idempotency
Revises: 0001_jobs_and_events
Create Date: 2026-04-13 00:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_job_retry_idempotency"
down_revision: str | Sequence[str] | None = "0001_jobs_and_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "jobs",
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("jobs", sa.Column("idempotency_key", sa.String(length=128), nullable=True))
    op.create_index("ix_jobs_idempotency_key", "jobs", ["idempotency_key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_jobs_idempotency_key", table_name="jobs")
    op.drop_column("jobs", "idempotency_key")
    op.drop_column("jobs", "max_retries")
    op.drop_column("jobs", "retry_count")
