# FILE: services/ai_service.py | PURPOSE: LLM fallback chain (Groq → Gemini → Anthropic) with streaming | CONNECTS TO: routers/chat.py, constants/ai_config.py

import os
import asyncio
import logging
from typing import AsyncGenerator
from constants.ai_config import NURO_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _build_system_prompt(user_profile: dict, recent_history: str, crisis_context: str) -> str:
    """Inject user context into the system prompt template."""
    profile_str = ", ".join(f"{k}: {v}" for k, v in user_profile.items() if v) if user_profile else "No profile data"
    return NURO_SYSTEM_PROMPT.format(
        userProfile=profile_str,
        recentHistory=recent_history or "No prior history",
        crisisContext=crisis_context or "None",
    )


async def _stream_groq(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
    """Stream from Groq llama-3.3-70b-versatile."""
    if not os.environ.get("GROQ_API_KEY"):
        raise ValueError("Missing GROQ_API_KEY environment variable")
        
    from groq import AsyncGroq
    client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=full_messages,
        stream=True,
        max_tokens=1024,
        temperature=0.7,
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


async def _stream_gemini(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
    """Stream from Gemini Flash as fallback."""
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("Missing GEMINI_API_KEY environment variable")

    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt,
    )

    history = []
    for msg in messages[:-1]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        })

    chat = model.start_chat(history=history)
    last_msg = messages[-1]["content"] if messages else ""

    response = await asyncio.to_thread(
        lambda: chat.send_message(last_msg, stream=True)
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text


async def _stream_anthropic(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
    """Stream from Anthropic Claude as final fallback."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("Missing ANTHROPIC_API_KEY environment variable")

    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    async with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def stream_response(
    messages: list,
    user_profile: dict,
    crisis_context: str = "",
    recent_history: str = "",
) -> AsyncGenerator[str, None]:
    """
    Main entry point: try Groq → Gemini → Anthropic.
    Yields string tokens as they arrive.
    """
    system_prompt = _build_system_prompt(user_profile, recent_history, crisis_context)

    providers = [
        ("Groq", _stream_groq),
        ("Gemini", _stream_gemini),
        ("Anthropic", _stream_anthropic),
    ]

    for name, provider_fn in providers:
        try:
            logger.info(f"Attempting AI provider: {name}")
            tokens_yielded = 0
            last_token_time = asyncio.get_event_loop().time()

            async for token in provider_fn(messages, system_prompt):
                now = asyncio.get_event_loop().time()
                if tokens_yielded > 0 and (now - last_token_time) > 4.0:
                    raise asyncio.TimeoutError(f"{name} token timeout")
                last_token_time = now
                tokens_yielded += 1
                yield token

            logger.info(f"Completed with {name}, tokens: {tokens_yielded}")
            return

        except Exception as e:
            logger.error(f"AI Provider {name} failed with error: {str(e)}")
            continue

    # Clean error delivery fallback tokens that won't break the frontend JSON layout parser
    error_msg = "Error: All AI providers failed. Check your GROQ_API_KEY environment variable in Render."
    for token in error_msg.split(" "):
        yield token + " "



# # FILE: services/ai_service.py | PURPOSE: LLM fallback chain (Groq → Gemini → Anthropic) with streaming | CONNECTS TO: routers/chat.py, constants/ai_config.py

# import os
# import asyncio
# import logging
# from typing import AsyncGenerator
# from constants.ai_config import NURO_SYSTEM_PROMPT

# logger = logging.getLogger(__name__)


# def _build_system_prompt(user_profile: dict, recent_history: str, crisis_context: str) -> str:
#     """Inject user context into the system prompt template."""
#     profile_str = ", ".join(f"{k}: {v}" for k, v in user_profile.items() if v) if user_profile else "No profile data"
#     return NURO_SYSTEM_PROMPT.format(
#         userProfile=profile_str,
#         recentHistory=recent_history or "No prior history",
#         crisisContext=crisis_context or "None",
#     )


# async def _stream_groq(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
#     """Stream from Groq llama-3.3-70b-versatile."""
#     from groq import AsyncGroq

#     client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

#     full_messages = [{"role": "system", "content": system_prompt}] + messages

#     stream = await client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=full_messages,
#         stream=True,
#         max_tokens=1024,
#         temperature=0.7,
#     )

#     async for chunk in stream:
#         token = chunk.choices[0].delta.content
#         if token:
#             yield token


# async def _stream_gemini(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
#     """Stream from Gemini Flash as fallback."""
#     import google.generativeai as genai

#     genai.configure(api_key=os.environ["GEMINI_API_KEY"])
#     model = genai.GenerativeModel(
#         model_name="gemini-1.5-flash",
#         system_instruction=system_prompt,
#     )

#     # Convert to Gemini format
#     history = []
#     for msg in messages[:-1]:
#         history.append({
#             "role": "user" if msg["role"] == "user" else "model",
#             "parts": [msg["content"]],
#         })

#     chat = model.start_chat(history=history)
#     last_msg = messages[-1]["content"] if messages else ""

#     response = await asyncio.to_thread(
#         lambda: chat.send_message(last_msg, stream=True)
#     )

#     for chunk in response:
#         if chunk.text:
#             yield chunk.text


# async def _stream_anthropic(messages: list, system_prompt: str) -> AsyncGenerator[str, None]:
#     """Stream from Anthropic Claude as final fallback."""
#     import anthropic

#     client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

#     async with client.messages.stream(
#         model="claude-haiku-4-5-20251001",
#         max_tokens=1024,
#         system=system_prompt,
#         messages=messages,
#     ) as stream:
#         async for text in stream.text_stream:
#             yield text


# async def stream_response(
#     messages: list,
#     user_profile: dict,
#     crisis_context: str = "",
#     recent_history: str = "",
# ) -> AsyncGenerator[str, None]:
#     """
#     Main entry point: try Groq → Gemini → Anthropic.
#     Yields string tokens as they arrive.
#     Applies a 4-second timeout per provider before falling back.
#     """
#     system_prompt = _build_system_prompt(user_profile, recent_history, crisis_context)

#     providers = [
#         ("Groq", _stream_groq),
#         ("Gemini", _stream_gemini),
#         ("Anthropic", _stream_anthropic),
#     ]

#     for name, provider_fn in providers:
#         try:
#             logger.info(f"Attempting AI provider: {name}")
#             tokens_yielded = 0
#             last_token_time = asyncio.get_event_loop().time()

#             async for token in provider_fn(messages, system_prompt):
#                 now = asyncio.get_event_loop().time()
#                 if tokens_yielded > 0 and (now - last_token_time) > 4.0:
#                     raise asyncio.TimeoutError(f"{name} token timeout")
#                 last_token_time = now
#                 tokens_yielded += 1
#                 yield token

#             logger.info(f"Completed with {name}, tokens: {tokens_yielded}")
#             return

#         except Exception as e:
#             logger.warning(f"{name} failed: {e}. Trying next provider.")
#             continue

#     # All providers failed
#     yield "Something went wrong on my end. Please try again in a moment."

# # CHANGE THIS FILE IF YOU WANT TO: adjust timeout thresholds, add more providers, change model versions
