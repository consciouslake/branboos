"""
keystone/src/providers/claude.py

Calls the Claude API (Messages endpoint) and returns the raw text response.
Used as the fallback provider when Gemini fails. Only this file ever
touches ANTHROPIC_API_KEY.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-sonnet-5"
ANTHROPIC_VERSION = "2023-06-01"


async def call_claude(
    system_prompt: str,
    conversation_history: list[dict[str, Any]],
    user_turn: str,
) -> str:
    """
    Send a request to Claude and return the raw text content.

    Claude's Messages API already uses role: user/assistant (no remapping
    needed, unlike Gemini). System prompt is a top-level `system` field.
    """
    api_key = os.environ["ANTHROPIC_API_KEY"]

    messages: list[dict[str, Any]] = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in conversation_history
    ]
    messages.append({"role": "user", "content": user_turn})

    payload: dict[str, Any] = {
        "model": CLAUDE_MODEL,
        "max_tokens": 1024,
        "temperature": 0.3,
        "system": system_prompt,
        "messages": messages,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    try:
        return "".join(
            block["text"] for block in data["content"] if block.get("type") == "text"
        )
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Claude response shape: {data}") from exc
