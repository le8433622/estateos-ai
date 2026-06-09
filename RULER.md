# RULER.md

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This file defines the non-negotiable implementation laws for EstateOS Network. If code conflicts with this file, the code is wrong.

EstateOS is a Real Estate Operating Network.

EstateOS is not:

- A generic listing website.
- A simple rental app.
- A success-fee-first marketplace.
- A legal guarantee service.
- A public legal-document database.

## Product Scope

EstateOS exists to create structured, attributable, verified, scored, API-accessible, AI-readable property data assets with controlled visibility, demand context, deal-room history, and future data rights.

## Law 0 - Documentation Compliance Is Mandatory

Every implementation must pass `docs/DOCUMENTATION_COMPLIANCE.md` before it can be considered valid.

Required implementation:

- Review `RULER.md`, `CHECKPOINT.md`, `AGENT.md`, `AGENTS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/DOCUMENTATION_COMPLIANCE.md` before non-trivial changes.
- Review every affected domain document before changing behavior, data models, permissions, UI copy, APIs, AI behavior, seed data, deployment, or operations.
- Record `PASS`, `N/A`, or `STOP` for every applicable checkpoint item.
- Treat unchecked items as failed items.
- Treat `STOP` as a hard block for implementation, commit, deploy, and completion.
- If documents conflict, apply the stricter EstateOS safety, privacy, permission, audit, anti-bypass, and legal-risk rule.
- If the stricter rule is unclear, stop and ask before changing behavior.

## Law 1 - Claim Before Truth

Every property record starts as a claim, not as verified truth.

```txt
No property data is absolute truth.
Every important field must have source, confidence, and history.
```

Required implementation:

- Store `source_account_id` on every property.
- Track claim state separately from verification state.
- Keep history for important field changes.
- Display source and confidence where users make decisions.

## Law 2 - Evidence Before Privilege

More evidence unlocks more distribution, lead quality, API visibility, and future royalty eligibility.

Required implementation:

- Do not give high API visibility to thin, self-declared records.
- Use evidence status to shape ranking, visibility, lead routing, and eligibility.
- Record evidence uploads in the data contribution ledger.

## Law 3 - Trust Is Earned, Not Granted At Login

Login does not equal trust. Roles and permissions must open gradually.

Required implementation:

- Use account profiles, trust levels, permissions, and audit history.
- Start new accounts with limited capability.
- Upgrade accounts based on evidence, behavior, verification, and platform review.

## Law 4 - No Legal Overclaiming

EstateOS must never imply absolute legal safety in MVP.

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

Required implementation:

- Use cautious legal labels only.
- Separate self-declared legal claims from reviewed evidence.
- Show confidence and missing evidence instead of legal certainty.

## Law 5 - Sensitive Evidence Is Private By Default

Sensitive evidence includes:

```txt
owner identity
phone numbers
unredacted legal docs
ID cards
bank details
contracts
exact private address/location
```

Required implementation:

- Redact sensitive evidence by default.
- Mask private contact data in public views.
- Expose exact private location only when permission and scope allow it.
- Use field-level visibility in UI and APIs.

## Law 6 - Every Economic Actor Must Be Attributable

Every property, evidence, verification, API usage, AI action, and deal-room event must have an actor.

Required implementation:

- Store actor identity on sensitive events.
- Do not allow anonymous mutations.
- Audit every change that affects trust, money, visibility, evidence, or rights.

## Law 7 - Data Ownership Must Be Recorded Before Payout

Do not implement complex payout early, but always record contribution and usage.

Required implementation:

- Create contribution entries for property creation, evidence upload, verification, updates, demand signals, API usage, deal-room events, and AI reports.
- Create usage entries for API access, exports, reports, and partner data usage.
- Treat royalty eligibility as future eligibility, not immediate payout.

## Law 8 - Do Not Create Bypass Incentives Early

MVP must not depend on success fee or large transaction commission.

Monetization begins with:

```txt
verification/data/API/SaaS
```

Required implementation:

- Prefer fixed verification fees, API subscriptions, data exports, SaaS, and B2B AI reports.
- Use deal rooms to create trust and history, not to enforce commission dependency.
- Protect source owners through visibility and attribution.

## Law 9 - Verifier Is Not God

Verifier outputs evidence result, risk notes, and confidence level. Verifier cannot close legal truth.

Required implementation:

- Prevent verifiers from changing transaction-critical fields unless separately authorized.
- Prevent verifiers from approving deposits, marking sold, changing payout rules, or declaring legal certainty.
- Audit verifier actions and monitor conflict risk.

## Law 10 - AI Is Bounded

AI can normalize, summarize, compare, classify, and recommend.

AI cannot:

```txt
approve legal status
reveal private evidence
transfer money
close deals
mark legal_clean
change payout rules
```

Required implementation:

- Log every AI action.
- Enforce permissions before AI accesses data.
- Require human approval for state-changing AI outputs where policy requires it.
- Make AI explain confidence, missing evidence, and limits.

## Enforcement Table

| Rule | Why it exists | Failure mode prevented | Required implementation |
| --- | --- | --- | --- |
| Source attribution | Data owners need protection and future rights | source theft | `source_account_id`, contribution ledger, audit log |
| Scoped source visibility | Sources hide data if exposed too early | agent bypass | masked owner/contact/location fields, scoped deal-room access |
| API usage logging | Data buyers may scrape then leave | buyer scraping | API keys, scopes, rate limits, `ApiUsageEvent` |
| Verifier limits | Verifiers may be bribed or conflicted | verifier bribery | verifier trust score, conflict flags, review audit, no legal finality |
| Cautious legal labels | Legal certainty can bankrupt the platform | legal overclaiming | allowed legal labels only, forbidden-label tests/checks |
| Private evidence default | Public leaks destroy trust and create liability | private data leakage | redaction, field-level visibility, scope checks |
| Bounded AI | AI can overstate facts or take unsafe actions | AI overreach | `AiAgentAction`, permission checks, human approval, no final legal decisions |
| API scopes | Partners need controlled access | API abuse | scopes per endpoint, rate limits, revocation, anomaly review |
| Evidence before distribution | Free listings create junk data | false listings | evidence state, trust score, freshness score, claim levels |
| Duplicate detection | Same asset may appear from many sources | duplicate listings | duplicate risk score, source merge policy, history events |

## Non-Goals

- Do not build a public dump of legal documents.
- Do not make legal guarantees.
- Do not make success fee the first business model.
- Do not optimize only for listing quantity.
- Do not allow unscoped AI or unlogged API access.

## Acceptance Criteria

- [x] `RULER.md` exists.
- [x] It contains the 10 core laws.
- [x] It defines forbidden labels and allowed cautious labels.
- [x] It explains anti-bypass and anti-human-nature guardrails.
- [x] It is written as a strict implementation ruler, not a vision document.
- [x] It makes documentation compliance a Law 0 hard gate.
