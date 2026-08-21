"""
keystone/src/providers/router.py

Picks which provider to call based on environment configuration, and
falls back from the primary provider to the secondary one on failure.

Env vars:
  KEYSTONE_PRIMARY_PROVIDER    "gemini" | "claude" (default: "gemini")
  GEMINI_API_KEY               required if gemini is primary or fallback
  ANTHROPIC_API_KEY            required if claude is primary or fallback

If only one provider's key is configured, that provider is used with no
fallback. If both are configured, the non-primary one is used as fallback
when the primary raises.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Awaitable, Callable

from .claude import call_claude
from .gemini import call_gemini

log = logging.getLogger("keystone.router")

_PROVIDERS: dict[str, Callable[[str, list[dict[str, Any]], str], Awaitable[str]]] = {
    "gemini": call_gemini,
    "claude": call_claude,
}


def _available_providers() -> list[str]:
    available = []
    if os.environ.get("GEMINI_API_KEY"):
        available.append("gemini")
    if os.environ.get("ANTHROPIC_API_KEY"):
        available.append("claude")
    return available


async def call_ai(
    system_prompt: str,
    conversation_history: list[dict[str, Any]],
    user_turn: str,
) -> str:
    available = _available_providers()
    if not available:
        raise RuntimeError("No AI provider configured: set GEMINI_API_KEY and/or ANTHROPIC_API_KEY.")

    primary = os.environ.get("KEYSTONE_PRIMARY_PROVIDER", "gemini")
    if primary not in available:
        primary = available[0]

    order = [primary] + [p for p in available if p != primary]

    last_exc: Exception | None = None
    for i, provider_name in enumerate(order):
        try:
            return await _PROVIDERS[provider_name](system_prompt, conversation_history, user_turn)
        except Exception as exc:  # noqa: BLE001 - deliberately broad, we fall back on any provider failure
            last_exc = exc
            is_last = i == len(order) - 1
            if is_last:
                log.error("[router] provider '%s' failed and no fallback remains: %s", provider_name, exc)
            else:
                log.warning("[router] provider '%s' failed, falling back to '%s': %s", provider_name, order[i + 1], exc)

    assert last_exc is not None
    raise last_exc
