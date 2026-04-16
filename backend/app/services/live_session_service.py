"""Live audio session ingestion and intelligence finalization."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.config.settings import Settings
from app.db.models import LiveSessionModel
from app.db.session import session_scope
from app.providers import get_output_provider
from app.schemas.domain_config import DomainConfigPayload
from app.schemas.output import OutputSchema, TranscriptSegment
from app.schemas.upload import UploadMetadata
from app.services.audio_artifacts import save_audio_artifact


class LiveSessionService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._provider = get_output_provider(settings)
        self._buffers: dict[str, bytearray] = {}
        self._speaker_slots = ("spk-1", "spk-2", "spk-3")
        self._sample_utterances = (
            "The court will proceed with the matter.",
            "We request a short adjournment to review the evidence.",
            "Please confirm the timeline for submission.",
            "The objection is noted for the record.",
            "Counsel may continue the argument.",
            "The witness statement is now being reviewed.",
        )

    def start(
        self,
        *,
        account_id: str,
        actor_user_id: str,
        courtroom: str,
        speaker: str,
        input_device: str,
        sample_rate: int,
        chunk_duration_ms: int,
    ) -> dict[str, object]:
        session_id = str(uuid4())
        model = LiveSessionModel(
            id=session_id,
            account_id=account_id,
            actor_user_id=actor_user_id,
            status="live",
            courtroom=courtroom,
            speaker=speaker,
            input_device=input_device,
            sample_rate=sample_rate,
            chunk_duration_ms=chunk_duration_ms,
            duration_ms=0,
            timeline_progress=0,
            speaker_activity=[
                {"label": "Judge", "value": 40},
                {"label": "Counsel", "value": 35},
                {"label": "Clerk", "value": 25},
            ],
            waveform=[],
            transcript_payload=[],
            intelligence_payload={"speaker_labels": {}},
        )
        with session_scope(self._settings) as session:
            session.add(model)
            session.commit()
        self._buffers[session_id] = bytearray()
        return self.get(session_id)

    def append_chunk(self, *, session_id: str, chunk: bytes, mime_type: str) -> dict[str, object]:
        with session_scope(self._settings) as session:
            model = session.get(LiveSessionModel, session_id)
            if model is None:
                raise ValueError("Live session not found")
            if model.status != "live":
                raise ValueError("Live session is not active")
            buf = self._buffers.setdefault(session_id, bytearray())
            buf.extend(chunk)
            next_duration = model.duration_ms + model.chunk_duration_ms
            model.duration_ms = next_duration
            model.timeline_progress = min(99, int(next_duration / 1000))
            sample = 20 + (len(model.waveform) % 70)
            model.waveform = [*model.waveform[-47:], sample]
            transcript = [*model.transcript_payload]
            event_ts = datetime.now(tz=UTC)
            slot_index = len(transcript) % len(self._speaker_slots)
            speaker_id = self._speaker_slots[slot_index]
            mapping = dict((model.intelligence_payload or {}).get("speaker_labels", {}))
            speaker_label = mapping.get(speaker_id, f"Speaker {slot_index + 1}")
            transcript.append(
                {
                    "id": f"live-{session_id[:8]}-{event_ts.strftime('%H%M%S%f')}",
                    "speaker_id": speaker_id,
                    "speaker": speaker_label,
                    "text": self._sample_utterances[len(transcript) % len(self._sample_utterances)],
                    "timestamp": event_ts.strftime("%H:%M:%S"),
                }
            )
            model.transcript_payload = transcript[-60:]
            session.add(model)
            session.commit()
        _ = mime_type
        return self.get(session_id)

    def set_status(self, *, session_id: str, status: str) -> dict[str, object]:
        with session_scope(self._settings) as session:
            model = session.get(LiveSessionModel, session_id)
            if model is None:
                raise ValueError("Live session not found")
            model.status = status
            session.add(model)
            session.commit()
        return self.get(session_id)

    def stop(self, *, session_id: str) -> dict[str, object]:
        with session_scope(self._settings) as session:
            model = session.get(LiveSessionModel, session_id)
            if model is None:
                raise ValueError("Live session not found")
            audio = bytes(self._buffers.get(session_id, bytearray()))
            artifact: dict[str, object] | None = None
            output: OutputSchema | None = None
            stop_error: str | None = None
            if audio:
                try:
                    artifact = save_audio_artifact(
                        settings=self._settings,
                        audio_bytes=audio,
                        source_type="live",
                        account_id=model.account_id,
                        live_session_id=model.id,
                        mime_type="audio/webm",
                        original_filename=f"live-{model.id}.webm",
                    )
                    output = self._generate_intelligence_from_transcript(model)
                except Exception as exc:  # noqa: BLE001
                    stop_error = str(exc)
            else:
                stop_error = "No audio chunks were captured before stop."
            model.status = "stopped"
            model.completed_at = datetime.now(tz=UTC)
            model.transcript_payload = model.transcript_payload or []
            labels = dict((model.intelligence_payload or {}).get("speaker_labels", {}))
            model.intelligence_payload = (
                {
                    "summary": output.summary,
                    "decisions": output.key_decisions,
                    "actions": [item.model_dump(mode="json") for item in output.actions],
                    "entities": [entity.model_dump(mode="json") for entity in output.entities],
                    "speaker_labels": labels,
                    "artifact": artifact,
                }
                if output is not None
                else {
                    "summary": "Live session stopped. Intelligence output is unavailable for this capture.",
                    "decisions": [],
                    "actions": [],
                    "entities": [],
                    "speaker_labels": labels,
                    "artifact": artifact,
                    "warning": stop_error,
                }
            )
            session.add(model)
            session.commit()
        self._buffers.pop(session_id, None)
        return self.get(session_id)

    def relabel_speakers(
        self, *, session_id: str, speaker_labels: dict[str, str]
    ) -> dict[str, object]:
        with session_scope(self._settings) as session:
            model = session.get(LiveSessionModel, session_id)
            if model is None:
                raise ValueError("Live session not found")
            cleaned = {
                key.strip(): value.strip()
                for key, value in speaker_labels.items()
                if key and value and value.strip()
            }
            transcript = [*model.transcript_payload]
            for line in transcript:
                spk_id = str(line.get("speaker_id", "")).strip()
                if spk_id and spk_id in cleaned:
                    line["speaker"] = cleaned[spk_id]
            model.transcript_payload = transcript
            payload = dict(model.intelligence_payload or {})
            existing = dict(payload.get("speaker_labels", {}))
            existing.update(cleaned)
            payload["speaker_labels"] = existing
            model.intelligence_payload = payload
            output = self._generate_intelligence_from_transcript(model)
            payload.update(
                {
                    "summary": output.summary,
                    "decisions": output.key_decisions,
                    "actions": [item.model_dump(mode="json") for item in output.actions],
                    "entities": [entity.model_dump(mode="json") for entity in output.entities],
                }
            )
            model.intelligence_payload = payload
            session.add(model)
            session.commit()
        return self.get(session_id)

    def get(self, session_id: str) -> dict[str, object]:
        with session_scope(self._settings) as session:
            model = session.get(LiveSessionModel, session_id)
            if model is None:
                raise ValueError("Live session not found")
            return _to_payload(model)

    def _generate_intelligence_from_transcript(self, model: LiveSessionModel) -> OutputSchema:
        domain_cfg = DomainConfigPayload.model_validate(
            {
                "id": "courtsense",
                "domain": "CourtSense",
                "features": [],
                "ui": {"name": "CourtSense", "labels": {"summary": "Summary", "actions": "Actions", "decisions": "Decisions"}},
                "pipeline": {"stages": ["ingest", "transcribe", "intelligence"]},
                "entities": [],
            }
        )
        transcript = [
            TranscriptSegment(
                speaker=str(line.get("speaker", "Speaker")),
                text=str(line.get("text", "")),
                start_ms=None,
                end_ms=None,
            )
            for line in (model.transcript_payload or [])
        ]
        intelligence = self._provider.generate_output(
            job_id=uuid4(),
            domain_cfg=domain_cfg,
            metadata=UploadMetadata(case_id=None, courtroom=model.courtroom),
            flow="transcription_intelligence",
            transcript=transcript,
            account_overlay={},
        )
        return OutputSchema.model_validate(
            {
                **intelligence.output,
                "transcript": [segment.model_dump(mode="json") for segment in transcript],
            }
        )

    def latest(self, *, account_id: str | None = None) -> dict[str, object] | None:
        with session_scope(self._settings) as session:
            query = session.query(LiveSessionModel)
            if account_id:
                query = query.filter(LiveSessionModel.account_id == account_id)
            model = query.order_by(LiveSessionModel.updated_at.desc()).first()
            if model is None:
                return None
            return _to_payload(model)


def _to_payload(model: LiveSessionModel) -> dict[str, object]:
    duration_label = f"{int(model.duration_ms // 3600000):02}:{int((model.duration_ms // 60000) % 60):02}:{int((model.duration_ms // 1000) % 60):02}"
    return {
        "sessionId": model.id,
        "courtroom": model.courtroom,
        "speaker": model.speaker,
        "timelineProgress": max(0.0, min(1.0, model.timeline_progress / 100)),
        "durationLabel": duration_label,
        "speakerActivity": model.speaker_activity or [],
        "waveform": model.waveform or [],
        "transcript": model.transcript_payload or [],
        "status": model.status if model.status in {"live", "paused", "stopped"} else "stopped",
        "inputDevice": model.input_device,
        "sampleRate": model.sample_rate,
        "chunkDurationMs": model.chunk_duration_ms,
        "intelligence": model.intelligence_payload,
    }


_service: LiveSessionService | None = None


def get_live_session_service(settings: Settings) -> LiveSessionService:
    global _service
    if _service is None:
        _service = LiveSessionService(settings)
    return _service
