"""Amar Para — FastAPI অ্যাপ।"""

import os

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .config import get_settings
from .database import Base, engine
from .routers import admin, ads, auth, jobs, notifications, posts, users

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ডেভ/প্রথম চালুতে টেবিল তৈরি (প্রোডাকশনে Alembic মাইগ্রেশন ব্যবহার করুন)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Amar Para API", version="1.0.0", description="পাড়ার নোটিশ বোর্ড — ব্যাকএন্ড API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# আপলোড করা ছবি /uploads-এ স্ট্যাটিক সার্ভ হয়
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
@limiter.exempt
def health_root():
    return {"status": "ok", "service": "amar-para", "env": settings.env}


@app.get("/api/v1/health")
@limiter.exempt
def health_v1():
    return {"status": "ok", "service": "amar-para", "env": settings.env}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(ads.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
