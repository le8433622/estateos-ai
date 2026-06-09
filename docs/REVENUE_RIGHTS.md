# EstateOS Revenue Rights

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This document defines the Revenue Rights OS for EstateOS Network.

EstateOS must record who created, verified, updated, and powered data usage from day one. Complex payout can come later, but contribution and usage attribution must exist immediately.

## Doctrine

```txt
Do not implement complex payout early.
Do record data ownership and contribution from day one.
Platform earns first from verification/data/API/SaaS, not large transaction commission.
```

## Scope

Revenue Rights OS covers contribution ledgers, usage ledgers, billing plans, payments, manual invoices, API usage events, future royalty eligibility, and anti-confusion rules.

## Non-Goals

- Do not build complex multi-party payout in MVP.
- Do not promise current revenue share just because contribution is recorded.
- Do not make success fee the first revenue pillar.
- Do not distribute money before fraud, tax, payment, and dispute policies exist.

## Revenue Lines

```txt
Supply verification fee
API subscription
Data export
Agency SaaS
B2B AI report
Verification marketplace
Deal room fixed service fee
Future data royalty network
```

## Required Entities

```txt
BillingPlan
PaymentRecord
DataContributionLedger
DataUsageLedger
RoyaltyEligibility
ApiUsageEvent
ManualInvoice
```

## Entity Contracts

Minimum `BillingPlan` fields:

```txt
id
name
plan_type
price_amount
currency
billing_period
limits
included_scopes
status
created_at
```

Minimum `PaymentRecord` fields:

```txt
id
account_id
billing_plan_id
amount
currency
status
provider
provider_ref
created_at
```

Minimum `DataContributionLedger` fields:

```txt
id
account_id
property_id
contribution_type
source_event_type
source_event_id
royalty_eligible_later
metadata
created_at
```

Minimum `DataUsageLedger` fields:

```txt
id
account_id
property_id
api_key_id
usage_type
fields_accessed
usage_units
royalty_eligible_later
created_at
```

Minimum `RoyaltyEligibility` fields:

```txt
id
account_id
property_id
eligibility_reason
status
policy_version
created_at
updated_at
```

## DataContributionLedger Must Record

```txt
created_property
uploaded_evidence
verified_location
verified_photo
verified_contact
updated_availability
api_property_used
demand_signal_created
deal_room_event_created
ai_report_contributed
```

Contribution rules:

- Contribution records source activity and possible future rights.
- Contribution does not guarantee immediate payout.
- Contribution should be immutable or append-only.
- Corrections should create new events, not rewrite history silently.

## DataUsageLedger Must Record

```txt
who used the data
what property was used
which API key used it
which fields were accessed
when it was used
usage units
whether usage is royalty eligible later
```

Usage rules:

- API access creates usage entries.
- Data export creates usage entries.
- AI reports that consume property data create usage entries.
- Deal-room fixed service usage can create usage entries.
- Usage records must not expose full sensitive field values.

## Early Pricing Model

```txt
100k VND basic cleanup
300k VND verified photo/contact/location
500k-1M VND field check
Free API 100 calls/day
Starter API 1M VND/month
Pro API 5M VND/month
Agency/Data Pro 10-30M VND/month
Enterprise custom
```

Pricing rules:

- Prices are operational defaults, not hard-coded policy.
- Billing plans should allow future configuration.
- Manual invoices can support early B2B sales before automated billing matures.

## Anti-Confusion Rules

- Data royalty eligibility is not immediate payout.
- Recording contribution does not guarantee current revenue share.
- Payout requires future policy, fraud checks, tax/payment readiness, and dispute window.
- Success fee must not be first revenue pillar.

## Permissions

- Contributors can see their own contribution records.
- API buyers can see their own usage and billing records.
- Platform operators can review revenue ledgers by role.
- Public users cannot see private contribution economics.
- AI agents can summarize ledgers only within granted scope.

## User And Account Flows

Contribution flow:

```txt
actor performs data action
-> action is audited
-> contribution ledger entry is created
-> possible RoyaltyEligibility is recorded if policy allows
-> no payout occurs unless future payout policy exists
```

Usage flow:

```txt
API/data/report usage occurs
-> usage event is logged
-> DataUsageLedger records property, fields, units, key, account
-> billing aggregates usage
-> future royalty eligibility can be calculated later
```

Billing flow:

```txt
plan selected
-> invoice/payment record created
-> usage applied to plan limits
-> overage/manual invoice if needed
-> payment status updates account access
```

## AI-Agent Rules

AI may summarize usage, detect billing anomalies, and prepare B2B reports. AI must not approve payout, change revenue rules, promise royalties, or hide anti-confusion language.

## Security And Privacy Constraints

- Ledger entries should store references and summaries, not raw sensitive evidence.
- Payment provider secrets must not be stored in ledger metadata.
- Contributor revenue context is private by default.
- Royalty eligibility must have policy versioning.

## Checkpoints

- Is contribution recorded?
- Is usage recorded?
- Is payout avoided unless policy exists?
- Is future royalty eligibility separated from immediate payout?
- Is billing access scoped?

## Acceptance Criteria

- [x] `docs/REVENUE_RIGHTS.md` exists.
- [x] It defines revenue lines.
- [x] It defines contribution and usage ledger requirements.
- [x] It separates future royalty eligibility from immediate payout.
- [x] It protects against over-complex MVP accounting.
