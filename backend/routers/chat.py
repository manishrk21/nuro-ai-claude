# FILE: routers/chat.py | PURPOSE: POST /api/stream — protected SSE chat endpoint | CONNECTS TO: services/ai_service.py, services/crisis_service.py, repositories/chat_repo.py

import asyncio
import json
import logging
import time
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from models.chat import StreamRequest
from utils.supabase_client import verify_jwt
from repositories.chat_repo import chat_repo
from repositories.profile_repo import profile_repo
from services.ai_service import stream_response
from services.crisis_service import assess_crisis, CrisisLevel

logger = logging.getLogger(__name__)
router = APIRouter()

FREE_LIMIT = 50000
PRO_LIMIT = 50000


def _get_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")
    token = auth.split(" ", 1)[1]
    try:
        return verify_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# def _get_user_profile(user_id: str) -> dict:
#     """Fetch safe profile fields to inject into the AI prompt."""
#     prefs = profile_repo.get_preferences(user_id)
#     if not prefs:
#         return {}
#     data = prefs.get("onboarding_data") or {}
#     # Only include fields relevant for personalisation — never financial_comfort
#     return {
#         "age": data.get("age"),
#         "country": data.get("country"),
#         "therapy_history": data.get("therapy_history"),
#         "support_expectation": data.get("support_expectation"),
#         "sleep_quality": prefs.get("sleep_quality"),
#     }
def _get_user_profile(user_id: str) -> dict:
    """Fetch safe profile fields to inject into the AI prompt."""
    try:
        prefs = profile_repo.get_preferences(user_id)
        # Safe check: if prefs is None, empty, or not a dictionary, return empty profile
        if not prefs or not isinstance(prefs, dict):
            return {}
        
        data = prefs.get("onboarding_data") or {}
        if not isinstance(data, dict):
            data = {}
            
        return {
            "age": data.get("age"),
            "country": data.get("country"),
            "therapy_history": data.get("therapy_history"),
            "support_expectation": data.get("support_expectation"),
            "sleep_quality": prefs.get("sleep_quality"),
        }
    except Exception as e:
        logger.warning(f"Failed to fetch user profile safely: {e}")
        return {}


@router.post("/stream")
async def stream_chat(request: Request, body: StreamRequest):
    start = time.time()
    user = _get_user(request)
    user_id = user["id"]

    # ── Quota check ────────────────────────────────────────────────────────
    # quota = chat_repo.check_quota(user_id)
    # plan = quota.get("plan", "free")
    quota = chat_repo.check_quota(user_id) or {"count": 0, "plan": "free"}
    plan = quota.get("plan", "free")

    limit = PRO_LIMIT if plan == "pro" else FREE_LIMIT
    if quota.get("count", 0) >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"You've reached your daily limit of {limit} messages. Upgrade to Pro for more.",
        )

    # Increment quota count
    chat_repo.increment_quota(user_id)

    # ── Crisis detection (async, non-blocking) ────────────────────────────
    last_user_msg = ""
    for msg in reversed(body.messages):
        if msg.role == "user":
            last_user_msg = msg.content
            break

    crisis_level, crisis_context = await assess_crisis(last_user_msg)

    # Log crisis event if flagged
    if crisis_level != CrisisLevel.NONE:
        try:
            msg_id = str(uuid.uuid4())
            chat_repo.log_crisis(
                user_id=user_id,
                session_id=body.session_id,
                message_id=msg_id,
                severity=crisis_level.value,
                detected_by="keyword+classifier",
            )
            logger.warning(f"Crisis detected: level={crisis_level.value}, user={user_id[:8]}…")
        except Exception as e:
            logger.error(f"Failed to log crisis: {e}")

    # ── Load recent history for context ──────────────────────────────────
    try:
        recent = chat_repo.get_recent_messages(body.session_id, limit=20)
        history_str = "\n".join(f"{m['role']}: {m['content'][:200]}" for m in recent[-6:])
    except Exception:
        history_str = ""

    # ── User profile for prompt ───────────────────────────────────────────
    user_profile = _get_user_profile(user_id)

    # ── Build messages list ───────────────────────────────────────────────
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    # ── SSE generator ─────────────────────────────────────────────────────
    async def event_generator():
        total_tokens = 0
        full_response = []

        try:
            async for token in stream_response(
                messages=messages,
                user_profile=user_profile,
                crisis_context=crisis_context,
                recent_history=history_str,
            ):
                full_response.append(token)
                total_tokens += 1
                yield f"data: {json.dumps({'token': token})}\n\n"

            # Done event
            yield f"data: {json.dumps({'done': True, 'tokens_used': total_tokens})}\n\n"

            # Save assistant message
            try:
                chat_repo.save_message(body.session_id, "assistant", "".join(full_response), total_tokens)
            except Exception as e:
                logger.error(f"Failed to save assistant message: {e}")

            duration_ms = round((time.time() - start) * 1000)
            logger.info(f"stream_chat: user={user_id[:8]}… tokens={total_tokens} duration={duration_ms}ms")

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': 'Stream interrupted. Please try again.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

# CHANGE THIS FILE IF YOU WANT TO: adjust quota limits, add session title auto-generation, add message moderation
