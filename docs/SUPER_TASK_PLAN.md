# EstateOS Network Super Task Plan

## Purpose

This is the master task plan for OpenCode, Codex, and implementation agents. It defines a coherent platform-kernel plan for EstateOS Network.

This is not a small MVP checklist. It is the foundation plan for a large product.

## Required Philosophy

```txt
Repo fork = technical shell
EstateOS Network = new product architecture
```

Implementation must proceed by kernels: doctrine, identity, property data, verification, trust, API, revenue rights, deal room, AI, and UI consoles.

## Phase 0 - Documentation Kernel

Goal:

- Create the product doctrine and implementation contract before deep feature work.

Files likely touched:

- `AGENT.md`
- `RULER.md`
- `CHECKPOINT.md`
- `docs/PRODUCT.md`
- `docs/ACCOUNT_MODEL.md`
- `docs/TRUST_MODEL.md`
- `docs/API_MARKETPLACE.md`
- `docs/REVENUE_RIGHTS.md`
- `docs/AI_AGENT_OS.md`
- `docs/DEAL_ROOM_OS.md`
- `docs/ANTI_BYPASS_RULES.md`
- `docs/IMPLEMENTATION_CONTRACT.md`

Models/entities:

- None implemented yet; all models are specified.

APIs:

- None implemented yet; API contracts are specified.

UI pages:

- None implemented yet; console architecture is specified.

Safety rules:

- Documentation must forbid generic listing drift, legal overclaiming, sensitive evidence leaks, unlogged API usage, unlogged AI actions, and commission-first MVP logic.

Tests/checks:

- Required docs exist.
- Required labels and forbidden labels are documented.
- Cross-document rules are consistent.

Acceptance criteria:

- Documentation kernel exists and can guide implementation without new business clarification.

Rollback notes:

- If doctrine conflicts appear, pause feature work and update docs before code.

## Phase 1 - Identity And Account Kernel

Goal:

- Implement login as economic identity: identity, role, permission, trust, data rights, audit, and possible future revenue rights.

Files likely touched:

- Backend user/account models and services.
- Admin account management UI.
- Auth middleware.
- Permission middleware.
- Seed/migration scripts.

Models/entities:

- `User`
- `Organization`
- `Membership`
- `AccountProfile`
- `PropertyClaimAccount`
- `PropertyDemandAccount`
- `VerificationOperatorAccount`
- `ApiDataBuyerAccount`
- `AgencyDeveloperAccount`
- `PlatformOperatorAccount`
- `AiAgentAccount`
- `Role`
- `Permission`
- `AuditLog`

APIs:

- `POST /api/v1/account-profiles`
- `GET /api/v1/account-profiles/me`
- `PATCH /api/v1/account-profiles/:id`
- `GET /api/v1/permissions/me`
- `GET /api/v1/audit-logs`

UI pages:

- Account profile setup.
- Organization membership management.
- Admin account moderation.
- Permission and audit views.

Safety rules:

- No anonymous sensitive mutations.
- Server-side permission checks are required.
- Account trust must be gradual.

Tests/checks:

- Permission denial tests.
- Audit creation tests.
- Account upgrade/downgrade tests.

Acceptance criteria:

- Every sensitive action can identify an actor and account profile.

Rollback notes:

- If profile migration fails, keep users authenticated but restrict sensitive actions to safe defaults.

## Phase 2 - Property Data OS

Goal:

- Convert generic property records into claim-based, attributable, evidence-aware data assets.

Files likely touched:

- Property models and APIs.
- Evidence storage services.
- Admin and claim console property forms.
- Search indexes.

Models/entities:

- `Property`
- `PropertyClaim`
- `PropertyEvidence`
- `PropertyHistoryEvent`
- `source_account_id`
- `api_visibility`
- `trust_score`
- `risk_score`
- `freshness_score`
- `duplicate_risk_score`

APIs:

- `POST /api/v1/properties/claims`
- `PATCH /api/v1/properties/:id`
- `POST /api/v1/properties/:id/evidence`
- `GET /api/v1/properties/:id/history`
- `GET /api/v1/properties/:id/trust-state`

UI pages:

- Claim console.
- Evidence upload.
- Property history.
- Trust-state badge and field source view.

Safety rules:

- No property without `source_account_id`.
- Sensitive fields are private by default.
- Important field changes create history events.

Tests/checks:

- Source attribution tests.
- Visibility shaping tests.
- Evidence upload audit tests.

Acceptance criteria:

- Properties are claim-based and ready for trust scoring, API usage, and contribution tracking.

Rollback notes:

- If new trust fields fail, keep legacy property display but block partner API visibility.

## Phase 3 - Verification And Trust OS

Goal:

- Implement verification workflows and cautious trust-state generation.

Files likely touched:

- Verification job services.
- Trust-state generator.
- Risk flag services.
- Verification console UI.

Models/entities:

- `VerificationJob`
- `VerificationReport`
- `RiskFlag`
- TrustState generator.
- Allowed verification labels.
- Forbidden legal labels.

APIs:

- `POST /api/v1/verification-jobs`
- `GET /api/v1/verification-jobs`
- `PATCH /api/v1/verification-jobs/:id`
- `POST /api/v1/verification-reports`
- `GET /api/v1/properties/:id/risk-flags`

UI pages:

- Verification queue.
- Verification report form.
- Risk flag review.
- Trust-state explanation panel.

Safety rules:

- No `legal_clean` or equivalent labels.
- Verifier cannot change transaction-critical fields by default.
- Verifier conflict risk is tracked.

Tests/checks:

- Forbidden-label tests.
- Trust-state generation tests.
- Verifier permission tests.

Acceptance criteria:

- Trust state exposes confidence, evidence, risk, and missing data without legal overclaiming.

Rollback notes:

- If trust generation fails, keep property in `self_declared` or `evidence_attached` state and avoid partner visibility increases.

## Phase 4 - API Marketplace OS

Goal:

- Turn EstateOS data into controlled API products for developers, agencies, banks, AI apps, and data buyers.

Files likely touched:

- API key services.
- API scope middleware.
- API usage logging.
- Billing plan services.
- Developer portal.

Models/entities:

- `ApiDataBuyerAccount`
- `ApiKey`
- `ApiUsageEvent`
- `ApiPlan`
- `ApiScope`
- `WebhookEndpoint`
- Developer portal docs.

APIs:

- `GET /api/v1/properties`
- `GET /api/v1/properties/:id`
- `GET /api/v1/properties/search`
- `GET /api/v1/properties/nearby`
- `GET /api/v1/properties/:id/trust-state`
- `GET /api/v1/properties/:id/history`
- `POST /api/v1/partner/properties`
- `PATCH /api/v1/partner/properties/:id`
- `POST /api/v1/partner/properties/:id/evidence`
- `POST /api/v1/api-keys`
- `GET /api/v1/api-usage`
- `POST /api/v1/webhooks`

UI pages:

- Developer portal.
- API key dashboard.
- Usage dashboard.
- Billing.
- Playground.
- Webhook manager.

Safety rules:

- API keys are hashed at rest.
- Partner/private endpoints require scopes.
- Every API call is logged.
- Response fields are shaped by plan and scope.

Tests/checks:

- Scope enforcement tests.
- Usage logging tests.
- Rate-limit tests.
- Response shaping tests.

Acceptance criteria:

- API access is controlled, observable, revocable, and billable.

Rollback notes:

- If abuse detection fails, disable partner/private scopes and keep public endpoints only.

## Phase 5 - Revenue Rights OS

Goal:

- Record ownership, contribution, usage, billing, and future royalty eligibility without overbuilding payout.

Files likely touched:

- Ledger models and services.
- Billing plan services.
- Invoice/payment screens.
- API usage integration.

Models/entities:

- `DataContributionLedger`
- `DataUsageLedger`
- `RoyaltyEligibility`
- `BillingPlan`
- `PaymentRecord`
- `ApiUsageEvent`
- `ManualInvoice`

APIs:

- `GET /api/v1/contribution-ledger`
- `GET /api/v1/usage-ledger`
- `GET /api/v1/billing-plans`
- `POST /api/v1/manual-invoices`
- `GET /api/v1/payments`

UI pages:

- Contribution ledger view.
- Usage ledger view.
- Billing plan admin.
- Manual invoice admin.

Safety rules:

- Do not implement complex payout early.
- Royalty eligibility is not immediate payout.
- Fraud, tax, payment, and dispute policy are required before payout.

Tests/checks:

- Contribution recording tests.
- Usage recording tests.
- No-payout-without-policy tests.

Acceptance criteria:

- Ownership and usage are recorded from day one.

Rollback notes:

- If billing fails, continue recording ledgers and disable charge attempts.

## Phase 6 - Demand And Deal Room OS

Goal:

- Implement structured demand and scoped transaction workspaces.

Files likely touched:

- Demand profile services.
- Lead intent services.
- Deal room services.
- Messaging/event UI.
- Evidence request workflows.

Models/entities:

- `DemandProfile`
- `LeadIntent`
- `DealRoom`
- `DealRoomEvent`
- `EvidenceRequest`
- `OfferNote`
- AI summary.

APIs:

- `POST /api/v1/demand-profiles`
- `GET /api/v1/demand-profiles/me`
- `POST /api/v1/deal-rooms`
- `GET /api/v1/deal-rooms/:id`
- `POST /api/v1/deal-rooms/:id/events`
- `POST /api/v1/deal-rooms/:id/evidence-requests`

UI pages:

- Demand console.
- Property match view.
- Deal room timeline.
- Evidence request panel.
- Risk summary panel.

Safety rules:

- Deal room is not dependent on transaction commission.
- Participants see only scoped data.
- Owner identity is not revealed by default.
- AI does not close deals.

Tests/checks:

- Deal-room permission tests.
- Event audit tests.
- Redaction tests.

Acceptance criteria:

- Deal room creates trust, context, and audit history without unsafe disclosure.

Rollback notes:

- If deal-room visibility fails, close private access and keep public property view only.

## Phase 7 - AI Agent OS

Goal:

- Implement bounded AI agents as an operating layer, not an uncontrolled decision maker.

Files likely touched:

- AI agent service layer.
- Prompt/output contracts.
- Audit and approval flows.
- AI summary UI.

Models/entities:

- `AiAgentAction`
- `property_normalizer`
- `duplicate_detector`
- `evidence_classifier`
- `risk_summarizer`
- `buyer_matcher`
- `verification_assistant`
- `deal_room_summarizer`
- `data_quality_auditor`

APIs:

- `POST /api/v1/ai/actions`
- `GET /api/v1/ai/actions/:id`
- `POST /api/v1/ai/actions/:id/approve`

UI pages:

- AI action log.
- AI summary review.
- Data quality audit view.
- Verification assistant panel.

Safety rules:

- AI cannot approve legal status, transfer money, close deals, reveal private evidence, or change payout rules.
- AI output separates verified facts from self-declared claims.
- Every action is logged.

Tests/checks:

- AI permission tests.
- AI audit tests.
- Forbidden action tests.
- Output contract tests.

Acceptance criteria:

- AI actions are bounded, logged, explainable, and safe for human review.

Rollback notes:

- If AI behavior is unsafe, disable state-changing AI actions and keep read-only summaries behind admin review.

## Phase 8 - UI Consoles

Goal:

- Build role-based surfaces for operating EstateOS.

Files likely touched:

- Admin frontend.
- Public frontend.
- Mobile app.
- Developer portal.
- Shared UI packages.

Models/entities:

- UI reads from account, property, trust, API, revenue, deal-room, and AI kernels.

APIs:

- All stable APIs from phases 1-7.

UI pages:

- EstateOS Command Center.
- Claim Console.
- Demand Console.
- Verification Console.
- API Buyer Console.
- Platform Admin Console.
- Developer Portal.

Safety rules:

- UI must not reveal data that API/backend denies.
- Trust labels must be cautious and explainable.
- Sensitive evidence must remain redacted by default.
- AI output must show confidence and limits.

Tests/checks:

- Permission-aware UI tests.
- Mobile and desktop layout checks.
- Sensitive data leak checks.
- Trust label snapshot checks.

Acceptance criteria:

- Each account profile has an appropriate operating console.

Rollback notes:

- If a console has visibility risk, disable the risky panel and keep backend restrictions active.

## Global Acceptance Criteria

- [x] `docs/SUPER_TASK_PLAN.md` exists.
- [x] It gives one coherent implementation plan.
- [x] It avoids tiny disconnected task thinking.
- [x] It includes phases 0-8.
- [x] It includes model/API/UI/checkpoint requirements.
