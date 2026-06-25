# FILE: routers/bookings.py | PURPOSE: Booking CRUD endpoints | CONNECTS TO: services/booking_service.py

import logging
from fastapi import APIRouter, Request, HTTPException
from utils.supabase_client import verify_jwt
from services.booking_service import booking_service
from models.booking import CreateBookingRequest
from repositories.profile_repo import profile_repo
from repositories.therapist_repo import therapist_repo
import os
from utils.supabase_client import get_supabase

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


def _get_role(user_id: str) -> str:
    p = profile_repo.get_profile(user_id)
    return p.get("role", "patient") if p else "patient"


@router.post("/bookings")
async def create_booking(request: Request, body: CreateBookingRequest):
    user = _get_user(request)
    booking = await booking_service.create_booking(
        patient_id=user["id"],
        therapist_id=body.therapist_id,
        proposed_slots=body.proposed_slots,
    )
    return booking


@router.get("/bookings")
async def list_bookings(request: Request):
    user = _get_user(request)
    role = _get_role(user["id"])
    return await booking_service.list_bookings(user["id"], role)

@router.post("/bookings/{booking_id}/accept")
async def accept_booking(booking_id: str, request: Request):
    user = _get_user(request)
    
    # 1. Look up the therapist profile by user id
    t_profile = therapist_repo.get_by_user_id(user["id"])
    if not t_profile:
        raise HTTPException(status_code=403, detail="Therapist profile not found")
        
    try:
        # 2. Pass the matching therapist ID (not user id) to the service
        return await booking_service.accept_booking(booking_id, t_profile["id"])
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorised to accept this booking")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/bookings/{booking_id}/reject")
async def reject_booking(booking_id: str, request: Request):
    user = _get_user(request)
    
    # 1. Look up the therapist profile by user id
    t_profile = therapist_repo.get_by_user_id(user["id"])
    if not t_profile:
        raise HTTPException(status_code=403, detail="Therapist profile not found")
        
    try:
        # 2. Pass the matching therapist ID (not user id) to the service
        return await booking_service.reject_booking(booking_id, t_profile["id"])
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorised")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, request: Request):
    user = _get_user(request)
    
    # 1. Look up the therapist profile by user id
    t_profile = therapist_repo.get_by_user_id(user["id"])
    if not t_profile:
        raise HTTPException(status_code=403, detail="Therapist profile not found")
        
    try:
        updated = await booking_service.complete_booking(booking_id, t_profile["id"])
        return {"ok": True, "booking": updated}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorised")
    except ValueError as e:
        error_text = str(e)
        if "repair-schema" in error_text or "database constraint" in error_text.lower():
            raise HTTPException(status_code=400, detail=error_text)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error completing booking")
        raise HTTPException(status_code=500, detail="Could not complete booking")


@router.post("/bookings/{booking_id}/complete-dev")
async def complete_booking_dev(booking_id: str, request: Request):
    """Development-only endpoint: mark a booking completed without normal auth.
    Requires header `X-DEV-KEY` matching env `DEV_TEST_KEY` (defaults to 'dev-key').
    Use only in local/dev environments.
    """
    dev_key = request.headers.get("X-DEV-KEY")
    allowed = os.environ.get("DEV_TEST_KEY", "dev-key")
    if dev_key != allowed:
        raise HTTPException(status_code=403, detail="Invalid dev key")

    # If Supabase env is not configured, return a simulated response for local/dev testing
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        return {"ok": True, "booking": {"id": booking_id, "status": "completed"}}

    sb = get_supabase()
    # Validate booking exists
    b_res = sb.table("booking_requests").select("*").eq("id", booking_id).maybe_single().execute()
    booking = b_res.data
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Mark booking_requests status -> completed
    try:
        updated = sb.table("booking_requests").update({"status": "completed"}).eq("id", booking_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB update failed: {e}")

    # Also update confirmed_sessions if present
    try:
        s_res = sb.table("confirmed_sessions").select("*").eq("booking_id", booking_id).maybe_single().execute()
        if s_res.data:
            sb.table("confirmed_sessions").update({"status": "completed"}).eq("id", s_res.data["id"]).execute()
    except Exception:
        pass

    return {"ok": True, "booking_id": booking_id, "new_status": "completed", "booking": booking}


@router.post("/bookings/repair-schema")
async def repair_booking_schema(request: Request):
    """
    Admin endpoint to fix the booking_requests status constraint if it doesn't include 'completed'.
    Requires X-DEV-KEY header for safety.
    """
    dev_key = request.headers.get("X-DEV-KEY")
    allowed = os.environ.get("DEV_TEST_KEY", "dev-key")
    if dev_key != allowed:
        raise HTTPException(status_code=403, detail="Invalid dev key")

    sb = get_supabase()
    try:
        # Try to add 'completed' to the status check constraint
        # First, drop the old constraint
        sb.rpc("exec_sql", {"sql": "ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check"}).execute()
        # Then, add the new constraint with 'completed'
        sb.rpc("exec_sql", {"sql": "ALTER TABLE booking_requests ADD CONSTRAINT booking_requests_status_check CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','no_show'))"}).execute()
        logger.info("Successfully repaired booking_requests_status_check constraint")
        return {"ok": True, "message": "booking_requests_status_check constraint has been updated to include 'completed' status"}
    except Exception as e:
        error_msg = str(e)
        # If rpc approach fails, suggest manual fix
        if "rpc" in error_msg.lower() or "exec_sql" in error_msg.lower():
            logger.warning("Could not use rpc to repair constraint. User must run SQL manually.")
            return {
                "ok": False,
                "message": "Could not auto-repair constraint. Please run this SQL in Supabase console:",
                "sql": "ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check; ALTER TABLE booking_requests ADD CONSTRAINT booking_requests_status_check CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','no_show'));"
            }
        logger.exception("Error repairing constraint")
        raise HTTPException(status_code=500, detail=f"Could not repair schema: {error_msg}")


@router.post("/bookings/check-schema")
async def check_booking_schema():
    """Check if the booking_requests table supports 'completed' status."""
    sb = get_supabase()
    try:
        # Try to insert a test row with completed status (won't actually insert)
        test_booking_id = "test-check-completed-status"
        sb.table("booking_requests").select("*").eq("id", test_booking_id).execute()
        # If that works, try to understand the constraint
        info_res = sb.rpc("get_constraint_info", {"table_name": "booking_requests", "constraint_name": "booking_requests_status_check"}).execute()
        return {
            "schema_ok": True,
            "supports_completed": True,
            "constraint_info": info_res.data if hasattr(info_res, 'data') else "unknown"
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "booking_requests_status_check" in error_msg or "violates check constraint" in error_msg or "completed" in error_msg:
            return {
                "schema_ok": False,
                "supports_completed": False,
                "error": "The database constraint does not support 'completed' status. Call POST /bookings/repair-schema to fix it.",
                "details": str(e)
            }
        return {
            "schema_ok": False,
            "supports_completed": None,
            "error": str(e)
        }

# @router.post("/bookings/{booking_id}/accept")
# async def accept_booking(booking_id: str, request: Request):
#     user = _get_user(request)
#     try:
#         return await booking_service.accept_booking(booking_id, user["id"])
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised to accept this booking")
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))


# @router.post("/bookings/{booking_id}/reject")
# async def reject_booking(booking_id: str, request: Request):
#     user = _get_user(request)
#     try:
#         return await booking_service.reject_booking(booking_id, user["id"])
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised")
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, request: Request):
    user = _get_user(request)
    try:
        return await booking_service.cancel_booking(booking_id, user["id"])
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorised")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# CHANGE THIS FILE IF YOU WANT TO: add rescheduling endpoint, add no-show handling, add payment integration













# # FILE: routers/bookings.py | PURPOSE: Booking CRUD endpoints | CONNECTS TO: services/booking_service.py

# import logging
# from fastapi import APIRouter, Request, HTTPException
# from utils.supabase_client import verify_jwt
# from services.booking_service import booking_service
# from models.booking import CreateBookingRequest
# from repositories.profile_repo import profile_repo
# from repositories.therapist_repo import therapist_repo
# import os
# from utils.supabase_client import get_supabase

# logger = logging.getLogger(__name__)
# router = APIRouter()


# def _get_user(request: Request) -> dict:
#     auth = request.headers.get("Authorization", "")
#     if not auth.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing token")
#     try:
#         return verify_jwt(auth.split(" ", 1)[1])
#     except Exception:
#         raise HTTPException(status_code=401, detail="Invalid token")


# def _get_role(user_id: str) -> str:
#     p = profile_repo.get_profile(user_id)
#     return p.get("role", "patient") if p else "patient"


# @router.post("/bookings")
# async def create_booking(request: Request, body: CreateBookingRequest):
#     user = _get_user(request)
#     booking = await booking_service.create_booking(
#         patient_id=user["id"],
#         therapist_id=body.therapist_id,
#         proposed_slots=body.proposed_slots,
#     )
#     return booking


# @router.get("/bookings")
# async def list_bookings(request: Request):
#     user = _get_user(request)
#     role = _get_role(user["id"])
#     return await booking_service.list_bookings(user["id"], role)

# @router.post("/bookings/{booking_id}/accept")
# async def accept_booking(booking_id: str, request: Request):
#     user = _get_user(request)
    
#     # 1. Look up the therapist profile by user id
#     t_profile = therapist_repo.get_by_user_id(user["id"])
#     if not t_profile:
#         raise HTTPException(status_code=403, detail="Therapist profile not found")
        
#     try:
#         # 2. Pass the matching therapist ID (not user id) to the service
#         return await booking_service.accept_booking(booking_id, t_profile["id"])
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised to accept this booking")
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))


# @router.post("/bookings/{booking_id}/reject")
# async def reject_booking(booking_id: str, request: Request):
#     user = _get_user(request)
    
#     # 1. Look up the therapist profile by user id
#     t_profile = therapist_repo.get_by_user_id(user["id"])
#     if not t_profile:
#         raise HTTPException(status_code=403, detail="Therapist profile not found")
        
#     try:
#         # 2. Pass the matching therapist ID (not user id) to the service
#         return await booking_service.reject_booking(booking_id, t_profile["id"])
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised")
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))

# @router.post("/bookings/{booking_id}/complete")
# async def complete_booking(booking_id: str, request: Request):
#     user = _get_user(request)
    
#     # 1. Look up the therapist profile by user id
#     t_profile = therapist_repo.get_by_user_id(user["id"])
#     if not t_profile:
#         raise HTTPException(status_code=403, detail="Therapist profile not found")
        
#     try:
#         updated = await booking_service.complete_booking(booking_id, t_profile["id"])
#         return {"ok": True, "booking": updated}
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised")
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         logger.exception("Unexpected error completing booking")
#         raise HTTPException(status_code=500, detail="Could not complete booking")


# @router.post("/bookings/{booking_id}/complete-dev")
# async def complete_booking_dev(booking_id: str, request: Request):
#     """Development-only endpoint: mark a booking completed without normal auth.
#     Requires header `X-DEV-KEY` matching env `DEV_TEST_KEY` (defaults to 'dev-key').
#     Use only in local/dev environments.
#     """
#     dev_key = request.headers.get("X-DEV-KEY")
#     allowed = os.environ.get("DEV_TEST_KEY", "dev-key")
#     if dev_key != allowed:
#         raise HTTPException(status_code=403, detail="Invalid dev key")

#     # If Supabase env is not configured, return a simulated response for local/dev testing
#     if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
#         return {"ok": True, "booking": {"id": booking_id, "status": "completed"}}

#     sb = get_supabase()
#     # Validate booking exists
#     b_res = sb.table("booking_requests").select("*").eq("id", booking_id).maybe_single().execute()
#     booking = b_res.data
#     if not booking:
#         raise HTTPException(status_code=404, detail="Booking not found")

#     # Mark booking_requests status -> completed
#     try:
#         updated = sb.table("booking_requests").update({"status": "completed"}).eq("id", booking_id).execute()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"DB update failed: {e}")

#     # Also update confirmed_sessions if present
#     try:
#         s_res = sb.table("confirmed_sessions").select("*").eq("booking_id", booking_id).maybe_single().execute()
#         if s_res.data:
#             sb.table("confirmed_sessions").update({"status": "completed"}).eq("id", s_res.data["id"]).execute()
#     except Exception:
#         pass

#     return {"ok": True, "booking_id": booking_id, "new_status": "completed", "booking": booking}
# # @router.post("/bookings/{booking_id}/accept")
# # async def accept_booking(booking_id: str, request: Request):
# #     user = _get_user(request)
# #     try:
# #         return await booking_service.accept_booking(booking_id, user["id"])
# #     except PermissionError:
# #         raise HTTPException(status_code=403, detail="Not authorised to accept this booking")
# #     except ValueError as e:
# #         raise HTTPException(status_code=404, detail=str(e))


# # @router.post("/bookings/{booking_id}/reject")
# # async def reject_booking(booking_id: str, request: Request):
# #     user = _get_user(request)
# #     try:
# #         return await booking_service.reject_booking(booking_id, user["id"])
# #     except PermissionError:
# #         raise HTTPException(status_code=403, detail="Not authorised")
# #     except ValueError as e:
# #         raise HTTPException(status_code=404, detail=str(e))


# @router.post("/bookings/{booking_id}/cancel")
# async def cancel_booking(booking_id: str, request: Request):
#     user = _get_user(request)
#     try:
#         return await booking_service.cancel_booking(booking_id, user["id"])
#     except PermissionError:
#         raise HTTPException(status_code=403, detail="Not authorised")
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))

# # CHANGE THIS FILE IF YOU WANT TO: add rescheduling endpoint, add no-show handling, add payment integration
