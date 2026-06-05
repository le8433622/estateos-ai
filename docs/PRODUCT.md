# EstateOS Network Product Architecture

## Purpose

This document defines EstateOS Network as the product architecture for this repository.

EstateOS is a large Real Estate Operating Network, not a small listing template.

## Product Thesis

EstateOS transforms real estate from vague listings into structured, attributable, verified, scored, API-accessible, AI-readable data assets with transaction context and future data rights.

The platform does not start by maximizing listings or transaction success fees. It starts by making property data reliable, attributable, scoped, auditable, and usable by humans, APIs, and AI systems.

## Required Definition

EstateOS Network:

```txt
Property Data OS
+ Supply OS
+ Demand OS
+ Verification OS
+ Trust OS
+ API Marketplace OS
+ Deal Room OS
+ AI Agent OS
+ Revenue Rights OS
```

## What EstateOS Is Not

EstateOS is not:

- A simple rental app.
- A generic listing board.
- A commission-first marketplace.
- A legal guarantee service.
- A public database of sensitive legal documents.
- A pure CRM for agencies.
- A booking template with AI added later.

## Core Systems

| System | Purpose | Primary outputs |
| --- | --- | --- |
| Property Data OS | Stores claim-based property records with source, history, evidence, visibility, and trust context | structured property data, history, freshness, duplicate risk |
| Supply OS | Helps owners, agents, agencies, and source accounts submit claims and evidence | property claims, source attribution, contribution records |
| Demand OS | Captures buyer/renter/investor demand as structured intent | demand profiles, lead intent, match context |
| Verification OS | Coordinates evidence review, photo/contact/location checks, and field checks | verification jobs, reports, limited labels, risk notes |
| Trust OS | Converts claims, evidence, behavior, and history into cautious trust state | trust_state, trust score, risk score, risk flags |
| API Marketplace OS | Provides controlled access to data products for partners | API keys, scopes, usage logs, billing events |
| Deal Room OS | Creates a scoped transaction workspace for participants, evidence requests, notes, and audit | deal rooms, events, AI summaries, transaction context |
| AI Agent OS | Runs bounded AI agents for normalization, matching, risk summaries, and audits | AiAgentAction logs, summaries, recommendations |
| Revenue Rights OS | Records contribution, usage, billing, and future royalty eligibility | contribution ledger, usage ledger, plans, invoices |

## Account Types

EstateOS uses account profiles as economic identity:

- `PropertyClaimAccount` - creates property claims and uploads evidence.
- `PropertyDemandAccount` - creates demand profiles and joins deal rooms.
- `VerificationOperatorAccount` - reviews evidence and submits verification reports.
- `ApiDataBuyerAccount` - consumes controlled API data products.
- `AgencyDeveloperAccount` - manages agency inventory, integrations, and developer access.
- `PlatformOperatorAccount` - moderates, reviews risk, manages policies, and operates trust controls.
- `AiAgentAccount` - executes bounded, logged AI actions.

## End-To-End Data Flow

```txt
property claim
-> evidence upload
-> verification job
-> trust_state generation
-> API visibility
-> data usage logging
-> demand matching
-> deal room
-> contribution ledger
-> future royalty eligibility
```

Implementation rules for the flow:

- Every property starts as a claim.
- Every claim has source attribution.
- Evidence changes trust and visibility, not legal certainty.
- API usage is logged per key, account, endpoint, and fields accessed.
- Deal-room events create transaction context and audit history.
- Contribution and usage are recorded before payout logic exists.

## Revenue Model

First revenue pillars:

- Supply verification fee.
- API subscription.
- Data export.
- Agency SaaS.
- B2B AI reports.
- Verification marketplace.
- Deal room fixed service fee.
- Future data royalty network.

Success fee must not be the first revenue pillar. A success-fee-first model creates bypass incentives, hides sources, and weakens data quality.

## Human Behavior Constraints

EstateOS must design for these failure modes:

| Constraint | Product response |
| --- | --- |
| source hiding | source attribution, masked visibility, contribution ledger |
| platform bypass | avoid commission-first MVP, use fixed fees/API/SaaS, scoped deal room |
| low-quality free listings | evidence levels, trust score, freshness score, duplicate detection |
| verification conflict risk | verifier trust score, conflict flags, audit, limited verifier powers |
| legal overclaiming risk | cautious legal labels only, no legal certainty, missing-evidence UX |
| private data leakage | redaction, field-level visibility, scoped APIs, audit logs |

## Product North Star

North star:

```txt
Clean Verified Property Data Assets
```

Supporting metrics:

```txt
verified_location_count
verified_photo_count
verified_contact_count
api_usage_count
trust_state_coverage
freshness_score
```

## Permissions

Implementation must use account profiles and scoped permissions. Examples:

```txt
property:create_claim
property:update_own
property:upload_evidence
property:read_public
property:read_partner
property:read_sensitive_internal
verification:accept_job
verification:submit_report
api:create_key
api:read_usage
deal_room:join
deal_room:add_event
billing:read
admin:moderate
ai:run_action
```

## Data Contracts

Core records must include actor, source, scope, visibility, and audit context where relevant.

Minimum required data anchors:

- `source_account_id` on property.
- `claim_state` on property or claim.
- `trust_state` on property.
- `api_visibility` on property.
- `DataContributionLedger` for contribution events.
- `DataUsageLedger` and `ApiUsageEvent` for data usage.
- `AiAgentAction` for AI actions.
- `AuditLog` for sensitive events.

## AI-Agent Rules

AI supports EstateOS by normalizing, classifying, summarizing, matching, comparing, and flagging risk.

AI must not approve legal status, transfer money, close deals, reveal sensitive evidence publicly, change revenue rules, or mark `legal_clean`.

## Security And Privacy Constraints

Sensitive evidence is private by default. Public and partner views must be shaped by visibility and scope.

Sensitive fields include owner identity, phone numbers, exact private location, unredacted legal documents, ID cards, bank details, and contracts.

## Implementation Checkpoints

Every implementation must pass:

- Product alignment checkpoint.
- Account and permission checkpoint.
- Property data checkpoint.
- Evidence and verification checkpoint.
- API marketplace checkpoint.
- Revenue rights checkpoint.
- AI safety checkpoint.
- Anti-bypass checkpoint.

## Acceptance Criteria

- [x] `docs/PRODUCT.md` exists.
- [x] It defines the 9 operating systems.
- [x] It defines all account types.
- [x] It explains product non-goals.
- [x] It explains first revenue logic.
- [x] It is ready for coding agents to implement.
