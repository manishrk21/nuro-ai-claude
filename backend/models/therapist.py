# FILE: models/therapist.py | PURPOSE: Pydantic schemas for therapist endpoints | CONNECTS TO: routers/therapists.py

from pydantic import BaseModel
from typing import Optional


class TherapistProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    specializations: Optional[list[str]] = None
    license_type: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    languages: Optional[list[str]] = None
    fee_per_session: Optional[float] = None
    available: Optional[bool] = None


class AvailabilitySlot(BaseModel):
    day_of_week: int  # 0=Sun … 6=Sat
    start_time: str   # "HH:MM"
    end_time: str


class SetAvailabilityRequest(BaseModel):
    slots: list[AvailabilitySlot]
