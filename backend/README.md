# Gym Stack — Backend

**Gym Stack Management** API: multi-tenant gym SaaS (Node, Express, Prisma, PostgreSQL).

## Stack

- Express 5 + Prisma 5 + PostgreSQL
- Winston logger, Helmet, compression, rate limit
- Brevo email (2FA OTP, gym/staff invites, invoices)
- Dual JWT (`ADMIN_JWT_SECRET` ≠ `JWT_SECRET`)
- Daily billing cron

## Layout

```
src/
  app.js                 # bootstrap (env check, health, crons)
  config/                # env, database
  constants/             # roles, gym billing
  middleware/            # auth, gymContext, gymAccess, apiSecurity
  routes/v1/admin|gym
  controllers/v1/admin|gym|shared
  services/admin|gym|shared
  seeders/               # modules, actions, permissions, roles, users
  scripts/seed-gym-demo.js
  cron/billingCron.js
  utils/                 # jwt, logger, permissions, password
```

## Setup (pnpm)

```bash
pnpm install
cp .env.example .env
# Required: DATABASE_URL, ADMIN_JWT_SECRET, JWT_SECRET, API_KEY, CLIENT_*
# Optional: BREVO_API_KEY, BREVO_EMAIL (OTP/invoice/invite emails)

pnpm db:migrate
pnpm db:seed       # MasterSeeder: RBAC + platform users + cloud plans
pnpm db:demo       # 5 gyms, owners/staff, members, payments, invoices
pnpm dev           # http://localhost:4000
```

Health: `GET /health`

## Seeders

```
src/seeders/
  modules.json
  actions.json
  permissions.json
  roles.json
  users.example.json   # copy → users.json
  users.json           # gitignored
  masterSeeder.js
  index.js
```

## Auth

| Actor | Rule |
|-------|------|
| Platform SA / staff | Email + password → always email 2FA |
| Gym owner | 2FA only if SA set `requireOwner2fa` |
| Gym staff | No 2FA; owner creates + emails credentials |

## Cloud billing lock

Unpaid after period end:

1. **grace** (7 days) — full access  
2. **soft_lock** (7 days) — view only  
3. **login_blocked** — cannot sign in  

Invoice emailed via Brevo. SA marks paid → gym active again. Cron: `src/cron/billingCron.js`.

## Demo gyms (`pnpm db:demo`)

| Slug | Status |
|------|--------|
| iron-peak | paid / active |
| city-strength | trial / active |
| lockfit | soft_lock + invoice |
| peak-power | grace + invoice |
| titan-gym | login_blocked |

Password: `Password123!`  
`admin@gymstack.local` · `staff@gymstack.local` · `owner@<slug>.local` · `staff@<slug>.local`
