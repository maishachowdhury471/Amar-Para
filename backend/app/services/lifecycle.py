"""পোস্ট লাইফসাইকেল ও ফ্ল্যাগ/অটো-ডিলিট লজিক।

ফ্ল্যাগ গোনার নিয়ম (README-তেও ব্যাখ্যা আছে):
- একটি কমেন্টে ফ্ল্যাগ = CommentFlag সারি (এক ব্যবহারকারী এক কমেন্টে একবারই)।
  Comment.negative_flags = ওই কমেন্টের মোট ফ্ল্যাগ সংখ্যা।
- একটি পোস্টের মোট নেগেটিভ ফ্ল্যাগ =
      (পোস্টের সব কমেন্টের negative_flags-এর যোগফল)
      + (পোস্টে খোলা (open) Report-এর সংখ্যা)
- মোট >= ৫ হলে পোস্ট auto-delete: status = "deleted"।
  এই চেক প্রতিটি নতুন ফ্ল্যাগ ও প্রতিটি নতুন রিপোর্টের পরে চলে।
"""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (
    AUTO_DELETE_FLAG_THRESHOLD,
    Comment,
    Notification,
    Post,
    Report,
)

DHAKA = ZoneInfo("Asia/Dhaka")


def dhaka_day_start_utc(now: datetime | None = None) -> datetime:
    """আজকের (Asia/Dhaka ক্যালেন্ডার দিন) শুরু — UTC-তে।"""
    now = now or datetime.now(timezone.utc)
    dhaka_now = now.astimezone(DHAKA)
    start_dhaka = dhaka_now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start_dhaka.astimezone(timezone.utc)


def posts_today_count(db: Session, author_id: int) -> int:
    start = dhaka_day_start_utc()
    return (
        db.query(func.count(Post.id))
        .filter(Post.author_id == author_id, Post.created_at >= start)
        .scalar()
        or 0
    )


def post_negative_total(db: Session, post_id: int) -> int:
    comment_flags = (
        db.query(func.coalesce(func.sum(Comment.negative_flags), 0))
        .filter(Comment.post_id == post_id)
        .scalar()
        or 0
    )
    open_reports = (
        db.query(func.count(Report.id))
        .filter(Report.post_id == post_id, Report.status == "open")
        .scalar()
        or 0
    )
    return int(comment_flags) + int(open_reports)


def check_auto_delete(db: Session, post: Post) -> bool:
    """মোট নেগেটিভ ফ্ল্যাগ >= ৫ হলে পোস্ট auto-delete করে True ফেরত দেয়।"""
    if post.status == "deleted":
        return False
    if post_negative_total(db, post.id) >= AUTO_DELETE_FLAG_THRESHOLD:
        post.status = "deleted"
        post.is_pinned = False
        db.add(post)
        db.commit()
        return True
    return False


def expire_posts(db: Session, now: datetime | None = None) -> dict:
    """১০ দিন পেরিয়ে সমাধান হয়নি এমন active পোস্ট -> dustbin; মেয়াদোত্তীর্ণ পিন নামাও।"""
    now = now or datetime.now(timezone.utc)
    dustbin_q = db.query(Post).filter(Post.status == "active", Post.expires_at < now)
    dustbin_count = dustbin_q.count()
    for post in dustbin_q.all():
        post.status = "dustbin"
        post.is_pinned = False
        db.add(post)
    unpin_q = db.query(Post).filter(
        Post.is_pinned.is_(True), Post.pinned_until.is_not(None), Post.pinned_until < now
    )
    unpin_count = unpin_q.count()
    for post in unpin_q.all():
        post.is_pinned = False
        post.pinned_until = None
        db.add(post)
    db.commit()
    return {"dustbin_moved": dustbin_count, "pins_removed": unpin_count}


def create_notification(db: Session, user_id: int, type_: str, title: str, body: str = "", link: str | None = None) -> Notification:
    notif = Notification(user_id=user_id, type=type_, title=title, body=body, link=link)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_admins(db: Session, type_: str, title: str, body: str = "", link: str | None = None) -> None:
    from ..models import User

    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        db.add(Notification(user_id=admin.id, type=type_, title=title, body=body, link=link))
    db.commit()
