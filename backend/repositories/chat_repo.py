# FILE: repositories/chat_repo.py | PURPOSE: All chat_sessions + chat_messages SQL | CONNECTS TO: routers/chat.py

from datetime import date, datetime, timezone
from utils.supabase_client import get_supabase


class ChatRepo:
    def save_message(self, session_id: str, role: str, content: str, tokens_used: int = 0) -> dict:
        sb = get_supabase()
        res = sb.table("chat_messages").insert({
            "session_id": session_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
        }).execute()
        return res.data[0] if res.data else {}

    def get_recent_messages(self, session_id: str, limit: int = 20) -> list:
        sb = get_supabase()
        res = (
            sb.table("chat_messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return res.data or []

    # def check_quota(self, user_id: str, plan: str = "free") -> dict:
    #     """Return today's usage. Creates row if missing."""
    #     sb = get_supabase()
    #     today = date.today().isoformat()
    #     res = (
    #         sb.table("message_quotas")
    #         .select("count, plan")
    #         .eq("user_id", user_id)
    #         .eq("date", today)
    #         .maybe_single()
    #         .execute()
    #     )
    #     data = res.data
    #     if not data:
    #         sb.table("message_quotas").insert({
    #             "user_id": user_id,
    #             "date": today,
    #             "count": 0,
    #             "plan": plan,
    #         }).execute()
    #         return {"count": 0, "plan": plan}
    #     return data
    
    def check_quota(self, user_id: str, plan: str = "free") -> dict:
        """Return today's usage. Creates row if missing."""
        sb = get_supabase()
        today = date.today().isoformat()
        try:
            res = (
                sb.table("message_quotas")
                .select("count, plan")
                .eq("user_id", user_id)
                .eq("date", today)
                .maybe_single()
                .execute()
            )
            data = res.data
        except Exception:
            # 406 = multiple rows (duplicate), or other Supabase error
            data = None
    
        if not data:
            try:
                sb.table("message_quotas").insert({
                    "user_id": user_id,
                    "date": today,
                    "count": 0,
                    "plan": plan,
                }).execute()
            except Exception:
                pass  # Row may have been inserted by a race condition
            return {"count": 0, "plan": plan}
        return data
    
    def increment_quota(self, user_id: str) -> None:
        sb = get_supabase()
        today = date.today().isoformat()
        # Use RPC for atomic increment
        sb.rpc("increment_quota", {"p_user_id": user_id, "p_date": today}).execute()

    def log_crisis(self, user_id: str, session_id: str, message_id: str, severity: str, detected_by: str = "keyword") -> None:
        sb = get_supabase()
        sb.table("crisis_events").insert({
            "user_id": user_id,
            "session_id": session_id,
            "message_id": message_id,
            "severity": severity,
            "detected_by": detected_by,
            "notified_therapist": False,
        }).execute()


chat_repo = ChatRepo()

# CHANGE THIS FILE IF YOU WANT TO: add message search, add pagination, change crisis notification logic
