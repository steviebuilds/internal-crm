# CRM v1 (internal)

Modern lightweight internal CRM built with Next.js 16, TypeScript, Tailwind, and MongoDB.

## v0 scope (deployed first)
- Basic auth gate (password + signed HTTP-only JWT cookie)
- Leads CRUD
- Lead list with search + status/priority filters
- MongoDB-backed schema + validation

## Tech
- Next.js App Router + TypeScript
- MongoDB (Mongoose)
- Zod validation
- Tailwind CSS

## Setup
1. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
2. Fill env vars.
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`

## Environment variables
- `MONGODB_URI` (required)
- `MONGODB_DB` (optional, default `crm_v1`)
- `AUTH_SECRET` (required)
- `CRM_PASSWORD_HASH` (recommended)
- `CRM_PASSWORD` (fallback for quick local use)

## Seed data
```bash
npm run seed
```

## Security notes
- Use `CRM_PASSWORD_HASH` in production (bcrypt)
- Keep `AUTH_SECRET` long/random
- Cookie is HTTP-only and secure in production

## API overview
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST /api/leads`
- `GET/PATCH/DELETE /api/leads/:id`
- `GET/POST /api/leads/:id/activities`
- `GET/POST /api/follow-ups`
