# CHECKPOINT.md

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Purpose

This file defines gates that every implementation must pass before being considered aligned with EstateOS Network.

Use this file before opening, reviewing, merging, or shipping any change.

## Scope

These checkpoints apply to backend, frontend, mobile, admin, scripts, API, AI, documentation, and data model changes.

## 0. Documentation Compliance Checkpoint

Check:

```txt
Were the required source documents reviewed?
Were all affected domain documents reviewed?
Is every applicable rule marked PASS or N/A?
Are all STOP items resolved before implementation, commit, deploy, and completion?
```

Required result:

- `docs/DOCUMENTATION_COMPLIANCE.md` must be applied to every non-trivial change.
- Required source documents must be reviewed: `RULER.md`, `CHECKPOINT.md`, `AGENT.md`, `AGENTS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/DOCUMENTATION_COMPLIANCE.md`.
- Every affected domain document must be reviewed before changing related behavior.
- Every applicable checkpoint must be marked `PASS`, `N/A`, or `STOP`.
- `N/A` requires a short reason.
- Any unchecked rule is treated as failed.
- Any `STOP` blocks implementation, commit, deploy, and completion.

## 1. Product Alignment Checkpoint

Check:

```txt
Does this change serve EstateOS Network?
Does it support data, trust, API, evidence, rights, demand, verification, deal room, or AI OS?
Does it avoid generic listing-only behavior?
```

Required result:

- The change must map to at least one EstateOS operating system.
- Generic listing behavior must be justified by trust, data, evidence, demand, or API usage.
- README, docs, UI copy, and implementation must not drift back to rental-template thinking.

## 2. Account/Permission Checkpoint

Check:

```txt
Is the actor known?
Does the actor have the right account profile?
Is permission scoped?
Is the action audit logged?
```

Required result:

- Actor identity is present for sensitive actions.
- Server-side permission checks exist.
- UI hiding is not treated as authorization.
- Audit logs avoid leaking sensitive evidence.

## 3. Property Data Checkpoint

Check:

```txt
Does property have source_account_id?
Does property have claim state?
Does property have trust_state?
Does sensitive field visibility respect scope?
```

Required result:

- Property data is claim-based until verified.
- Important field changes create history events.
- API visibility is field-level and scope-aware.
- Duplicate and freshness signals are considered.

## 4. Evidence/Verification Checkpoint

Check:

```txt
Is evidence status tracked?
Is verification result limited to allowed labels?
Is legal_clean forbidden?
Is verifier prevented from changing transaction-critical fields?
```

Required result:

- Evidence records have status, visibility, redaction, and actor.
- Verification outputs confidence, risk notes, and allowed labels only.
- Verifier cannot approve deposits, close legal truth, or alter revenue rules.
- Conflict risk and verifier trust score are tracked where relevant.

## 5. API Marketplace Checkpoint

Check:

```txt
Does endpoint require API key if partner/private?
Are scopes checked?
Is usage logged?
Are response fields shaped by visibility/scope?
```

Required result:

- API keys are hashed at rest and shown only once.
- Partner/private APIs require scopes.
- API usage creates `ApiUsageEvent` records.
- Sensitive evidence and exact private location are excluded unless scope permits.

## 6. Revenue Rights Checkpoint

Check:

```txt
Is data contribution recorded?
Is usage recorded?
Is payout avoided unless policy exists?
Is future royalty eligibility separated from immediate payout?
```

Required result:

- Contribution ledger records creator, updater, verifier, and data source.
- Usage ledger records API, export, report, and partner usage.
- Royalty eligibility is not represented as current payout.
- No complex payout logic ships before policy, fraud, tax, payment, and dispute controls exist.

## 7. AI Safety Checkpoint

Check:

```txt
Is AI action logged?
Is AI bounded to allowed action?
Does AI separate verified facts from self-declared claims?
Does AI avoid legal certainty?
```

Required result:

- Every AI action creates `AiAgentAction`.
- AI access is permission-scoped.
- AI output identifies evidence, uncertainty, and missing data.
- AI does not mark legal finality, transfer money, close deals, or change payout rules.

## 8. Anti-Bypass Checkpoint

Check:

```txt
Does this change protect source owners?
Does it avoid transaction-fee dependency?
Does it avoid leaking sensitive data?
Does it reduce scraping/bypass incentives?
```

Required result:

- Source identity and private contact data are masked by default.
- Deal room creates history and trust, not success-fee dependency.
- API usage is logged, rate-limited, and revocable.
- Data owner contribution is recorded for future rights.

## Final PR Checklist

Use this checklist in every PR or implementation review:

```txt
- [ ] Documentation compliance passed
- [ ] Product alignment passed
- [ ] Permission checks passed
- [ ] Audit logs added
- [ ] Sensitive data protected
- [ ] API scopes checked
- [ ] Trust labels valid
- [ ] No forbidden legal labels
- [ ] Data contribution logged
- [ ] AI action bounded/logged if used
- [ ] Tests/build pass
```

## Acceptance Criteria

- [x] `CHECKPOINT.md` exists.
- [x] It defines all checkpoint categories.
- [x] It includes final PR checklist.
- [x] It prevents product drift and unsafe implementation.
- [x] It requires documentation compliance before every non-trivial change.
