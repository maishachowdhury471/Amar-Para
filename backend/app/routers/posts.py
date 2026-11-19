"""Posts, Comments, Flag, Report, Pin।"""

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import get_current_user
from ..models import (
    AUTO_DELETE_FLAG_THRESHOLD,
    CATEGORY_CODES,
    PIN_DAYS,
    PIN_EXTEND_DAYS,
    PIN_PRICE_TAKA,
    POST_LIFETIME_DAYS,
    Comment,
    CommentFlag,
    Gram,
    Para,
    PinExtension,
    PinRequest,
    Post,
    Report,
    User,
)
from ..schemas import CommentCreate, CommentOut, FlagRequest, PostOut, PostUpdate, ReportCreate
from ..services.lifecycle import (
    check_auto_delete,
    create_notification,
    notify_admins,
    posts_today_count,
)
from .helpers import post_to_out

router = APIRouter(tags=["posts"])
settings = get_settings()
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_POSTS_PER_DAY = 2


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="পোস্ট পাওয়া যায়নি")
    return post


def _check_owner_or_admin(post: Post, user: User):
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="এটা আপনার পোস্ট নয়")


@router.get("/posts", response_model=list[PostOut])
def list_posts(
    category: str | None = None,
    gram_id: int | None = None,
    para_id: int | None = None,
    q: str | None = None,
    status: str = "active",
    db: Session = Depends(get_db),
):
    if category and category not in CATEGORY_CODES:
        raise HTTPException(status_code=400, detail="অবৈধ ক্যাটাগরি")
    if status not in ("active", "solved", "dustbin", "deleted"):
        raise HTTPException(status_code=400, detail="অবৈধ status")
    query = db.query(Post).filter(Post.status == status)
    if category:
        query = query.filter(Post.category == category)
    if gram_id:
        query = query.filter(Post.gram_id == gram_id)
    if para_id:
        query = query.filter(Post.para_id == para_id)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Post.title.ilike(like), Post.body.ilike(like)))
    # পিন করা পোস্ট আগে, তারপর নতুন পোস্ট
    posts = query.order_by(Post.is_pinned.desc(), Post.pinned_until.desc().nullslast(), Post.created_at.desc()).all()
    return [post_to_out(p, db) for p in posts]


@router.post("/posts", response_model=PostOut, status_code=201)
async def create_post(
    title: str = Form(..., max_length=200),
    body: str = Form(...),
    gram_id: int | None = Form(None),
    para_id: int | None = Form(None),
    category: str = Form(...),
    phone: str = Form(...),
    price: int | None = Form(None),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if category not in CATEGORY_CODES:
        raise HTTPException(status_code=400, detail=f"ক্যাটাগরি হতে হবে: {', '.join(CATEGORY_CODES)}")
    if category == "bikri" and price is None:
        raise HTTPException(status_code=400, detail="বিক্রির পোস্টে দাম দিতে হবে")
    if category != "bikri" and price is not None:
        price = None  # দাম শুধু বিক্রির পোস্টে
    if gram_id and not db.query(Gram).filter(Gram.id == gram_id).first():
        raise HTTPException(status_code=400, detail="গ্রাম পাওয়া যায়নি")
    if para_id and not db.query(Para).filter(Para.id == para_id).first():
        raise HTTPException(status_code=400, detail="পাড়া পাওয়া যায়নি")
    # দিনে সর্বোচ্চ ২টি পোস্ট (Asia/Dhaka ক্যালেন্ডার দিন)
    if posts_today_count(db, user.id) >= MAX_POSTS_PER_DAY:
        raise HTTPException(status_code=429, detail="আজকের জন্য ২টি পোস্টের সীমা শেষ — আগামীকাল আবার পোস্ট করতে পারবেন")
    if len(images) > settings.max_images_per_post:
        raise HTTPException(status_code=400, detail=f"সর্বোচ্চ {settings.max_images_per_post}টি ছবি দেওয়া যাবে")

    os.makedirs(settings.upload_dir, exist_ok=True)
    saved_paths: list[str] = []
    for img in images:
        if img.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="শুধু jpg/png/webp ছবি দেওয়া যাবে")
        data = await img.read()
        if len(data) > settings.max_image_bytes:
            raise HTTPException(status_code=400, detail=f"একটি ছবি সর্বোচ্চ {settings.max_image_size_mb}MB হতে পারে")
        if not data:
            continue
        ext = ALLOWED_IMAGE_TYPES[img.content_type]
        filename = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(settings.upload_dir, filename), "wb") as f:
            f.write(data)
        saved_paths.append(f"/uploads/{filename}")

    now = datetime.now(timezone.utc)
    post = Post(
        author_id=user.id,
        gram_id=gram_id,
        para_id=para_id,
        category=category,
        title=title,
        body=body,
        phone=phone,
        price=price,
        images=saved_paths,
        status="active",
        expires_at=now + timedelta(days=POST_LIFETIME_DAYS),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_out(post, db)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return post_to_out(_get_post_or_404(db, post_id), db)


@router.put("/posts/{post_id}", response_model=PostOut)
def update_post(post_id: int, payload: PostUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    _check_owner_or_admin(post, user)
    if payload.title is not None:
        post.title = payload.title
    if payload.body is not None:
        post.body = payload.body
    if payload.category is not None:
        post.category = payload.category
    if payload.price is not None:
        post.price = payload.price if post.category == "bikri" else None
    db.commit()
    db.refresh(post)
    return post_to_out(post, db)


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    _check_owner_or_admin(post, user)
    post.status = "deleted"
    db.commit()
    return {"detail": "পোস্ট মুছে ফেলা হয়েছে"}


@router.post("/posts/{post_id}/mark-solved", response_model=PostOut)
def mark_solved(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    _check_owner_or_admin(post, user)
    post.status = "solved"
    db.commit()
    db.refresh(post)
    return post_to_out(post, db)


# ---------- Comments ----------
@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    post = _get_post_or_404(db, post_id)
    comments = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.created_at.asc()).all()
    out = []
    for c in comments:
        co = CommentOut.model_validate(c)
        author = db.query(User).filter(User.id == c.author_id).first()
        co.author_username = author.username if author else None
        out.append(co)
    return out


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(post_id: int, payload: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    if post.status == "deleted":
        raise HTTPException(status_code=400, detail="মুছে ফেলা পোস্টে কমেন্ট করা যাবে না")
    comment = Comment(post_id=post.id, author_id=user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    # পোস্টের লেখককে নোটিফিকেশন (নিজের পোস্টে নিজে কমেন্ট করলে নয়)
    if post.author_id != user.id:
        create_notification(
            db, post.author_id, "reply",
            "আপনার পোস্টে নতুন রিপ্লাই",
            f"{user.username} আপনার পোস্টে রিপ্লাই দিয়েছেন: {payload.body[:100]}",
            link=f"/posts/{post.id}",
        )
    out = CommentOut.model_validate(comment)
    out.author_username = user.username
    return out


@router.post("/comments/{comment_id}/flag")
def flag_comment(comment_id: int, payload: FlagRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="কমেন্ট পাওয়া যায়নি")
    # একই ব্যবহারকারী একই কমেন্টে দুবার ফ্ল্যাগ করতে পারবে না
    existing = db.query(CommentFlag).filter(CommentFlag.comment_id == comment.id, CommentFlag.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="আপনি এই কমেন্টে ইতিমধ্যে ফ্ল্যাগ করেছেন")
    db.add(CommentFlag(comment_id=comment.id, user_id=user.id, reason=payload.reason))
    comment.negative_flags += 1
    db.commit()
    post = _get_post_or_404(db, comment.post_id)
    deleted = check_auto_delete(db, post)
    return {
        "detail": "ফ্ল্যাগ করা হয়েছে",
        "comment_negative_flags": comment.negative_flags,
        "post_auto_deleted": deleted,
        "threshold": AUTO_DELETE_FLAG_THRESHOLD,
    }


# ---------- Report ----------
@router.post("/posts/{post_id}/report", status_code=201)
def report_post(post_id: int, payload: ReportCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    report = Report(post_id=post.id, reporter_id=user.id, reason=payload.reason)
    db.add(report)
    db.commit()
    db.refresh(report)
    notify_admins(
        db, "report",
        "নতুন রিপোর্ট এসেছে",
        f"{user.username} পোস্ট #{post.id} রিপোর্ট করেছেন: {payload.reason}",
        link=f"/posts/{post.id}",
    )
    deleted = check_auto_delete(db, post)
    return {"detail": "রিপোর্ট জমা হয়েছে", "report_id": report.id, "post_auto_deleted": deleted}


# ---------- Pin ----------
@router.post("/posts/{post_id}/request-pin", status_code=201)
def request_pin(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    _check_owner_or_admin(post, user)
    existing = (
        db.query(PinRequest)
        .filter(PinRequest.post_id == post.id, PinRequest.status == "pending")
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="এই পোস্টের পিন আবেদন ইতিমধ্যে অপেক্ষমাণ আছে")
    pin = PinRequest(post_id=post.id, user_id=user.id, amount_taka=PIN_PRICE_TAKA, days=PIN_DAYS, status="pending")
    db.add(pin)
    db.commit()
    db.refresh(pin)
    notify_admins(db, "pin_request", "নতুন পিন আবেদন", f"{user.username} পোস্ট #{post.id} পিন করতে চান (১০০ টাকা / ১০ দিন)", link=f"/posts/{post.id}")
    return {"detail": "পিন আবেদন জমা হয়েছে", "pin_request_id": pin.id, "amount_taka": PIN_PRICE_TAKA, "days": PIN_DAYS}


@router.post("/posts/{post_id}/extend-pin")
def extend_pin(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = _get_post_or_404(db, post_id)
    _check_owner_or_admin(post, user)
    if not post.is_pinned:
        raise HTTPException(status_code=400, detail="শুধু পিন করা পোস্টের মেয়াদ বাড়ানো যায়")
    ext = PinExtension(post_id=post.id, user_id=user.id, amount_taka=PIN_PRICE_TAKA, days=PIN_EXTEND_DAYS)
    db.add(ext)
    base = post.pinned_until or datetime.now(timezone.utc)
    post.pinned_until = base + timedelta(days=PIN_EXTEND_DAYS)
    db.commit()
    return {
        "detail": "পিনের মেয়াদ ৫ দিন বাড়ানো হয়েছে",
        "amount_taka": PIN_PRICE_TAKA,
        "days_added": PIN_EXTEND_DAYS,
        "pinned_until": post.pinned_until.isoformat(),
    }
