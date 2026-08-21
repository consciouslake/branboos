"""
keystone/src/providers/gemini.py

Calls the Gemini API (gemini-3.6-flash) and returns the raw text response.
Only this file ever touches GEMINI_API_KEY.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.6-flash:generateContent"
)


async def call_gemini(
    system_prompt: str,
    conversation_history: list[dict[str, Any]],
    user_turn: str,
) -> str:
    """
    Send a request to Gemini and return the raw text content.

    Gemini uses `contents` with `role: user/model` (not `assistant`).
    System prompt is passed as a separate `system_instruction` field.
    """
    api_key = os.environ["GEMINI_API_KEY"]

    # Map conversation history to Gemini's role names
    contents: list[dict[str, Any]] = []
    for msg in conversation_history:
        gemini_role = "model" if msg["role"] == "assistant" else "user"
        contents.append({
            "role": gemini_role,
            "parts": [{"text": msg["content"]}],
        })

    # Append the new user turn
    contents.append({
        "role": "user",
        "parts": [{"text": user_turn}],
    })

    payload: dict[str, Any] = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature": 0.3,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GEMINI_API_URL,
            params={"key": api_key},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response shape: {data}") from exc
