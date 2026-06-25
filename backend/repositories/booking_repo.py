# FILE: repositories/booking_repo.py | PURPOSE: All booking SQL queries | CONNECTS TO: services/booking_service.py

import datetime
import logging
import uuid
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)


class BookingRepo:
    async def create(self, id: str, patient_id: str, therapist_id: str, proposed_slots: list, status: str = "pending") -> dict:
        sb = get_supabase()
        res = sb.table("booking_requests").insert({
            "id": id,
            "patient_id": patient_id,
            "therapist_id": therapist_id,
            "proposed_slots": proposed_slots,
            "status": status,
        }).execute()
        return res.data[0] if res.data else {}

    async def get(self, booking_id: str) -> dict | None:
        sb = get_supabase()
        res = sb.table("booking_requests").select("*").eq("id", booking_id).maybe_single().execute()
        return res.data
    
    async def update_status(self, booking_id: str, status: str, meet_link: str = None) -> dict:
        sb = get_supabase()
        update = {"status": status}
        if meet_link:
            update["meet_link"] = meet_link
        try:
            res = sb.table("booking_requests").update(update).eq("id", booking_id).execute()
        except Exception as e:
            error_msg = str(e).lower()
            if "booking_requests_status_check" in error_msg or "violates check constraint" in error_msg:
                logger.error("Database constraint error - the 'completed' status may not be supported in this database schema")
                raise ValueError(f"Database constraint error: The booking status '{status}' is not allowed by the database. Please contact support to update the database schema or call POST /api/bookings/repair-schema with the dev key.")
            logger.exception("Unable to update booking status")
            raise ValueError(f"Unable to update booking status: {e}")

        if getattr(res, 'error', None):
            error_msg_dict = str(getattr(res, 'error', {})).lower()
            if "booking_requests_status_check" in error_msg_dict or "violates check constraint" in error_msg_dict:
                logger.error("Database constraint error during update")
                raise ValueError(f"Database constraint error: The booking status '{status}' is not allowed. Call POST /api/bookings/repair-schema to fix the database schema.")
            logger.error("Supabase update error: %s", res.error)
            raise ValueError(f"Unable to update booking status: {res.error}")

        booking = await self.get(booking_id)
        if not booking:
            raise ValueError("Booking was updated but could not be reloaded")

        return booking

    async def complete_booking(self, booking_id: str, therapist_id: str) -> dict:
        sb = get_supabase()
        # Validate booking ownership first
        booking_res = sb.table("booking_requests").select("*").eq("id", booking_id).maybe_single().execute()
        booking = booking_res.data
        if not booking:
            raise ValueError("Booking not found")
        if booking["therapist_id"] != therapist_id:
            raise PermissionError("Not your booking")
        if booking["status"] != "confirmed":
            raise ValueError(f"Only confirmed bookings can be completed (current status: {booking['status']})")

        updated = await self.update_status(booking_id, "completed")

        # If there is a confirmed session row, also mark it completed there for patient-facing consistency
        try:
            session_res = sb.table("confirmed_sessions").select("*").eq("booking_id", booking_id).maybe_single().execute()
            if session_res.data:
                sb.table("confirmed_sessions").update({"status": "completed"}).eq("id", session_res.data["id"]).execute()
        except Exception:
            pass

        return updated

    # async def list_by_patient(self, patient_id: str) -> list:
    #     sb = get_supabase()
    #     res = sb.table("booking_requests").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
    #     return res.data or []
    async def list_by_patient(self, patient_id: str) -> list:
        await self.expire_past_sessions()
        sb = get_supabase()
        
        # 1. Pull booking request items
        req_res = sb.table("booking_requests").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
        bookings = req_res.data or []
        
        # 2. Pull confirmed sessions list
        session_res = sb.table("confirmed_sessions").select("*").eq("patient_id", patient_id).order("session_at", desc=False).execute()
        sessions = session_res.data or []
        
        # 3. Gather therapist details to attach names to confirmed rows
        if sessions:
            therapist_ids = list(set(s["therapist_id"] for s in sessions))
            t_res = sb.table("therapists").select("id, name").in_("id", therapist_ids).execute()
            therapist_map = {t["id"]: t["name"] for t in (t_res.data or [])}
        else:
            therapist_map = {}

        # 4. Format and append into a single uniform data structure
        for s in sessions:
            bookings.append({
                "id": s["id"],
                "booking_id": s["booking_id"],
                "patient_id": s["patient_id"],
                "therapist_id": s["therapist_id"],
                "therapist_name": therapist_map.get(s["therapist_id"], "Verified Therapist"),
                "status": s.get("status", "confirmed"),
                "proposed_slots": [s["session_at"]],
                "meet_link": s["meet_link"],
                "created_at": s["created_at"]
            })
            
        return bookings
        
    
    async def list_by_therapist(self, therapist_id: str) -> list:
        await self.expire_past_sessions()
        sb = get_supabase()
        
        # 1. Get therapist record from user_id context
        t_res = sb.table("therapists").select("id").eq("user_id", therapist_id).maybe_single().execute()
        if not t_res.data:
            return []
        tid = t_res.data["id"]
        
        # 2. Fetch the raw booking requests for this therapist
        res = sb.table("booking_requests").select("*").eq("therapist_id", tid).order("created_at", desc=True).execute()
        bookings = res.data or []
        
        if not bookings:
            return []
            
        # 3. Extract all unique patient IDs from these bookings
        patient_ids = list(set(b["patient_id"] for b in bookings))
        
        # 4. Fetch the onboarding user preferences for these specific patients
        pref_res = sb.table("user_preferences").select("user_id, onboarding_data").in_("user_id", patient_ids).execute()
        preferences_map = {p["user_id"]: p for p in (pref_res.data or [])}
        
        # 5. Safe python stitch: attach the data structure back onto each booking item
        for b in bookings:
            pid = b["patient_id"]
            if pid in preferences_map:
                b["patient_profile"] = {
                    "onboarding_data": preferences_map[pid].get("onboarding_data", {})
                }
            else:
                b["patient_profile"] = {"onboarding_data": {}}
                
        return bookings

    
    async def create_confirmed_session(self, booking_id: str, patient_id: str, therapist_id: str, session_at: str, meet_link: str) -> dict:
        sb = get_supabase()
        # Resolve therapist UUID from user_id
        t_res = sb.table("therapists").select("id").eq("user_id", therapist_id).maybe_single().execute()
        tid = t_res.data["id"] if t_res.data else therapist_id

        res = sb.table("confirmed_sessions").insert({
            "id": str(uuid.uuid4()),
            "booking_id": booking_id,
            "patient_id": patient_id,
            "therapist_id": tid,
            "session_at": session_at,
            "duration_minutes": 60,
            "status": "confirmed",
            "meet_link": meet_link,
        }).execute()
        return res.data[0] if res.data else {}

    def _parse_session_datetime(self, slot_value):
        if not slot_value:
            return None
        if isinstance(slot_value, dict):
            slot_value = slot_value.get("slot") or slot_value.get("session_at")
        if not isinstance(slot_value, str):
            return None
        if slot_value.endswith("Z"):
            slot_value = slot_value[:-1] + "+00:00"
        try:
            return datetime.datetime.fromisoformat(slot_value)
        except Exception:
            return None

    async def expire_past_sessions(self):
        sb = get_supabase()
        now = datetime.datetime.now(datetime.timezone.utc)

        # Expire confirmed sessions first, then any confirmed booking_request items identified by slot time.
        completed_sessions = []
        try:
            update_res = (
                sb.table("confirmed_sessions")
                  .update({"status": "completed"})
                  .eq("status", "confirmed")
                  .lt("session_at", now.isoformat())
                  .execute()
            )
            completed_sessions = getattr(update_res, 'data', None) or []
        except Exception as e:
            logger.exception("Failed to expire confirmed_sessions rows: %s", e)

        for session in completed_sessions:
            try:
                sb.table("booking_requests").update({"status": "completed"}).eq("id", session["booking_id"]).eq("status", "confirmed").execute()
            except Exception as e:
                logger.warning("Could not sync booking_requests for completed session %s: %s", session.get("id"), e)

        try:
            booking_res = sb.table("booking_requests").select("*").eq("status", "confirmed").execute()
            bookings = booking_res.data or []
        except Exception as e:
            logger.exception("Failed to fetch confirmed booking_requests for expiry: %s", e)
            bookings = []

        for booking in bookings:
            slot = None
            if isinstance(booking.get("proposed_slots"), list) and booking["proposed_slots"]:
                slot = booking["proposed_slots"][0]
            session_time = self._parse_session_datetime(slot)
            if session_time and session_time < now:
                try:
                    sb.table("booking_requests").update({"status": "completed"}).eq("id", booking["id"]).eq("status", "confirmed").execute()
                    try:
                        session_res = sb.table("confirmed_sessions").select("*").eq("booking_id", booking["id"]).maybe_single().execute()
                        if session_res.data:
                            sb.table("confirmed_sessions").update({"status": "completed"}).eq("id", session_res.data["id"]).execute()
                    except Exception:
                        pass
                except Exception as e:
                    logger.warning("Failed to expire confirmed booking_request %s: %s", booking["id"], e)

        return completed_sessions


booking_repo = BookingRepo()

# CHANGE THIS FILE IF YOU WANT TO: add recurring sessions, add session reminders, add cancellation logging
