# FILE: routers/therapists.py | PURPOSE: Therapist listing, profile, and availability endpoints | CONNECTS TO: repositories/therapist_repo.py

import logging
from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional
from utils.supabase_client import verify_jwt
from repositories.therapist_repo import therapist_repo
from models.therapist import TherapistProfileUpdate, SetAvailabilityRequest

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        return verify_jwt(auth.split(" ", 1)[1])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/therapists")
async def list_therapists(
    specialization: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    fee_max: Optional[float] = Query(None),
    available_only: bool = Query(False),
    search: Optional[str] = Query(None),
):
    """Public endpoint — no auth required for browsing."""
    return therapist_repo.list(
        specialization=specialization or "",
        language=language or "",
        fee_max=fee_max,
        available_only=available_only,
        search=search or "",
    )


@router.get("/therapists/{therapist_id}")
async def get_therapist(therapist_id: str):
    """Public endpoint."""
    t = therapist_repo.get(therapist_id)
    if not t:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return t


@router.put("/therapists/me")
async def update_my_profile(request: Request, body: TherapistProfileUpdate):
    user = _get_user(request)
    updated = therapist_repo.upsert(user["id"], **{k: v for k, v in body.model_dump().items() if v is not None})
    return updated


@router.post("/therapists/me/availability")
async def set_availability(request: Request, body: SetAvailabilityRequest):
    user = _get_user(request)
    t = therapist_repo.get_by_user_id(user["id"])
    if not t:
        raise HTTPException(status_code=404, detail="Therapist profile not found")
    therapist_repo.set_availability(t["id"], [s.model_dump() for s in body.slots])
    return {"ok": True}

# CHANGE THIS FILE IF YOU WANT TO: add therapist search by geo, add review endpoints, add admin verification routes
