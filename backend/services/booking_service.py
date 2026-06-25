# FILE: services/booking_service.py | PURPOSE: Direct Booking Service Link Integration

import uuid
import logging
from fastapi import HTTPException
from repositories.booking_repo import booking_repo
from utils.supabase_client import get_supabase  

logger = logging.getLogger(__name__)


class BookingService:
    async def create_booking(self, patient_id: str, therapist_id: str, proposed_slots: list) -> dict:
        booking_id = str(uuid.uuid4())
        return await booking_repo.create(
            id=booking_id,
            patient_id=patient_id,
            therapist_id=therapist_id,
            proposed_slots=proposed_slots,
            status="pending",
        )

    async def accept_booking(self, booking_id: str, therapist_id: str) -> dict:
        from utils.google_meet import create_oauth_google_meet

        booking = await booking_repo.get(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking["therapist_id"] != therapist_id:
            raise PermissionError("Not your booking")

        slot = (booking.get("proposed_slots") or [None])[0]
        meet_link = None

        try:
            sb = get_supabase()
            
            # 1. Fetch authenticated token row
            token_res = sb.table("therapist_tokens").select("*").eq("therapist_id", therapist_id).maybe_single().execute()
            
            # 2. FIX: Retrieve patient email using Auth Admin API (safe and reliable)
            patient_email = "patient@nuroai.com" # Default fallback
            try:
                # This fetches the email directly from the Supabase Auth system
                user_info = sb.auth.admin.get_user_by_id(booking["patient_id"])
                if user_info and user_info.user:
                    patient_email = user_info.user.email
            except Exception as auth_err:
                logger.warning(f"Could not fetch email from Auth Admin: {auth_err}")

            if token_res.data and slot:
                # Call Google to generate the genuine meeting link
                meet_link = await create_oauth_google_meet(
                    summary="NURO AI Therapy Session",
                    start_time_iso=slot,
                    patient_email=patient_email,
                    therapist_id=therapist_id,
                    token_data=token_res.data
                )
        except Exception as e:
            logger.error(f"Error calling dynamic token values: {e}", exc_info=True)

        # STRICT ENFORCEMENT: If Google didn't return a real link, stop and raise an error
        if not meet_link:
            raise HTTPException(status_code=400, detail="Google API failed to generate a genuine meeting link. Verify OAuth sync.")
        
        # Save the genuine link right into the database columns
        updated = await booking_repo.update_status(booking_id, "confirmed", meet_link=meet_link)

        if slot:
            await booking_repo.create_confirmed_session(
                booking_id=booking_id,
                patient_id=booking["patient_id"],
                therapist_id=therapist_id,
                session_at=slot,
                meet_link=meet_link,
            )

        return updated
        
    async def reject_booking(self, booking_id: str, therapist_id: str) -> dict:
        booking = await booking_repo.get(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking["therapist_id"] != therapist_id:
            raise PermissionError("Not your booking")
        return await booking_repo.update_status(booking_id, "rejected")

    async def complete_booking(self, booking_id: str, therapist_id: str) -> dict:
        booking = await booking_repo.get(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking["therapist_id"] != therapist_id:
            raise PermissionError("Not your booking")
        if booking["status"] not in ["confirmed"]:
            raise ValueError("Only confirmed bookings can be completed")
        return await booking_repo.complete_booking(booking_id, therapist_id)

    async def cancel_booking(self, booking_id: str, patient_id: str) -> dict:
        booking = await booking_repo.get(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking["patient_id"] != patient_id:
            raise PermissionError("Not your booking")
        return await booking_repo.update_status(booking_id, "cancelled")

    async def list_bookings(self, user_id: str, role: str) -> list:
        if role == "therapist":
            return await booking_repo.list_by_therapist(user_id)
        return await booking_repo.list_by_patient(user_id)


booking_service = BookingService()
# without google calander working 
# # FILE: services/booking_service.py | PURPOSE: Booking business logic | CONNECTS TO: routers/bookings.py, repositories/booking_repo.py

# import uuid
# import logging
# from repositories.booking_repo import booking_repo
# from services.calendar_utils import generate_meet_link

# logger = logging.getLogger(__name__)


# class BookingService:
#     async def create_booking(self, patient_id: str, therapist_id: str, proposed_slots: list) -> dict:
#         booking_id = str(uuid.uuid4())
#         return await booking_repo.create(
#             id=booking_id,
#             patient_id=patient_id,
#             therapist_id=therapist_id,
#             proposed_slots=proposed_slots,
#             status="pending",
#         )

#     async def accept_booking(self, booking_id: str, therapist_id: str) -> dict:
#         booking = await booking_repo.get(booking_id)
#         if not booking:
#             raise ValueError("Booking not found")
#         if booking["therapist_id"] != therapist_id:
#             raise PermissionError("Not your booking")

#         meet_link = generate_meet_link()
#         updated = await booking_repo.update_status(booking_id, "confirmed", meet_link=meet_link)

#         # Create confirmed_session row
#         slot = (booking.get("proposed_slots") or [None])[0]
#         if slot:
#             await booking_repo.create_confirmed_session(
#                 booking_id=booking_id,
#                 patient_id=booking["patient_id"],
#                 therapist_id=therapist_id,
#                 session_at=slot,
#                 meet_link=meet_link,
#             )

#         return updated

#     async def reject_booking(self, booking_id: str, therapist_id: str) -> dict:
#         booking = await booking_repo.get(booking_id)
#         if not booking:
#             raise ValueError("Booking not found")
#         if booking["therapist_id"] != therapist_id:
#             raise PermissionError("Not your booking")
#         return await booking_repo.update_status(booking_id, "rejected")

#     async def cancel_booking(self, booking_id: str, patient_id: str) -> dict:
#         booking = await booking_repo.get(booking_id)
#         if not booking:
#             raise ValueError("Booking not found")
#         if booking["patient_id"] != patient_id:
#             raise PermissionError("Not your booking")
#         return await booking_repo.update_status(booking_id, "cancelled")

#     async def list_bookings(self, user_id: str, role: str) -> list:
#         if role == "therapist":
#             return await booking_repo.list_by_therapist(user_id)
#         return await booking_repo.list_by_patient(user_id)


# booking_service = BookingService()

# # CHANGE THIS FILE IF YOU WANT TO: add notifications on booking, add rescheduling logic, add payment integration
