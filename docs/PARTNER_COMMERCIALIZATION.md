# EstateOS Partner Commercialization

## Partner Lifecycle

```txt
interest → application → approval → trial/sandbox → plan selection
→ contract/manual invoice → production API access → usage review → renewal/upgrade
```

## Partner Application

Partners apply via `/partners` with organization info, use case, requested data products, and locations.

Statuses: `draft → submitted → under_review → approved_for_trial | approved_for_production | rejected | suspended`

## Sandbox Access

- Approved partners get sandbox API keys (environment: `sandbox`)
- Sandbox keys return redacted data only
- Keys expire in 30 days
- Sandbox usage is logged separately (via `environment` field on `ApiUsageEvent`)

## Production Access

Requires:
1. Partner application approved for production
2. Required agreements accepted (api_terms, data_visibility_terms, privacy_terms)
3. Plan selection + manual invoice path
4. Production API key issued

## Guardrails

- No sensitive data before approval
- No production key before agreement acceptance
- Sandbox data is separated from production by environment field
- API usage is logged by environment
- Plan/scopes/visibility rules apply to all environments
- Manual invoice required for paid production access (unless free trial plan)

## Communication Templates

### Approval for Trial
Subject: EstateOS Partner — Trial Access Approved
Body: Your application for trial access has been approved. Generate sandbox credentials at /partners/sandbox.

### Rejection
Subject: EstateOS Partner — Application Status
Body: Thank you for your interest. Your application has been reviewed and we are unable to proceed at this time. Review notes: [notes]

### Production Access
Subject: EstateOS Partner — Production Access
Body: Your application has been approved for production. Please accept the required agreements and contact us for plan setup.