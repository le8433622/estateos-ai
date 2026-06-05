# EstateOS Trust Model

## Purpose

This document defines the trust and risk model for EstateOS Network.

EstateOS must not claim absolute truth. It exposes structured confidence, source, evidence state, history, and risk.

## Doctrine

```txt
Claim before truth.
Evidence before privilege.
Trust is earned through behavior and evidence, not granted by login.
```

## Scope

The trust model applies to property records, account profiles, verification operators, demand profiles, API partners, AI outputs, and data visibility decisions.

## Non-Goals

- Do not certify legal cleanliness.
- Do not guarantee ownership.
- Do not eliminate all risk.
- Do not hide uncertainty.
- Do not expose sensitive evidence to prove trust publicly.

## Required Trust Labels

Allowed trust labels:

```txt
self_declared
verified_photo
verified_location
verified_contact
availability_checked
operator_checked
authorized_source
trusted_data_owner
```

Label meanings:

| Label | Meaning |
| --- | --- |
| `self_declared` | Source account submitted the data without evidence review. |
| `evidence_attached` | Evidence exists but is not fully reviewed or public. |
| `verified_photo` | Photo/media check passed under defined policy. |
| `verified_location` | Location check passed under defined policy. |
| `verified_contact` | Contact check passed under defined policy. |
| `availability_checked` | Availability was checked at a specific time. |
| `operator_checked` | Platform or authorized operator reviewed limited evidence. |
| `authorized_source` | Source authority is supported by evidence or platform policy. |
| `trusted_data_owner` | Source has repeated high-quality contribution history. |

## Required Legal Labels

Allowed cautious legal labels:

```txt
legal_not_provided
legal_self_declared
legal_evidence_attached_redacted
legal_pending_review
legal_reviewed_limited
legal_not_verified
```

Legal label rules:

- `legal_not_provided` means no legal evidence was submitted.
- `legal_self_declared` means the source made a legal claim without verification.
- `legal_evidence_attached_redacted` means evidence exists but remains private/redacted.
- `legal_pending_review` means review is requested or in progress.
- `legal_reviewed_limited` means limited review occurred under defined constraints.
- `legal_not_verified` means legal status is not verified by EstateOS.

## Forbidden Labels

These labels are forbidden:

```txt
legal_clean
safe_to_buy
guaranteed_ownership
no_planning_risk
risk_free
```

Any implementation that introduces these labels or equivalent claims fails the checkpoint.

## Required Score Types

```txt
PropertyTrustScore
PropertyRiskScore
ClaimAccountTrustScore
DemandTrustScore
VerifierTrustScore
ApiPartnerTrustScore
FreshnessScore
DuplicateRiskScore
```

Score rules:

- Scores must be explainable.
- Scores must not imply legal certainty.
- Scores must expose inputs and last update time.
- Scores must be recomputable from evidence, history, and policy.

## Required Risk Flags

| Risk flag | Meaning | Product response |
| --- | --- | --- |
| `legal_document_not_verified` | Legal evidence is missing, self-declared, or not reviewed | show cautious legal label, restrict legal claims |
| `price_changed_recently` | Price changed within a configured freshness window | show history, lower confidence |
| `location_precision_low` | Public or submitted location lacks precision | approximate map, request location verification |
| `duplicate_listing_risk` | Similar property appears from other sources | duplicate review, source comparison |
| `source_authorization_missing` | Source authority is not established | restrict visibility, request evidence |
| `contact_unverified` | Contact has not passed verification | mask/limit contact exposure |
| `availability_stale` | Availability was not checked recently | lower freshness, request check |
| `media_reuse_suspected` | Photos may be reused or inconsistent | media review, duplicate/media flags |
| `verifier_conflict_risk` | Verifier may have relationship or incentive conflict | review assignment, require second check |
| `api_abuse_risk` | API behavior suggests scraping or scope misuse | rate limit, revoke, abuse review |

## Required trust_state Object

Example:

```json
{
  "claim_level": "evidence_attached",
  "evidence_level": "operator_checked",
  "location_status": "verified_location",
  "photo_status": "verified_photo",
  "contact_status": "verified_contact",
  "availability_status": "availability_checked",
  "legal_status": "legal_reviewed_limited",
  "trust_score": 76,
  "risk_score": 24,
  "risk_flags": [
    "price_changed_recently",
    "legal_document_not_verified"
  ],
  "last_checked_at": "2026-06-05T00:00:00Z"
}
```

## Required Scoring Logic

Scoring must be explainable and based on:

```txt
evidence completeness
verification results
source account trust
history changes
report/dispute history
freshness
API/data usage
buyer/demand feedback
```

Suggested score inputs:

| Input | Positive signal | Negative signal |
| --- | --- | --- |
| Evidence completeness | photo/contact/location/legal evidence attached | missing evidence |
| Verification results | verified photo/location/contact | failed or stale checks |
| Source account trust | high quality history | disputes, reversals, junk data |
| History changes | stable history | frequent price/contact/location changes |
| Reports/disputes | low dispute rate | fraud or stale reports |
| Freshness | recently checked | stale availability |
| API/data usage | responsible partner usage | abuse, scraping, anomaly |
| Demand feedback | useful qualified demand | spam or mismatch reports |

## Permissions

- Public users can see public trust labels and redacted confidence context.
- Property source accounts can see their own evidence and improvement steps.
- Verifiers can see job-scoped evidence.
- Platform operators can see role-scoped internal trust context.
- API buyers can see trust fields allowed by scope.
- AI agents can access only action-scoped trust inputs.

## Data Contracts

Trust-state generation must read from:

- Property claim state.
- Evidence status.
- Verification reports.
- Account trust.
- Property history events.
- Risk flags.
- Dispute/report events.
- API usage events where relevant.
- Demand feedback where relevant.

Trust-state generation must write:

- `trust_state`.
- `trust_score`.
- `risk_score`.
- `risk_flags`.
- `last_checked_at`.
- Audit log when labels materially change.

## User And Account Flows

Trust improvement flow:

```txt
self_declared
-> evidence_attached
-> verified_photo/contact/location
-> operator_checked
-> authorized_source
-> trusted_data_owner
```

Legal confidence flow:

```txt
legal_not_provided
-> legal_self_declared
-> legal_evidence_attached_redacted
-> legal_pending_review
-> legal_reviewed_limited
```

The flow must never end in legal certainty.

## AI-Agent Rules

AI may explain trust state, summarize risk flags, detect duplicate risk, and suggest missing evidence.

AI must not create forbidden legal labels, hide uncertainty, or convert limited review into certainty.

## Security And Privacy Constraints

- Trust explanations must not reveal sensitive evidence.
- Legal evidence remains redacted unless scoped permission allows access.
- Public trust labels should show status and confidence, not raw private documents.

## Checkpoints

- Are labels from the allowed set?
- Are forbidden labels absent?
- Is legal status cautious?
- Is trust score explainable?
- Are sensitive evidence details redacted?
- Is trust-label change audited?

## Acceptance Criteria

- [x] `docs/TRUST_MODEL.md` exists.
- [x] It defines allowed and forbidden labels.
- [x] It defines score types and risk flags.
- [x] It includes `trust_state` JSON example.
- [x] It prevents legal overclaiming.
