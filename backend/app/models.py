"""SQLAlchemy মডেল — Amar Para।

ক্যাটাগরি: DB-তে ইংরেজি কোড, বাংলা লেবেল CATEGORY_LABELS ম্যাপে।
"""

import enum
from datetime import datetime, timedelta, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

UTC = timezone.utc


def utcnow() -> datetime:
    return datetime.now(UTC)


class Category(str, enum.Enum):
    dorkar = "dorkar"
    bikri = "bikri"
    hariye = "hariye"
    khobor = "khobor"
    dokan = "dokan"
    kajer_lok = "kajer-lok"
    bari_bhara = "bari-bhara"
    notun_uddog = "notun-uddog"


CATEGORY_CODES = [c.value for c in Category]

CATEGORY_LABELS = {
    "dorkar": "দরকার",
    "bikri": "বিক্রি",
    "hariye": "হারিয়ে গেছে",
    "khobor": "খবর",
    "dokan": "দোকানের খবর",
    "kajer-lok": "কাজের লোক",
    "bari-bhara": "বাড়ি ভাড়া",
    "notun-uddog": "নতুন উদ্যোগ",
}

POST_STATUSES = ("active", "solved", "dustbin", "deleted")
PIN_PRICE_TAKA = 100
PIN_DAYS = 10
PIN_EXTEND_DAYS = 5
POST_LIFETIME_DAYS = 10
AUTO_DELETE_FLAG_THRESHOLD = 5


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    gram_name: Mapped[str] = mapped_column(String(100), nullable=False)
    para_name: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)  # user | admin
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    posts = relationship("Post", back_populates="author", foreign_keys="Post.author_id")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")


class Gram(Base):
    __tablename__ = "grams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    paras = relationship("Para", back_populates="gram", cascade="all, delete-orphan")


class Para(Base):
    __tablename__ = "paras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gram_id: Mapped[int] = mapped_column(Integer, ForeignKey("grams.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("gram_id", "name", name="uq_para_gram_name"),)

    gram = relationship("Gram", back_populates="paras")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    gram_id: Mapped[int] = mapped_column(Integer, ForeignKey("grams.id"), nullable=True)
    para_id: Mapped[int] = mapped_column(Integer, ForeignKey("paras.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    images: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pinned_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: utcnow() + timedelta(days=POST_LIFETIME_DAYS),
        nullable=False,
    )

    author = relationship("User", back_populates="posts", foreign_keys=[author_id])
    gram = relationship("Gram")
    para = relationship("Para")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    negative_flags: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")


class CommentFlag(Base):
    """একজন ব্যবহারকারী একই কমেন্টে একবারই ফ্ল্যাগ করতে পারবে — ডিডুপ টেবিল।"""

    __tablename__ = "comment_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    comment_id: Mapped[int] = mapped_column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_comment_flag_user"),)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # reply | pin_approved | pin_rejected | report | system
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    link: Mapped[str] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class PinRequest(Base):
    __tablename__ = "pin_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    amount_taka: Mapped[int] = mapped_column(Integer, default=PIN_PRICE_TAKA, nullable=False)
    days: Mapped[int] = mapped_column(Integer, default=PIN_DAYS, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    post = relationship("Post")
    user = relationship("User")


class PinExtension(Base):
    """পিন বাড়ানো (extend-pin) — ১০০ টাকা, আরও ৫ দিন। প্রতিটি এক্সটেনশনের রেকর্ড।"""

    __tablename__ = "pin_extensions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    amount_taka: Mapped[int] = mapped_column(Integer, default=PIN_PRICE_TAKA, nullable=False)
    days: Mapped[int] = mapped_column(Integer, default=PIN_EXTEND_DAYS, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    post = relationship("Post")
    user = relationship("User")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    comment_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("comments.id"), nullable=True)
    reporter_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    post = relationship("Post")
    comment = relationship("Comment")
    reporter = relationship("User")


class AdRequest(Base):
    __tablename__ = "ad_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
