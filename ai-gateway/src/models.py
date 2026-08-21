"""
keystone/src/models.py

Pydantic models for the /v1/generate contract (appendix §3).
These are the source of truth for request/response shapes — Atrium and Quarry
must match these exactly.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, conint, field_validator


# ── Conversation message (Atrium only) ───────────────────────────────────────

class Role(str, Enum):
    user      = "user"
    assistant = "assistant"


class Message(BaseModel):
    role:    Role
    content: str


# ── Request ───────────────────────────────────────────────────────────────────

class Product(str, Enum):
    atrium = "atrium"
    quarry = "quarry"


class GenerateRequest(BaseModel):
    product:              Product
    template:             str                        # filename in src/templates/ (no extension)
    variables:            dict[str, Any] = {}
    conversation_history: list[Message] = []         # required for atrium, empty for quarry


# ── Atrium state (parsed out of the model's <meta> tag) ──────────────────────

class Segment(str, Enum):
    industrial  = "Industrial & PMC"
    commercial  = "Commercial"
    residential = "Residential"
    interiors   = "Interiors"


class Stage(str, Enum):
    greeting    = "greeting"
    qualifying  = "qualifying"
    showcasing  = "showcasing"
    handoff     = "handoff"


class AtriumState(BaseModel):
    segment:       Optional[Segment]
    lead_score:    conint(ge=0, le=100)      # type: ignore[valid-type]
    stage:         Stage
    handoff_ready: bool


# ── Responses ─────────────────────────────────────────────────────────────────

class AtriumResponse(BaseModel):
    reply: str
    state: Optional[AtriumState]
    valid: bool


class QuarryResponse(BaseModel):
    recommendation: str
    valid:          bool


# ── Error response ────────────────────────────────────────────────────────────

class ErrorCode(str, Enum):
    validation_failed = "validation_failed"
    provider_error    = "provider_error"
    unauthorized      = "unauthorized"


class FallbackPayload(BaseModel):
    reply: str
    state: None = None


class ErrorResponse(BaseModel):
    error:    ErrorCode
    message:  str
    fallback: FallbackPayload
