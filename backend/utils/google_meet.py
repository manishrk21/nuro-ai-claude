# FILE: utils/google_meet.py | PURPOSE: Production OAuth2 Genuine Google Meet Generator

import os
import logging
import httpx
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from utils.supabase_client import get_supabase

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']

async def refresh_therapist_token(therapist_id: str, refresh_token: str) -> str:
    """Refreshes the expired therapist access token using their long-lived refresh token."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
                    "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            data = response.json()
            new_access_token = data.get("access_token")
            
            if new_access_token:
                sb = get_supabase()
                sb.table("therapist_tokens").update({
                    "access_token": new_access_token
                }).eq("therapist_id", therapist_id).execute()
                return new_access_token
    except Exception as e:
        logger.error(f"Failed to auto-refresh therapist token: {e}")
    return None


async def create_oauth_google_meet(summary: str, start_time_iso: str, patient_email: str, therapist_id: str, token_data: dict) -> str:
    """Natively creates a calendar event and extracts a 100% real Google Meet link."""
    access_token = token_data.get("access_token")
    if token_data.get("refresh_token"):
        refreshed_token = await refresh_therapist_token(therapist_id, token_data["refresh_token"])
        if refreshed_token:
            access_token = refreshed_token

    try:
        creds = Credentials(
            token=access_token,
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ.get("GOOGLE_CLIENT_ID"),
            client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES
        )
        service = build('calendar', 'v3', credentials=creds)
        
        event_body = {
            'summary': summary,
            'description': 'Therapy Session via NURO AI.',
            'start': {'dateTime': start_time_iso, 'timeZone': 'UTC'},
            'end': {'dateTime': start_time_iso, 'timeZone': 'UTC'},
            'attendees': [{'email': patient_email}] if patient_email else [],
            'conferenceData': {
                'createRequest': {
                    'requestId': f"nuro-call-{os.urandom(4).hex()}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }
        }

        # Create the event inside the therapist's primary Google Calendar
        event = service.events().insert(
            calendarId='primary', 
            body=event_body, 
            conferenceDataVersion=1
        ).execute()

        # NATIVELY EXTRACT THE REAL LINK: No custom strings, no fake formatting
        meet_link = event.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri')
        if not meet_link:
            meet_link = event.get('hangoutLink')

        return meet_link

    except Exception as e:
        logger.error(f"Google API failed to generate real link: {e}", exc_info=True)
        return None
