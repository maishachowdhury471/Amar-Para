# আমার পাড়া — ফ্রন্টএন্ড

গ্রামের নোটিশ বোর্ড — দরকার, বিক্রি, হারিয়ে গেছে, খবর, দোকানের খবর, কাজের লোক,
বাড়ি ভাড়া, নতুন উদ্যোগ — সব এক জায়গায়। সম্পূর্ণ বাংলা, মোবাইল-বান্ধব।

## স্ট্যাক

- **Angular 18** (standalone components, TypeScript strict)
- **NgRx 18** — auth, posts, notifications, admin স্টোর (actions / reducer / effects / selectors)
- **Tailwind CSS 3** — `tailwind.config.js` দেখুন
- **RxJS**, Angular Router, Reactive Forms

## চালানো

```bash
npm install
npm start          # http://localhost:4200 — ডেভ সার্ভার
npm run build      # প্রোডাকশন বিল্ড → dist/amar-para/browser
```

ব্যাকএন্ড চালু থাকতে হবে: `http://localhost:8000/api/v1` (ডিফল্ট)।
API ঠিকানা বদলাতে `src/environments/environment.ts`-এ `apiUrl` বদলান।
প্রোডাকশনে `src/environments/environment.prod.ts` ব্যবহৃত হয়।

## Docker

```bash
docker build -t amar-para-frontend .
docker run -p 8080:80 amar-para-frontend
```

## পাতা / রুট

| রুট | কী আছে |
|---|---|
| `/login` | ইউজারনেম + পাসওয়ার্ড |
| `/register` | মোবাইলে OTP যাচাই → তথ্য (ইউজারনেম, গ্রাম, পাড়া, মোবাইল, পাসওয়ার্ড) |
| `/feed` | সবার পোস্ট, ক্যাটাগরি/সার্চ/গ্রাম/পাড়া ফিল্টার, পিন করা পোস্ট উপরে |
| `/post/:id` | বিস্তারিত, ছবি, Call বোতাম, কমেন্ট, ফ্ল্যাগ, রিপোর্ট, হয়ে গেছে, পিন |
| `/create-post` | নতুন পোস্ট, ছবি আপলোড প্রিভিউসহ (এডিট: `?edit=<id>`) |
| `/profile/:username` | প্রোফাইল ও তার পোস্ট |
| `/me` | নিজের প্রোফাইল ও পোস্ট |
| `/notifications` | নোটিফিকেশন, পড়া চিহ্ন, অপঠিত সংখ্যা |
| `/solved` | সমাধান হওয়া পোস্ট |
| `/dustbin` | ১০ দিনে সমাধান না হওয়া পোস্ট (ফিডে দেখা যায় না) |
| `/admin` | শুধু অ্যাডমিন: পরিসংখ্যান, বার গ্রাফ, ব্যবহারকারী, পোস্ট, পিন সারি, রিপোর্ট সারি |
| `/ads` | বিজ্ঞাপন কীভাবে দেবেন + ফর্ম (পিন: ১০০ টাকা / ১০ দিন) |

## নিয়ম

- লগইন ছাড়া ফিড দেখা যাবে না (AuthGuard) — যাচাই করা মোবাইল ছাড়া ঢোকা যাবে না।
- দিনে সর্বোচ্চ **২টি** পোস্ট। সার্ভার 429/400 দিলে সেই বার্তা UI-তে দেখানো হয়।
- পিন: ১০০ টাকা / ১০ দিন, অ্যাডমিনের অনুমোদন লাগবে। মেয়াদ বাড়ানো: ৫ দিনের জন্য ১০০ টাকা।
- ১০ দিনে সমাধান না হলে পোস্ট ডাস্টবিনে যায়। সমাধান হলে সমাধান সেকশনে যায়।
- ৫টি খারাপ/অশালীন কমেন্টে পোস্ট নিজে থেকেই মুছে যায়। খারাপ পোস্টের রিপোর্ট শুধু অ্যাডমিন দেখেন ও মোছেন।

## ফাইল কাঠামো

```
src/
├── environments/            environment.ts / environment.prod.ts
├── app/
│   ├── core/
│   │   ├── models.ts                ডেটা মডেল ও ক্যাটাগরি
│   │   ├── services/api.service.ts  সব API কল
│   │   ├── interceptors/            JWT Bearer interceptor
│   │   └── guards/                  AuthGuard, AdminGuard
│   ├── store/
│   │   ├── auth/         actions, reducer, effects, selectors
│   │   ├── posts/        actions, reducer, effects, selectors
│   │   ├── notifications/actions, reducer, effects, selectors
│   │   └── admin/        actions, reducer, effects, selectors
│   ├── features/
│   │   ├── auth/         login, register (OTP ধাপসহ)
│   │   ├── feed/         feed, status-list (solved/dustbin)
│   │   ├── posts/        post-detail, create-post
│   │   ├── profile/      profile, me
│   │   ├── notifications/
│   │   ├── admin/
│   │   └── ads/
│   └── shared/components/ header, post-card
├── styles.css  tailwind.config.js  Dockerfile  nginx.conf
```

## ডেভ মোডে OTP

`environment.ts`-এ `devShowOtp: true` থাকলে রেজিস্ট্রেশনের OTP ধাপে OTP স্ক্রিনেই
দেখানো হয়। আসল SMS চালু হলে `devShowOtp: false` করুন — তখন নোটটি আর দেখাবে না।

## বাকি কাজ

- ব্যাকএন্ড চালু হলে পুরো ফ্লো (OTP → রেজিস্ট্রেশন → পোস্ট) লাইভে যাচাই করা।
- আসল SMS OTP চালু হলে `devShowOtp` বন্ধ করা।
- পিনের টাকা দেওয়ার (পেমেন্ট) ব্যবস্থা যোগ করা — এখন শুধু অ্যাডমিনকে টাকা দেওয়ার নিয়ম লেখা আছে।
