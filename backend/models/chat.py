# FILE: models/chat.py | PURPOSE: Pydantic schemas for chat endpoints | CONNECTS TO: routers/chat.py

from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class StreamRequest(BaseModel):
    session_id: str
    messages: list[ChatMessage]
