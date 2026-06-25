# FILE: repositories/profile_repo.py | PURPOSE: All profiles + user_preferences SQL | CONNECTS TO: routers/auth.py

from utils.supabase_client import get_supabase


class ProfileRepo:
    def get_profile(self, user_id: str) -> dict | None:
        sb = get_supabase()
        res = sb.table("profiles").select("*").eq("user_id", user_id).maybe_single().execute()
        return res.data

    def upsert_profile(self, user_id: str, **kwargs) -> dict:
        sb = get_supabase()
        res = sb.table("profiles").upsert({"user_id": user_id, **kwargs}).execute()
        return res.data[0] if res.data else {}

    def get_preferences(self, user_id: str) -> dict | None:
        sb = get_supabase()
        res = sb.table("user_preferences").select("*").eq("user_id", user_id).maybe_single().execute()
        return res.data

    def upsert_preferences(self, user_id: str, **kwargs) -> dict:
        sb = get_supabase()
        res = sb.table("user_preferences").upsert({"user_id": user_id, **kwargs}).execute()
        return res.data[0] if res.data else {}

    def accept_consent(self, user_id: str) -> None:
        from datetime import datetime, timezone
        sb = get_supabase()
        sb.table("profiles").upsert({
            "user_id": user_id,
            "consent_accepted": True,
            "consent_accepted_at": datetime.now(timezone.utc).isoformat(),
        }).execute()


profile_repo = ProfileRepo()

# CHANGE THIS FILE IF YOU WANT TO: add profile deletion, add audit logging per profile update
