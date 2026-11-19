"""Pydantic v2 স্কিমা — রিকোয়েস্ট/রেসপন্স।"""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from .models import CATEGORY_CODES, CATEGORY_LABELS


# ---------- Auth ----------
class OtpRequest(BaseModel):
    mobile: str = Field(..., min_length=11, max_length=15, examples=["01712345678"])

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if v.startswith("+880"):
            v = "0" + v[4:]
        if not v.isdigit() or len(v) != 11 or not v.startswith("01"):
            raise ValueError("সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)")
        return v


class OtpVerify(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=6, max_length=6)

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v: str) -> str:
        return OtpRequest.clean_mobile(v)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    gram_name: str = Field(..., min_length=1, max_length=100)
    para_name: str = Field(..., min_length=1, max_length=100)
    mobile: str
    password: str = Field(..., min_length=6, max_length=72)
    confirm_password: str
    otp: str = Field(..., min_length=6, max_length=6)

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v: str) -> str:
        return OtpRequest.clean_mobile(v)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না")
        return self


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- Users ----------
class UserOut(BaseModel):
    id: int
    username: str
    gram_name: str
    para_name: str
    mobile: str
    is_phone_verified: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()


# ---------- Gram / Para ----------
class GramCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class GramOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ParaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ParaOut(BaseModel):
    id: int
    gram_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Posts ----------
class PostOut(BaseModel):
    id: int
    author_id: int
    author_username: str | None = None
    gram_id: int | None
    para_id: int | None
    category: str
    category_label: str | None = None
    title: str
    body: str
    phone: str
    price: int | None
    images: list[str] = []
    status: str
    is_pinned: bool
    pinned_until: datetime | None
    created_at: datetime
    expires_at: datetime
    comment_count: int = 0

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def add_label(self):
        self.category_label = CATEGORY_LABELS.get(self.category, self.category)
        return self


class PostUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    body: str | None = None
    price: int | None = None
    category: str | None = None

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str | None) -> str | None:
        if v is not None and v not in CATEGORY_CODES:
            raise ValueError(f"ক্যাটাগরি হতে হবে: {', '.join(CATEGORY_CODES)}")
        return v


class PostCreateForm(BaseModel):
    """multipart ফর্মের টেক্সট ফিল্ড যাচাইয়ের জন্য (রাউটারে হাতে যাচাই করা হয়)।"""

    title: str
    body: str
    gram_id: int | None = None
    para_id: int | None = None
    category: str
    phone: str
    price: int | None = None


# ---------- Comments ----------
class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    post_id: int
    author_id: int
    author_username: str | None = None
    body: str
    negative_flags: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FlagRequest(BaseModel):
    reason: str = Field(default="", max_length=200)


class ReportCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=300)


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: str
    link: str | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Pins ----------
class PinRequestOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    amount_taka: int
    days: int
    status: str
    requested_at: datetime
    decided_at: datetime | None
    expires_at: datetime | None

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    id: int
    post_id: int
    comment_id: int | None
    reporter_id: int
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Ads ----------
class AdRequestCreate(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=150)
    phone: str
    message: str = Field(default="", max_length=2000)

    @field_validator("phone")
    @classmethod
    def clean_mobile(cls, v: str) -> str:
        return OtpRequest.clean_mobile(v)


class AdRequestOut(BaseModel):
    id: int
    user_id: int | None
    business_name: str
    phone: str
    message: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
