"""add audio artifacts and live sessions

Revision ID: 0006_audio_artifacts_live_sessions
Revises: 0005_account_ai_connections_job_account
Create Date: 2026-04-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_audio_artifacts_live_sessions"
down_revision: str | None = "0005_account_ai_connections_job_account"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "audio_artifacts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=True),
        sa.Column("live_session_id", sa.String(length=36), nullable=True),
        sa.Column("account_id", sa.String(length=36), nullable=True),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("storage_uri", sa.String(length=500), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=True),
        sa.Column("legal_hold", sa.Boolean(), nullable=False),
        sa.Column("retention_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audio_artifacts_job_id", "audio_artifacts", ["job_id"], unique=False)
    op.create_index("ix_audio_artifacts_live_session_id", "audio_artifacts", ["live_session_id"], unique=False)
    op.create_index("ix_audio_artifacts_account_id", "audio_artifacts", ["account_id"], unique=False)
    op.create_index("ix_audio_artifacts_source_type", "audio_artifacts", ["source_type"], unique=False)
    op.create_index("ix_audio_artifacts_sha256", "audio_artifacts", ["sha256"], unique=False)

    op.create_table(
        "live_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("account_id", sa.String(length=36), nullable=True),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("courtroom", sa.String(length=120), nullable=False),
        sa.Column("speaker", sa.String(length=120), nullable=False),
        sa.Column("input_device", sa.String(length=255), nullable=False),
        sa.Column("sample_rate", sa.Integer(), nullable=False),
        sa.Column("chunk_duration_ms", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("timeline_progress", sa.Integer(), nullable=False),
        sa.Column("speaker_activity", sa.JSON(), nullable=False),
        sa.Column("waveform", sa.JSON(), nullable=False),
        sa.Column("transcript_payload", sa.JSON(), nullable=False),
        sa.Column("intelligence_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_live_sessions_account_id", "live_sessions", ["account_id"], unique=False)
    op.create_index("ix_live_sessions_actor_user_id", "live_sessions", ["actor_user_id"], unique=False)
    op.create_index("ix_live_sessions_status", "live_sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_live_sessions_status", table_name="live_sessions")
    op.drop_index("ix_live_sessions_actor_user_id", table_name="live_sessions")
    op.drop_index("ix_live_sessions_account_id", table_name="live_sessions")
    op.drop_table("live_sessions")

    op.drop_index("ix_audio_artifacts_sha256", table_name="audio_artifacts")
    op.drop_index("ix_audio_artifacts_source_type", table_name="audio_artifacts")
    op.drop_index("ix_audio_artifacts_account_id", table_name="audio_artifacts")
    op.drop_index("ix_audio_artifacts_live_session_id", table_name="audio_artifacts")
    op.drop_index("ix_audio_artifacts_job_id", table_name="audio_artifacts")
    op.drop_table("audio_artifacts")
