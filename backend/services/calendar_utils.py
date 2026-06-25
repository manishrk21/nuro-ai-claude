# FILE: services/calendar_utils.py | PURPOSE: Generate placeholder Google Meet links | CONNECTS TO: booking_service.py

import random
import string


def generate_meet_link() -> str:
    """Generate a placeholder Google Meet-style link."""
    def seg(n):
        return ''.join(random.choices(string.ascii_lowercase, k=n))
    return f"meet.google.com/{seg(3)}-{seg(4)}-{seg(3)}"

# CHANGE THIS FILE IF YOU WANT TO: integrate Google Meet API for real links, add Zoom link generation
