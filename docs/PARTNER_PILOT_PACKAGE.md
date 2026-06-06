# EstateOS Partner Pilot Package

## What EstateOS Offers Partners

EstateOS provides API-grade structured property data for Vietnam's real estate market. Our data is claim-based, attributed, scored by quality, and verified through human operator checks.

## Available Data Products

| Product | Description | Required Plan |
|---------|-------------|---------------|
| Public Listing Feed | Basic public property listings | Free Developer |
| API-Grade Property Feed | High-quality properties (quality ≥ high) | Pro |
| Verified Location Feed | Properties with verified location | Starter |
| Fresh Inventory Feed | Recently updated properties | Starter |
| Duplicate-Filtered Feed | Clean portfolio display | Pro |
| Market Signal Snapshot | Aggregated market analytics | Agency |
| Trust State Feed | Full trust + verification context | Agency |

## Sandbox Limits

- 30-day sandbox key expiry
- Redacted data (approximate location, no sensitive evidence)
- Limited to 100 API calls/day
- All plan scopes are available for testing

## Trust Label Explanation

EstateOS uses cautious labels only:

| Label | Meaning |
|-------|---------|
| `self_declared` | Source owner declared the information |
| `evidence_attached` | Evidence file(s) uploaded |
| `verified_photo` | Photo checked by verification operator |
| `verified_location` | Location confirmed |
| `verified_contact` | Contact information confirmed |
| `availability_checked` | Property availability confirmed |
| `operator_checked` | Platform operator reviewed |
| `authorized_source` | Source is an authorized data owner |
| `legal_not_verified` | Legal status is not verified |

> EstateOS never returns `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, `no_planning_risk`, or `risk_free`.

## Redaction Policy

- Exact private location is masked in all public/partner feeds
- Sensitive evidence is never included in API responses
- Owner identity is not publicly exposed
- Contact information requires scoped access
- All responses include `sensitive_fields_redacted: true`

## Pricing Preview

| Plan | Price | Daily Limit |
|------|-------|-------------|
| Free Developer | 0 VND/month | 100 calls/day |
| Starter | 1M VND/month | 1,000 calls/day |
| Pro | 5M VND/month | 5,000 calls/day |
| Agency / Data Pro | 15M VND/month | 20,000 calls/day |
| Enterprise | Custom | Custom |

## Manual Invoice Path

Paid plans are available via manual invoice:

1. Select plan
2. Admin issues invoice
3. Pay via bank transfer or arranged method
4. Invoice marked paid → plan activated
5. Production API key issued

## Support / Contact

For pilot access: contact your EstateOS representative or apply at `/partners`.

## Pilot Success Criteria

| Metric | Target |
|--------|--------|
| Properties in platform | 100–500 |
| API-grade properties | 20–50 |
| Source owners | 10–30 |
| Sandbox partners | 3–5 |
| Verification packages | 10 paid/test |
| API calls (pilot) | 1,000+ |

## Legal Notes

- EstateOS does not provide legal certainty, ownership guarantees, or investment advice.
- All property data is claim-based and verified at limited confidence levels.
- Partners must not represent EstateOS data as legally guaranteed.
- Manual invoices are used for pilot billing; no automated payment processing.