"""ASR provider factory."""

from __future__ import annotations

from app.asr.mock_provider import MockAsrProvider
from app.asr.openai_compatible_provider import OpenAICompatibleAsrProvider
from app.asr.types import AsrProvider
from app.config.settings import Settings


def get_asr_provider(settings: Settings) -> AsrProvider:
    key = settings.asr_provider.strip().lower()
    if key in {"mock", "mock_asr"}:
        return MockAsrProvider()
    if key in {"openai", "openai-compatible", "self-hosted-whisper", "on-prem-whisper"}:
        return OpenAICompatibleAsrProvider(settings)
    return MockAsrProvider()
