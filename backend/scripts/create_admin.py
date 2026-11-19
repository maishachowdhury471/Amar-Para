"""প্রথম অ্যাডমিন বানানো:  python scripts/create_admin.py --username admin --mobile 01700000000 --password '...' """

import argparse
import getpass
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base  # noqa: E402
from app.models import User  # noqa: E402
from app.security import hash_password  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Amar Para — প্রথম অ্যাডমিন তৈরি")
    parser.add_argument("--username", required=True)
    parser.add_argument("--mobile", required=True)
    parser.add_argument("--gram", default="ঢাকা")
    parser.add_argument("--para", default="সদর")
    parser.add_argument("--password", default=None, help="না দিলে জিজ্ঞেস করবে (টার্মিনালে লুকিয়ে টাইপ)")
    args = parser.parse_args()

    password = args.password or getpass.getpass("অ্যাডমিন পাসওয়ার্ড: ")
    if len(password) < 6:
        print("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
        sys.exit(1)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == args.username).first():
            print(f"ইউজারনেম '{args.username}' ইতিমধ্যে আছে")
            sys.exit(1)
        if db.query(User).filter(User.mobile == args.mobile).first():
            print(f"মোবাইল '{args.mobile}' ইতিমধ্যে আছে")
            sys.exit(1)
        admin = User(
            username=args.username,
            hashed_password=hash_password(password),
            gram_name=args.gram,
            para_name=args.para,
            mobile=args.mobile,
            is_phone_verified=True,
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"অ্যাডমিন তৈরি হয়েছে: {args.username} (id={admin.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
