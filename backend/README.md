# আমার পাড়া (Amar Para) — ব্যাকএন্ড

পাড়া/এলাকার নোটিশ বোর্ডের ব্যাকএন্ড API। **স্ট্যাক:** Python FastAPI + Uvicorn, SQLAlchemy + PostgreSQL, Alembic, Pydantic v2, JWT, bcrypt, slowapi রেট লিমিট।

## চালানো (লোকাল)

```bash
cd backend
cp .env.example .env        # SECRET_KEY, DATABASE_URL ঠিক করুন
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head         # মাইগ্রেশন (অথবা প্রথম চালুতে টেবিল নিজে তৈরি হয়)
python scripts/create_admin.py --username admin --mobile 01700000000
uvicorn app.main:app --reload --port 8000
```

API ডক: http://localhost:8000/docs — হেলথ: `GET /health` ও `GET /api/v1/health`

## Docker

```bash
docker build -t amar-para-backend .
docker run -p 8000:8000 --env-file .env amar-para-backend
```

PostgreSQL-এর সাথে (docker-compose উদাহরণ):

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: amarpara
      POSTGRES_PASSWORD: amarpara
      POSTGRES_DB: amarpara
    volumes:
      - pgdata:/var/lib/postgresql/data
  api:
    build: .
    environment:
      DATABASE_URL: postgresql+psycopg://amarpara:amarpara@db:5432/amarpara
    env_file: .env
    ports: ["8000:8000"]
    depends_on: [db]
volumes:
  pgdata:
```

## .env

সব সিক্রেট `.env`-এ — কোডে কোনো সিক্রেট হার্ডকোড নেই। দেখুন `.env.example`।
গুরুত্বপূর্ণ: `SECRET_KEY` (কমপক্ষে ৩২ অক্ষরের র‍্যান্ডম), `DATABASE_URL`,
`ACCESS_TOKEN_EXPIRE_MINUTES` (ডিফল্ট ১০০৮০ = ৭ দিন), `JOB_SECRET`,
`SMS_PROVIDER` (`log` ডেভ / `env` আসল provider), `CORS_ORIGINS`।

## এন্ডপয়েন্ট (prefix `/api/v1`)

| গ্রুপ | এন্ডপয়েন্ট |
|---|---|
| হেলথ | `GET /health`, `GET /api/v1/health` |
| Auth | `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/register`, `POST /auth/login` |
| Users | `GET /users/me`, `GET /users/{username}`, `GET /users/{id}/posts` |
| Grams | `GET /grams`, `POST /grams` (admin), `GET /grams/{id}/paras`, `POST /grams/{id}/paras` (admin) |
| Posts | `GET /posts?category=&gram_id=&para_id=&q=&status=`, `POST /posts` (multipart + ছবি), `GET /posts/{id}`, `PUT /posts/{id}`, `DELETE /posts/{id}`, `POST /posts/{id}/mark-solved` |
| Comments | `GET /posts/{id}/comments`, `POST /posts/{id}/comments`, `POST /comments/{id}/flag` |
| Report | `POST /posts/{id}/report` |
| Pin | `POST /posts/{id}/request-pin`, `POST /posts/{id}/extend-pin` |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| Admin | `GET /admin/stats`, `GET /admin/users`, `GET /admin/posts`, `GET /admin/pins`, `POST /admin/pins/{id}/approve`, `POST /admin/pins/{id}/reject`, `GET /admin/reports`, `POST /admin/reports/{id}/resolve`, `DELETE /admin/posts/{id}` |
| Ads | `GET /ads/info`, `POST /ads/requests` |
| Jobs | `POST /jobs/expire-posts` (অ্যাডমিন JWT বা `X-Job-Secret`) |

## নিয়ম (ব্যাকএন্ডে জোর করে लागू)

- **দিনে সর্বোচ্চ ২টি পোস্ট** — একই লেখক, একই ক্যালেন্ডার দিন (Asia/Dhaka)।
- **নিজের পোস্ট ছাড়া এডিট/ডিলিট নয়** (অ্যাডমিন ছাড়া)।
- **অ্যাডমিন-শুধু রুটে রোল চেক** বাধ্যতামূলক।
- **পাসওয়ার্ড** bcrypt হ্যাশে সংরক্ষণ, কখনো প্লেইন টেক্সটে নয়, রেসপন্সে ফেরত নয়।
- **ORM ব্যবহার** — raw SQL নয়।
- **ছবি:** শুধু jpg/png/webp, প্রতিটি সর্বোচ্চ ৫MB, পোস্টে সর্বোচ্চ ৫টি; `/uploads`-এ সংরক্ষণ, `/uploads/...` পাথে সার্ভ হয়।
- **পোস্টের মেয়াদ:** তৈরি থেকে ১০ দিন — সমাধান না হলে Dustbin-এ যায়; সমাধান হলে Somadhan (status=solved) সেকশনে।

## ক্যাটাগরি

DB-তে ইংরেজি কোড, বাংলা লেবেল আলাদা ম্যাপে (`CATEGORY_LABELS`):

| কোড | বাংলা |
|---|---|
| dorkar | দরকার |
| bikri | বিক্রি |
| hariye | হারিয়ে গেছে |
| khobor | খবর |
| dokan | দোকানের খবর |
| kajer-lok | কাজের লোক |
| bari-bhara | বাড়ি ভাড়া |
| notun-uddog | নতুন উদ্যোগ |

দাম (`price`) শুধু বিক্রি (`bikri`) পোস্টে।

## ফ্ল্যাগ / অটো-ডিলিট লজিক

- একটি কমেন্টে ফ্ল্যাগ = `CommentFlag` সারি। **একই ব্যবহারকারী একই কমেন্টে দুবার ফ্ল্যাগ করতে পারবে না** (unique constraint)।
- `Comment.negative_flags` = ওই কমেন্টের মোট ফ্ল্যাগ সংখ্যা।
- একটি পোস্টের **মোট নেগেটিভ ফ্ল্যাগ** = (পোস্টের সব কমেন্টের `negative_flags`-এর যোগফল) + (পোস্টে খোলা `Report`-এর সংখ্যা)।
- মোট **৫ বা তার বেশি** হলে পোস্ট **auto-delete** হয় (`status=deleted`) — প্রতিটি নতুন ফ্ল্যাগ ও প্রতিটি নতুন রিপোর্টের পরে এই চেক চলে (`services/lifecycle.py: check_auto_delete`)।
- খারাপ পোস্টের রিপোর্ট এলে সব অ্যাডমিনকে নোটিফিকেশন যায়; শুধু অ্যাডমিনই পোস্ট মুছতে পারে (অটো-ডিলিট ছাড়া)।

## পিন

- পিন আবেদন: **১০০ টাকা, ১০ দিন**। আবেদন `pending` থাকে, অ্যাডমিন approve করলে `pinned_until = এখন + ১০ দিন`।
- মেয়াদ বাড়ানো: শুধু পিন করা পোস্টে, **১০০ টাকা, আরও ৫ দিন** (`pinned_until += ৫ দিন`, প্রতিটি এক্সটেনশন `pin_extensions` টেবিলে রেকর্ড থাকে)।
- পিন করা পোস্ট ফিডে আগে দেখায়।

## নোটিফিকেশন

- নিজের পোস্টে রিপ্লাই এলে → পোস্টের লেখককে।
- পিন approve/reject হলে → আবেদনকারীকে।
- রিপোর্ট / পিন আবেদন এলে → সব অ্যাডমিনকে।

## OTP / SMS

- `POST /auth/request-otp` → ৬ সংখ্যার OTP (১০ মিনিটের মেয়াদ, SHA-256 হ্যাশে সংরক্ষণ)।
- **ডেভ মোডে** (`ENV=development`) OTP কনসোলে লগ হয় ও রেসপন্সে `dev_otp` ফিল্ডে আসে। প্রোডাকশনে কখনো রেসপন্সে OTP আসে না।
- রেজিস্ট্রেশনে যাচাই করা মোবাইল বাধ্যতামূলক — OTP যাচাই না হলে ৪০০।
- আসল SMS: `services/sms.py`-তে `SmsProvider` প্রোটোকল + `LogSmsProvider` (ডেভ) + `EnvSmsProvider` স্টাব। আসল provider (BulkSMSBD/SSL Wireless/Twilio) লাগাতে `.env`-এ `SMS_PROVIDER=env`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` সেট করে `EnvSmsProvider._send()`-এ provider-এর API ফরম্যাট বসাতে হবে।

## মেয়াদোত্তীর্ণ পোস্টের জব (expire-posts)

`POST /jobs/expire-posts` — ১০ দিন পেরিয়ে সমাধান হয়নি এমন active পোস্টকে dustbin-এ পাঠায়, মেয়াদোত্তীর্ণ পিন নামায়। অ্যাডমিন JWT অথবা `X-Job-Secret: <JOB_SECRET>` হেডার লাগে।

ডকারে/ক্রনে চালানো:

```bash
# প্রতি ঘণ্টায় (cron):
0 * * * * curl -s -X POST https://YOUR-DOMAIN/api/v1/jobs/expire-posts -H "X-Job-Secret: $JOB_SECRET"
```

## টেস্ট

```bash
pytest -v
```

টেস্টে health, register/login (OTP যাচাই ছাড়া রেজিস্ট্রেশন ব্যর্থ হয়), দিনে ২-পোস্টের সীমা, পিন ফ্লো (অ্যাডমিন approve → পিন → extend), ফ্ল্যাগে অটো-ডিলিট, expire জব ও ads/info যাচাই করা হয় (SQLite টেস্ট DB)।

## বাকি কাজ

- **SMS provider আসল:** এখন শুধু লগ/স্টাব — আসল SMS provider যুক্ত করতে হবে।
- **পেমেন্ট গেটওয়ে মক:** পিনের ১০০ টাকা ও এক্সটেনশনের ১০০ টাকা এখন শুধু DB-তে রেকর্ড হয় — আসল পেমেন্ট (bKash/Nagad/SSLCommerz) এখনো যুক্ত হয়নি।
- ফ্রন্টএন্ড (Angular) এই API ব্যবহার করবে — `CORS_ORIGINS`-এ ফ্রন্টএন্ডের ঠিকানা যোগ করুন।
