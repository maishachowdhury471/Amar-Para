"""Ads — শুধু তথ্য ও বিজ্ঞাপনের আবেদন (আয়ের ঘোষণা নয়)।"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_optional_user
from ..models import PIN_DAYS, PIN_PRICE_TAKA, AdRequest, User
from ..schemas import AdRequestCreate, AdRequestOut

router = APIRouter(prefix="/ads", tags=["ads"])


@router.get("/info")
def ads_info():
    return {
        "pin": {
            "price_taka": PIN_PRICE_TAKA,
            "days": PIN_DAYS,
            "extend_price_taka": PIN_PRICE_TAKA,
            "extend_days": 5,
            "note": "পিন করতে অ্যাডমিনের অনুমোদন লাগে। আবেদন করুন, অ্যাডমিন অনুমোদন দিলে পোস্ট ১০ দিন উপরে থাকবে।",
        },
        "how_to_advertise": [
            "নিচের ফর্মে আপনার দোকান/ব্যবসার নাম, মোবাইল ও বার্তা লিখে আবেদন করুন।",
            "অ্যাডমিন আপনার সাথে যোগাযোগ করবেন।",
            "বিজ্ঞাপন 'দোকানের খবর' ক্যাটাগরিতে পোস্ট হিসেবে দেখানো হয়।",
        ],
    }


@router.post("/requests", response_model=AdRequestOut, status_code=201)
def create_ad_request(
    payload: AdRequestCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    ad = AdRequest(
        user_id=user.id if user else None,
        business_name=payload.business_name,
        phone=payload.phone,
        message=payload.message,
        status="pending",
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return ad
