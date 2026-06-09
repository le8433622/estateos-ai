# EstateOS Security Launch Checklist

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Default Secrets

- [ ] `MI_JWT_SECRET` changed from `Movinin`
- [ ] `MI_COOKIE_SECRET` changed from `Movinin`
- [ ] Default seed passwords (`EstateOS123`) removed or rotated
- [ ] All SMTP credentials use real production values
- [ ] Stripe/PayPal keys are production (not test), or test keys documented

## Sensitive Evidence

- [ ] Sensitive evidence is `select: false` by default at the model level
- [ ] Public API responses never include unredacted evidence
- [ ] Evidence fields are redacted in ops/admin views (see `redactEvidenceForOps`)
- [ ] No endpoint exposes raw evidence file references in public responses

## Private Location

- [ ] Exact private location is never included in public API responses
- [ ] `buildPublicLocation()` masks `exact_private` precision as `approximate`
- [ ] Partner responses include approximate or district-level location unless explicitly scoped
- [ ] `sensitive_fields_redacted: true` is present in all shaped public responses

## API Keys

- [ ] API keys are hashed at rest using bcrypt or similar
- [ ] API key secrets are shown to the user only once at creation
- [ ] Revoked keys cannot be used for authentication
- [ ] Key revocation is audited
- [ ] Sandbox keys expire in 30 days
- [ ] Sandbox keys access sandbox data only (via `environment` field)

## Admin Endpoints

- [ ] All ops/admin endpoints require `authPermission('admin:moderate')` (server-side, not just UI hiding)
- [ ] Legacy `authJwt.authAdmin` routes still work for Movin' In routes only
- [ ] AI Agent and VerificationOperator cannot log into admin console
- [ ] Admin sensitive views redact evidence and private data

## Partner / Sandbox Separation

- [ ] Partner applications require approval before sandbox access
- [ ] Sandbox keys return redacted data only
- [ ] Production API keys require agreement acceptance
- [ ] Partner status transitions are validated server-side

## Audit Logging

- [ ] Manual invoice status changes are audited
- [ ] Verification report submission is audited
- [ ] API key creation and revocation are audited
- [ ] Admin console reads are audited
- [ ] Property claim creation and evidence upload are audited
- [ ] Audit logs do not leak sensitive evidence or secrets

## AI Actions (if active)

- [ ] Every AI action creates an `AiAgentAction` record
- [ ] AI cannot approve legal status, transfer money, close deals, or change payout rules
- [ ] AI output includes confidence, evidence, and uncertainty

## Field Redaction

- [ ] Public property responses: no exact private location, no owner identity, no sensitive evidence
- [ ] Partner responses: approximate location unless scoped
- [ ] `sensitive_fields_redacted: true` present in all shaped responses

## Forbidden Labels

- [ ] `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, `no_planning_risk`, `risk_free` never appear in any response
- [ ] `containsForbiddenLabel()` is used during verification report submission
- [ ] No new code path emits forbidden labels

## Rate Limiting

- [ ] Public endpoints have basic rate limiting
- [ ] API-key-based endpoints have per-key and per-account limits
- [ ] Webhook endpoints have failure thresholds
- [ ] Suspicious usage patterns can be reviewed via `ApiUsageEvent` logs

## Deployment

- [ ] MongoDB uses auth and SSL in production
- [ ] `node_modules` is not committed
- [ ] `.env` files are not committed
- [ ] CI pipeline includes lint, build, forbidden pattern check, documentation compliance check, and backend compliance tests
- [ ] Pre-commit (`pre-commit.js`) runs all checks locally before allowing commit
- [ ] Documentation compliance gate must be recorded with `Decision: PASS` before any completion claim
- [ ] Production seed endpoint locked (returns 400 if already seeded)
- [ ] Database backups configured (see `docs/BACKUP_ROLLBACK.md`)

## Input Validation

- [ ] Supply property creation rejects empty body (requires title + property_type)
- [ ] API key creation rejects empty body (requires name + scopes)
- [ ] AiAgentAccount blocked from web login (both admin and frontend)
- [ ] Seed endpoint cannot be re-run after first successful seed
