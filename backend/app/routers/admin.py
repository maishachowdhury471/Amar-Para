"""Admin — পরিসংখ্যান, ব্যবহারকারী/পোস্ট ব্যবস্থাপনা, পিন ও রিপোর্ট।"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_admin
from ..models import (
    PIN_DAYS,
    Comment,
    Notification,
    PinRequest,
    Post,
    Report,
    User,
)
from ..schemas import PinRequestOut, PostOut, ReportOut, UserOut
from ..services.lifecycle import create_notification
from .helpers import post_to_out

router = APIRouter(prefix="/admin", tags=["admin"])


def _daily_series(db: Session, model, days: int = 30) -> list[dict]:
    """প্রতিদিনের সংখ্যার সিরিজ (শেষ N দিন)। SQLite ও PostgreSQL দুটোতেই চলে।"""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(model.created_at), func.count(model.id))
        .filter(model.created_at >= since)
        .group_by(func.date(model.created_at))
        .order_by(func.date(model.created_at))
        .all()
    )
    by_date = {str(d): c for d, c in rows}
    series = []
    for i in range(days, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).date().isoformat()
        series.append({"date": day, "count": by_date.get(day, 0)})
    return series


@router.get("/stats")
def stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    return {
        "totals": {
            "users": db.query(func.count(User.id)).scalar(),
            "posts": db.query(func.count(Post.id)).scalar(),
            "comments": db.query(func.count(Comment.id)).scalar(),
            "active_posts": db.query(func.count(Post.id)).filter(Post.status == "active").scalar(),
            "solved_posts": db.query(func.count(Post.id)).filter(Post.status == "solved").scalar(),
            "dustbin_posts": db.query(func.count(Post.id)).filter(Post.status == "dustbin").scalar(),
            "pending_pins": db.query(func.count(PinRequest.id)).filter(PinRequest.status == "pending").scalar(),
            "open_reports": db.query(func.count(Report.id)).filter(Report.status == "open").scalar(),
        },
        "growth": {
            "users_last_7d": db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar(),
            "users_last_30d": db.query(func.count(User.id)).filter(User.created_at >= month_ago).scalar(),
            "posts_last_7d": db.query(func.count(Post.id)).filter(Post.created_at >= week_ago).scalar(),
            "posts_last_30d": db.query(func.count(Post.id)).filter(Post.created_at >= month_ago).scalar(),
        },
        "daily": {
            "users": _daily_series(db, User),
            "posts": _daily_series(db, Post),
            "comments": _daily_series(db, Comment),
        },
    }


@router.get("/users", response_model=list[UserOut])
def admin_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/posts", response_model=list[PostOut])
def admin_posts(status: str | None = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(Post).order_by(Post.created_at.desc())
    if status:
        q = q.filter(Post.status == status)
    return [post_to_out(p, db) for p in q.all()]


@router.delete("/posts/{post_id}")
def admin_delete_post(post_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="পোস্ট পাওয়া যায়নি")
    post.status = "deleted"
    post.is_pinned = False
    db.commit()
    return {"detail": "পোস্ট মুছে ফেলা হয়েছে"}


@router.get("/pins", response_model=list[PinRequestOut])
def admin_pins(status: str = "pending", db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return (
        db.query(PinRequest)
        .filter(PinRequest.status == status)
        .order_by(PinRequest.requested_at.asc())
        .all()
    )


@router.post("/pins/{pin_id}/approve")
def approve_pin(pin_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    pin = db.query(PinRequest).filter(PinRequest.id == pin_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="পিন আবেদন পাওয়া যায়নি")
    if pin.status != "pending":
        raise HTTPException(status_code=400, detail="এই আবেদনটি ইতিমধ্যে নিষ্পত্তি হয়েছে")
    now = datetime.now(timezone.utc)
    post = db.query(Post).filter(Post.id == pin.post_id).first()
    if not post or post.status == "deleted":
        raise HTTPException(status_code=400, detail="পোস্টটি আর পিন করার মতো নেই")
    pin.status = "approved"
    pin.decided_at = now
    pin.expires_at = now + timedelta(days=pin.days or PIN_DAYS)
    post.is_pinned = True
    post.pinned_until = pin.expires_at
    db.commit()
    create_notification(
        db, pin.user_id, "pin_approved",
        "আপনার পিন আবেদন অনুমোদিত হয়েছে",
        f"পোস্ট #{post.id} {pin.days} দিনের জন্য উপরে পিন করা হয়েছে।",
        link=f"/posts/{post.id}",
    )
    return {"detail": "পিন অনুমোদিত হয়েছে", "pinned_until": post.pinned_until.isoformat()}


@router.post("/pins/{pin_id}/reject")
def reject_pin(pin_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    pin = db.query(PinRequest).filter(PinRequest.id == pin_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="পিন আবেদন পাওয়া যায়নি")
    if pin.status != "pending":
        raise HTTPException(status_code=400, detail="এই আবেদনটি ইতিমধ্যে নিষ্পত্তি হয়েছে")
    pin.status = "rejected"
    pin.decided_at = datetime.now(timezone.utc)
    db.commit()
    create_notification(
        db, pin.user_id, "pin_rejected",
        "আপনার পিন আবেদন বাতিল হয়েছে",
        f"পোস্ট #{pin.post_id}-এর পিন আবেদন অনুমোদিত হয়নি।",
        link=f"/posts/{pin.post_id}",
    )
    return {"detail": "পিন আবেদন বাতিল হয়েছে"}


@router.get("/reports", response_model=list[ReportOut])
def admin_reports(status: str = "open", db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return (
        db.query(Report)
        .filter(Report.status == status)
        .order_by(Report.created_at.asc())
        .all()
    )


@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="রিপোর্ট পাওয়া যায়নি")
    report.status = "resolved"
    db.commit()
    return {"detail": "রিপোর্ট নিষ্পত্তি হয়েছে"}
