# FILE: routers/notes.py | PURPOSE: Session notes CRUD (therapist only) | CONNECTS TO: repositories/booking_repo.py

import logging
import uuid
from fastapi import APIRouter, Request, HTTPException
from utils.supabase_client import verify_jwt, get_supabase
from models.booking import NoteRequest

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


@router.post("/notes")
async def create_or_update_note(request: Request, body: NoteRequest):
    user = _get_user(request)
    sb = get_supabase()

    # Verify requester is a therapist
    t_res = sb.table("therapists").select("id").eq("user_id", user["id"]).maybe_single().execute()
    if not t_res.data:
        raise HTTPException(status_code=403, detail="Only therapists can create notes")

    therapist_id = t_res.data["id"]

    res = sb.table("session_notes").upsert({
        "id": str(uuid.uuid4()),
        "session_id": body.session_id,
        "therapist_id": therapist_id,
        "content": body.content,
    }).execute()

    return res.data[0] if res.data else {}


@router.get("/notes/{session_id}")
async def get_note(session_id: str, request: Request):
    user = _get_user(request)
    sb = get_supabase()

    t_res = sb.table("therapists").select("id").eq("user_id", user["id"]).maybe_single().execute()
    if not t_res.data:
        raise HTTPException(status_code=403, detail="Only therapists can read notes")

    therapist_id = t_res.data["id"]

    res = (
        sb.table("session_notes")
        .select("*")
        .eq("session_id", session_id)
        .eq("therapist_id", therapist_id)
        .maybe_single()
        .execute()
    )
    return res.data or {}

# CHANGE THIS FILE IF YOU WANT TO: add note versioning, add shared care notes between therapists
