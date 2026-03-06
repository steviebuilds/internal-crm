#!/usr/bin/env tsx

import { getExternalApiBaseUrl, getExternalApiKey } from "@/lib/external-api";

type ParsedArgs = {
  positionals: string[];
  options: Record<string, string | boolean | string[]>;
};

type RequestOptions = {
  method?: string;
  path: string;
  body?: unknown;
  baseUrl: string;
  apiKey: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, string | boolean | string[]> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.trim();

    if (inlineValue !== undefined) {
      assignOption(options, key, inlineValue);
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      assignOption(options, key, true);
      continue;
    }

    assignOption(options, key, next);
    i += 1;
  }

  return { positionals, options };
}

function assignOption(target: ParsedArgs["options"], key: string, value: string | boolean) {
  const existing = target[key];
  if (existing === undefined) {
    target[key] = value;
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(String(value));
    return;
  }

  target[key] = [String(existing), String(value)];
}

function getString(options: ParsedArgs["options"], key: string, fallback = "") {
  const value = options[key];
  if (Array.isArray(value)) return value[value.length - 1] || fallback;
  if (typeof value === "string") return value;
  return fallback;
}

function getBoolean(options: ParsedArgs["options"], key: string) {
  return options[key] === true;
}

function getRequired(options: ParsedArgs["options"], key: string, helpText: string) {
  const value = getString(options, key);
  if (!value) {
    console.error(`Missing required option --${key}\n`);
    console.error(helpText);
    process.exit(1);
  }
  return value;
}

function getCsv(options: ParsedArgs["options"], key: string) {
  const value = getString(options, key);
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getOptionalDate(options: ParsedArgs["options"], key: string) {
  const value = getString(options, key);
  return value || null;
}

function resolveGlobalConfig(args: ParsedArgs) {
  return {
    baseUrl: getString(args.options, "base-url", process.env.CRM_API_BASE_URL || getExternalApiBaseUrl()).replace(/\/$/, ""),
    apiKey: getString(args.options, "api-key", process.env.CRM_API_KEY || process.env.CRM_EXTERNAL_API_KEY || getExternalApiKey()),
  };
}

async function requestJson({ method = "GET", path, body, baseUrl, apiKey }: RequestOptions) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await response.text();
  let data: unknown = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    printJson({ ok: false, status: response.status, error: data });
    process.exit(1);
  }

  return data;
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function rootHelp() {
  return `
Wahlu CRM CLI

Purpose:
  Thin CLI wrapper for the CRM external API. This is designed for other agents and scripts,
  so responses are printed as pretty JSON and the command surface maps directly to the REST API.

Auth:
  Default API key: ${getExternalApiKey()}
  Override with: --api-key <key> or CRM_API_KEY

Base URL:
  Default base URL: ${getExternalApiBaseUrl()}
  Override with: --base-url <url> or CRM_API_BASE_URL

Usage:
  yarn crm <command> [subcommand] [options]

Top-level commands:
  health                         Check API and database connectivity
  dashboard                      Get company total, pipeline counts, and follow-up buckets
  companies list                 List/search companies
  companies get <id>             Get one company by id
  companies create               Create a company
  companies update <id>          Update a company
  companies delete <id>          Delete a company
  companies activities <id>      List activities for one company
  companies add-activity <id>    Add one activity entry to a company
  companies people <id>          List people for one company
  activities get <id>            Get one activity by id
  activities update <id>         Update one activity by id
  activities delete <id>         Delete one activity by id
  people list                    List/search people
  people get <id>                Get one person by id
  people create                  Create a person
  people update <id>             Update a person
  people delete <id>             Delete a person

Global options:
  --base-url <url>               API base URL
  --api-key <key>                API key for /api/v1
  --help                         Show help for the current command

Examples:
  yarn crm health
  yarn crm dashboard
  yarn crm companies list --status Interested --priority High
  yarn crm companies get 69aa6f355049f383352559d7
  yarn crm companies create --name "New Builder" --source Other --status New --priority Medium
  yarn crm companies update 69aa6f355049f383352559d7 --priority High
  yarn crm companies add-activity 69aa6f355049f383352559d7 --type note --body "Followed up by SMS"
  yarn crm companies people 69aa6f355049f383352559d7
  yarn crm activities get 69aa7a8c49c3decaec11420a
  yarn crm people list --company-id 69aa6f355049f383352559d7
`.trim();
}

function companiesHelp() {
  return `
Companies commands

List:
  yarn crm companies list [--query <text>] [--status <status>] [--priority <priority>] [--page <n>] [--page-size <n>] [--with-meta]

Get:
  yarn crm companies get <id>

Create:
  yarn crm companies create --name <text> [options]

Update:
  yarn crm companies update <id> [options]

Delete:
  yarn crm companies delete <id>

Activities:
  yarn crm companies activities <companyId>
  yarn crm companies add-activity <companyId> --type <call|email|note|status-change> --body <text>
  yarn crm companies people <companyId> [--query <text>] [--page <n>] [--page-size <n>]

Company create/update options:
  --name <text>                  Company name
  --website <url>                Website URL
  --industry <text>              Industry label
  --source <value>               Website | Referral | Cold Outreach | LinkedIn | Event | Other
  --status <value>               New | Contacted | Demo Sent | Interested | Won | Lost
  --priority <value>             Low | Medium | High
  --tags <csv>                   Comma-separated tags
  --notes <text>                 Internal notes
  --instagram-handle <text>      Instagram handle without or with @
  --instagram-url <url>          Instagram profile URL
  --facebook-url <url>           Facebook URL
  --linkedin-url <url>           LinkedIn URL
  --x-url <url>                  X URL
  --tiktok-url <url>             TikTok URL
  --youtube-url <url>            YouTube URL
  --addresses <csv>              Comma-separated address strings
  --phones <csv>                 Comma-separated phone strings
  --emails <csv>                 Comma-separated email strings
  --assigned-to <text>           Owner/assignee label
  --last-touch-at <iso>          ISO datetime
  --next-follow-up-at <iso>      ISO datetime

Examples:
  yarn crm companies list --query roofing --with-meta
  yarn crm companies create --name "Northside Joinery" --source Referral --status New --priority Medium --emails hello@example.com
  yarn crm companies update 69aa6f355049f383352559d7 --priority High --status Contacted
  yarn crm companies add-activity 69aa6f355049f383352559d7 --type email --body "Sent proposal"
  yarn crm companies people 69aa6f355049f383352559d7
`.trim();
}

function peopleHelp() {
  return `
People commands

List:
  yarn crm people list [--query <text>] [--company-id <id>] [--page <n>] [--page-size <n>]

Get:
  yarn crm people get <id>

Create:
  yarn crm people create --company-id <id> --full-name <text> [options]

Update:
  yarn crm people update <id> [options]

Delete:
  yarn crm people delete <id>

Person create/update options:
  --company-id <id>              Parent company id
  --full-name <text>             Contact name
  --role <text>                  Job title / role
  --phones <csv>                 Comma-separated phone strings
  --emails <csv>                 Comma-separated email strings
  --linkedin-url <url>           LinkedIn URL
  --instagram-handle <text>      Instagram handle
  --instagram-url <url>          Instagram URL
  --notes <text>                 Internal notes
  --is-primary-contact           Mark as primary contact

Examples:
  yarn crm people list --company-id 69aa6f355049f383352559d7
  yarn crm people create --company-id 69aa6f355049f383352559d7 --full-name "Coby Wilson" --emails info@barkconstruction.com.au --is-primary-contact
  yarn crm people update 69aa6f355049f38335255997 --role Founder
`.trim();
}

function activitiesHelp() {
  return `
Activities commands

Get:
  yarn crm activities get <id>

Update:
  yarn crm activities update <id> [--type <type>] [--body <text>]

Delete:
  yarn crm activities delete <id>

Examples:
  yarn crm activities get 69aa7a8c49c3decaec11420a
  yarn crm activities update 69aa7a8c49c3decaec11420a --body "Updated timeline note"
  yarn crm activities delete 69aa7a8c49c3decaec11420a
`.trim();
}

function buildCompanyPayload(options: ParsedArgs["options"], requireName: boolean) {
  const payload: Record<string, unknown> = {
    website: getString(options, "website"),
    industry: getString(options, "industry"),
    source: getString(options, "source", "Other"),
    status: getString(options, "status", "New"),
    priority: getString(options, "priority", "Medium"),
    tags: getCsv(options, "tags"),
    notes: getString(options, "notes"),
    instagramHandle: getString(options, "instagram-handle"),
    instagramUrl: getString(options, "instagram-url"),
    facebookUrl: getString(options, "facebook-url"),
    linkedinUrl: getString(options, "linkedin-url"),
    xUrl: getString(options, "x-url"),
    tiktokUrl: getString(options, "tiktok-url"),
    youtubeUrl: getString(options, "youtube-url"),
    addresses: getCsv(options, "addresses"),
    phones: getCsv(options, "phones"),
    emails: getCsv(options, "emails"),
    assignedTo: getString(options, "assigned-to"),
    lastTouchAt: getOptionalDate(options, "last-touch-at"),
    nextFollowUpAt: getOptionalDate(options, "next-follow-up-at"),
  };

  const name = requireName ? getRequired(options, "name", companiesHelp()) : getString(options, "name");
  if (name) payload.name = name;

  return payload;
}

function buildPersonPayload(options: ParsedArgs["options"], requireCompanyId: boolean, requireName: boolean) {
  const payload: Record<string, unknown> = {
    role: getString(options, "role"),
    phones: getCsv(options, "phones"),
    emails: getCsv(options, "emails"),
    linkedinUrl: getString(options, "linkedin-url"),
    instagramHandle: getString(options, "instagram-handle"),
    instagramUrl: getString(options, "instagram-url"),
    notes: getString(options, "notes"),
  };

  const companyId = requireCompanyId ? getRequired(options, "company-id", peopleHelp()) : getString(options, "company-id");
  if (companyId) payload.companyId = companyId;

  const fullName = requireName ? getRequired(options, "full-name", peopleHelp()) : getString(options, "full-name");
  if (fullName) payload.fullName = fullName;

  if (getBoolean(options, "is-primary-contact")) {
    payload.isPrimaryContact = true;
  }

  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [group, action, maybeId] = args.positionals;
  const { baseUrl, apiKey } = resolveGlobalConfig(args);

  if (!group || getBoolean(args.options, "help")) {
    if (group === "companies") {
      console.log(companiesHelp());
      return;
    }

    if (group === "people") {
      console.log(peopleHelp());
      return;
    }

    if (group === "activities") {
      console.log(activitiesHelp());
      return;
    }

    console.log(rootHelp());
    return;
  }

  if (group === "health") {
    printJson(await requestJson({ path: "/api/v1/health", baseUrl, apiKey }));
    return;
  }

  if (group === "dashboard") {
    printJson(await requestJson({ path: "/api/v1/dashboard", baseUrl, apiKey }));
    return;
  }

  if (group === "companies") {
    if (!action || action === "--help") {
      console.log(companiesHelp());
      return;
    }

    if (action === "list") {
      const params = new URLSearchParams();
      const query = getString(args.options, "query");
      const status = getString(args.options, "status");
      const priority = getString(args.options, "priority");
      const page = getString(args.options, "page");
      const pageSize = getString(args.options, "page-size");
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (page) params.set("page", page);
      if (pageSize) params.set("pageSize", pageSize);
      if (getBoolean(args.options, "with-meta")) params.set("withMeta", "1");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      printJson(await requestJson({ path: `/api/v1/companies${suffix}`, baseUrl, apiKey }));
      return;
    }

    if (action === "get") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ path: `/api/v1/companies/${id}`, baseUrl, apiKey }));
      return;
    }

    if (action === "create") {
      printJson(await requestJson({ method: "POST", path: "/api/v1/companies", body: buildCompanyPayload(args.options, true), baseUrl, apiKey }));
      return;
    }

    if (action === "update") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ method: "PATCH", path: `/api/v1/companies/${id}`, body: buildCompanyPayload(args.options, false), baseUrl, apiKey }));
      return;
    }

    if (action === "delete") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ method: "DELETE", path: `/api/v1/companies/${id}`, baseUrl, apiKey }));
      return;
    }

    if (action === "activities") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ path: `/api/v1/companies/${id}/activities`, baseUrl, apiKey }));
      return;
    }

    if (action === "people") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      const params = new URLSearchParams();
      const query = getString(args.options, "query");
      const page = getString(args.options, "page");
      const pageSize = getString(args.options, "page-size");
      if (query) params.set("q", query);
      if (page) params.set("page", page);
      if (pageSize) params.set("pageSize", pageSize);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      printJson(await requestJson({ path: `/api/v1/companies/${id}/people${suffix}`, baseUrl, apiKey }));
      return;
    }

    if (action === "add-activity") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing company id\n\n${companiesHelp()}`);
        process.exit(1);
      }
      const type = getRequired(args.options, "type", companiesHelp());
      const body = getRequired(args.options, "body", companiesHelp());
      printJson(await requestJson({ method: "POST", path: `/api/v1/companies/${id}/activities`, body: { type, body }, baseUrl, apiKey }));
      return;
    }

    console.error(`Unknown companies subcommand: ${action}\n\n${companiesHelp()}`);
    process.exit(1);
  }

  if (group === "people") {
    if (!action || action === "--help") {
      console.log(peopleHelp());
      return;
    }

    if (action === "list") {
      const params = new URLSearchParams();
      const query = getString(args.options, "query");
      const companyId = getString(args.options, "company-id");
      const page = getString(args.options, "page");
      const pageSize = getString(args.options, "page-size");
      if (query) params.set("q", query);
      if (companyId) params.set("companyId", companyId);
      if (page) params.set("page", page);
      if (pageSize) params.set("pageSize", pageSize);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      printJson(await requestJson({ path: `/api/v1/people${suffix}`, baseUrl, apiKey }));
      return;
    }

    if (action === "get") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing person id\n\n${peopleHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ path: `/api/v1/people/${id}`, baseUrl, apiKey }));
      return;
    }

    if (action === "create") {
      printJson(await requestJson({ method: "POST", path: "/api/v1/people", body: buildPersonPayload(args.options, true, true), baseUrl, apiKey }));
      return;
    }

    if (action === "update") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing person id\n\n${peopleHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ method: "PATCH", path: `/api/v1/people/${id}`, body: buildPersonPayload(args.options, false, false), baseUrl, apiKey }));
      return;
    }

    if (action === "delete") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing person id\n\n${peopleHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ method: "DELETE", path: `/api/v1/people/${id}`, baseUrl, apiKey }));
      return;
    }

    console.error(`Unknown people subcommand: ${action}\n\n${peopleHelp()}`);
    process.exit(1);
  }

  if (group === "activities") {
    if (!action || action === "--help") {
      console.log(activitiesHelp());
      return;
    }

    if (action === "get") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing activity id\n\n${activitiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ path: `/api/v1/activities/${id}`, baseUrl, apiKey }));
      return;
    }

    if (action === "update") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing activity id\n\n${activitiesHelp()}`);
        process.exit(1);
      }
      const payload: Record<string, unknown> = {};
      const type = getString(args.options, "type");
      const body = getString(args.options, "body");
      if (type) payload.type = type;
      if (body) payload.body = body;
      printJson(await requestJson({ method: "PATCH", path: `/api/v1/activities/${id}`, body: payload, baseUrl, apiKey }));
      return;
    }

    if (action === "delete") {
      const id = maybeId;
      if (!id) {
        console.error(`Missing activity id\n\n${activitiesHelp()}`);
        process.exit(1);
      }
      printJson(await requestJson({ method: "DELETE", path: `/api/v1/activities/${id}`, baseUrl, apiKey }));
      return;
    }

    console.error(`Unknown activities subcommand: ${action}\n\n${activitiesHelp()}`);
    process.exit(1);
  }

  console.error(`Unknown command: ${group}\n\n${rootHelp()}`);
  process.exit(1);
}

void main();
