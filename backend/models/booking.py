# FILE: models/booking.py | PURPOSE: Pydantic schemas for booking endpoints | CONNECTS TO: routers/bookings.py

from pydantic import BaseModel
from typing import Optional


class CreateBookingRequest(BaseModel):
    therapist_id: str
    proposed_slots: list[str]  # ISO datetime strings


class NoteRequest(BaseModel):
    patient_id: Optional[str] = None
    session_id: Optional[str] = None
    content: str
