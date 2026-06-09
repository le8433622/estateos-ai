# AGENTS.md — EstateOS AI Agent Operating Guide

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Mission
Transform this repository from a basic Movin' In fork into **EstateOS Network**: a Real Estate Operating Network for Vietnam.

EstateOS is not a generic listing website, not a rental clone, and not a transaction-fee marketplace. It is the platform kernel for structured real estate data, source claims, evidence, verification, trust scoring, API distribution, AI agents, deal rooms, audit, and future data-rights economics.

## Product Doctrine

```txt
Real estate is not merely a listing.
Real estate is a data asset with source, claim, evidence, trust state, risk state, usage rights, API visibility, and transaction history.
```

## Mandatory Documentation Compliance Gate

Every agent must comply with `docs/DOCUMENTATION_COMPLIANCE.md` before editing, committing, deploying, or marking work complete.

Required source documents for every non-trivial change:

```txt
RULER.md
CHECKPOINT.md
AGENT.md
AGENTS.md
docs/IMPLEMENTATION_CONTRACT.md
docs/DOCUMENTATION_COMPLIANCE.md
```

The agent must also read every domain document affected by the change. Examples: `docs/ACCOUNT_MODEL.md` for permissions, `docs/TRUST_MODEL.md` for trust labels, `docs/API_MARKETPLACE.md` for API scopes, `docs/AI_AGENT_OS.md` for AI behavior, `docs/REVENUE_RIGHTS.md` for contribution/usage ledgers, and `docs/SECURITY_LAUNCH_CHECKLIST.md` for launch/security controls.

Compliance is binary:

- `PASS` means implemented and verified.
- `N/A` means not applicable and must include a short reason.
- `STOP` means blocked, unclear, conflicting, unsafe, or unverified.

No `STOP` item may ship. If documentation conflicts, the stricter EstateOS safety, privacy, audit, permission, anti-bypass, or legal-risk rule wins. If unclear, stop and ask before changing behavior.

## Non-Negotiable Constraints

Agents must not implement these in MVP:

- No `legal_clean` label.
- No guarantee that a property is safe to buy.
- No public sensitive legal documents.
- No public exact private owner/contact info.
- No public exact private location if the source requested masking.
- No transaction-success-fee dependency in the initial business model.
- No complex payout splitting in the first platform kernel.
- No AI action that transfers money, approves legal status, closes deals, reveals private evidence, or marks a property legally clean.

## Allowed MVP Trust Labels

Use cautious labels only:

- `self_declared`
- `evidence_attached`
- `verified_photo`
- `verified_location`
- `verified_contact`
- `availability_checked`
- `operator_checked`
- `authorized_source`
- `trusted_data_owner`
- `legal_not_verified`

## Core Agent Roles

### 1. Product Architect Agent
Owns product coherence. Must ensure all changes support EstateOS Network, not a small listing MVP.

Checks:
- Does the feature strengthen data infrastructure?
- Does it preserve source attribution?
- Does it create trust/risk visibility?
- Does it help API/AI/verification/deal-room scale?

### 2. Backend Agent
Builds modules, models, services, APIs, permission checks, audit logs.

Primary modules:
- identity
- organizations
- account-profiles
- property-data-os
- property-claims
- evidence
- verification
- trust-risk
- demand
- deal-room
- api-platform
- billing
- revenue-rights
- ai-agents
- audit

### 3. Frontend Agent
Builds public web, supply onboarding, demand onboarding, property pages, API portal, trust pages, deal-room pages.

Must avoid generic e-commerce or vacation-rental copy.

### 4. Admin Agent
Builds operator console:
- EstateOS Command Center
- Property Review Queue
- Claim Review
- Evidence Review
- Verification Jobs
- Trust & Risk
- API Buyers
- API Usage
- Revenue Rights Ledger
- AI Agent Actions
- Audit Logs

### 5. Verification Agent
Implements verification workflow with limited claims.

Can produce:
- evidence result
- verification note
- risk flag
- confidence level

Cannot produce:
- legal guarantee
- final ownership guarantee
- transaction approval

### 6. API Platform Agent
Builds API keys, scopes, usage logs, plans, developer portal, playground, and webhook foundations.

Every partner/private data field must require scope checks.

### 7. AI Agent OS Agent
Adds AI action logging and scoped AI actor behavior.

AI may:
- normalize property data
- detect duplicate risk
- classify evidence
- summarize risk
- match demand
- summarize deal room
- suggest verification tasks

AI may not:
- mark legal status final
- expose sensitive evidence
- approve deposit
- close deal
- change payout rules

## Implementation Rule

Every new feature must declare which kernel it belongs to:

```txt
Identity Kernel
Property Kernel
Claim Kernel
Evidence Kernel
Verification Kernel
Trust Kernel
Demand Kernel
Deal Room Kernel
API Kernel
AI Kernel
Revenue Rights Kernel
Audit Kernel
```

## Commit Discipline

Each commit should preserve build stability when possible and include a clear reason:

```txt
feat(property): add trust_state fields
feat(api): add scoped API key model
feat(verification): add verified_location workflow
fix(security): mask private location in public API
```

## Definition of Done

A change is complete only when:

- The data model is defined.
- API permissions are considered.
- Audit logging is considered.
- Human abuse/bypass risk is considered.
- AI boundaries are respected.
- The UI copy matches EstateOS Network, not Movin' In rental clone.
- Documentation is updated when product rules change.
- The Documentation Compliance Checkpoint from `docs/DOCUMENTATION_COMPLIANCE.md` is recorded with `Decision: PASS`.
- Every applicable EstateOS document rule is marked `PASS` or `N/A`; unchecked rules are not allowed.
