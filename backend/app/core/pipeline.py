"""Deterministic mock pipeline — no external AI calls."""

from __future__ import annotations

import hashlib
from uuid import UUID

from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import ActionItem, Entity, OutputSchema, TranscriptSegment
from app.schemas.upload import UploadMetadata


def _digest(job_id: UUID) -> bytes:
    return hashlib.sha256(str(job_id).encode("utf-8")).digest()


def should_fail_job(job_id: UUID, failure_rate: float, force_failure: bool) -> bool:
    """Deterministic failure: combine rate with hash bucket."""
    if force_failure:
        return True
    if failure_rate <= 0.0:
        return False
    if failure_rate >= 1.0:
        return True
    b = _digest(job_id)[0] / 255.0
    return b < failure_rate


def build_mock_output(
    job_id: UUID,
    domain_cfg: DomainConfigPayload,
    metadata: UploadMetadata,
) -> OutputSchema:
    """Create repeatable output from job id and config."""
    d = _digest(job_id)
    case_ref = metadata.case_id or f"CASE-{d[0]:03d}-{d[1]:03d}"
    room = metadata.courtroom or ("Room A" if d[2] % 2 == 0 else "Room B")

    speakers = ["Judge", "Clerk", "Counsel A", "Witness"]
    lines = [
        f"This hearing is now in session for matter {case_ref} in {room}.",
        "The court has reviewed the filings on the record.",
        "Counsel, please present your opening remarks.",
        "Thank you. The court will take this under advisement.",
    ]
    transcript: list[TranscriptSegment] = []
    t = 0
    for i, text in enumerate(lines):
        spk = speakers[(d[i] + i) % len(speakers)]
        dur = 8000 + (d[i + 4] % 4000)
        transcript.append(
            TranscriptSegment(
                speaker=spk,
                text=text,
                start_ms=t,
                end_ms=t + dur,
            )
        )
        t += dur + 500

    summary = (
        f"Proceedings for {case_ref} covered scheduling, evidentiary questions, "
        f"and next steps. Domain profile: {domain_cfg.ui.name}."
    )
    decisions = [
        "Court accepted the exhibit index subject to minor corrections.",
        "Continuance granted for supplemental briefing.",
    ]
    actions = [
        ActionItem(
            text="File supplemental brief by agreed deadline",
            owner="Counsel A",
            priority="high",
        ),
        ActionItem(text="Serve notice on opposing party", owner="Clerk", priority="medium"),
    ]
    entities = [
        Entity(type="case", value=case_ref),
        Entity(type="judge", value="Hon. J. Mercer"),
        Entity(type="evidence", value="Exhibit packet A-1"),
    ]

    return OutputSchema(
        transcript=transcript,
        summary=summary,
        key_decisions=decisions,
        actions=actions,
        entities=entities,
        schema_version="v1",
    )
