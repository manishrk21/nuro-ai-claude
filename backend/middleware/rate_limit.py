# FILE: middleware/rate_limit.py | PURPOSE: Basic per-IP rate limiting via slowapi | CONNECTS TO: main.py

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# CHANGE THIS FILE IF YOU WANT TO: add per-user rate limits, add Redis backend for distributed limiting
