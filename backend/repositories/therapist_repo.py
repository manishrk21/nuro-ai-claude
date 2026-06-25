# FILE: repositories/therapist_repo.py | PURPOSE: All therapist SQL queries | CONNECTS TO: routers/therapists.py

from utils.supabase_client import get_supabase


class TherapistRepo:
    def list(self, specialization: str = "", language: str = "", fee_max: float = None, available_only: bool = False, search: str = "") -> list:
        sb = get_supabase()
        query = sb.table("therapists").select("*").eq("verified_status", "verified")

        if specialization:
            query = query.contains("specializations", [specialization])
        if language:
            query = query.contains("languages", [language])
        if fee_max:
            query = query.lte("fee_per_session", fee_max)
        if available_only:
            query = query.eq("available", True)
        if search:
            query = query.ilike("name", f"%{search}%")

        res = query.order("created_at", desc=False).limit(50).execute()
        return res.data or []

    def get(self, therapist_id: str) -> dict | None:
        sb = get_supabase()
        res = sb.table("therapists").select("*").eq("id", therapist_id).maybe_single().execute()
        return res.data

    def get_by_user_id(self, user_id: str) -> dict | None:
        sb = get_supabase()
        res = sb.table("therapists").select("*").eq("user_id", user_id).maybe_single().execute()
        return res.data

    def upsert(self, user_id: str, **kwargs) -> dict:
        sb = get_supabase()
        res = sb.table("therapists").upsert({"user_id": user_id, **kwargs}).execute()
        return res.data[0] if res.data else {}

    def set_availability(self, therapist_id: str, slots: list) -> None:
        sb = get_supabase()
        # Clear old slots then insert new ones
        sb.table("therapist_availability").delete().eq("therapist_id", therapist_id).execute()
        if slots:
            rows = [{"therapist_id": therapist_id, **slot} for slot in slots]
            sb.table("therapist_availability").insert(rows).execute()


therapist_repo = TherapistRepo()

# CHANGE THIS FILE IF YOU WANT TO: add rating aggregation, add proximity search, add pagination
