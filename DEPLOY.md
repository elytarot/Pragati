# PRAGATI MIS Portal — Deployment Guide
## Bright Beginnings NGO | Rajasthan

---

## What's in this package

```
pragati/
├── backend/          ← Node.js + Express + Prisma API
│   ├── src/
│   │   ├── routes/   ← All 11 API route files
│   │   ├── middleware/← Auth, Audit, Upload
│   │   ├── jobs/     ← Notification cron jobs
│   │   └── utils/    ← PDF, Excel, SMS
│   ├── prisma/
│   │   ├── schema.prisma ← Full DB schema (12 tables)
│   │   └── seed.js       ← 3 districts, 29 blocks, 12 users
│   ├── .env.example  ← Copy to .env and fill values
│   └── railway.toml  ← Railway deployment config
├── frontend/
│   ├── src/
│   │   ├── api/      ← All API modules (11 files)
│   │   ├── context/  ← AuthContext
│   │   ├── hooks/    ← useAPI hooks for every module
│   │   └── PRAGATI_Portal.jsx ← Main portal UI
│   ├── .env.example  ← Copy to .env.local
│   └── vercel.json   ← Vercel deployment config
└── DEPLOY.md         ← This file
```

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Accounts on: Railway (railway.app), Vercel (vercel.com), Cloudflare (cloudflare.com)
- Domain name (e.g. pragati.brightbeginnings.org) — register at namecheap.com (~₹800/year)

---

## STEP 1 — Setup Backend Locally

```bash
cd pragati/backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Now edit .env and fill ALL values (see .env.example comments)

# Generate JWT secrets (run this in terminal, paste output into .env)
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(32).toString('hex'))"

# Start local PostgreSQL (or use Railway/Supabase URL directly)
# If using local: createdb pragati_db

# Run database migration (creates all tables)
npx prisma migrate dev --name init

# Seed the database (districts, blocks, users)
npm run db:seed

# View database visually (optional)
npm run db:studio

# Start dev server
npm run dev
# → Server running at http://localhost:4000
# → Test: curl http://localhost:4000/health
```

---

## STEP 2 — Setup Frontend Locally

```bash
cd pragati/frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:4000/api

# Copy the main portal file
# The PRAGATI_Portal.jsx should be in src/
# Create src/main.jsx (see below)

# Start dev server
npm run dev
# → App running at http://localhost:5173
```

### Create src/main.jsx

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './PRAGATI_Portal.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Create index.html in frontend root

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PRAGATI — Bright Beginnings NGO</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

## STEP 3 — Wire Frontend to Real Backend

In `PRAGATI_Portal.jsx`, replace the static login and data with real API calls.

### Replace Login function:

```jsx
// At top of file, add import:
import { authAPI } from './api/index.js'

// In Login component, replace attempt():
const attempt = async () => {
  try {
    setErr('')
    const data = await authAPI.login(email, password)
    localStorage.setItem('pragati_token',   data.accessToken)
    localStorage.setItem('pragati_refresh', data.refreshToken)
    onLogin(data.user)
  } catch (err) {
    setErr(err.response?.data?.message || 'Login failed')
  }
}
```

### Replace Dashboard data:

```jsx
// In Dashboard component:
import { useDashboard } from './hooks/useAPI.js'

function Dashboard({ user }) {
  const { data, loading, error } = useDashboard()
  if (loading) return <div>Loading...</div>
  if (!data) return null
  // Use data.kpis.totalChildren, data.kpis.activeIEPs, etc.
  // Use data.trend for charts
}
```

### Replace Children list:

```jsx
// In ChildrenReg component:
import { useChildren, useLocations } from './hooks/useAPI.js'

function ChildrenReg() {
  const [search, setSrch]  = useState('')
  const [fDist,  setFDist] = useState('')
  const { children, total, loading, create } = useChildren({ search, districtId: fDist, page: 1 })
  const { districts, getBlocks } = useLocations()
  // children array now comes from API
  // districts/blocks come from API
}
```

### Replace AI Goals call:

```jsx
// In AIAssistant component:
import { useAIGoals } from './hooks/useAPI.js'

function AIAssistant() {
  const { result, loading, error, generate } = useAIGoals()
  // Call: generate({ childId, goalArea, language, provider })
  // result contains the AI text
}
```

---

## STEP 4 — Deploy Backend to Railway

```bash
# 1. Push backend to GitHub
cd pragati/backend
git init
git add .
git commit -m "PRAGATI backend v1.0.0"
gh repo create pragati-backend --private
git push -u origin main

# 2. Go to railway.app
#    → New Project → Deploy from GitHub → select pragati-backend
#    → Railway auto-detects Node.js

# 3. Add databases in Railway
#    → New → Database → Add PostgreSQL
#    → New → Database → Add Redis
#    → Both DATABASE_URL and REDIS_URL auto-injected

# 4. Set environment variables
#    Railway dashboard → your service → Variables
#    Paste all values from .env (except DATABASE_URL and REDIS_URL which are auto-set)

# 5. Set start command (Railway auto-detects from package.json)
#    Verify: "start": "npx prisma migrate deploy && node src/app.js"

# 6. Deploy triggers automatically on git push
#    Check logs: railway logs

# 7. Get your backend URL from Railway dashboard
#    e.g.: https://pragati-backend-production.up.railway.app

# 8. Test health check
curl https://your-railway-url.railway.app/health
```

---

## STEP 5 — Deploy Frontend to Vercel

```bash
# 1. Push frontend to GitHub
cd pragati/frontend
git init
git add .
git commit -m "PRAGATI frontend v1.0.0"
gh repo create pragati-frontend --private
git push -u origin main

# 2. Go to vercel.com
#    → New Project → Import from GitHub → select pragati-frontend

# 3. Set environment variable in Vercel dashboard
#    VITE_API_URL = https://your-railway-url.railway.app/api

# 4. Deploy → Vercel gives you URL like: pragati-frontend.vercel.app

# 5. Or deploy via CLI:
npm install -g vercel
cd pragati/frontend
vercel --prod
```

---

## STEP 6 — Configure Custom Domain

### Frontend (Vercel)
```
Vercel Dashboard → Project → Settings → Domains
Add: pragati.brightbeginnings.org

DNS Record at your registrar (Namecheap/GoDaddy):
Type: CNAME
Name: pragati
Value: cname.vercel-dns.com
```

### Backend (Railway)
```
Railway Dashboard → Service → Settings → Networking → Custom Domain
Add: api.pragati.brightbeginnings.org

DNS Record:
Type: CNAME
Name: api.pragati
Value: [Railway-provided value]
```

SSL certificates are auto-provisioned by both Vercel and Railway (Let's Encrypt).

---

## STEP 7 — Run Seed on Production

After first deploy, run seed to create districts, blocks, and first admin account:

```bash
# Option A: Railway shell
railway shell
npm run db:seed

# Option B: Add seed to start command (run once then remove)
"start": "npx prisma migrate deploy && node prisma/seed.js && node src/app.js"
```

**First login credentials:**
- Email: `admin@brightbeginnings.org`
- Password: `Pragati@Admin2025!`
- **⚠️ CHANGE IMMEDIATELY after first login**

---

## STEP 8 — Post-Deploy Checklist

```
□ Health check returns 200: https://api.pragati.bb.org/health
□ Login works for all 5 demo roles
□ Child registration saves to database
□ IEP creation works
□ AI goal generation works (Claude API)
□ SMS test sent (set MSG91 key)
□ Monthly report generates PDF
□ Domain SSL is active (HTTPS only)
□ All field workers have accounts created
□ Daily backup scheduled in Railway
□ All default passwords changed
```

---

## Monthly Costs (Estimated)

| Service          | Cost/month    |
|-----------------|---------------|
| Railway (Backend + DB + Redis) | ₹1,500–2,500 |
| Vercel (Frontend) | Free |
| Cloudflare R2 (Files) | Free (10GB) |
| Claude AI (IEP Goals) | ₹150–500 |
| MSG91 SMS | ₹200–400 |
| Domain (.org/year) | ₹67/month |
| **Total** | **₹2,000–3,500/month** |

---

## Support

- WhatsApp group for BB tech team
- Railway docs: docs.railway.app
- Prisma docs: prisma.io/docs
- Claude API: docs.anthropic.com

**Portal URL:** https://pragati.brightbeginnings.org  
**API Health:** https://api.pragati.brightbeginnings.org/health  
**DB Studio (dev only):** npm run db:studio
