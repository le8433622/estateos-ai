# Documentation Compliance Contract

## Documentation Compliance Notice

This document is the governing source for repository documentation compliance. Any implementation, change, deployment, or completion claim touching this document must preserve a mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Mandatory Status

This file is a non-optional implementation gate for every AI agent, human contributor, automation script, and release process working in this repository.

If any change conflicts with this file, `RULER.md`, `CHECKPOINT.md`, `AGENT.md`, `AGENTS.md`, or `docs/IMPLEMENTATION_CONTRACT.md`, the change is not compliant and must stop.

## Compliance Scope

This contract applies to every repository artifact:

- Backend, frontend, admin, mobile, packages, scripts, CI, deployment, data models, seed data, tests, and documentation.
- Product copy, API responses, AI outputs, verification reports, audit summaries, partner materials, and operator workflows.
- New files, edited files, migrations, generated code, configuration, and operational runbooks.

## Required Source Documents

Before changing code, docs, configuration, seed data, tests, deployment settings, or release procedures, the actor must review and apply:

```txt
RULER.md
CHECKPOINT.md
AGENT.md
AGENTS.md
docs/IMPLEMENTATION_CONTRACT.md
docs/DOCUMENTATION_COMPLIANCE.md
```

The actor must also review every domain document relevant to the affected area, including but not limited to:

```txt
docs/ACCOUNT_MODEL.md
docs/TRUST_MODEL.md
docs/API_MARKETPLACE.md
docs/AI_AGENT_OS.md
docs/DEAL_ROOM_OS.md
docs/REVENUE_RIGHTS.md
docs/ANTI_BYPASS_RULES.md
docs/SECURITY_LAUNCH_CHECKLIST.md
docs/CI_EXPECTATIONS.md
docs/DEPLOYMENT_PILOT.md
docs/PILOT_RUNBOOK.md
docs/PILOT_QA_CHECKLIST.md
```

## 100% Compliance Definition

"100% compliant" means all applicable rules are explicitly satisfied. It does not mean "mostly aligned" or "tests passed".

For every affected change, each relevant rule must be marked:

```txt
PASS - implemented and verified
N/A - not applicable, with a short reason
STOP - blocked, unclear, conflicting, unsafe, or not yet verified
```

Rules:

- No unchecked rule may be silently skipped.
- No `STOP` item may ship, merge, deploy, or be described as complete.
- If two documents conflict, the stricter EstateOS safety, privacy, audit, permission, anti-bypass, or legal-risk rule wins.
- If the stricter rule is unclear, stop and ask for clarification before changing behavior.
- Passing tests does not override documentation compliance.
- Product speed, demo pressure, or convenience does not override documentation compliance.

## Mandatory Checkpoints

Every non-trivial change must pass these checkpoints:

### 1. Pre-Implementation Checkpoint

Before editing files, identify:

- The affected EstateOS kernel.
- The source documents reviewed.
- The actor/account profile impacted.
- The sensitive data, trust, evidence, API, AI, audit, revenue-rights, and anti-bypass surfaces impacted.
- Any rule that is unclear or conflicting.

If the impacted documents are not known, stop and inspect the repository before editing.

### 2. Implementation Checkpoint

While editing, enforce:

- Server-side authorization, not UI-only hiding.
- Audit logging for sensitive actions.
- Field-level visibility for sensitive data.
- Allowed trust and legal labels only.
- Claim-based property state until verification supports higher confidence.
- API scopes, usage logging, and rate/abuse controls where relevant.
- AI action boundaries and logs where relevant.
- Contribution/usage ledgers where relevant.

### 3. Pre-Commit Checkpoint

Before commit or handoff:

- Run relevant lint, typecheck, tests, smoke checks, or document why not run.
- Run forbidden-label checks where available.
- Confirm no sensitive secrets or private evidence are committed.
- Confirm docs were updated if rules, flows, permissions, data contracts, or operational procedures changed.

### 4. Pre-Deploy Checkpoint

Before deploy:

- Confirm production env and seed safety rules.
- Confirm API visibility and sensitive data masking.
- Confirm rollback/backup considerations for risky changes.
- Confirm pilot constraints remain intact.

### 5. Completion Checkpoint

Before saying work is done, provide or record this summary:

```txt
Documentation Compliance Checkpoint
- Files reviewed:
- Files changed:
- Kernels affected:
- Product alignment: PASS/N/A/STOP
- Permission model: PASS/N/A/STOP
- Audit logging: PASS/N/A/STOP
- Sensitive data protection: PASS/N/A/STOP
- Trust/legal label safety: PASS/N/A/STOP
- API scope/usage logging: PASS/N/A/STOP
- AI boundaries: PASS/N/A/STOP
- Revenue rights/contribution: PASS/N/A/STOP
- Anti-bypass risk: PASS/N/A/STOP
- Tests/build/docs verification: PASS/N/A/STOP
- Decision: PASS/STOP
```

## Non-Negotiable Stop Conditions

Stop immediately and ask for direction if a change would:

- Introduce legal certainty, legal guarantee, or unsafe-buy implications.
- Expose owner identity, private contact data, exact private location, legal documents, ID cards, contracts, bank details, or unredacted evidence publicly.
- Allow AI to approve legal status, close deals, transfer money, reveal private evidence, or change payout rules.
- Allow verifier or operator actions without actor identity and audit trail.
- Allow partner/private API data without scopes and usage logging.
- Implement transaction-success-fee dependency as the primary MVP business model.
- Add payout splitting before policy, fraud, tax, dispute, and payment controls exist.
- Bypass account profiles or server-side permissions.
- Conflict with `RULER.md`, `CHECKPOINT.md`, or `docs/IMPLEMENTATION_CONTRACT.md`.

## Required Language For Completion

Agents must not claim "done", "complete", "ready", "deployed", or "verified" unless the Completion Checkpoint decision is `PASS` or the remaining gaps are explicitly listed as blockers.

## Acceptance Criteria

- [x] This contract defines 100% documentation compliance.
- [x] It requires checkpointing before implementation, commit, deploy, and completion.
- [x] It defines PASS/N/A/STOP semantics.
- [x] It makes stricter rules win when documents conflict.
- [x] It prevents silent skipping of relevant EstateOS rules.
