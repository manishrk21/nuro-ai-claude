# FILE: services/crisis_service.py | PURPOSE: Crisis detection — keyword layer + AI classifier | CONNECTS TO: routers/chat.py, repositories/crisis_repo.py

import asyncio
import logging
import os
from enum import Enum

logger = logging.getLogger(__name__)

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "don't want to be here",
    "self harm", "hurt myself", "not want to wake up", "can't go on",
    "want to die", "no reason to live", "better off dead", "end it all",
    "take my own life", "overdose", "cutting myself",
]

INDIA_RESOURCES = (
    "If you're in crisis right now, please reach out to a trained human counsellor:\n"
    "- iCall (India): 9152987821\n"
    "- Vandrevala Foundation (24/7): 1860-2662-345\n"
    "- International: findahelpline.com"
)


class CrisisLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EMERGENCY = "emergency"


def keyword_scan(message: str) -> bool:
    """Layer 1: Fast keyword scan."""
    lower = message.lower()
    return any(kw in lower for kw in CRISIS_KEYWORDS)


async def ai_classify(message: str) -> CrisisLevel:
    """
    Layer 2: AI risk classifier via a lightweight Groq call.
    Runs async and does NOT block the main streaming response.
    """
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY", ""))
        resp = await asyncio.wait_for(
            client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{
                    "role": "user",
                    "content": (
                        f"Rate the mental health crisis risk level in this message. "
                        f"Reply with ONLY one word: LOW, MODERATE, HIGH, or EMERGENCY.\n\n"
                        f"Message: {message[:500]}"
                    ),
                }],
                max_tokens=5,
                temperature=0,
            ),
            timeout=3.0,
        )
        level_str = resp.choices[0].message.content.strip().upper()
        return CrisisLevel(level_str.lower()) if level_str.lower() in CrisisLevel._value2member_map_ else CrisisLevel.LOW
    except Exception as e:
        logger.warning(f"AI classifier error: {e}")
        return CrisisLevel.LOW


async def assess_crisis(message: str) -> tuple[CrisisLevel, str]:
    """
    Assess crisis level and return (level, crisis_context_for_prompt).
    crisis_context is injected into the AI prompt; empty string means no crisis detected.
    """
    keyword_hit = keyword_scan(message)

    if not keyword_hit:
        return CrisisLevel.NONE, ""

    # Run AI classifier in background — don't await yet for speed
    level = await ai_classify(message)

    crisis_context = ""

    if level == CrisisLevel.LOW:
        logger.info("Crisis level: LOW — logged only")
        crisis_context = ""  # just log, no prompt injection

    elif level == CrisisLevel.MODERATE:
        crisis_context = (
            f"SAFETY CONTEXT: The user's message may indicate emotional distress. "
            f"Gently acknowledge their pain and include crisis resources.\n{INDIA_RESOURCES}"
        )

    elif level == CrisisLevel.HIGH:
        crisis_context = (
            f"SAFETY CONTEXT: High-risk crisis indicators detected. "
            f"Prioritise safety, validate their pain, and prominently include:\n{INDIA_RESOURCES}"
        )

    elif level == CrisisLevel.EMERGENCY:
        crisis_context = (
            f"SAFETY CONTEXT — EMERGENCY: Immediate crisis signals. "
            f"Lead your response with crisis resources before anything else:\n{INDIA_RESOURCES}"
        )

    return level, crisis_context

# CHANGE THIS FILE IF YOU WANT TO: add more crisis keywords, tune classifier prompts, add SMS alert for therapists
