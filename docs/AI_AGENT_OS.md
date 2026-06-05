# EstateOS AI Agent OS

## Purpose

This document defines the AI Agent OS for EstateOS Network.

EstateOS uses AI as a bounded operating layer, not as an uncontrolled decision maker.

## Scope

AI Agent OS covers agent roles, allowed actions, forbidden actions, `AiAgentAction`, audit rules, UX rules, permission scope, safety limits, and human approval requirements.

## Non-Goals

- AI is not a legal authority.
- AI is not a transaction closer.
- AI is not a payout approver.
- AI is not a permission bypass.
- AI is not a public revealer of sensitive evidence.

## Required AI Roles

```txt
property_normalizer
duplicate_detector
evidence_classifier
risk_summarizer
buyer_matcher
price_comparator
verification_assistant
deal_room_summarizer
data_quality_auditor
api_copilot
```

Role definitions:

| Agent type | Purpose |
| --- | --- |
| `property_normalizer` | Converts messy property input into structured fields for human review. |
| `duplicate_detector` | Detects duplicate or near-duplicate property risk. |
| `evidence_classifier` | Classifies evidence type and redaction needs. |
| `risk_summarizer` | Summarizes risk flags and missing evidence. |
| `buyer_matcher` | Ranks properties for demand profiles using scoped data. |
| `price_comparator` | Compares price against market context without guaranteeing valuation. |
| `verification_assistant` | Suggests verification jobs and missing checks. |
| `deal_room_summarizer` | Summarizes deal-room history and open risks. |
| `data_quality_auditor` | Finds stale, inconsistent, duplicate, or low-quality data. |
| `api_copilot` | Helps API users understand docs, scopes, and usage. |

## Allowed AI Actions

AI can:

```txt
normalize property data
classify evidence type
detect duplicate risk
summarize risk flags
suggest missing evidence
rank properties for demand profiles
summarize deal room history
prepare reports for human review
suggest verification jobs
explain trust_state to users
```

## Forbidden AI Actions

AI cannot:

```txt
mark legal_clean
approve legal status
reveal sensitive evidence publicly
transfer money
close a deal
change revenue rules
approve payout
bypass permissions
change trust_state without audit/human policy
```

## Required AiAgentAction Model

Fields:

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

Recommended additional fields:

```txt
data_scope
permission_scope
state_changed
approval_required
policy_version
metadata
```

## Required Audit Rules

Every AI action must log:

```txt
who/what triggered it
what data scope it accessed
what output it produced
whether human approval was required
whether output changed system state
```

Audit rules:

- Read-only summaries still create `AiAgentAction`.
- State-changing AI outputs require policy-defined approval.
- AI action logs must avoid raw sensitive evidence in summaries.
- AI errors and refused actions should be logged for quality review.

## Required AI UX Rules

```txt
AI explains confidence, not certainty.
AI says what evidence is missing.
AI separates verified facts from self-declared claims.
AI recommends next action, not final legal truth.
```

UI copy must label AI output as assistant output and must show confidence, missing evidence, and scope limits.

## Entities

- `AiAgentAccount`
- `AiAgentAction`
- `AuditLog`
- `TrustState`
- `RiskFlag`
- `VerificationJob`
- `DealRoomEvent`

## Permissions

Required permission examples:

```txt
ai:run_action
ai:read_action_log
ai:approve_state_change
property:read_public
property:read_partner
property:read_sensitive_internal
deal_room:join
verification:submit_report
```

AI must receive the minimum data scope needed for the requested task.

## Data Contracts

AI input contract:

```txt
agent_type
requested_action
data_scope
actor_id
permission_scope
```

AI output contract:

```txt
verified_facts
self_declared_claims
missing_evidence
risk_flags
confidence
recommended_next_action
state_change_request
```

AI output must never contain forbidden labels.

## User And Account Flows

AI summary flow:

```txt
user requests summary
-> permission and data-scope check
-> AI reads scoped data
-> output separates facts/claims/missing evidence
-> AiAgentAction logged
-> user sees summary and limits
```

AI state-change flow:

```txt
AI suggests state change
-> policy checks if human approval required
-> human approves or rejects
-> system changes state if allowed
-> AuditLog and AiAgentAction record result
```

## Security And Privacy Constraints

- AI must not receive unredacted sensitive evidence unless role and policy explicitly allow it.
- AI logs must avoid storing full private documents or secrets.
- AI outputs must not reveal owner identity, phone, exact private location, ID cards, bank details, contracts, or unredacted legal documents publicly.
- AI should refuse unsafe legal certainty and recommend human review.

## Checkpoints

- Is AI action logged?
- Is AI bounded to allowed action?
- Does AI separate verified facts from self-declared claims?
- Does AI avoid legal certainty?
- Does AI avoid sensitive data leakage?
- Is human approval required for state change?

## Acceptance Criteria

- [x] `docs/AI_AGENT_OS.md` exists.
- [x] It defines AI agent types.
- [x] It defines allowed and forbidden AI actions.
- [x] It defines AI audit requirements.
- [x] It prevents AI from becoming an unsafe autonomous closer.
