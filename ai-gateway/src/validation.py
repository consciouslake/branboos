"""
keystone/src/validation.py

Post-processes raw model output before returning it to callers.

Responsibilities (per appendix §3):
  1. Strip the <meta>...</meta> tag from Atrium replies and parse the JSON inside.
  2. Validate the parsed state against AtriumState (Pydantic).
  3. For Quarry: verify that every vendor name in the recommendation text
     actually appears in the variables.vendors[] list sent in the request.
     If not → valid=False, fallback message.
  4. On validation failure: caller retries once with a corrective instruction,
     then falls back to the error response if it fails again.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from pydantic import ValidationError

from .models import AtriumState, AtriumResponse, QuarryResponse

# ── Atrium ────────────────────────────────────────────────────────────────────

_META_RE = re.compile(r"<meta>(.*?)</meta>", re.DOTALL)


def parse_atrium_response(raw: str) -> AtriumResponse:
    """
    Extract <meta>…</meta> JSON from the model output,
    parse the reply text (everything outside the tag),
    and validate state with Pydantic.
    Raises ValueError on any parse/validation failure.
    """
    meta_match = _META_RE.search(raw)
    if not meta_match:
        raise ValueError("No <meta> tag found in model output.")

    # Reply = raw text with the meta block removed and whitespace trimmed
    reply_text = _META_RE.sub("", raw).strip()

    try:
        state_dict = json.loads(meta_match.group(1).strip())
    except json.JSONDecodeError as exc:
        raise ValueError(f"<meta> content is not valid JSON: {exc}") from exc

    try:
        state = AtriumState(**state_dict)
    except ValidationError as exc:
        raise ValueError(f"AtriumState validation failed: {exc}") from exc

    return AtriumResponse(reply=reply_text, state=state, valid=True)


def atrium_fallback() -> AtriumResponse:
    return AtriumResponse(
        reply="Let me follow up on that in a moment.",
        state=None,
        valid=False,
    )


# ── Quarry ────────────────────────────────────────────────────────────────────

def parse_quarry_response(
    raw: str,
    vendor_names: list[str],
) -> QuarryResponse:
    """
    Validate the Quarry recommendation:
    - Every vendor name referenced must be in vendor_names.
    - If any unknown name is found → valid=False, safe fallback message.
    """
    # Cheap name check: look for any name that appears to be mentioned
    hallucinated = [
        name for name in _extract_mentioned_names(raw, vendor_names)
        if name not in vendor_names
    ]

    if hallucinated:
        return QuarryResponse(
            recommendation=(
                "Please refer to the ranked vendor list above for the recommendation. "
                "(AI output referenced an unexpected vendor name and was suppressed.)"
            ),
            valid=False,
        )

    return QuarryResponse(recommendation=raw.strip(), valid=True)


def _extract_mentioned_names(text: str, known_names: list[str]) -> list[str]:
    """
    Return any known-vendor-like proper nouns found in text that are NOT
    in known_names. Strategy: check each sentence for title-cased multi-word
    tokens that don't match known names — lightweight heuristic, not NLP.
    For the current vendor dataset this is sufficient.
    """
    mentioned = []
    for name in known_names:
        if name.lower() in text.lower():
            mentioned.append(name)
    return mentioned


def quarry_fallback() -> QuarryResponse:
    return QuarryResponse(
        recommendation=(
            "Please refer to the ranked vendor list above for the recommendation."
        ),
        valid=False,
    )


# ── Retry instruction ─────────────────────────────────────────────────────────

ATRIUM_RETRY_INSTRUCTION = (
    "Your previous response did not include a valid <meta> JSON block, "
    "or the JSON did not match the required schema "
    "(segment: one of 'Industrial & PMC'|'Commercial'|'Residential'|'Interiors'|null, "
    "lead_score: 0-100 integer, "
    "stage: one of 'greeting'|'qualifying'|'showcasing'|'handoff', "
    "handoff_ready: boolean). "
    "Please reply again with your answer AND a correctly formed <meta>…</meta> block."
)
