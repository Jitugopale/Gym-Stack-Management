# Gym Stack — Frontend

**Gym Stack Management** UI: platform admin + per-gym desk (React, Vite, Tailwind).

## Stack

- React 19 + Vite + React Router
- Axios (`@/utils/axiosInstance`) + Vite proxy API headers
- Feature folders: `features/admin` · `features/gym`

## Layout

```
src/
  features/admin|gym|shared
  components/common|layout|ui
  config/          routes, apiEndpoints, adminNav, gymNav
  services/admin|gym
  routes/          adminRoutes, gymRoutes
  context/AuthContext.jsx
  utils/axiosInstance.js
```

## Setup (pnpm)

```bash
pnpm install
cp .env.example .env
# Match API_KEY / CLIENT_ID / CLIENT_SECRET with Gym Stack backend
pnpm dev          # http://localhost:5173
```

### Env

```env
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=Gym Stack Management
VITE_BASE_PATH=/

API_PROXY_TARGET=http://localhost:4000
API_KEY=...
CLIENT_ID=...
CLIENT_SECRET=...
```

## Screens

| Area | Paths |
|------|--------|
| Home | `/` |
| Admin | `/admin/login`, dashboard, gyms, billing |
| Gym | `/gym/:slug/login`, dashboard, members, plans, payments, staff, billing |

## Demo entry

Backend must be running (`pnpm db:seed` + `pnpm db:demo`).  
Password: `Password123!`

- Admin: `/admin/login` → `admin@gymstack.local` (email 2FA)
- Active gym: `/gym/iron-peak/login` → `owner@iron-peak.local`
- Soft lock: `/gym/lockfit/login` → `owner@lockfit.local`
