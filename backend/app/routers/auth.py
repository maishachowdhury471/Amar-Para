"""Auth: OTP, রেজিস্ট্রেশন, লগইন।"""

import hashlib
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import OtpCode, User
from ..schemas import LoginRequest, OtpRequest, OtpVerify, RegisterRequest, TokenResponse, UserOut
from ..security import create_access_token, hash_password, verify_password
from ..services.sms import get_sms_provider

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
OTP_TTL_MINUTES = 10
OTP_VERIFIED_WINDOW_MINUTES = 30


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _issue_otp(db: Session, mobile: str) -> str:
    otp = f"{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)
    db.add(
        OtpCode(
            mobile=mobile,
            code_hash=_hash_otp(otp),
            expires_at=now + timedelta(minutes=OTP_TTL_MINUTES),
        )
    )
    db.commit()
    return otp


@router.post("/request-otp")
def request_otp(payload: OtpRequest, db: Session = Depends(get_db)):
    otp = _issue_otp(db, payload.mobile)
    get_sms_provider().send_otp(payload.mobile, otp)
    resp: dict = {"detail": "OTP পাঠানো হয়েছে", "mobile": payload.mobile}
    # ডেভ মোডে শুধুমাত্র রেসপন্সে OTP দেখানো হয় (প্রোডাকশনে কখনো নয়)
    if settings.is_development:
        resp["dev_otp"] = otp
    return resp


@router.post("/verify-otp")
def verify_otp(payload: OtpVerify, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    row = (
        db.query(OtpCode)
        .filter(
            OtpCode.mobile == payload.mobile,
            OtpCode.code_hash == _hash_otp(payload.otp),
            OtpCode.used.is_(False),
            OtpCode.expires_at > now,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=400, detail="ভুল বা মেয়াদোত্তীর্ণ OTP")
    row.used = True
    row.verified_at = now
    db.commit()
    return {"verified": True, "mobile": payload.mobile}


def _mobile_verified(db: Session, mobile: str) -> bool:
    """শেষ ৩০ মিনিটের মধ্যে OTP যাচাই হয়েছে কি না।"""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=OTP_VERIFIED_WINDOW_MINUTES)
    return (
        db.query(OtpCode)
        .filter(OtpCode.mobile == mobile, OtpCode.used.is_(True), OtpCode.verified_at >= cutoff)
        .first()
        is not None
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে")
    if db.query(User).filter(User.mobile == payload.mobile).first():
        raise HTTPException(status_code=400, detail="এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে")
    if not _mobile_verified(db, payload.mobile):
        raise HTTPException(status_code=400, detail="মোবাইল যাচাই করা হয়নি — প্রথমে OTP যাচাই করুন")
    user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        gram_name=payload.gram_name,
        para_name=payload.para_name,
        mobile=payload.mobile,
        is_phone_verified=True,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.username)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="ভুল ইউজারনেম বা পাসওয়ার্ড")
    token = create_access_token(user.username)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
