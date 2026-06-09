# EstateOS Account Model

## Purpose

This document defines the account model for EstateOS Network.

In EstateOS, login is not only authentication. Login is economic identity:

```txt
Account = identity + role + permission + trust + data rights + audit + possible revenue rights
```

## Why It Exists

Real estate data, verification, API access, demand, and deal-room events create economic value and legal risk. EstateOS must know who performed each action, what profile they used, what scope they had, and what future rights may be attached.

## Scope

This model governs all human, organization, AI, system, source owner, verifier, API buyer, and platform operator access.

## Base Entities

| Entity | Purpose |
| --- | --- |
| `User` | Human login identity. |
| `Organization` | Company, agency, developer, verification partner, data buyer, or platform entity. |
| `Membership` | Connects a user to an organization with role and status. |
| `AccountProfile` | Economic operating profile used by an actor. |
| `Role` | Named capability bundle within an organization or profile. |
| `Permission` | Scoped action string checked server-side. |
| `AuditLog` | Immutable record of sensitive actions. |

## Required Account Profiles

- `PropertyClaimAccount`
- `PropertyDemandAccount`
- `VerificationOperatorAccount`
- `ApiDataBuyerAccount`
- `AgencyDeveloperAccount`
- `PlatformOperatorAccount`
- `AiAgentAccount`

## Common AccountProfile Contract

```txt
id
user_id
organization_id
profile_type
status
trust_level
permissions
visibility_scopes
created_at
updated_at
```

Status values:

```txt
applicant
active
limited
suspended
revoked
```

## Permission Model

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

Rules:

- Permissions are checked server-side.
- Permissions are scoped by profile, organization, plan, trust level, and target resource.
- Sensitive permissions require audit logging.
- Permission changes require platform operator audit.

## PropertyClaimAccount

Purpose:

- Lets owners, agents, agencies, and source accounts submit property claims and evidence.

Who uses it:

- Property owners, listing agents, agency staff, source partners, and authorized representatives.

Human-nature risk:

- Source hiding, inaccurate uploads, duplicate listings, contact leakage, and bypass attempts.

Verification levels:

```txt
claim_applicant
self_declared
evidence_attached
operator_checked
authorized
trusted_data_owner
```

Allowed actions:

- Create property claim.
- Update own claim.
- Upload evidence.
- Request verification.
- View own contribution ledger.
- Join scoped deal rooms.

Forbidden actions:

- Mark legal certainty.
- View other owners' sensitive evidence.
- Hide source attribution from the platform.
- Change trust labels directly.
- Approve payouts.

Data visibility:

- Own claims, own evidence status, redacted public views, and scoped deal-room data.

Trust score inputs:

- Evidence completeness, verification success, dispute history, duplicate risk, stale updates, and prior data quality.

Economic value:

- Data contribution, lead quality, API visibility, future royalty eligibility, verification upsell.

Audit requirements:

- Claim create/update, price change, evidence upload, verification request, visibility change.

Upgrade/downgrade rules:

- Upgrade with verified contact/location/photo and low dispute history.
- Downgrade for false data, duplicate abuse, source hiding, or sensitive data leakage.

## PropertyDemandAccount

Purpose:

- Captures structured buyer, renter, investor, or partner demand and qualifies access to property data.

Who uses it:

- Buyers, renters, investors, brokers representing buyers, and enterprise demand accounts.

Human-nature risk:

- Scraping, bypass, fake demand, spam, and requesting sensitive data without intent.

Verification levels:

```txt
demand_applicant
contact_verified
qualified_demand
transaction_ready
trusted_demand
```

Allowed actions:

- Create demand profile.
- Save/search properties.
- Request scoped access.
- Join deal room.
- Add deal-room events.

Forbidden actions:

- Scrape data.
- Access owner identity by default.
- Access unredacted legal evidence without scope.
- Bypass audit in deal room.

Data visibility:

- Public property data, trust labels, redacted evidence status, deal-room scoped data.

Trust score inputs:

- Contact verification, demand completeness, spam reports, deal-room behavior, payment/billing status.

Economic value:

- Demand signal, qualified lead, B2B matching, deal-room service fee, data product insight.

Audit requirements:

- Demand creation, sensitive access request, deal-room join, event creation, API export if enabled.

Upgrade/downgrade rules:

- Upgrade with verified contact, serious demand details, payment, and clean behavior.
- Downgrade for scraping, spam, bypass attempts, or policy violation.

## VerificationOperatorAccount

Purpose:

- Reviews evidence, performs checks, submits reports, and contributes trust signals.

Who uses it:

- Internal operators, field verifiers, verification partners, and quality review teams.

Human-nature risk:

- Bribery, low-quality checks, conflict of interest, overclaiming, and unauthorized field changes.

Verification levels:

```txt
applicant
basic_checker
field_verifier
authorized_internal
trusted_partner
```

Allowed actions:

- Accept verification jobs.
- Review evidence.
- Submit verification reports.
- Add risk notes.
- Flag conflict risk.

Forbidden actions:

- Mark `legal_clean`.
- Approve legal status.
- Approve deposit.
- Mark property sold.
- Change price or payout rules.
- Reveal private evidence publicly.

Data visibility:

- Job-scoped evidence, redacted legal docs unless permission allows, assigned property context.

Trust score inputs:

- Report quality, reversal rate, conflict flags, timeliness, dispute outcomes, review consistency.

Economic value:

- Verification marketplace fees, field check fees, data quality contribution.

Audit requirements:

- Job acceptance, evidence view, report submission, risk flag creation, trust-state impact.

Upgrade/downgrade rules:

- Upgrade through consistent quality and low conflict risk.
- Downgrade for low-quality reports, conflicts, bribery indicators, or overclaiming.

## ApiDataBuyerAccount

Purpose:

- Gives partners controlled API access to public, partner, trust, analytics, and market data products.

Who uses it:

- Real estate apps, agencies, banks, valuation companies, insurance companies, AI apps, research firms, and enterprise data buyers.

Human-nature risk:

- Scraping, overuse, data resale, scope abuse, and extracting source owners.

Plans:

```txt
free
starter
pro
enterprise
```

Allowed actions:

- Create API keys.
- Read scoped properties.
- Read usage and billing.
- Configure webhooks.
- Submit partner data if plan allows.

Forbidden actions:

- Access sensitive evidence by default.
- Exceed scopes or rate limits.
- Resell prohibited data.
- Derive hidden source owner identity.

Data visibility:

- Plan/scope-shaped fields, public or partner property data, trust state, analytics, redacted evidence status.

Trust score inputs:

- Usage behavior, billing status, abuse flags, scope violations, support review, data contribution quality.

Economic value:

- API subscription, data export, enterprise data products, usage-ledger entries.

Audit requirements:

- Key create/revoke, scope change, API call, export, webhook event, billing event.

Upgrade/downgrade rules:

- Upgrade by plan, contract, clean usage, and verified organization.
- Downgrade or revoke for abuse, scraping, payment failure, or scope misuse.

## AgencyDeveloperAccount

Purpose:

- Lets agencies and developers manage inventory, integrations, team access, and partner submission workflows.

Who uses it:

- Agencies, property platforms, integration developers, and source organizations.

Human-nature risk:

- Bulk low-quality submissions, duplicate data, source hiding, and unapproved contact exposure.

Verification levels:

```txt
applicant
organization_verified
integration_enabled
trusted_source_partner
```

Allowed actions:

- Manage organization members.
- Submit partner properties.
- Upload evidence.
- Use partner APIs.
- View organization usage and contribution records.

Forbidden actions:

- Bypass source attribution.
- Reveal owner/private data beyond scope.
- Mark legal certainty.
- Disable audit logs.

Data visibility:

- Organization-owned records, partner API fields, scoped deal-room data, own ledger entries.

Trust score inputs:

- Data quality, duplicate rate, dispute rate, verification pass rate, API behavior, billing health.

Economic value:

- Agency SaaS, API subscription, data contribution, verified supply pipeline.

Audit requirements:

- Member changes, API key changes, bulk uploads, evidence updates, export usage.

Upgrade/downgrade rules:

- Upgrade by verified organization and clean data quality.
- Downgrade for junk data, duplicates, abuse, or leak risk.

## PlatformOperatorAccount

Purpose:

- Operates moderation, trust policies, account review, risk review, billing review, and safety enforcement.

Who uses it:

- Internal admin, operations, trust and safety, finance, support, and policy owners.

Human-nature risk:

- Excessive privilege, accidental leaks, policy inconsistency, and insider misuse.

Verification levels:

```txt
operator_applicant
support_operator
trust_operator
billing_operator
platform_admin
```

Allowed actions:

- Moderate accounts and properties.
- Review evidence and disputes.
- Manage trust policies.
- Review abuse and billing.
- Revoke API keys.

Forbidden actions:

- Bypass audit.
- Export sensitive evidence without policy.
- Mark legal certainty.
- Use platform access for personal deals.

Data visibility:

- Role-scoped internal data, sensitive evidence only when policy and task require it.

Trust score inputs:

- Internal reviews, policy compliance, action reversals, incident history.

Economic value:

- Platform risk reduction, operational integrity, support quality.

Audit requirements:

- Every sensitive admin action, permission change, evidence view, export, key revocation, billing override.

Upgrade/downgrade rules:

- Upgrade through internal authorization and training.
- Downgrade for policy breach, unnecessary access, or incident review.

## AiAgentAccount

Purpose:

- Gives AI a bounded identity for actions, access scopes, outputs, and audit logs.

Who uses it:

- Platform AI services and approved automation workflows.

Human-nature risk:

- AI overreach, hallucinated certainty, sensitive data exposure, unapproved state change.

Verification levels:

```txt
disabled
read_only
assistant
state_change_requires_human
trusted_internal_tool
```

AI can:

```txt
normalize
summarize
classify
compare
recommend
flag risk
```

AI cannot:

```txt
approve legal status
reveal sensitive evidence publicly
transfer money
close deal
change payout rule
mark legal_clean
```

Data visibility:

- Only the data scope granted for the action. Sensitive evidence remains redacted unless internal policy explicitly permits access.

Trust score inputs:

- Output quality, human approval rate, policy violations, incident logs, model performance.

Economic value:

- Data cleanup, report generation, matching quality, verification assistance, API copilot.

Audit requirements:

- Every AI action logs trigger, data scope, input summary, output summary, target, model, approval requirement, and state-change result.

Upgrade/downgrade rules:

- Upgrade only after policy review and reliable output.
- Downgrade or disable after unsafe output, leak risk, hallucinated legal certainty, or permission issue.

## Data Contracts

Every account-sensitive event must include actor context:

```txt
actor_type
actor_id
account_profile
organization_id
scope
created_at
```

Every trust-impacting account event must create audit:

```txt
action
before_summary
after_summary
metadata
created_at
```

## User/Account Flows

Profile setup flow:

```txt
user registers
-> selects account profile
-> verifies contact/organization if required
-> receives limited permissions
-> builds trust through evidence and behavior
-> gets upgraded or downgraded by policy
```

Organization flow:

```txt
organization created
-> membership invited
-> role assigned
-> profile permissions scoped
-> audit logs record organization actions
```

## Security And Privacy Constraints

- Sensitive data is private by default.
- Internal access must be role-scoped.
- API access must be key-scoped.
- Deal-room access must be participant-scoped.
- AI access must be action-scoped.

## App-to-Profile Mapping

Each AccountProfile maps to a specific app for login and UI access:

| Profile | App | Login Gate | Dashboard |
|---|---|---|---|
| `PlatformOperatorAccount` | Admin | `admin:moderate` | Command Center, Review, Billing, Quality, Distribution, Partners |
| `VerificationOperatorAccount` | Frontend | `verification:accept_job` | Verifier dashboard |
| `AiAgentAccount` | System-only | No web login | N/A (API/agent only) |
| `PropertyClaimAccount` | Frontend | `property:create_claim` | Supply, Demand |
| `PropertyDemandAccount` | Frontend | `deal_room:join` | Demand |
| `ApiDataBuyerAccount` | Frontend | `api:create_key` | API Buyer, Partners |
| `AgencyDeveloperAccount` | Frontend | `property:create_claim` + `api:create_key` | Supply, API Buyer, Partners |

Admin login gates:
- Only users with at least one active AccountProfile containing `admin:moderate` permission can log into the Admin app.
- The legacy `UserType.Admin` check is no longer used for EstateOS route authorization.

Frontend login gates:
- All users with valid credentials can log into the Frontend app (no profile check at login).
- Menu items and feature access are filtered client-side by `allowed_actions` and enforced server-side by `authPermission()` middleware.

## Permission Enforcement

Authorization uses a layered approach:

1. **Route-level middleware**: `authPermission(permission, profileTypes?)` in `backend/src/middlewares/authPermission.ts`
   - Calls `requireAccountProfile()` from `accountProfileService.ts`
   - Checks `AccountProfile.allowed_actions` array
   - Attaches `req.accountProfile` for downstream controllers

2. **Controller-level**: Some controllers call `requireAccountProfile()` directly for finer-grained checks

3. **Public routes**: No middleware (health, readiness, billing plans, public properties, data product catalog)

Permission-to-profile defaults (see `backend/src/estateos/constants.ts:DEFAULT_PROFILE_ALLOWED_ACTIONS`):

| Permission | Profiles with default access |
|---|---|
| `property:create_claim` | PropertyClaimAccount, AgencyDeveloperAccount, PlatformOperatorAccount |
| `property:upload_evidence` | PropertyClaimAccount, AgencyDeveloperAccount, PlatformOperatorAccount |
| `property:read_public` | All profiles |
| `property:read_partner` | ApiDataBuyerAccount, AgencyDeveloperAccount, PlatformOperatorAccount |
| `property:read_sensitive_internal` | PlatformOperatorAccount |
| `verification:accept_job` | VerificationOperatorAccount, PlatformOperatorAccount |
| `verification:submit_report` | VerificationOperatorAccount, PlatformOperatorAccount |
| `api:create_key` | ApiDataBuyerAccount, AgencyDeveloperAccount, PlatformOperatorAccount |
| `api:read_usage` | ApiDataBuyerAccount, AgencyDeveloperAccount, PlatformOperatorAccount |
| `deal_room:join` | PropertyClaimAccount, PropertyDemandAccount, PlatformOperatorAccount |
| `deal_room:add_event` | PropertyClaimAccount, PropertyDemandAccount, PlatformOperatorAccount |
| `billing:read` | ApiDataBuyerAccount, PlatformOperatorAccount |
| `admin:moderate` | PlatformOperatorAccount |
| `ai:run_action` | AiAgentAccount |

## Checkpoints

- Is the actor known?
- Does the actor have the right profile?
- Is permission scoped?
- Is sensitive access logged?
- Does the action affect trust, rights, billing, API usage, or visibility?

## Acceptance Criteria

- [x] `docs/ACCOUNT_MODEL.md` exists.
- [x] It defines all account profiles.
- [x] It explains login as economic identity.
- [x] It defines permissions and forbidden actions.
- [x] It ties account levels to trust, data access, and rights.
- [x] It defines app-to-profile login mapping.
- [x] It documents permission enforcement (authPermission middleware + requireAccountProfile service).
- [x] It documents permission-to-profile default assignments.
