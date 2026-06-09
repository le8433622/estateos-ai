# EstateOS Security Launch Checklist

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Default Secrets

- [x] `MI_JWT_SECRET` changed from `Movinin` — confirmed via `/health` endpoint
- [x] `MI_COOKIE_SECRET` changed from `Movinin` — confirmed via `/health` endpoint
- [ ] Default seed passwords (`EstateOS123`) removed or rotated — need to check seed users
- [x] All SMTP credentials use real production values (Gmail app password)
- [ ] Stripe/PayPal keys are production (not test), or test keys documented — N/A (MVP no payments)

## Sensitive Evidence

- [x] Sensitive evidence is `select: false` by default at the model level (`PropertyEvidence.file_ref` + `metadata`)
- [x] Public API responses never include unredacted evidence
- [x] Evidence fields are redacted in ops/admin views (see `redactEvidenceForOps`)
- [x] No endpoint exposes raw evidence file references in public responses

## Private Location

- [x] Exact private location is never included in public API responses
- [x] `buildPublicLocation()` masks `exact_private` precision as `approximate`
- [ ] Partner responses include approximate or district-level location unless explicitly scoped — N/A (partner API not launched)
- [x] `sensitive_fields_redacted: true` is present in all shaped public responses

## API Keys

- [x] API keys are hashed at rest using bcrypt (hash_algo field, upgrade-on-use from SHA-256)
- [x] API key secrets are shown to the user only once at creation
- [x] Revoked keys cannot be used for authentication
- [x] Key revocation is audited
- [ ] Sandbox keys expire in 30 days — N/A (sandbox not yet launched)
- [ ] Sandbox keys access sandbox data only (via `environment` field) — N/A (sandbox not yet launched)

## Admin Endpoints

- [x] All ops/admin endpoints require `authPermission('admin:moderate')` — confirmed via QA matrix (65/65)
- [x] Legacy `authJwt.authAdmin` routes still work for Movin' In routes only — confirmed via QA
- [x] AI Agent and VerificationOperator cannot log into admin console — confirmed via QA (returns 204)
- [x] Admin sensitive views redact evidence and private data

## Partner / Sandbox Separation

- [ ] Partner applications require approval before sandbox access — N/A (pilot scale)
- [ ] Sandbox keys return redacted data only — N/A (sandbox not yet launched)
- [ ] Production API keys require agreement acceptance — N/A (pilot scale)
- [ ] Partner status transitions are validated server-side — verified via QA

## Audit Logging

- [x] Manual invoice status changes are audited (via `auditOpsRead`)
- [x] Verification report submission is audited (via `createAuditLog`)
- [x] API key creation and revocation are audited
- [x] Admin console reads are audited (via `auditOpsRead` on every ops endpoint)
- [x] Property claim creation and evidence upload are audited
- [x] Audit logs do not leak sensitive evidence or secrets

## AI Actions (if active)

- [ ] Every AI action creates an `AiAgentAction` record — N/A (AI Agent not active in MVP)
- [x] AI cannot approve legal status, transfer money, close deals, or change payout rules — enforced via `DEFAULT_PROFILE_ALLOWED_ACTIONS['AiAgentAccount']`
- [ ] AI output includes confidence, evidence, and uncertainty — N/A (AI Agent not active)

## Field Redaction

- [x] Public property responses: no exact private location, no owner identity, no sensitive evidence
- [ ] Partner responses: approximate location unless scoped — N/A (partner API not launched)
- [x] `sensitive_fields_redacted: true` present in all shaped responses

## Forbidden Labels

- [x] `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, `no_planning_risk`, `risk_free` never appear in any response — confirmed via CI check + QA
- [x] `containsForbiddenLabel()` is used during verification report submission
- [x] No new code path emits forbidden labels — enforced by `scripts/checkForbiddenPatterns.js` in pre-commit + CI

## Rate Limiting

- [x] Public endpoints have basic rate limiting (via `rateLimit.ts` middleware)
- [ ] API-key-based endpoints have per-key and per-account limits — pending implementation
- [ ] Webhook endpoints have failure thresholds — N/A (webhooks not launched)
- [x] Suspicious usage patterns can be reviewed via `ApiUsageEvent` logs

## Deployment

- [x] MongoDB uses auth and SSL in production (Atlas TLS enforced)
- [x] `node_modules` is not committed (in `.gitignore`)
- [x] `.env` files are not committed (added to `.gitignore`)
- [x] CI pipeline includes lint, build, forbidden pattern check, documentation compliance check, and backend compliance tests
- [x] Pre-commit (`pre-commit.js`) runs all checks locally before allowing commit
- [x] Documentation compliance gate must be recorded with `Decision: PASS` before any completion claim
- [x] Production seed endpoint locked (returns 400 if already seeded) — confirmed via QA
- [ ] Database backups configured (see `docs/BACKUP_ROLLBACK.md`) — needs drill

## Input Validation

- [x] Supply property creation rejects empty body (requires title + property_type) — confirmed via QA
- [x] API key creation rejects empty body (requires name + scopes) — confirmed via QA
- [x] AiAgentAccount blocked from web login (both admin and frontend) — confirmed via QA
- [x] Seed endpoint cannot be re-run after first successful seed — confirmed via QA

## Last Verified

- Deployment commit: `38da0d5` (feat: admin cleanup tools)
- Health check: ✅ All 11 checks pass
- QA matrix: 65/65 passed
- DB cleanup: 0 remaining QA artifacts
- MongoDB password: ⚠️ PENDING ROTATION
