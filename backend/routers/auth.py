# FILE: routers/auth.py | PURPOSE: Profile and consent endpoints | CONNECTS TO: repositories/profile_repo.py

import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.supabase_client import verify_jwt
from repositories.profile_repo import profile_repo

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.split(" ", 1)[1]
    try:
        return verify_jwt(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


class PreferencesUpdate(BaseModel):
    onboarding_data: Optional[dict] = None
    financial_comfort: Optional[str] = None
    sleep_quality: Optional[str] = None


@router.get("/auth/profile")
async def get_profile(request: Request):
    user = _get_user(request)
    profile = profile_repo.get_profile(user["id"])
    prefs = profile_repo.get_preferences(user["id"])
    return {"profile": profile, "preferences": prefs}


@router.put("/auth/profile")
async def update_profile(request: Request, body: PreferencesUpdate):
    user = _get_user(request)
    updated = profile_repo.upsert_preferences(
        user["id"],
        **{k: v for k, v in body.model_dump().items() if v is not None},
    )
    return {"preferences": updated}


@router.post("/auth/consent")
async def record_consent(request: Request):
    user = _get_user(request)
    profile_repo.accept_consent(user["id"])
    logger.info(f"Consent accepted: user={user['id'][:8]}…")
    return {"accepted": True}

# CHANGE THIS FILE IF YOU WANT TO: add profile deletion endpoint, add email change flow
import os
from fastapi.responses import RedirectResponse
import httpx
from utils.supabase_client import get_supabase
# Ensure you have GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and SELF_URL (your backend URL) in your env

@router.get("/auth/google/login")
async def google_login(therapist_id: str):
    """Redirects the therapist to Google's consent screen to request calendar access."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = f"{os.environ.get('SELF_URL', 'https://nuro-ai-claude.onrender.com')}/api/auth/google/callback"
    
    # We request offline access and force prompt to guarantee we get a refresh_token
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=https://www.googleapis.com/auth/calendar&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={therapist_id}"
    )
    return RedirectResponse(url=google_url)


@router.get("/auth/google/callback")
async def google_callback(code: str, state: str):
    """Receives the auth code from Google, exchanges it for tokens, and saves them to Supabase."""
    therapist_id = state  # The therapist_id passed through the state parameter
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = f"{os.environ.get('SELF_URL', 'https://nuro-ai-claude.onrender.com')}/api/auth/google/callback"

    async with httpx.AsyncClient() as client:
        # Exchange authorization code for access & refresh tokens
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_data = response.json()

    if "error" in token_data:
        raise HTTPException(status_code=400, detail=f"Google Auth Failed: {token_data.get('error_description')}")

    # Save tokens to Supabase
    sb = get_supabase()
    sb.table("therapist_tokens").upsert({
        "therapist_id": therapist_id,
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token"), # Sent on first connection consent
    }, on_conflict="therapist_id").execute()

    # Redirect user back to frontend dashboard profile panel
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend_url}/dashboard/therapist?calendar=connected")

@router.get("/auth/google/status")
async def get_google_status(request: Request):
    user = _get_user(request)
    sb = get_supabase()

    # Authenticate the therapist profile by the logged-in user id
    therapist = sb.table("therapists").select("id").eq("user_id", user["id"]).maybe_single().execute()
    if not therapist.data:
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    # Check if this therapist has tokens
    res = sb.table("therapist_tokens").select("id").eq("therapist_id", therapist.data["id"]).maybe_single().execute()
    return {"connected": res.data is not None}
