"""
keystone/src/main.py

FastAPI application — the internal AI gateway.

Endpoints:
  GET  /health          — liveness check (used by Docker healthcheck)
  POST /v1/generate     — the only endpoint Atrium and Quarry call

Security:
  Every request to /v1/generate must include:
    Authorization: Bearer <KEYSTONE_SERVICE_TOKEN>
  Keystone is never exposed publicly — this token is a defence-in-depth
  measure for the internal Docker network.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .models import (
    AtriumResponse,
    ErrorCode,
    ErrorResponse,
    FallbackPayload,
    GenerateRequest,
    Product,
    QuarryResponse,
)
from .providers.router import call_ai
from .validation import (
    ATRIUM_RETRY_INSTRUCTION,
    atrium_fallback,
    parse_atrium_response,
    parse_quarry_response,
    quarry_fallback,
)

# ── Bootstrap ─────────────────────────────────────────────────────────────────

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("keystone")

app = FastAPI(title="Keystone", version="0.1.0", docs_url=None, redoc_url=None)

TEMPLATES_DIR = Path(__file__).parent / "templates"
bearer = HTTPBearer()


# ── Auth ──────────────────────────────────────────────────────────────────────

def _verify_token(credentials: HTTPAuthorizationCredentials = Security(bearer)) -> None:
    expected = os.environ.get("KEYSTONE_SERVICE_TOKEN", "")
    if not expected or credentials.credentials != expected:
        raise HTTPException(status_code=401, detail="unauthorized")


# ── Template loader ───────────────────────────────────────────────────────────

def _load_template(name: str, variables: dict) -> str:
    path = TEMPLATES_DIR / f"{name}.txt"
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Unknown template: {name}")
    text = path.read_text(encoding="utf-8")
    # Simple {{ key }} substitution
    for k, v in variables.items():
        text = text.replace(f"{{{{ {k} }}}}", json.dumps(v) if isinstance(v, (dict, list)) else str(v))
    return text


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {"service": "keystone", "status": "ok"}


@app.post("/v1/generate")
async def generate(
    req: GenerateRequest,
    _: None = Security(_verify_token),
) -> Union[AtriumResponse, QuarryResponse]:

    history = [m.model_dump() for m in req.conversation_history]

    # ── Atrium path ───────────────────────────────────────────────────────────
    if req.product == Product.atrium:
        system_prompt = _load_template(req.template, req.variables)

        # Build the user turn from the last message in history (pop it off)
        if not history:
            raise HTTPException(status_code=400, detail="conversation_history must not be empty for atrium")

        user_turn = history[-1]["content"]
        prior_history = history[:-1]

        raw = await call_ai(system_prompt, prior_history, user_turn)
        log.info("[atrium] raw output length=%d", len(raw))

        try:
            return parse_atrium_response(raw)
        except ValueError as exc:
            log.warning("[atrium] validation failed on first attempt: %s", exc)

        # ── Retry once ────────────────────────────────────────────────────────
        retry_history = prior_history + [
            {"role": "user",      "content": user_turn},
            {"role": "assistant", "content": raw},
        ]
        raw2 = await call_ai(system_prompt, retry_history, ATRIUM_RETRY_INSTRUCTION)
        log.info("[atrium] retry output length=%d", len(raw2))

        try:
            return parse_atrium_response(raw2)
        except ValueError as exc2:
            log.error("[atrium] validation failed after retry: %s", exc2)
            return _error_response(ErrorCode.validation_failed, str(exc2))

    # ── Quarry path ───────────────────────────────────────────────────────────
    if req.product == Product.quarry:
        vendors = req.variables.get("vendors", [])
        vendor_names = [v["name"] for v in vendors if isinstance(v, dict) and "name" in v]

        # Inject vendors JSON into the template
        variables_with_json = {**req.variables, "vendors_json": vendors}
        user_prompt = _load_template(req.template, variables_with_json)

        raw = await call_ai(
            system_prompt="",   # Quarry template is self-contained; no separate system prompt
            conversation_history=[],
            user_turn=user_prompt,
        )
        log.info("[quarry] raw output length=%d", len(raw))

        result = parse_quarry_response(raw, vendor_names)
        if result.valid:
            return result

        log.warning("[quarry] vendor name validation failed, returning fallback")
        return quarry_fallback()

    raise HTTPException(status_code=400, detail=f"Unknown product: {req.product}")


# ── Error helper ──────────────────────────────────────────────────────────────

def _error_response(code: ErrorCode, message: str) -> JSONResponse:
    body = ErrorResponse(
        error=code,
        message=message,
        fallback=FallbackPayload(reply="Let me follow up on that in a moment."),
    )
    return JSONResponse(status_code=200, content=body.model_dump())
