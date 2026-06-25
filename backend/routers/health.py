# FILE: routers/health.py | PURPOSE: GET /api/health — public endpoint for Render wake-up ping | CONNECTS TO: main.py

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
async def health_check():
    """Public health endpoint — used by frontend to wake up Render on page load."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# CHANGE THIS FILE IF YOU WANT TO: add DB connectivity check, add version info
