# Wahlu CRM

Company-first outreach CRM built with Next.js 16, TypeScript, Tailwind, and MongoDB.

## Current feature set
- Basic auth gate (password + signed HTTP-only JWT cookie)
- Company CRUD with structured intelligence fields
- First-class People model linked to companies
- Company timeline activities
- Search + filters + server-side pagination
- Follow-up center (overdue + due-today + done/snooze/reschedule)

## Core data model
### Company
- `name`, `website`, `industry`
- `status`, `priority`, `source`
- `tags[]`, `notes`
- socials: `instagramHandle`, `instagramUrl`, `facebookUrl`, `linkedinUrl`, `xUrl`, `tiktokUrl`, `youtubeUrl`
- `addresses[]`, `phones[]`, `emails[]`
- `assignedTo`
- `lastTouchAt`, `nextFollowUpAt`, timestamps

### Person
- `companyId`
- `fullName`, `role`
- `phones[]`, `emails[]`
- socials: `linkedinUrl`, `instagramHandle`, `instagramUrl`
- confidence metadata: `confidenceScore`, `confidenceSource`, `confidenceNotes`
- `notes`, `isPrimaryContact`, timestamps

## API
- `GET/POST /api/companies`
- `GET/PATCH/DELETE /api/companies/:id`
- `GET/POST /api/companies/:id/people`
- `GET/POST /api/companies/:id/activities`
- `GET/POST /api/people`
- `GET/PATCH/DELETE /api/people/:id`
- `GET/POST /api/follow-ups`

## Pagination contract
For list endpoints (`/api/companies`, `/api/people`, `/api/companies/:id/people`):
- query params: `page`, `pageSize`, optional `q`, filters
- response metadata: `total`, `page`, `pageSize`, `totalPages`

Search is DB-level first, then paginated.

## Migration (legacy leads → canonical companies)
**Recommended production path (idempotent):**
```bash
# 1) dry-run, inspect counts + sample mappings
npm run migrate:legacy-leads-normalized -- --sample=5

# 2) apply once satisfied
npm run migrate:legacy-leads-normalized -- --apply --sample=5
```

This migration:
1. Reads legacy docs from `leads`
2. Maps known legacy fields (`company`, `companyName`, `business_name`, etc.) to canonical `companies` fields
3. Skips rows without a real company name (and reports skipped count)
4. Upserts by `_id` for idempotency (safe re-runs, no duplicate inserts)

Legacy runtime fallback is disabled by default and can be explicitly enabled with:
```bash
ENABLE_LEGACY_LEADS_FALLBACK=1
```

## Rollback notes
- Snapshot DB before migration.
- If rollback needed: restore snapshot and redeploy previous app revision.
- Migration is additive/transformative but not designed for automatic reverse transform.

## Setup
```bash
cp .env.example .env.local
npm install
npm run dev
```
Open `http://localhost:3000`.
