# EstateOS Network Implementation Contract

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This document is the master implementation contract for EstateOS Network. It binds product doctrine, data models, permissions, audit, API behavior, AI limits, revenue rights, and anti-bypass rules into one source of truth.

## Mandatory Documentation Compliance

Every implementation must pass `docs/DOCUMENTATION_COMPLIANCE.md`. This contract cannot be implemented partially or by intent only.

Rules:

- Required source documents must be reviewed before non-trivial changes: `RULER.md`, `CHECKPOINT.md`, `AGENT.md`, `AGENTS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/DOCUMENTATION_COMPLIANCE.md`.
- Every affected domain document must be reviewed before changing related code, docs, configuration, data models, UI, API behavior, AI behavior, or operations.
- Each applicable rule must be marked `PASS`, `N/A`, or `STOP`.
- `N/A` requires a short reason.
- `STOP` blocks implementation, commit, deployment, and completion.
- If this document conflicts with another EstateOS document, the stricter safety, privacy, permission, audit, anti-bypass, or legal-risk rule wins.
- Tests/build passing does not override missing documentation compliance.

## Why It Exists

The inherited repository is a technical shell from Movin' In. EstateOS is a new product architecture. Without a strict contract, future work can drift back into generic listing, booking, or commission-first marketplace behavior.

## Product Definition

EstateOS Network is:

```txt
Real Estate Operating Network
= Property Data OS
+ Supply OS
+ Demand OS
+ Verification OS
+ Trust OS
+ API Marketplace OS
+ Deal Room OS
+ AI Agent OS
+ Revenue Rights OS
```

EstateOS transforms real estate from vague listings into structured, attributable, verified, scored, API-accessible, AI-readable data assets with transaction context and future data rights.

## Scope

This contract applies to:

- Backend models, services, workers, APIs, permissions, and logs.
- Frontend, admin, mobile, and developer portal UI.
- Verification workflows and trust-state generation.
- API marketplace, API key, usage, billing, and webhooks.
- AI agent actions, summaries, recommendations, and risk analysis.
- Deal rooms, evidence requests, communication events, and audit history.
- Revenue contribution and usage ledgers.

## Non-Goals

EstateOS must not become:

- A simple rental app.
- A generic listing board.
- A commission-first marketplace.
- A legal guarantee service.
- A public database of sensitive legal documents.
- An AI closer that makes final legal, financial, or transaction decisions.

## Non-Negotiable Product Rules

1. Do not build a generic real estate listing website.
2. Do not build a transaction-success-fee-first marketplace.
3. Do not implement `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, or `no_planning_risk` labels in MVP.
4. Do not expose sensitive evidence publicly.
5. Do not expose exact private location publicly unless permission and scope allow it.
6. Every property must have source attribution.
7. Every verification action must be audit logged.
8. Every AI action must be audit logged.
9. Every API call must be logged.
10. Data ownership and contribution must be recorded from day one.
11. Revenue sharing can be recorded first; payout logic can come later.
12. The platform earns first from verification, data, API, and SaaS, not from large transaction commission.

## Required Core Entities

Identity and account entities:

- `User`
- `Organization`
- `Membership`
- `AccountProfile`
- `Role`
- `Permission`
- `AuditLog`
- `PropertyClaimAccount`
- `PropertyDemandAccount`
- `VerificationOperatorAccount`
- `ApiDataBuyerAccount`
- `AgencyDeveloperAccount`
- `PlatformOperatorAccount`
- `AiAgentAccount`

Property, trust, and evidence entities:

- `Property`
- `PropertyClaim`
- `PropertyEvidence`
- `PropertyHistoryEvent`
- `VerificationJob`
- `VerificationReport`
- `TrustState`
- `RiskFlag`
- `FreshnessScore`
- `DuplicateRiskScore`

API marketplace entities:

- `ApiKey`
- `ApiPlan`
- `ApiScope`
- `ApiUsageEvent`
- `WebhookEndpoint`

Revenue rights entities:

- `BillingPlan`
- `PaymentRecord`
- `DataContributionLedger`
- `DataUsageLedger`
- `RoyaltyEligibility`
- `ManualInvoice`

Demand, deal-room, and AI entities:

- `DemandProfile`
- `LeadIntent`
- `DealRoom`
- `DealRoomEvent`
- `EvidenceRequest`
- `OfferNote`
- `AiAgentAction`

## Permission Contract

All permissions must be scoped and checked server-side.

Permission examples:

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

Permission checks must consider:

- Actor identity.
- Account profile.
- Organization membership.
- Role.
- Scope.
- Target resource ownership.
- Trust level.
- API plan and scopes.
- Visibility and redaction rules.

## Data Contracts

Minimum `Property` contract:

```txt
id
source_account_id
claim_state
title
property_type
location_public
location_private
price
currency
api_visibility
trust_state
trust_score
risk_score
freshness_score
duplicate_risk_score
created_at
updated_at
```

Minimum `PropertyEvidence` contract:

```txt
id
property_id
uploaded_by_account_id
evidence_type
file_ref
visibility
redaction_state
review_status
reviewed_by_account_id
created_at
updated_at
```

Minimum `AuditLog` contract:

```txt
id
actor_type
actor_id
account_profile
action
target_type
target_id
scope
before_summary
after_summary
metadata
created_at
```

Minimum `ApiUsageEvent` contract:

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
created_at
```

Minimum `AiAgentAction` contract:

```txt
id
agent_type
actor_id
input_summary
output_summary
target_type
target_id
human_approved
model_name
created_at
```

## User And Account Flows

Property supply flow:

```txt
account registration
-> account profile selection
-> property claim
-> evidence upload
-> operator/verification review
-> trust_state generation
-> visibility increase
-> data contribution ledger entry
```

Demand flow:

```txt
demand profile creation
-> contact qualification
-> property matching
-> scoped data view
-> deal-room invite
-> deal-room event history
-> demand signal contribution
```

API buyer flow:

```txt
API buyer account
-> plan selection
-> API key creation
-> scope assignment
-> API usage
-> usage logging
-> billing and abuse monitoring
```

Verification flow:

```txt
verification job request
-> verifier assignment
-> evidence review or field check
-> report submission
-> trust_state update
-> audit log
-> contribution ledger
```

AI flow:

```txt
bounded AI action request
-> permission and data-scope check
-> model execution
-> AiAgentAction log
-> human approval if state-changing
-> audit log if system state changes
```

## AI-Agent Rules

AI may normalize, classify, summarize, compare, recommend, detect duplicates, flag risk, suggest missing evidence, and prepare reports for human review.

AI must not approve legal status, reveal sensitive evidence, transfer money, close deals, mark `legal_clean`, change payout rules, or bypass permissions.

AI output must separate:

- Verified facts.
- Self-declared claims.
- Missing evidence.
- Confidence level.
- Recommended next action.

## Security And Privacy Constraints

Sensitive data is private by default:

- Owner identity.
- Phone numbers.
- Unredacted legal documents.
- ID cards.
- Bank details.
- Contracts.
- Exact private address/location.

Required controls:

- Field-level visibility.
- Redaction state.
- API response shaping.
- Scope checks.
- Audit logs.
- Rate limits.
- Revocation.
- Abuse review.

## Checkpoints

Every implementation must pass `CHECKPOINT.md`.

Every implementation must also pass `docs/DOCUMENTATION_COMPLIANCE.md`.

Minimum merge requirements:

- Documentation compliance passed.
- Product alignment passed.
- Permission checks passed.
- Audit logs added.
- Sensitive data protected.
- API scopes checked.
- Trust labels valid.
- No forbidden legal labels.
- Data contribution logged.
- AI action bounded and logged if used.
- Tests/build pass.

## Acceptance Criteria

- [x] All required markdown files are represented by this contract set.
- [x] Each file is written as an implementation contract, not marketing copy.
- [x] The repo no longer reads like a simple Movin' In rental fork.
- [x] The docs define EstateOS as a large operating network.
- [x] The docs protect against bypass, bribery, source theft, scraping, and legal overclaiming.
- [x] OpenCode/Codex can implement from these docs without needing new business clarification.
- [x] The contract requires 100% documentation compliance before implementation, commit, deploy, and completion.
