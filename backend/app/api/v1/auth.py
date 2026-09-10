from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, get_current_user,
)
from app.core.email import send_otp_email
from app.core.otp import (
    create_and_store_otp, verify_otp as verify_otp_code,
    send_otp_dev_sms, verify_otp_dev_sms
)
from app.core.config import settings
from app.models.user import User
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = "919110625567"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    name: str
    password: str
    phone: Optional[str] = "919110625567"


class OtpResponse(BaseModel):
    message: str
    email_sent: bool
    sms_sent: bool = False
    phone: Optional[str] = None
    dev_otp: Optional[str] = None
    code_length: int = 4


# ── Existing endpoints ────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        language=data.language,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    from datetime import datetime, timezone
    from app.models.iot import Alert, AlertType, AlertSeverity
    user.updated_at = datetime.now(timezone.utc)
    login_alert = Alert(
        user_id=user.id,
        alert_type=AlertType.weather_alert,
        severity=AlertSeverity.info,
        title="Session Active: User Signed In",
        message=f"{user.full_name} signed in successfully via web console.",
        channels=["in_app"]
    )
    db.add(login_alert)
    await db.flush()

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=86400,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── OTP endpoints ─────────────────────────────────────────────────────────────

@router.post("/send-otp", response_model=OtpResponse)
async def send_otp(data: SendOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1 of sign-up: generate OTP and dispatch via SMS (otp.dev) and email.
    """
    # Check if email already registered
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered. Please log in instead.")

    # Generate and store OTP (Redis or in-memory fallback)
    otp = await create_and_store_otp(data.email)
    if otp is None:
        raise HTTPException(
            status_code=429,
            detail="Too many OTP requests. Please wait 10 minutes before trying again."
        )

    # 1. Dispatch SMS via otp.dev API
    sms_sent = False
    phone_to_use = data.phone or getattr(settings, "DEFAULT_PHONE", "919110625567")
    if phone_to_use:
        try:
            sms_res = await send_otp_dev_sms(phone=phone_to_use, code_length=4)
            if sms_res.get("data") and sms_res["data"].get("message_id"):
                sms_sent = True
                print(f"[OTP.dev SMS] Successfully sent SMS OTP to {phone_to_use}")
        except Exception as e:
            print(f"[OTP.dev SMS] Error sending SMS: {e}")

    # 2. Also try Email
    email_sent = await send_otp_email(
        to_email=data.email,
        otp=otp,
        user_name=data.name,
    )

    if not email_sent and not sms_sent:
        # Fallback log to console in dev mode
        print(f"\n{'='*50}")
        print(f"[AgriMind OTP - DEV MODE]")
        print(f"  Email : {data.email}")
        print(f"  Phone : {phone_to_use}")
        print(f"  OTP   : {otp}")
        print(f"  TTL   : 5 minutes")
        print(f"{'='*50}\n")

    msg = ""
    if sms_sent and email_sent:
        msg = f"OTP sent to SMS (+{phone_to_use}) and Email ({data.email})"
    elif sms_sent:
        msg = f"OTP sent to your phone (+{phone_to_use}) via SMS!"
    elif email_sent:
        msg = f"OTP sent to your email ({data.email})"
    else:
        msg = f"Dev mode: Your OTP is {otp}"

    return OtpResponse(
        message=msg,
        email_sent=email_sent,
        sms_sent=sms_sent,
        phone=phone_to_use,
        code_length=4 if sms_sent else 6,
        dev_otp=otp if (not email_sent and not sms_sent and settings.DEBUG) else None,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_and_register(data: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2 of sign-up: verify OTP (via otp.dev SMS or email) then create the user and return a JWT.
    """
    phone_to_use = data.phone or getattr(settings, "DEFAULT_PHONE", "919110625567")
    
    # 1. Try SMS verification with otp.dev first if phone is available
    is_valid = False
    if phone_to_use:
        try:
            is_valid = await verify_otp_dev_sms(phone=phone_to_use, code=data.otp)
        except Exception:
            is_valid = False

    # 2. If not verified via SMS, try email / in-memory OTP
    if not is_valid:
        is_valid = await verify_otp_code(data.email, data.otp)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP code. Please check your SMS or request a new code."
        )

    # Double-check email not taken (race condition guard)
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Create user
    user = User(
        email=data.email,
        phone=phone_to_use,
        password_hash=get_password_hash(data.password),
        full_name=data.name,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Auto-provision starter farm, field, and cycle for the new farmer
    from app.models.farm import Farm, Field, CropCycle, CropType, GrowthStage, CropCycleStatus
    from app.models.iot import Alert, AlertType, AlertSeverity
    from datetime import date, timedelta

    farm = Farm(
        user_id=user.id,
        name=f"{user.full_name.split()[0]}'s Farm",
        total_area_acres=10.0,
        latitude=13.0827,
        longitude=80.2707,
        state="Tamil Nadu",
        district="Chennai"
    )
    db.add(farm)
    await db.flush()

    field = Field(
        farm_id=farm.id,
        name="Main Plot (Rice)",
        area_acres=5.0,
        soil_type="clay_loam"
    )
    db.add(field)
    await db.flush()

    crop_res = await db.execute(select(CropType).limit(1))
    crop_type = crop_res.scalar_one_or_none()
    if crop_type:
        cycle = CropCycle(
            field_id=field.id,
            crop_type_id=crop_type.id,
            sowing_date=date.today() - timedelta(days=30),
            expected_harvest=date.today() + timedelta(days=90),
            growth_stage=GrowthStage.vegetative,
            status=CropCycleStatus.active,
            health_score=90.0,
        )
        db.add(cycle)

    welcome_alert = Alert(
        user_id=user.id,
        alert_type=AlertType.weather_alert,
        severity=AlertSeverity.info,
        title="Welcome to AgriMind AI",
        message=f"Account created and verified successfully for {user.full_name}.",
        channels=["in_app"]
    )
    db.add(welcome_alert)
    await db.flush()

    # Issue JWT
    token_data = {"sub": str(user.id), "role": user.role.value if hasattr(user, 'role') else "farmer"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=86400,
    )
