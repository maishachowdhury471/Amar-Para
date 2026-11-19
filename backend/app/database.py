"""ডাটাবেস সংযোগ (SQLAlchemy 2.0)।"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import get_settings

settings = get_settings()

# সুরক্ষা: এই ব্যাকএন্ড সিঙ্ক SQLAlchemy ব্যবহার করে, তাই async ড্রাইভার
# (postgresql+asyncpg://) এখানে চলবে না। পুরনো .env-এ asyncpg থাকলে
# স্বয়ংক্রিয়ভাবে সঠিক সিঙ্ক ড্রাইভারে (postgresql+psycopg://) বদলে নেওয়া হয়।
database_url = settings.database_url
if "+asyncpg://" in database_url:
    database_url = database_url.replace("+asyncpg://", "+psycopg://")
if "+psycopg2://" in database_url:
    database_url = database_url.replace("+psycopg2://", "+psycopg://")

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
