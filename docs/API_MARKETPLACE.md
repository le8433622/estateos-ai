# EstateOS API Marketplace

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This document defines the API Marketplace OS for EstateOS Network.

EstateOS must become data infrastructure for other apps, AI agents, agencies, banks, valuation companies, insurance companies, platforms, and enterprise data buyers.

## API Product Thesis

EstateOS API sells controlled access to structured property data, trust state, risk flags, freshness, verification labels, and market signals.

API access must be scoped, metered, auditable, rate-limited, revocable, and shaped by field-level visibility.

## Scope

This document covers API buyer types, plans, scopes, API keys, endpoint contracts, response examples, developer portal, billing hooks, and abuse prevention.

## Non-Goals

- Do not expose sensitive evidence by default.
- Do not expose exact private location publicly.
- Do not provide unmetered partner data access.
- Do not let API consumers infer private source owner identity.
- Do not sell legal certainty.

## API Buyer Types

```txt
real estate app
agency/san
bank
valuation company
insurance company
AI property-search app
market research company
enterprise data buyer
```

## API Plans

```txt
Free Developer
Starter
Pro
Agency/Data Pro
Enterprise
```

Plan principles:

- Free Developer is for testing and limited public data.
- Starter unlocks production use with limited rate and basic trust fields.
- Pro unlocks richer search, trust state, analytics, and higher limits.
- Agency/Data Pro supports partner write APIs and agency workflows.
- Enterprise supports custom limits, contracts, data products, and review.

## API Scopes

Required scopes:

```txt
properties:read_public
properties:read_partner
properties:read_trust_state
properties:search
properties:nearby
properties:history
properties:write_partner
evidence:write
verification:read_status
analytics:read_market
billing:read
```

Scope rules:

- Every partner/private endpoint must check scopes server-side.
- Scopes must be attached to API keys and accounts.
- Scope changes must be audited.
- Sensitive fields require explicit scope and visibility allowance.

## API Key Rules

Required rules:

```txt
hash keys at rest
show key only once
rate limit by key and account
support revocation
support scope changes
log all calls
```

Required `ApiKey` fields:

```txt
id
account_id
name
key_hash
scopes
status
last_used_at
created_at
revoked_at
```

Key lifecycle:

```txt
create key
-> show secret once
-> use with scopes
-> log every call
-> rotate or revoke when needed
```

## API Endpoints

| Endpoint | Scope | Purpose | Visibility rules |
| --- | --- | --- | --- |
| `GET /api/v1/properties` | `properties:read_public` | List public properties | public fields only, approximate/private-safe location |
| `GET /api/v1/properties/:id` | `properties:read_public` or `properties:read_partner` | Read one property | shaped by plan, scope, property visibility |
| `GET /api/v1/properties/search` | `properties:search` | Structured search | public or partner fields by scope |
| `GET /api/v1/properties/nearby` | `properties:nearby` | Nearby property lookup | no exact private location unless scoped |
| `GET /api/v1/properties/:id/trust-state` | `properties:read_trust_state` | Read trust state | cautious labels, no raw sensitive evidence |
| `GET /api/v1/properties/:id/history` | `properties:history` | Read property history | sensitive before/after values redacted unless scoped |
| `POST /api/v1/partner/properties` | `properties:write_partner` | Partner property submission | requires source attribution and audit |
| `PATCH /api/v1/partner/properties/:id` | `properties:write_partner` | Partner property update | history event and contribution ledger |
| `POST /api/v1/partner/properties/:id/evidence` | `evidence:write` | Upload evidence | private by default, redaction status required |
| `POST /api/v1/api-keys` | authenticated API buyer | Create key | show secret once, audit creation |
| `GET /api/v1/api-usage` | `billing:read` | Usage dashboard data | account-scoped usage only |
| `POST /api/v1/webhooks` | account scoped | Configure webhooks | validate URL, log events, allow revocation |

## API Response Examples

Public property response:

```json
{
  "id": "prop_123",
  "title": "Apartment near District 1",
  "property_type": "apartment",
  "location": {
    "city": "Ho Chi Minh City",
    "district": "District 1",
    "precision": "approximate"
  },
  "price": {
    "amount": 25000000,
    "currency": "VND",
    "period": "month"
  },
  "claim_level": "self_declared",
  "trust_state_summary": {
    "trust_score": 42,
    "risk_score": 58,
    "labels": ["self_declared"],
    "legal_status": "legal_not_provided"
  },
  "evidence": {
    "photo_status": "not_verified",
    "contact_status": "not_verified",
    "location_status": "not_verified"
  },
  "sensitive_fields_redacted": true
}
```

Partner/trust property response:

```json
{
  "id": "prop_456",
  "title": "Verified townhouse with field check",
  "property_type": "townhouse",
  "source": {
    "source_account_id": "acct_789",
    "source_type": "authorized_source"
  },
  "location": {
    "city": "Ho Chi Minh City",
    "district": "Thu Duc",
    "precision": "district_plus_area",
    "exact_private_location_visible": false
  },
  "price": {
    "amount": 8200000000,
    "currency": "VND"
  },
  "trust_state": {
    "claim_level": "authorized_source",
    "evidence_level": "operator_checked",
    "location_status": "verified_location",
    "photo_status": "verified_photo",
    "contact_status": "verified_contact",
    "availability_status": "availability_checked",
    "legal_status": "legal_reviewed_limited",
    "trust_score": 84,
    "risk_score": 16,
    "risk_flags": ["legal_document_not_verified"],
    "last_checked_at": "2026-06-05T00:00:00Z"
  },
  "api_visibility": "partner_trust",
  "usage_logged": true
}
```

## Developer Portal

Required pages:

```txt
API docs
API key dashboard
Usage dashboard
Billing
Playground
Webhook manager
Data products
```

Developer portal requirements:

- Show scopes and examples per endpoint.
- Show rate limits and usage units.
- Show billing plan and overage rules.
- Allow key creation, rotation, and revocation.
- Provide sample JSON with redaction notes.
- Explain forbidden legal labels and sensitive data policy.

## Abuse Prevention

Required controls:

```txt
rate limits
scope checks
field-level visibility
no sensitive evidence by default
no exact private location public
usage anomaly detection
```

Additional controls:

- Per-key and per-account rate limits.
- Endpoint-specific usage units.
- Usage anomaly review.
- Key revocation.
- Webhook signature verification.
- Enterprise contract review for high-volume access.

## Entities

- `ApiDataBuyerAccount`
- `ApiKey`
- `ApiPlan`
- `ApiScope`
- `ApiUsageEvent`
- `WebhookEndpoint`
- `BillingPlan`
- `DataUsageLedger`

## Permissions

API permissions are API scopes. Application services must also enforce account ownership, plan status, and field-level visibility.

## Data Contracts

Minimum `ApiUsageEvent` fields:

```txt
id
api_key_id
account_id
endpoint
method
status_code
scopes_used
fields_accessed
usage_units
ip_hash
user_agent_summary
created_at
```

Minimum response shaping inputs:

```txt
api_key_scope
api_plan
property_api_visibility
field_visibility
account_trust
legal/evidence redaction_state
```

## User And Account Flows

API buyer flow:

```txt
create ApiDataBuyerAccount
-> choose plan
-> create API key
-> assign scopes
-> call endpoint
-> shape response
-> log ApiUsageEvent
-> bill or rate-limit by usage
```

Partner write flow:

```txt
partner submits property
-> source_account_id recorded
-> claim_state set
-> contribution ledger entry
-> verification/trust pipeline
-> API visibility adjusted after evidence
```

## AI-Agent Rules

AI copilots may explain API docs, suggest queries, summarize usage, and flag anomalies. AI must not reveal hidden fields, bypass scopes, or generate legal certainty.

## Security And Privacy Constraints

- Sensitive evidence remains private by default.
- Exact private location is not public.
- Key secrets are never stored in plaintext.
- API usage logs must not store full secrets.
- Responses must be shaped before serialization.

## Checkpoints

- Does partner/private endpoint require API key?
- Are scopes checked?
- Is usage logged?
- Are fields shaped by visibility and scope?
- Are keys hashed and revocable?
- Are rate limits active?

## Acceptance Criteria

- [x] `docs/API_MARKETPLACE.md` exists.
- [x] It defines API buyer types, plans, scopes, endpoints, and key rules.
- [x] It includes API response examples.
- [x] It includes abuse prevention.
- [x] It is ready for backend and developer portal implementation.
