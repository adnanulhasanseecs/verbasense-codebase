"""Raw audio artifact persistence for audit/compliance."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

from app.config.settings import Settings
from app.db.models import AudioArtifactModel
from app.db.session import session_scope


def save_audio_artifact(
    *,
    settings: Settings,
    audio_bytes: bytes,
    source_type: str,
    account_id: str | None,
    job_id: UUID | None = None,
    live_session_id: str | None = None,
    mime_type: str = "application/octet-stream",
    original_filename: str | None = None,
    legal_hold: bool = False,
) -> dict[str, object]:
    artifact_id = str(uuid4())
    base_dir = Path(settings.audio_artifacts_dir)
    base_dir.mkdir(parents=True, exist_ok=True)
    suffix = ".webm" if "webm" in mime_type else ".wav" if "wav" in mime_type else ".bin"
    path = base_dir / f"{artifact_id}{suffix}"
    path.write_bytes(audio_bytes)
    checksum = hashlib.sha256(audio_bytes).hexdigest()
    retention_until = datetime.now(tz=UTC) + timedelta(days=settings.job_retention_days)
    with session_scope(settings) as session:
        session.add(
            AudioArtifactModel(
                id=artifact_id,
                job_id=str(job_id) if job_id else None,
                live_session_id=live_session_id,
                account_id=account_id,
                source_type=source_type,
                storage_uri=str(path.as_posix()),
                sha256=checksum,
                size_bytes=len(audio_bytes),
                mime_type=mime_type,
                original_filename=original_filename,
                legal_hold=legal_hold,
                retention_until=retention_until,
            )
        )
        session.commit()
    return {
        "id": artifact_id,
        "storage_uri": str(path.as_posix()),
        "sha256": checksum,
        "size_bytes": len(audio_bytes),
        "mime_type": mime_type,
        "retention_until": retention_until.isoformat(),
    }
