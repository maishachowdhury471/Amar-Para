"""Amar Para backend — pytest (TestClient + SQLite টেস্ট DB)।

টেস্ট চালানোর আগে কোনো সার্ভার লাগে না; .env-এর বদলে এখানে টেস্ট সেটিংস ব্যবহার হয়।
"""

import os
import tempfile

os.environ["ENV"] = "development"
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only-123456"
os.environ["JOB_SECRET"] = "test-job-secret"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

Base.metadata.create_all(bind=engine)
client = TestClient(app)

MOBILE = "01712345678"
MOBILE2 = "01812345678"


def _register(username: str, mobile: str) -> dict:
    r = client.post("/api/v1/auth/request-otp", json={"mobile": mobile})
    assert r.status_code == 200, r.text
    otp = r.json()["dev_otp"]
    r = client.post("/api/v1/auth/verify-otp", json={"mobile": mobile, "otp": otp})
    assert r.status_code == 200, r.text
    r = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "gram_name": "গ্রাম",
            "para_name": "পাড়া",
            "mobile": mobile,
            "password": "secret123",
            "confirm_password": "secret123",
            "otp": otp,
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def _auth(username: str, mobile: str) -> str:
    data = _register(username, mobile)
    return data["access_token"]


def _post(token: str, title: str, category: str = "dorkar"):
    return client.post(
        "/api/v1/posts",
        data={"title": title, "body": "বিস্তারিত", "category": category, "phone": MOBILE},
        headers={"Authorization": f"Bearer {token}"},
    )


def test_health():
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/api/v1/health").json()["status"] == "ok"


def test_register_requires_verified_otp():
    r = client.post(
        "/api/v1/auth/register",
        json={
            "username": "nootp",
            "gram_name": "গ",
            "para_name": "প",
            "mobile": "01999999999",
            "password": "secret123",
            "confirm_password": "secret123",
            "otp": "123456",
        },
    )
    assert r.status_code == 400


def test_register_login_and_me():
    data = _register("maisha", MOBILE)
    assert data["user"]["username"] == "maisha"
    assert data["user"]["is_phone_verified"] is True
    assert "hashed_password" not in data["user"]
    r = client.post("/api/v1/auth/login", json={"username": "maisha", "password": "secret123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    r = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == "maisha"
    # ভুল পাসওয়ার্ড
    r = client.post("/api/v1/auth/login", json={"username": "maisha", "password": "wrong"})
    assert r.status_code == 401


def test_two_posts_per_day_limit():
    token = _auth("poster", MOBILE2)
    assert _post(token, "পোস্ট ১").status_code == 201
    assert _post(token, "পোস্ট ২").status_code == 201
    r = _post(token, "পোস্ট ৩")
    assert r.status_code == 429
    assert "২টি" in r.json()["detail"]


def test_pin_flow_needs_admin():
    # অ্যাডমিন সরাসরি DB-তে বানানো (scripts/create_admin.py-এর মতো)
    from app.database import SessionLocal
    from app.models import User
    from app.security import hash_password

    db = SessionLocal()
    admin = User(username="admin1", hashed_password=hash_password("admin123"),
                 gram_name="গ", para_name="প", mobile="01600000000",
                 is_phone_verified=True, role="admin")
    db.add(admin)
    db.commit()
    db.close()

    r = client.post("/api/v1/auth/login", json={"username": "admin1", "password": "admin123"})
    admin_token = r.json()["access_token"]

    token = _auth("pinner", "01511111111")
    post_id = _post(token, "পিনের পোস্ট").json()["id"]

    # সাধারণ ব্যবহারকারী অ্যাডমিন রুটে ঢুকতে পারবে না
    r = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403

    # পিন আবেদন
    r = client.post(f"/api/v1/posts/{post_id}/request-pin", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    assert r.json()["amount_taka"] == 100
    pin_id = r.json()["pin_request_id"]

    # অ্যাডমিন pending দেখবে ও approve করবে
    r = client.get("/api/v1/admin/pins", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert any(p["id"] == pin_id for p in r.json())
    r = client.post(f"/api/v1/admin/pins/{pin_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200

    # পোস্ট এখন পিন করা
    r = client.get(f"/api/v1/posts/{post_id}")
    assert r.json()["is_pinned"] is True
    assert r.json()["pinned_until"] is not None

    # extend-pin: আরও ৫ দিন
    r = client.post(f"/api/v1/posts/{post_id}/extend-pin", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["days_added"] == 5

    # পিন আবেদনকারী নোটিফিকেশন পেয়েছে
    r = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert any(n["type"] == "pin_approved" for n in r.json())


def test_flag_auto_delete():
    token = _auth("flagger", "01322222222")
    post_id = _post(token, "খারাপ পোস্ট").json()["id"]
    # ৫ জন আলাদা ব্যবহারকারী কমেন্টে ফ্ল্যাগ করলে পোস্ট auto-delete
    comment = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"body": "একটি কমেন্ট"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    for i in range(5):
        t = _auth(f"flaguser{i}", f"0140000000{i}")
        r = client.post(f"/api/v1/comments/{comment['id']}/flag", json={"reason": "অশ্লীল"}, headers={"Authorization": f"Bearer {t}"})
        assert r.status_code == 200, r.text
    r = client.get(f"/api/v1/posts/{post_id}")
    assert r.json()["status"] == "deleted"
    # একই ব্যবহারকারী দুবার ফ্ল্যাগ করতে পারবে না
    t = _auth("flaguser0b", "01400000009")
    client.post(f"/api/v1/comments/{comment['id']}/flag", json={"reason": "x"}, headers={"Authorization": f"Bearer {t}"})
    r = client.post(f"/api/v1/comments/{comment['id']}/flag", json={"reason": "x"}, headers={"Authorization": f"Bearer {t}"})
    assert r.status_code == 400


def test_expire_job_with_secret():
    r = client.post("/api/v1/jobs/expire-posts", headers={"X-Job-Secret": "test-job-secret"})
    assert r.status_code == 200
    assert "dustbin_moved" in r.json()
    r = client.post("/api/v1/jobs/expire-posts")
    assert r.status_code == 401


def test_ads_info():
    r = client.get("/api/v1/ads/info")
    assert r.json()["pin"]["price_taka"] == 100
    assert r.json()["pin"]["days"] == 10
