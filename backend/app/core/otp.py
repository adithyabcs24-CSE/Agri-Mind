"""
OTP service — generates, stores (Redis), and verifies one-time passwords.

Storage: Redis with a 5-minute TTL per OTP.
Fallback: In-memory dict if Redis is unavailable (dev mode).
Rate limit: Max 3 OTPs per email per 10 minutes.
"""

import secrets
import time
from typing import Optional

# In-memory fallback (used when Redis is unavailable)
_otp_store: dict[str, dict] = {}
_rate_limit_store: dict[str, list] = {}

OTP_TTL_SECONDS = 300       # 5 minutes
MAX_ATTEMPTS = 5            # Max wrong guesses before invalidation
RATE_LIMIT_WINDOW = 600     # 10 minutes
RATE_LIMIT_MAX = 3          # Max OTP sends per window


def _generate_otp() -> str:
    """6-digit cryptographically secure OTP."""
    return str(secrets.randbelow(900000) + 100000)


def _rate_limit_check(email: str) -> bool:
    """Returns True if the email is within rate limit (allowed to send)."""
    now = time.time()
    times = _rate_limit_store.get(email, [])
    # Remove timestamps older than the window
    times = [t for t in times if now - t < RATE_LIMIT_WINDOW]
    if len(times) >= RATE_LIMIT_MAX:
        return False
    times.append(now)
    _rate_limit_store[email] = times
    return True


async def create_and_store_otp(email: str) -> Optional[str]:
    """
    Generate an OTP for the email, store it, and return it.
    Returns None if rate limited.
    
    Tries Redis first; falls back to in-memory dict.
    """
    if not _rate_limit_check(email):
        return None

    otp = _generate_otp()

    # Try Redis
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        key = f"otp:{email}"
        await r.setex(key, OTP_TTL_SECONDS, f"{otp}:0")  # value = "otp:attempts"
        await r.aclose()
    except Exception:
        # Fallback: in-memory
        _otp_store[email] = {
            "otp": otp,
            "expires_at": time.time() + OTP_TTL_SECONDS,
            "attempts": 0,
        }

    return otp


async def verify_otp(email: str, entered_otp: str) -> bool:
    """
    Verify the entered OTP for the email.
    Invalidates OTP after correct use or after MAX_ATTEMPTS wrong guesses.
    Returns True if correct, False otherwise.
    """
    # Try Redis
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        key = f"otp:{email}"
        value = await r.get(key)

        if not value:
            await r.aclose()
            return False

        stored_otp, attempts_str = value.split(":")
        attempts = int(attempts_str)

        if attempts >= MAX_ATTEMPTS:
            await r.delete(key)
            await r.aclose()
            return False

        if entered_otp == stored_otp:
            await r.delete(key)  # Consume OTP
            await r.aclose()
            return True
        else:
            # Increment attempts
            await r.setex(key, await r.ttl(key), f"{stored_otp}:{attempts + 1}")
            await r.aclose()
            return False

    except Exception:
        # Fallback: in-memory
        record = _otp_store.get(email)
        if not record:
            return False

        if time.time() > record["expires_at"]:
            del _otp_store[email]
            return False

        if record["attempts"] >= MAX_ATTEMPTS:
            del _otp_store[email]
            return False

        if entered_otp == record["otp"]:
            del _otp_store[email]
            return True
        else:
            record["attempts"] += 1
            return False


async def send_otp_dev_sms(phone: str, code_length: int = 4) -> dict:
    """
    Sends a real-time SMS OTP via otp.dev API.
    """
    import json
    import urllib.request
    from app.core.config import settings

    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "").strip()
    if len(clean_phone) == 10 and not clean_phone.startswith("91"):
        clean_phone = f"91{clean_phone}"

    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    payload = {
        "data": {
            "channel": settings.OTP_DEV_CHANNEL,
            "sender": settings.OTP_DEV_SENDER,
            "phone": clean_phone,
            "template": settings.OTP_DEV_TEMPLATE,
            "code_length": code_length,
        }
    }
    url = "https://api.otp.dev/v1/verifications"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "X-OTP-Key": settings.OTP_DEV_API_KEY,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


async def verify_otp_dev_sms(phone: str, code: str) -> bool:
    """
    Verifies an SMS OTP via GET https://api.otp.dev/v1/verifications?code={code}&phone={phone}
    """
    import json
    import urllib.request
    import urllib.parse
    from app.core.config import settings

    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "").strip()
    if len(clean_phone) == 10 and not clean_phone.startswith("91"):
        clean_phone = f"91{clean_phone}"

    url = f"https://api.otp.dev/v1/verifications?code={urllib.parse.quote(code)}&phone={urllib.parse.quote(clean_phone)}"
    req = urllib.request.Request(
        url,
        headers={
            "X-OTP-Key": settings.OTP_DEV_API_KEY,
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="GET"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print(f"[OTP.dev Verification Response for {clean_phone}]: {res_data}")
            data_field = res_data.get("data")
            if isinstance(data_field, list) and len(data_field) > 0:
                return True
            if isinstance(data_field, dict) and bool(data_field):
                return True
            return False
    except Exception as e:
        print(f"[OTP.dev Verification Error for {clean_phone}]: {e}")
        return False
