# FILE: utils/supabase_client.py | PURPOSE: Shared Supabase service-role client | CONNECTS TO: All repositories

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def get_supabase() -> Client:
    """Return a singleton Supabase service-role client."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client


def verify_jwt(token: str) -> dict:
    """
    Verify a Supabase JWT and return the user dict.
    Raises an exception if the token is invalid.
    """
    client = get_supabase()
    response = client.auth.get_user(token)
    if not response or not response.user:
        raise ValueError("Invalid or expired token")
    return {
        "id": response.user.id,
        "email": response.user.email,
        "role": response.user.role,
    }

# CHANGE THIS FILE IF YOU WANT TO: add connection pooling, add retry logic
