# EstateOS Deal Room OS

## Purpose

This document defines the Deal Room OS for EstateOS Network.

Deal Room is a controlled workspace for transaction context, evidence requests, participant coordination, AI summaries, and audit history.

## Doctrine

Deal Room exists to:

```txt
collect evidence context
organize participants
record communication events
track evidence requests
summarize risk context
create a timeline
generate future transaction data
```

It should not depend on large transaction commission as the first monetization path.

## Scope

Deal Room OS covers participants, fields, events, visibility rules, evidence requests, notes, AI summaries, audit logs, and non-goals.

## Non-Goals

```txt
Do not make deal room dependent on transaction commission.
Do not let AI close deal.
Do not let verifier approve deposit.
Do not reveal private owner identity by default.
```

Additional non-goals:

- Do not replace legal counsel or escrow.
- Do not treat deal-room participation as proof of legal safety.
- Do not expose unredacted evidence to all participants by default.

## Required Participants

```txt
PropertyClaimAccount
PropertyDemandAccount
Agent/Agency/Owner representative
VerificationOperatorAccount
PlatformOperatorAccount
AiAgentAccount
```

Participant rules:

- Every participant must have profile, role, scope, and audit context.
- Participants see only data needed for their role.
- AI is represented by `AiAgentAccount` and logs actions.

## Required DealRoom Fields

```txt
id
property_id
demand_profile_id
participants
status
events
notes
ai_summary
audit_log
created_at
updated_at
```

Recommended status values:

```txt
open
pending_evidence
verification_requested
active_negotiation
paused
closed
archived
```

## Required Event Types

```txt
created
participant_joined
message_added
evidence_requested
evidence_uploaded
verification_requested
verification_result_added
viewing_requested
viewing_completed
offer_note_added
risk_note_added
ai_summary_generated
closed
```

## Event Contract

Minimum `DealRoomEvent` fields:

```txt
id
deal_room_id
event_type
actor_type
actor_id
account_profile
visibility_scope
payload_summary
created_at
```

Rules:

- Event payload summaries must not expose raw sensitive evidence.
- Sensitive attachments must use evidence references and visibility controls.
- Important events must also create `AuditLog` entries.

## Evidence Request Contract

Minimum fields:

```txt
id
deal_room_id
requested_by_account_id
assigned_to_account_id
property_id
evidence_type
status
visibility_scope
created_at
updated_at
```

Status values:

```txt
requested
uploaded
under_review
accepted_limited
rejected
cancelled
```

## Visibility Rules

```txt
participants see only scoped data
sensitive evidence remains redacted unless permission allows
AI summaries separate verified facts and self-declared claims
all actions are audit logged
```

Field-level visibility examples:

| Field | Default visibility | Higher-scope visibility |
| --- | --- | --- |
| Owner identity | hidden | participant-scoped with approval |
| Phone number | masked | deal-room scoped if policy allows |
| Exact private location | approximate | scoped after permission |
| Legal document | redacted status | unredacted only for authorized review |
| Verification report | summary | full report by role/scope |

## Entities

- `DealRoom`
- `DealRoomEvent`
- `EvidenceRequest`
- `OfferNote`
- `RiskFlag`
- `AiAgentAction`
- `AuditLog`
- `PropertyClaimAccount`
- `PropertyDemandAccount`

## Permissions

Required permission examples:

```txt
deal_room:join
deal_room:add_event
deal_room:read_scoped
deal_room:request_evidence
deal_room:upload_evidence
deal_room:close
ai:run_action
verification:read_status
```

Rules:

- Deal-room permissions must be participant-scoped.
- A participant cannot read all deal rooms by default.
- Verification operators access only assigned evidence/jobs.
- AI access uses the deal-room data scope granted for the action.

## User And Account Flows

Deal room creation flow:

```txt
qualified demand meets property claim
-> platform or participant creates deal room
-> participants receive scoped roles
-> evidence requests and messages create events
-> verification results update risk/trust context
-> AI summary can be generated for review
-> deal room closes or archives with timeline
```

Evidence request flow:

```txt
participant requests evidence
-> request assigned
-> evidence uploaded privately
-> verifier/operator reviews if needed
-> result added as scoped event
-> trust/risk summary updates
```

## AI-Agent Rules

AI may summarize deal-room history, list missing evidence, identify open risk flags, and prepare a human-readable context report.

AI must not close the deal, approve legal status, approve deposit, reveal sensitive evidence, or pressure users into transaction decisions.

AI summary format must separate:

- Verified facts.
- Self-declared claims.
- Missing evidence.
- Open risk flags.
- Recommended next actions.

## Security And Privacy Constraints

- Owner identity is private by default.
- Exact private location is private by default.
- Unredacted evidence is private by default.
- All participant access must be logged.
- Event payloads must avoid raw secrets.

## Checkpoints

- Are participants scoped?
- Is sensitive evidence redacted?
- Is every event audited?
- Does AI summary separate facts and claims?
- Is deal room independent of large transaction commission?

## Acceptance Criteria

- [x] `docs/DEAL_ROOM_OS.md` exists.
- [x] It defines purpose, participants, events, visibility.
- [x] It treats deal room as a trust workspace.
- [x] It includes AI summary rules and audit rules.
