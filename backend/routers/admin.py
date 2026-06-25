# FILE: routers/admin.py | PURPOSE: Admin endpoints for therapist verification | CONNECTS TO: repositories/therapist_repo.py
# SECURITY: All endpoints require a valid ADMIN_SECRET header — never expose to frontend

import os
import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_STATUSES = ("pending", "under_review", "verified", "rejected", "suspended")


def _require_admin(request: Request):
    """Simple secret-header guard. Replace with proper admin auth in production."""
    secret = request.headers.get("X-Admin-Secret", "")
    expected = os.environ.get("ADMIN_SECRET", "")
    if not expected or secret != expected:
        raise HTTPException(status_code=403, detail="Admin access required")


class VerifyRequest(BaseModel):
    status: Literal["pending", "under_review", "verified", "rejected", "suspended"]
    reviewer_notes: Optional[str] = None


@router.get("/admin/therapists")
async def list_all_therapists(request: Request, status: Optional[str] = None):
    """List all therapists, optionally filtered by verified_status."""
    _require_admin(request)
    sb = get_supabase()
    query = sb.table("therapists").select(
        "id, user_id, name, license_type, license_number, verified_status, "
        "created_at, reviewer_notes, verification_docs_url, years_experience"
    )
    if status:
        query = query.eq("verified_status", status)
    res = query.order("created_at", desc=True).execute()
    return res.data or []


@router.get("/admin/therapists/pending")
async def list_pending(request: Request):
    """Shortcut: list therapists awaiting review."""
    _require_admin(request)
    sb = get_supabase()
    res = (
        sb.table("therapists")
        .select("id, user_id, name, license_type, license_number, created_at, verification_docs_url")
        .in_("verified_status", ["pending", "under_review"])
        .order("created_at", desc=False)
        .execute()
    )
    return res.data or []


@router.put("/admin/therapists/{therapist_id}/verify")
async def verify_therapist(therapist_id: str, request: Request, body: VerifyRequest):
    """
    Approve, reject, or change status of a therapist.
    
    To approve:  PUT body = {"status": "verified"}
    To reject:   PUT body = {"status": "rejected", "reviewer_notes": "License not found"}
    To review:   PUT body = {"status": "under_review"}
    """
    _require_admin(request)
    sb = get_supabase()

    # Check therapist exists
    existing = sb.table("therapists").select("id, name, user_id").eq("id", therapist_id).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Therapist not found")

    update_data = {"verified_status": body.status}

    if body.reviewer_notes:
        update_data["reviewer_notes"] = body.reviewer_notes

    if body.status == "verified":
        from datetime import datetime, timezone
        update_data["verified_at"] = datetime.now(timezone.utc).isoformat()
        # Make them available by default upon verification
        update_data["available"] = True

        try:
            sb.table("profiles").update({"role": "therapist"}).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Failed to update profile role for user {user_id}: {str(e)}")
            
    res = sb.table("therapists").update(update_data).eq("id", therapist_id).execute()

    logger.info(
        f"Admin: therapist {therapist_id} ({existing.data['name']}) → {body.status}"
    )

    # TODO: Send email notification to therapist here
    # e.g., send_verification_email(existing.data['user_id'], body.status)

    return {
        "ok": True,
        "therapist_id": therapist_id,
        "name": existing.data["name"],
        "new_status": body.status,
    }


@router.get("/admin/therapists/{therapist_id}")
async def get_therapist_detail(therapist_id: str, request: Request):
    """Full therapist record for admin review."""
    _require_admin(request)
    sb = get_supabase()
    res = sb.table("therapists").select("*").eq("id", therapist_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data

# CHANGE THIS FILE IF YOU WANT TO: add email sending on status change, add admin UI, add audit logging per verification action
