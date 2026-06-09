# AGENT.md

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This file is the operating manual for OpenCode, Codex, and any AI coding agent working in this repository.

EstateOS Network is a Real Estate Operating Network, not a generic property listing site.

The existing Movin' In codebase is only the technical shell. New implementation must move the product toward EstateOS Network.

## Mandatory Documentation Compliance Gate

Agents must treat `docs/DOCUMENTATION_COMPLIANCE.md` as a hard gate. Work is not complete unless all applicable repository documents are checked and the final decision is `PASS`.

Before editing, agents must review:

```txt
RULER.md
CHECKPOINT.md
AGENT.md
AGENTS.md
docs/IMPLEMENTATION_CONTRACT.md
docs/DOCUMENTATION_COMPLIANCE.md
```

Agents must also review every affected domain document. Examples include `docs/ACCOUNT_MODEL.md`, `docs/TRUST_MODEL.md`, `docs/API_MARKETPLACE.md`, `docs/AI_AGENT_OS.md`, `docs/DEAL_ROOM_OS.md`, `docs/REVENUE_RIGHTS.md`, `docs/ANTI_BYPASS_RULES.md`, `docs/SECURITY_LAUNCH_CHECKLIST.md`, `docs/CI_EXPECTATIONS.md`, and pilot/deployment runbooks when launch behavior is affected.

Every checkpoint item must be marked `PASS`, `N/A`, or `STOP`. `N/A` requires a reason. `STOP` blocks implementation, commit, deploy, and completion. Passing tests without documentation compliance is not sufficient.

## Mission

EstateOS Network is composed of these operating systems:

- Property Data OS
- Supply OS
- Demand OS
- Verification OS
- Trust OS
- API Marketplace OS
- Deal Room OS
- AI Agent OS
- Revenue Rights OS

The mission is to transform vague listings into structured, attributable, verified, scored, API-accessible, AI-readable property data assets with transaction context and future data rights.

## Agent Behavior Rules

AI coding agents must:

- Preserve product doctrine from `RULER.md`, `CHECKPOINT.md`, and `docs/IMPLEMENTATION_CONTRACT.md`.
- Prefer platform kernels over isolated features.
- Avoid building generic listing flows unless tied to trust, data, API, evidence, rights, demand, verification, deal room, or AI OS.
- Treat all property data as claim-based until verified.
- Add audit logs for sensitive actions.
- Keep sensitive evidence private by default.
- Build with future API and data marketplace use in mind.
- Record data contribution even before payout exists.
- Shape visibility by account profile, scope, trust state, and API plan.
- Separate verified facts from self-declared claims in UI, APIs, AI outputs, and reports.

## Forbidden Implementation Patterns

Agents must not:

- Implement `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, `no_planning_risk`, or `risk_free` labels.
- Expose exact private location publicly.
- Expose owner identity, phone numbers, legal documents, ID cards, bank details, contracts, or unredacted evidence publicly.
- Build commission-first success-fee marketplace logic in MVP.
- Let AI agents approve legal status, transfer money, close deals, or change payout rules.
- Let verifiers change prices, mark sold, approve deposits, or change revenue rules.
- Create anonymous data mutations without actor identity and audit trail.
- Treat login as sufficient proof of trust.
- Claim legal certainty when only limited review or self-declared evidence exists.

## Required Actor Model

Every sensitive mutation, usage event, AI action, verification result, and deal-room event must include actor identity.

Required actor fields:

```txt
actor_type: user | organization | ai_agent | system
actor_id
role/profile
scope
created_at
```

Actor identity must be attached to:

- Property creation and update.
- Claim creation and update.
- Evidence upload and review.
- Verification job lifecycle.
- Trust label changes.
- API key lifecycle and API usage.
- AI actions and AI-generated summaries.
- Billing events.
- Deal room events.
- Data contribution and data usage ledger entries.

## Required Audit Events

Implement audit logs for:

- Property creation/update.
- Claim creation/update.
- Price change.
- Evidence upload/review.
- Verification job result.
- Trust label change.
- API key creation/revocation.
- API call usage.
- AI action.
- Billing event.
- Deal room event.

Minimum audit fields:

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

Audit logs must not expose sensitive evidence in plain text summaries.

## Human-Nature Constraints

EstateOS must assume real market behavior, not ideal behavior:

- Agent/source owners may hide sources.
- Buyers may bypass fees.
- Verifiers may be bribed.
- Free listing behavior creates data junk.
- Transaction success-fee dependency creates bypass incentives.
- Legal overclaiming can bankrupt the platform.
- API buyers may scrape then leave.
- Participants may move communication outside the system.

Therefore implementation must rely on:

- Attribution.
- Limited visibility.
- Trust score.
- Freshness score.
- Duplicate detection.
- Usage logging.
- Evidence state.
- Audit trail.
- Data ownership ledger.
- Scope-limited APIs.
- Rate limits and abuse review.

## Required Account Profiles

Use account profiles as economic identity, not just authentication:

- `PropertyClaimAccount`
- `PropertyDemandAccount`
- `VerificationOperatorAccount`
- `ApiDataBuyerAccount`
- `AgencyDeveloperAccount`
- `PlatformOperatorAccount`
- `AiAgentAccount`

Account profile determines allowed actions, visibility, trust levels, audit requirements, and future economic rights.

## Required Permissions

Use scoped permissions such as:

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

Permissions must be checked server-side. UI-only hiding is not authorization.

## Data Contract Rules

Every property must include source and trust context:

```txt
source_account_id
claim_state
trust_state
api_visibility
freshness_score
duplicate_risk_score
created_at
updated_at
```

Every evidence record must include:

```txt
property_id
uploaded_by_account_id
evidence_type
visibility
redaction_state
review_status
created_at
```

Every API usage event must include:

```txt
api_key_id
account_id
endpoint
scopes_used
fields_accessed
usage_units
created_at
```

## AI Agent Rules

AI can:

- Normalize.
- Summarize.
- Classify.
- Compare.
- Recommend.
- Flag risk.
- Suggest missing evidence.

AI cannot:

- Approve legal status.
- Reveal sensitive evidence publicly.
- Transfer money.
- Close deals.
- Change payout rules.
- Mark `legal_clean`.
- Bypass permissions.

Every AI action must be logged through `AiAgentAction` and must declare the data scope accessed.

## Build Order Guidance

Agents should build in this order:

1. Documentation kernel.
2. Account/profile kernel.
3. Property/claim/evidence kernel.
4. Verification/trust kernel.
5. API marketplace kernel.
6. Revenue rights ledger.
7. Deal room kernel.
8. AI agent action kernel.
9. UI/console layers.

## Security And Privacy Constraints

Sensitive evidence is private by default.

Sensitive data includes:

- Owner identity.
- Phone numbers.
- Unredacted legal documents.
- ID cards.
- Bank details.
- Contracts.
- Exact private address or location.

Public APIs and public pages must use masked fields, approximate location, redacted evidence status, and trust labels instead of raw sensitive material.

## Checkpoints

Before merging any implementation, verify:

- The change serves EstateOS Network, not generic listing drift.
- Every sensitive action has actor and audit trail.
- Sensitive fields have visibility controls.
- Trust labels are from the allowed set.
- Forbidden legal labels are not introduced.
- Data contribution and usage are recorded where relevant.
- AI outputs are bounded, logged, and non-final.
- API calls are scoped, rate-limited, and usage-logged.
- The Documentation Compliance Checkpoint is recorded exactly as required by `docs/DOCUMENTATION_COMPLIANCE.md`.
- No relevant rule from the required source documents is unchecked or silently skipped.

## Acceptance Criteria

- [x] `AGENT.md` exists.
- [x] It states what AI agents must do and must not do.
- [x] It prevents the repo from drifting back into a generic rental/listing app.
- [x] It includes sensitive-data and audit requirements.
- [x] It includes human-nature constraints and anti-bypass doctrine.
