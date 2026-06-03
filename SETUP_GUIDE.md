# SurveyEase — Complete Setup Guide

## 🏗️ Architecture Overview

```
SurveyEase
├── Next.js App (Frontend + API)     → Deployed on Vercel
├── PostgreSQL (Database)            → Hosted on Supabase  
├── RapidoReach (Survey Provider)    → Webhook Postbacks
└── Supabase Auth (optional)         → User Authentication
```

---

## 1️⃣ Supabase Setup

### Database Connection
Your Supabase project is already configured:
- **Project URL:** `https://gavgtimgjwdtioonziwy.supabase.co`
- **Project Ref:** `gavgtimgjwdtioonziwy`

### Database Tables
The app uses Drizzle ORM with the following tables (auto-created via `npx drizzle-kit push`):

| Table | Purpose |
|-------|---------|
| `users` | User accounts, points, levels, streaks |
| `survey_wall_sessions` | Tracks each survey attempt/completion |
| `transactions` | All point earning/spending records |
| `referrals` | Referral relationships |
| `achievements` | User achievement badges |
| `notifications` | In-app notifications |

### Steps:
1. Get your Supabase **database connection string** from:
   - Supabase Dashboard → Project Settings → Database → Connection String (URI)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.gavgtimgjwdtioonziwy.supabase.co:5432/postgres`

2. Set this as `DATABASE_URL` in your Vercel env vars (replace the local one).

---

## 2️⃣ Vercel Setup

### Environment Variables to Set in Vercel Dashboard:

Go to **Vercel → Project Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.gavgtimgjwdtioonziwy.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gavgtimgjwdtioonziwy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_c3Bd-OSyB6F0E78mHEx0QA_qlAuhEjl` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key) |
| `RAPIDOREACH_APP_ID` | `B4RkqLUuAFf` |
| `RAPIDOREACH_APP_KEY` | `0cf62256a0c4eb5ea5b0ec5db690e5cf` |
| `RAPIDOREACH_APP_SECRET` | `b95892f5497255ca5edaad340fee54ff` |
| `SURVEY_SECRET_KEY` | `b95892f5497255ca5edaad340fee54ff` |
| `JWT_SECRET` | Generate a strong random string (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | `https://surveyease.vercel.app` |

### Deploy Steps:
1. Push code to GitHub
2. Import repo in Vercel
3. Set all environment variables above
4. Deploy
5. After first deploy, run schema push:
   ```bash
   npx drizzle-kit push
   ```

---

## 3️⃣ RapidoReach Configuration

### In RapidoReach Dashboard:

1. **App Settings:**
   - App ID: `B4RkqLUuAFf`
   - App Key: `0cf62256a0c4eb5ea5b0ec5db690e5cf`
   - App Secret: `b95892f5497255ca5edaad340fee54ff`

2. **Postback URL Configuration:**
   Set your Server Postback URL to:
   ```
   https://surveyease.vercel.app/api/webhooks/survey-callback?userId={user_id}&transId={transaction_id}&reward={payout}&status={status}&signature={signature}
   ```

   Replace the `{placeholders}` with RapidoReach's actual macro variables:
   - `{user_id}` → The user ID you pass in the survey wall URL
   - `{transaction_id}` → RapidoReach's unique transaction ID
   - `{payout}` → USD reward amount
   - `{status}` → complete or disqualified

3. **IP Whitelist:**
   The following IPs are already whitelisted in the webhook handler:
   - `161.97.78.55`
   - `173.212.227.149`
   - `75.119.139.250`
   - `75.119.139.251`

4. **Survey Wall URL (used in the app):**
   ```
   https://www.rapidoreach.com/web_offerwall?app_id=B4RkqLUuAFf&user_id={USER_DATABASE_ID}
   ```

---

## 4️⃣ Testing the Webhook

### Using the Built-in Dev Panel:
1. Sign up / Login to SurveyEase
2. Go to Profile → Enable "Dev Test Panel"
3. Set reward amount and click "Simulate Survey Completion"
4. Points should be instantly credited

### Manual cURL Test:
```bash
curl "https://surveyease.vercel.app/api/webhooks/survey-callback?userId=USER_UUID&transId=TEST-$(date +%s)&reward=0.50&status=complete"
```

### Expected Response:
```json
{ "status": "ok" }
```

---

## 5️⃣ Points System

| Action | Points |
|--------|--------|
| Sign Up Bonus | 500 pts |
| Survey Completion | $reward × 1000 pts |
| Referral Bonus | 500 pts |
| Daily Bonus | 50 pts |
| Streak Bonus | 100 pts |

**Exchange Rate:** 1,000 points = $1.00 USD
**Minimum Withdrawal:** 5,000 points ($5.00)

---

## 6️⃣ Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Login & get JWT |
| `/api/user/me` | GET | Get user profile |
| `/api/user/transactions` | GET | Transaction history |
| `/api/user/notifications` | GET/PUT | Notifications |
| `/api/webhooks/survey-callback` | GET/POST | RapidoReach postback |
| `/api/webhooks/simulate` | POST | Dev test simulation |
| `/api/health` | GET | Health check |

---

## 7️⃣ Security Features

- ✅ HMAC SHA-256 webhook signature validation
- ✅ IP whitelist checking for postbacks
- ✅ Idempotent transaction processing (no double-credits)
- ✅ JWT authentication for all user endpoints
- ✅ Password hashing
- ✅ Server-side secret management

---

## 📱 PWA Support

The app includes a web manifest for PWA installation:
- Add to Home Screen on mobile devices
- Standalone display mode
- Custom theme color (#FF7A1A)
