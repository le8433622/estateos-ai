# EstateOS Pilot QA Checklist

> **URLs (internal pilot):** Backend `https://estateos-backend-api.onrender.com`, Frontend `https://estateos-frontend.onrender.com`, Admin `https://estateos-admin.onrender.com`. Custom domains (`estateos.vn`) are optional for internal pilot — required only before public partner launch.

## Supply Flow

- [ ] Source owner can log in
- [ ] Supply profile activates
- [ ] New property claim created with required fields
- [ ] Property appears in supply dashboard
- [ ] Evidence can be attached (photo, location, contact proof, etc.)
- [ ] Evidence appears in property detail

## Billing Flow

- [ ] Billing plans are seeded (Free Developer, Starter, Pro, Agency, Enterprise)
- [ ] Verification package plans are seeded (basic_cleanup, verified_photo_contact_location, field_check)
- [ ] User can request verification package (API)
- [ ] Invoice is created with "issued" status
- [ ] Admin can view invoices in Billing console
- [ ] Admin can mark invoice "paid"
- [ ] Verification job is auto-created when invoice marked paid

## Verification Flow

- [ ] Verifier can log in
- [ ] Verifier profile activates
- [ ] Verification jobs visible in Verifier dashboard
- [ ] Verification reports visible in Verifier dashboard

## Quality Flow

- [ ] Property quality score computed
- [ ] Quality level correctly assigned (low/medium/high/api_grade)
- [ ] Missing fields listed
- [ ] Recommended next actions generated
- [ ] Duplicate candidates detected when similar properties exist
- [ ] Freshness score computed correctly
- [ ] Quality refresh works for individual and batch
- [ ] Market signals dashboard shows correct distribution

## Data Product Flow

- [ ] 7 data products listed in catalog
- [ ] Preview returns matching properties
- [ ] Export returns full data (respects plan/scope limits)
- [ ] Feed pagination works (since, page, limit)
- [ ] Sensitive data is redacted in all responses
- [ ] Forbidden labels never appear in any data product response

## Partner Application Flow

- [ ] Partner can submit application
- [ ] Application status is "submitted"
- [ ] Admin can view application
- [ ] Admin can approve for trial
- [ ] Admin can approve for production
- [ ] Admin can reject with notes
- [ ] Partner can view application status
- [ ] Status transitions are validated (no invalid transitions)

## Sandbox Key Flow

- [ ] Approved partner can generate sandbox key
- [ ] Sandbox key has environment "sandbox"
- [ ] Sandbox key expires in 30 days
- [ ] Sandbox key returns redacted data only

## Agreement Flow

- [ ] Partner can accept API terms
- [ ] Partner can accept data visibility terms
- [ ] Partner can accept privacy terms
- [ ] Agreements recorded in database

## API Usage Logging

- [ ] Every API call creates ApiUsageEvent
- [ ] Usage includes endpoint, scopes_used, fields_accessed, usage_units
- [ ] Sandbox usage is logged with environment context

## Admin Dashboards

- [ ] EstateOS Command Center shows counts
- [ ] Data Quality dashboard shows market signals
- [ ] Distribution console shows analytics
- [ ] Partners console shows pipeline metrics
- [ ] Pilot dashboard shows success metrics
- [ ] Billing console shows invoices and subscriptions

## Field Redaction Check

- [ ] Public property responses never include exact private location
- [ ] Public responses never include owner identity
- [ ] Public responses never include sensitive evidence
- [ ] Partner responses include approximate location only unless scoped
- [ ] `sensitive_fields_redacted: true` is present in all shaped responses

## Forbidden Label Check

Verify these labels NEVER appear in any response:

- [ ] `legal_clean`
- [ ] `safe_to_buy`
- [ ] `guaranteed_ownership`
- [ ] `no_planning_risk`
- [ ] `risk_free`

Allowed labels that SHOULD appear:

- [ ] `self_declared`
- [ ] `evidence_attached`
- [ ] `verified_photo`
- [ ] `verified_location`
- [ ] `verified_contact`
- [ ] `availability_checked`
- [ ] `operator_checked`
- [ ] `authorized_source`
- [ ] `legal_not_verified`

## Security Checks

- [ ] No secrets/keys committed in code
- [ ] API keys hashed at rest
- [ ] Passwords hashed
- [ ] Sensitive evidence select: false by default
- [ ] Admin pages require authentication
- [ ] Activation pages require authentication