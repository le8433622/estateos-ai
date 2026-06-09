# EstateOS Anti-Bypass Rules

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This document defines anti-bypass, source protection, anti-scraping, and anti-overclaim rules for EstateOS Network.

EstateOS must be designed for real market behavior, not ideal behavior.

## Scope

These rules apply to property supply, demand, API usage, verification, deal rooms, evidence handling, legal labels, AI outputs, and revenue design.

## Non-Goals

- Do not assume every actor behaves cooperatively.
- Do not expose private source data to create short-term growth.
- Do not rely on success fees as the first monetization path.
- Do not use legal certainty as a conversion tactic.

## Required Failure Modes And Product Responses

| Failure mode | Product response |
| --- | --- |
| source owner hides source | require `source_account_id`, mask public source identity, record contribution ledger, reward verified source quality |
| source owner uploads inaccurate data | evidence state, trust score, freshness score, dispute/report flow, downgrade source trust |
| buyer/data user scrapes then leaves | API keys, scopes, rate limits, usage logs, anomaly detection, revocation |
| participants move communication outside system | make deal room useful for evidence, timeline, AI summary, and fixed service value, not commission dependency |
| verifier submits low-quality result | verifier trust score, report review, reversal tracking, downgrade/suspend verifier |
| verifier has conflict risk | conflict disclosure, conflict flags, assignment rules, second review for high-risk jobs |
| generic free listings create junk data | claim levels, evidence before privilege, duplicate detection, visibility/ranking penalties |
| API partner exceeds intended usage | rate limits, plan limits, scope checks, usage billing, abuse review |
| legal status is overclaimed | cautious legal labels only, forbidden label checks, separate self-declared claims from reviewed evidence |
| private data leaks | field-level visibility, redaction, audit logs, incident review, access revocation |

## Required Product Responses

```txt
field-level visibility
masked sensitive data
source_account_id on every property
data contribution ledger
API scopes
rate limits
usage logs
trust score
freshness score
duplicate detection
evidence state
verification audit
no success-fee dependency in early product
```

## Source Protection Rules

```txt
do not expose owner identity publicly
do not expose exact private location publicly
do not expose unredacted documents publicly
record data owner for future royalty eligibility
allow API visibility levels per property
```

Implementation details:

- Public property pages use masked contact and approximate location.
- Partner APIs use field-level response shaping.
- Deal rooms reveal additional information only by role, permission, and audit.
- Source contribution is recorded even if payout is not implemented.

## API Protection Rules

```txt
API key required for partner data
scope check per endpoint
usage logging per call
rate limits
revocation
abuse review
field-level response shaping by plan/scope
```

Implementation details:

- API keys are hashed at rest.
- API calls create `ApiUsageEvent`.
- Suspicious usage creates abuse review.
- Scope changes and revocations are audited.
- Private fields are excluded unless plan, scope, and property visibility allow them.

## Legal Protection Rules

```txt
Use cautious labels only.
Never label a property as legally clean in MVP.
Always show legal confidence state.
Always separate self-declared legal claims from reviewed evidence.
```

Forbidden labels:

```txt
legal_clean
safe_to_buy
guaranteed_ownership
no_planning_risk
risk_free
```

Allowed cautious labels:

```txt
legal_not_provided
legal_self_declared
legal_evidence_attached_redacted
legal_pending_review
legal_reviewed_limited
legal_not_verified
```

## Entities

- `Property`
- `PropertyClaim`
- `PropertyEvidence`
- `DataContributionLedger`
- `DataUsageLedger`
- `ApiKey`
- `ApiUsageEvent`
- `TrustState`
- `RiskFlag`
- `VerificationReport`
- `DealRoomEvent`
- `AuditLog`

## Permissions

Required permission protections:

- Public users read public fields only.
- Deal-room participants read scoped fields only.
- API buyers read fields allowed by scope and plan only.
- Verifiers read only assigned job evidence.
- Platform operators read sensitive evidence only by role and policy.
- AI agents read only the action-scoped data they need.

## Data Contracts

Every property must include:

```txt
source_account_id
api_visibility
claim_state
trust_state
freshness_score
duplicate_risk_score
```

Every sensitive access must include:

```txt
actor_id
actor_type
account_profile
permission_scope
target_type
target_id
created_at
```

Every API call must include usage logging with:

```txt
api_key_id
endpoint
scopes_used
fields_accessed
usage_units
created_at
```

## User And Account Flows

Source protection flow:

```txt
source submits property
-> source_account_id recorded
-> public fields are masked
-> evidence increases trust and visibility
-> contribution ledger records source activity
-> future royalty eligibility can be evaluated later
```

API protection flow:

```txt
API request arrives
-> key is authenticated
-> scope is checked
-> rate limit is applied
-> fields are shaped by scope/plan/property visibility
-> usage event is logged
-> abuse rules evaluate usage
```

Legal protection flow:

```txt
legal claim submitted
-> label starts cautious
-> evidence remains redacted
-> review can produce limited legal label
-> UI/API shows confidence and missing evidence
-> forbidden legal certainty remains blocked
```

## AI-Agent Rules

AI must respect all anti-bypass rules. It may identify source leakage risk, scraping patterns, duplicate risk, and legal overclaiming. It must not infer and reveal hidden owner identity, exact location, or legal certainty.

## Security And Privacy Constraints

- Field-level visibility is mandatory.
- Masked sensitive data is the default.
- Redacted evidence is the public default.
- Exact private location is not public.
- Access to sensitive evidence must be logged.
- Abuse and incident review must be possible from logs.

## Checkpoints

- Does this protect source owners?
- Does this avoid transaction-fee dependency?
- Does this avoid leaking sensitive data?
- Does this reduce scraping and bypass incentives?
- Does this align with `RULER.md`?

## Acceptance Criteria

- [x] `docs/ANTI_BYPASS_RULES.md` exists.
- [x] It defines human-market failure modes.
- [x] It defines anti-bypass rules.
- [x] It defines source protection and API protection.
- [x] It aligns with `RULER.md`.
