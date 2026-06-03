# 💰 SurveyEase — Rewarded Survey Platform

A premium, mobile-first survey rewards web application with RapidoReach integration, gamification, and secure webhook postbacks.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🎨 **Premium UI** — Modern dark navy nav, orange accents, smooth animations
- 📱 **Mobile-First** — Fixed header/nav, horizontal scroll, responsive design
- 🔐 **Secure Webhooks** — HMAC SHA-256 validation, IP whitelist, idempotency
- 🎮 **Gamification** — Levels, XP, streaks, achievements, leaderboards
- 💰 **Points System** — 1000 pts = $1.00, surveys, referrals, bonuses
- 🎯 **RapidoReach** — Survey wall iframe with user tracking
- 🧪 **Dev Panel** — Test webhook completions directly in-app
- 🌙 **Dark Mode** — Full dark theme support
- 📊 **Transaction History** — Complete earning/spending records

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/surveyease)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- RapidoReach account

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/surveyease.git
cd surveyease

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
nano .env

# Push database schema
npx drizzle-kit push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection String**
3. Copy the URI and set as `DATABASE_URL`
4. Run: `npx drizzle-kit push`

### Option 2: Run SQL Directly

```sql
-- See drizzle/0000_tense_champions.sql for full schema
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random string for JWT signing (32+ chars) |
| `SURVEY_SECRET_KEY` | RapidoReach App Secret for HMAC |
| `RAPIDOREACH_APP_ID` | Your RapidoReach App ID |
| `RAPIDOREACH_APP_KEY` | Your RapidoReach App Key |
| `RAPIDOREACH_APP_SECRET` | Your RapidoReach App Secret |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |

## 📡 RapidoReach Webhook Setup

Set your **Server Postback URL** in RapidoReach dashboard:

```
https://surveyease.vercel.app/api/webhooks/survey-callback?userId={user_id}&transId={transaction_id}&reward={payout}&status={status}
```

**IP Whitelist** (already configured in code):
- 161.97.78.55
- 173.212.227.149
- 75.119.139.250
- 75.119.139.251

## 📁 Project Structure

```
surveyease/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── user/           # Profile, Transactions, Notifications
│   │   │   ├── webhooks/       # Survey callbacks, Simulate
│   │   │   └── health/         # Health check
│   │   ├── page.tsx            # Main app (all screens)
│   │   ├── layout.tsx          # Root layout + PWA
│   │   └── globals.css         # Design system
│   ├── db/
│   │   ├── schema.ts           # Drizzle ORM tables
│   │   └── index.ts            # Database connection
│   └── lib/
│       ├── crypto.ts           # HMAC, hashing, conversions
│       └── jwt.ts              # JWT utilities
├── public/
│   ├── manifest.json           # PWA manifest
│   └── favicon.svg             # App icon
├── drizzle/                    # Generated migrations
├── vercel.json                 # Vercel config
├── .env.example                # Environment template
└── SETUP_GUIDE.md              # Detailed setup guide
```

## 🔌 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ | Create account |
| `/api/auth/login` | POST | ❌ | Login |
| `/api/user/me` | GET | ✅ | Get profile |
| `/api/user/transactions` | GET | ✅ | Transaction history |
| `/api/user/notifications` | GET/PUT | ✅ | Notifications |
| `/api/webhooks/survey-callback` | GET/POST | 🔐 | RapidoReach postback |
| `/api/webhooks/simulate` | POST | ✅ | Dev test simulation |
| `/api/health` | GET | ❌ | Health check |

## 💵 Points System

| Action | Points |
|--------|--------|
| Sign Up Bonus | 500 |
| Survey Completion | $reward × 1000 |
| Referral Bonus | 500 |
| Daily Bonus | 50 |
| Streak Bonus | 100 |

**Exchange Rate:** 1,000 points = $1.00 USD  
**Minimum Withdrawal:** 5,000 points ($5.00)

## 🧪 Testing

### Test Webhook (Dev Panel)
1. Login to the app
2. Go to Profile → Enable "Dev Test Panel"
3. Set reward amount → Click "Simulate"

### Test via cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Simulate webhook
curl -X POST http://localhost:3000/api/webhooks/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reward":0.50}'
```

## 📄 License

MIT License — feel free to use for your projects!

---

Built with ❤️ using Next.js, Drizzle ORM, and Tailwind CSS
