"""Mock pipeline determinism."""

from uuid import UUID

from app.core.pipeline import build_mock_output
from app.schemas.domain_config import DomainConfigPayload, PipelineConfig, UIConfig, UILabels
from app.schemas.upload import UploadMetadata


def _cfg() -> DomainConfigPayload:
    return DomainConfigPayload(
        id="courtsense",
        domain="judicial",
        features=["transcription"],
        ui=UIConfig(
            name="CourtSense",
            labels=UILabels(summary="S", actions="A", decisions="D"),
        ),
        pipeline=PipelineConfig(stages=["a", "b"]),
        entities=["case"],
    )


def test_deterministic_output() -> None:
    jid = UUID("00000000-0000-4000-8000-000000000001")
    cfg = _cfg()
    meta = UploadMetadata()
    o1 = build_mock_output(jid, cfg, meta)
    o2 = build_mock_output(jid, cfg, meta)
    assert o1.model_dump() == o2.model_dump()
