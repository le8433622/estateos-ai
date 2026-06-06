# EstateOS Pilot — Vinh / Cửa Lò / Nghệ An

## Pilot Scope

- **Area:** Vinh, Cửa Lò, Ngệ An
- **Property target:** 100–500 records
- **API-grade target:** 20–50 records
- **Source owner target:** 10–30 accounts
- **Partner target:** 3–5 sandbox partners
- **Verification package target:** 10 paid/manual test packages

## Pilot Roles

| Role | Account | Purpose |
|------|---------|---------|
| Platform Operator | operator@estateos.test | Review, moderate, issue invoices |
| Property Claim Source | claim-source-1@estateos.test | Submit property claims and evidence |
| Verification Operator | verifier-1@estateos.test | Accept and complete verification jobs |
| API Data Buyer | api-buyer-1@estateos.test | Test API keys, data products |
| Demand User | demand-1@estateos.test | Express property interest |
| Partner Applicant | New signup via /partners | Test partner flow |

## Success Criteria

1. Source owners can submit property data → at least 20 properties in pilot area
2. Evidence can be uploaded → at least 10 evidence items
3. Verification packages can be requested and processed → at least 3 jobs completed
4. Property quality improves after verification → at least 3 properties reach "high" quality
5. API/data buyers can apply, enter sandbox, use data products → at least 1 sandbox key generated
6. Manual invoice flow works → at least 1 invoice issued and marked paid
7. Admin can observe everything end-to-end via dashboards

## Getting Started

1. Run `npm run seed:estateos`
2. Start backend: `backend> npm run start`
3. Start admin: `admin> npm run start`
4. Start frontend: `frontend> npm run start`
5. Follow PILOT_RUNBOOK.md for end-to-end demo

## Pilot Data

Seeded data covers Ngệ An region with 20 estateOS properties, evidence, verification reports, API usage events, and billing plans. See SEED_DEMO.md for full seed details.