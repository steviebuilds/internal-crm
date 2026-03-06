# CRM API and CLI Reference

This document is for agents and scripts that need to operate the CRM without using the browser UI.

## Auth

External API key:

```text
wahlu-crm-internal-2026
```

Accepted headers:

```http
Authorization: Bearer wahlu-crm-internal-2026
x-api-key: wahlu-crm-internal-2026
```

## Base URLs

Production:

```text
https://crm.stevie.cool
```

Local dev:

```text
http://localhost:3000
```

External API base path:

```text
/api/v1
```

## External API Endpoints

### Discovery and health
- `GET /api/v1`
- `GET /api/v1/health`
- `GET /api/v1/dashboard`

### Companies
- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:id`
- `PATCH /api/v1/companies/:id`
- `DELETE /api/v1/companies/:id`

### Company activities
- `GET /api/v1/companies/:id/activities`
- `POST /api/v1/companies/:id/activities`
- `GET /api/v1/activities/:id`
- `PATCH /api/v1/activities/:id`
- `DELETE /api/v1/activities/:id`

### People
- `GET /api/v1/people`
- `POST /api/v1/people`
- `GET /api/v1/people/:id`
- `PATCH /api/v1/people/:id`
- `DELETE /api/v1/people/:id`
- `GET /api/v1/companies/:id/people`
- `POST /api/v1/companies/:id/people`

## Query Parameters

### Company list
- `q`
- `status`
- `priority`
- `page`
- `pageSize`
- `withMeta=1`

Example:

```bash
curl -s \
  -H 'Authorization: Bearer wahlu-crm-internal-2026' \
  'https://crm.stevie.cool/api/v1/companies?q=roofing&status=Interested&page=1&pageSize=10&withMeta=1'
```

### People list
- `q`
- `companyId`
- `page`
- `pageSize`

## Payload Shapes

### Create company

```json
{
  "name": "Northside Joinery",
  "website": "https://northsidejoinery.example",
  "industry": "Joinery",
  "source": "Referral",
  "status": "New",
  "priority": "Medium",
  "tags": ["joinery", "sydney"],
  "notes": "",
  "instagramHandle": "",
  "instagramUrl": "",
  "facebookUrl": "",
  "linkedinUrl": "",
  "xUrl": "",
  "tiktokUrl": "",
  "youtubeUrl": "",
  "addresses": [],
  "phones": [],
  "emails": ["hello@example.com"],
  "assignedTo": "",
  "lastTouchAt": null,
  "nextFollowUpAt": null
}
```

Enums:
- `status`: `New`, `Contacted`, `Demo Sent`, `Interested`, `Won`, `Lost`
- `priority`: `Low`, `Medium`, `High`
- `source`: `Website`, `Referral`, `Cold Outreach`, `LinkedIn`, `Event`, `Other`

### Create person

```json
{
  "companyId": "69aa6f355049f383352559d7",
  "fullName": "Coby Wilson",
  "role": "",
  "phones": [],
  "emails": ["info@barkconstruction.com.au"],
  "linkedinUrl": "",
  "instagramHandle": "",
  "instagramUrl": "",
  "notes": "",
  "isPrimaryContact": true
}
```

### Create activity

```json
{
  "type": "note",
  "body": "Followed up after the call"
}
```

Activity types:
- `call`
- `email`
- `note`
- `status-change`

## CLI

Entry point:

```bash
yarn crm --help
```

Detailed help exists for:
- `yarn crm --help`
- `yarn crm companies --help`
- `yarn crm people --help`
- `yarn crm activities --help`

### Common commands

```bash
yarn crm health
yarn crm dashboard
yarn crm companies list --status Interested --priority High
yarn crm companies get 69aa6f355049f383352559d7
yarn crm companies update 69aa6f355049f383352559d7 --priority High
yarn crm companies delete 69aa6f355049f383352559d7
yarn crm companies people 69aa6f355049f383352559d7
yarn crm companies add-activity 69aa6f355049f383352559d7 --type note --body "Followed up by SMS"
yarn crm people list --company-id 69aa6f355049f383352559d7
yarn crm people create --company-id 69aa6f355049f383352559d7 --full-name "Coby Wilson" --emails info@barkconstruction.com.au --is-primary-contact
yarn crm people update 69aa6f355049f383352559d8 --role Founder
yarn crm people delete 69aa6f355049f383352559d8
yarn crm activities get 69aa7a8c49c3decaec11420a
yarn crm activities update 69aa7a8c49c3decaec11420a --body "Updated timeline note"
yarn crm activities delete 69aa7a8c49c3decaec11420a
```

### CLI config overrides

```bash
yarn crm --base-url http://localhost:3000 health
yarn crm --api-key your-key companies list
```

Environment variables:
- `CRM_API_BASE_URL`
- `CRM_API_KEY`
- `CRM_EXTERNAL_API_KEY`

## Notes for agents
- Prefer the external API/CLI over browser automation.
- Use IDs from API responses for follow-up writes.
- `PATCH` payloads can be partial.
- Deleting a company also deletes linked people and activities.
- Setting `isPrimaryContact=true` will demote the current primary contact for that company.
