# External API and CLI Plan - 2026-03-06

## Goal
Add a stable, API-key-protected external interface for the CRM and a CLI that other agents can use without browser auth or UI scraping.

## API shape
- `GET /api/v1` - API descriptor and endpoint list
- `GET /api/v1/health` - liveness check
- `GET /api/v1/dashboard` - pipeline counts and follow-up buckets
- `GET /api/v1/companies` - list/search companies
- `POST /api/v1/companies` - create company
- `GET /api/v1/companies/:id` - get company
- `PATCH /api/v1/companies/:id` - update company
- `DELETE /api/v1/companies/:id` - delete company
- `GET /api/v1/companies/:id/activities` - list timeline activity
- `POST /api/v1/companies/:id/activities` - add activity
- `GET /api/v1/people` - list/search people
- `POST /api/v1/people` - create person
- `PATCH /api/v1/people/:id` - update person
- `DELETE /api/v1/people/:id` - delete person

## Auth
- Hardcoded development API key for now, implemented in shared server/client config
- Accept either `Authorization: Bearer <key>` or `x-api-key: <key>`
- Return a clear 401 JSON error for missing/invalid keys

## CLI shape
- `yarn crm --help`
- `yarn crm health`
- `yarn crm dashboard`
- `yarn crm companies list ...`
- `yarn crm companies get <id>`
- `yarn crm companies create ...`
- `yarn crm companies update <id> ...`
- `yarn crm companies delete <id>`
- `yarn crm companies activities <companyId>`
- `yarn crm companies add-activity <companyId> ...`
- `yarn crm people list ...`
- `yarn crm people create ...`
- `yarn crm people update <id> ...`
- `yarn crm people delete <id>`

## Design choices
- Reuse existing validation schemas and service functions where possible
- Keep the CLI dependency-light and ship detailed manual `--help` text instead of pulling in a framework
- Default CLI base URL to `https://crm.stevie.cool`, overridable via `--base-url` or `CRM_API_BASE_URL`
- Default CLI API key to the shared hardcoded key so other local agents can use it immediately

## Verification
- lint the repo
- run the CLI `--help`
- hit at least `health`, `companies list`, and `dashboard` against the route handlers locally where feasible
