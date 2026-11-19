"""Jobs — মেয়াদোত্তীর্ণ পোস্ট dustbin-এ পাঠানো ও পিন নামানো।

সুরক্ষা: অ্যাডমিন JWT অথবা X-Job-Secret হেডার (JOB_SECRET) — যেকোনো একটা
মিললেই চলবে। ডকারে/ক্রনে চালানোর নির্দেশ README-তে আছে।
"""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import get_optional_user
from ..models import User
from ..services.lifecycle import expire_posts

router = APIRouter(prefix="/jobs", tags=["jobs"])
settings = get_settings()


@router.post("/expire-posts")
def run_expire_posts(
    x_job_secret: str | None = Header(default=None, alias="X-Job-Secret"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    secret_ok = bool(settings.job_secret) and x_job_secret == settings.job_secret
    admin_ok = user is not None and user.role == "admin"
    if not (secret_ok or admin_ok):
        raise HTTPException(status_code=401, detail="অ্যাডমিন লগইন বা সঠিক X-Job-Secret প্রয়োজন")
    return expire_posts(db)
