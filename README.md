# Gym Stack (Multi-Tenant Gym Management)

A full-stack multi-tenant gym management SaaS built with React, Node.js, Express, Prisma, and PostgreSQL. Gym Stack demonstrates real-world tenancy, dual-realm authentication, RBAC, cloud billing, and FitPlus-style membership renew/restart flows for platform admins and gym desks.

## Features

### User roles

**Platform Super Admin / Staff**

- Login with JWT + optional email OTP 2FA (HttpOnly cookies)
- Create and manage gyms, owners, and cloud subscription plans
- Toggle per-gym feature modules (dashboard, members, plans, payments, staff, billing)
- Manage invoices, billing lifecycle, and platform users

**Gym Owner / Staff**

- Gym-scoped login by slug (`/gym/{slug}`)
- Owner 2FA only when SA enables it; staff can skip OTP
- Desk modules gated by plan defaults + SA feature overrides

### Membership management

- Add members on membership plans (monthly / quarterly / yearly via `durationDays`)
- Advance **Renew** while end date is still in the future (starts day after current end)
- **Restart** after expiry/cancel with start options: Today, From expiry, or Pick date
- Freeze, Cancel, Unfreeze; filter Active / Frozen / Expired / Expiring soon
- Payments ledger (does not extend dates — renew/restart does)

### Cloud billing

- Cloud plans (Core / Basic / Premium) with default feature packs
- Trial → grace → soft lock → login blocked lifecycle + daily cron
- Gym invoices and SA mark-paid flows

### Other features

- Dual-realm auth (platform vs gym) with separate secrets/cookies
- Module → Action → Permission RBAC with seeded roles
- Staff invites, membership plan CRUD, payments desk
- Clean React UI (Vite + Tailwind) with nested admin/gym layouts

## Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React.js (Vite) | Node.js + Express | PostgreSQL |
| React Router | Prisma ORM | Prisma Client |
| Tailwind CSS | JWT + Bcrypt + HttpOnly cookies | — |
| Axios | Email OTP (Brevo optional) | — |

## Quick start

```bash
# API
cd backend
pnpm install
cp .env.example .env          # set DATABASE_URL, JWT secrets, Brevo (optional)
pnpm db:migrate
pnpm db:seed                  # RBAC + SA users + cloud plans
pnpm db:demo                  # demo gyms + membership data
pnpm dev                      # http://127.0.0.1:4001

# UI
cd frontend
pnpm install
cp .env.example .env
pnpm dev                      # http://127.0.0.1:5173
```

| Folder | App |
|--------|-----|
| [`backend/`](./backend) | Gym Stack API |
| [`frontend/`](./frontend) | Gym Stack desk UI |

## Usage

1. Open the frontend in your browser.
2. Log in as platform SA to create gyms, assign cloud plans, and toggle modules.
3. Open `/gym/{slug}` and log in as owner/staff to manage members, plans, payments, and billing.
4. On Members: use **Renew** for advance renew, **Restart** after expiry (pick start date), Freeze/Cancel as needed.

## Demo logins

Password for all: `Password123!`

| Email | Access |
|-------|--------|
| `admin@gymstack.local` | Platform SA (2FA) |
| `staff@gymstack.local` | Platform staff (2FA) |
| `owner@iron-peak.local` | Active gym (rich desk data) |
| `owner@lockfit.local` | Soft-locked gym (view-only) |
| `owner@titan-gym.local` | Login blocked |

## Difficulty

Intermediate–Advanced — suitable for full-stack developers learning multi-tenancy, RBAC, billing states, and membership lifecycle APIs.

## Learning Outcomes

- Build a multi-tenant SaaS with shared DB + `gymId` isolation
- Implement dual-realm auth (cookies, JWT, email OTP)
- Design RBAC with modules, actions, and permissions
- Model membership periods from plan duration (not blind monthly pay)
- Handle renew vs restart start dates after expiry
- Wire SA feature toggles to gym desk navigation and API access
- Connect React desks to an Express + Prisma + PostgreSQL API

## Project layout

```
Multitentat-Gym/
├── backend/     # Express API, Prisma, seeds, billing cron
└── frontend/    # Vite React admin + gym desks
```

#fullstack #reactjs #nodejs #expressjs #prisma #postgresql #multitenant #saas #gymmanagement #rbac #jwt #webdevelopment #crudapp #membership #billing
