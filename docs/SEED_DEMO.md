# EstateOS Seed And Demo Workflow

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

`npm run seed:estateos` creates development/demo data for validating the EstateOS operational kernel.

It is not production migration logic and must not be used to backfill live customer data.

## What It Seeds

- Account profiles for claim sources, demand accounts, verification operators, API buyers, platform operator, and AI agent.
- 20 claim-based properties in Vinh, Cua Lo, and Nghe An.
- Property claims, private/redacted evidence records, verification jobs, limited verification reports, risk flags, API keys, API usage events, contribution ledgers, usage ledgers, and royalty eligibility placeholders.
- Trust states generated from allowed labels only.

## How To Run

From `backend`:

```bash
npm run seed:estateos
```

Required environment is the same as the backend server: database URI, CDN paths, SMTP placeholders, admin/frontend host values, and JWT/cookie config.

## Safety Rules

- Run only against local, staging, demo, or disposable databases.
- Do not run against production unless a future migration plan explicitly approves it.
- The seed uses `estateos-kernel-00` metadata so demo records are identifiable.
- The seed is designed to be idempotent for core demo records and avoids raw sensitive evidence values.
- Evidence records store status/reference metadata; they do not publish unredacted legal documents.

## Validation Checklist

After seeding, verify:

- Admin `/estateos` shows command-center counts and recent activity.
- `/api-docs` documents `/api/v1` scopes and examples.
- `GET /api/v1/properties` returns redacted public fields only.
- Partner/trust access requires an API key with the required scopes.
- Audit logs and API usage events appear in the operational console.

## Guardrails

Seed data must not create these labels:

```txt
legal_clean
safe_to_buy
guaranteed_ownership
no_planning_risk
risk_free
```
