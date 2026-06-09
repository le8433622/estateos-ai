# EstateOS Super Task Plan — Next Steps (Pilot Launch)

> **Status:** Auth fixed ✅ | Backend ready ✅ | Frontend core flows exist ✅ | Admin core flows exist ✅
>
> **Next:** Close remaining pilot gaps → Run pilot → Launch

## Phase A — Pilot Hardening (now → 1–2 days)

### A1. Authentication & UX Polish

| # | Task | Files | Priority |
|---|------|-------|----------|
| A1.1 | ✅ SameSite=None cookie fix | `userController.ts` | Done |
| A1.2 | ✅ HashRouter sign-in button fix | `Header.tsx`, `Checkout.tsx` | Done |
| A1.3 | Verify login + route persistence e2e | Manual test on Render | High |
| A1.4 | Add Launch Dashboard to admin side nav | `admin/src/components/Header.tsx` | Medium |
| A1.5 | Remove/orphan Movin' In rental pages from nav (Home, Search, Bookings, Agencies, Locations) — replace with EstateOS home | `frontend/src/App.tsx`, `Header.tsx` | Medium |

### A2. Missing Pilot UI Screens

| # | Task | Files | Priority |
|---|------|-------|----------|
| A2.1 | Add "Request Verification Package" button on supply property detail page (`/supply/:id`) — calls `POST /api/v1/billing/verification-packages` | `ActivationSupplyDetail.tsx`, `EstateOSActivationService.ts` | High |
| A2.2 | Add structured **Property Claim Review** page in admin — approve/reject claims, view evidence | `admin/src/pages/`, `estateosRoutes.ts` (ops-property-claims) | High |
| A2.3 | Add **Evidence Review** page in admin — view evidence, flag issues | `admin/src/pages/`, `estateosController.ts` | High |
| A2.4 | Add **Supply Review Queue** in admin — list submitted properties pending review | `admin/src/pages/` | Medium |

### A3. Infrastructure

| # | Task | Files | Priority |
|---|------|-------|----------|
| A3.1 | Replace `/tmp/cdn/...` with R2 or S3 object storage for evidence + avatar uploads | `backend/src/controllers/`, `env.config.ts` | High (before public access) |
| A3.2 | Run production seed on Render | `npm run seed:estateos` via Render shell | High |
| A3.3 | Forbidden-label CI check in deploy pipeline | `.github/workflows/` or pre-commit | Medium |
| A3.4 | Register `estateos.vn` + configure Render custom domains | Render dashboard + DNS | Medium (needed before public partner launch) |

## Phase B — Pilot Execution (2–3 days)

### B1. End-to-End Pilot Run

Walk PILOT_RUNBOOK.md (15 steps) on production Render URLs:

| Step | Action | Verification |
|------|--------|-------------|
| B1.1 | Seed production database | Verify all collections populated |
| B1.2 | Login as operator (`admin.estateos...`) | Dashboard loads with data |
| B1.3 | Login as source, create property claim | Property appears in supply dashboard |
| B1.4 | Attach evidence | Evidence appears in property detail |
| B1.5 | Request verification package | Invoice created |
| B1.6 | Admin marks invoice paid | Verification job auto-created |
| B1.7 | Login as verifier | Jobs visible in verifier dashboard |
| B1.8 | Refresh quality | Scores updated |
| B1.9 | Check data products | 7 products listed, preview works |
| B1.10 | Partner applies, admin approves | Sandbox key generated |
| B1.11 | API call with sandbox key | Redacted data returned |
| B1.12 | Admin reviews all dashboards | All metrics show data |

### B2. QA Checklist

Run PILOT_QA_CHECKLIST.md (128 items):

| Category | # Items | Coverage |
|----------|---------|----------|
| Supply Flow | 6 | ✅ Backend ready, frontend exists |
| Billing Flow | 7 | ✅ Backend ready, admin exists |
| Verification Flow | 5 | ✅ Backend ready, frontend exists |
| Quality Flow | 9 | ✅ Backend ready, admin exists |
| Data Product Flow | 6 | ✅ Backend ready, frontend exists |
| Partner Application Flow | 8 | ✅ Backend ready, both UIs exist |
| Sandbox Key Flow | 4 | ✅ Backend ready, frontend exists |
| Agreement Flow | 4 | ✅ Backend ready, frontend exists |
| API Usage Logging | 3 | ✅ Backend ready |
| Admin Dashboards | 8 | ✅ 6/7 dashboards built |
| Field Redaction Check | 5 | ✅ Backend enforced |
| Forbidden Labels | 5 | ✅ Never appear |
| Allowed Labels | 9 | ✅ Present in responses |
| Security Checks | 7 | ✅ Passwords hashed, API keys hashed |

### B3. Live Demo with Pilot Partners

| # | Task | Details |
|---|------|---------|
| B3.1 | Create real pilot accounts (Vinh / Cửa Lò / Nghệ An source owners) | Via admin UI or seed |
| B3.2 | Onboard 10–30 source owners | Submit 100–500 property records |
| B3.3 | Generate 10+ evidence items | Photo, location, contact proof |
| B3.4 | Process 10+ verification packages | Manual/test packages |
| B3.5 | Issue sandbox keys to 3–5 partners | Test data product API consumption |

## Phase C — Post-Pilot Production Gate (3–5 days)

### C1. Security & Compliance

| # | Task | Priority |
|---|------|----------|
| C1.1 | Rotate all default passwords | Critical |
| C1.2 | Enable MongoDB auth + SSL in production | Critical |
| C1.3 | Set `ES_BLOCK_PRODUCTION_SEED=true` | Critical |
| C1.4 | Add rate limiting to public API endpoints | High |
| C1.5 | Add request validation middleware | High |
| C1.6 | Run SECURITY_LAUNCH_CHECKLIST.md | High |

### C2. Custom Domain & SSL

| # | Task | Details |
|---|------|---------|
| C2.1 | Buy `estateos.vn` domain | Or use existing |
| C2.2 | Configure DNS (Render points to CNAME) | `app.estateos.vn`, `api.estateos.vn`, `admin.estateos.vn` |
| C2.3 | Update backend `FRONTEND_HOST`, `ADMIN_HOST` env vars | SameSite=Lax works natively on same registrable domain |
| C2.4 | Update frontend `VITE_MI_API_HOST` | Point to `api.estateos.vn` |
| C2.5 | Test full flow on custom domain | Sign-in, validate, data products, partners |

### C3. Monitoring & Observability

| # | Task | Details |
|---|------|---------|
| C3.1 | Add structured logging (JSON format) | Backend middleware |
| C3.2 | Set up uptime monitoring | Render health check + external (e.g., UptimeRobot) |
| C3.3 | Add API error tracking | Sentry or similar |
| C3.4 | Set up daily DB backup | MongoDB Atlas backup |

### C4. Documentation

| # | Task | Details |
|---|------|---------|
| C4.1 | Update AGENTS.md with pilot results | Lessons learned, configuration |
| C4.2 | Draft partner onboarding guide | For sandbox partners |
| C4.3 | Draft data contribution guide | For source owners |
| C4.4 | Document API scope reference | Auto-generated from `apiScopes` constant |

## Phase D — Post-Launch Kernels (next 1–2 weeks)

| Kernel | What to build | Priority |
|--------|--------------|----------|
| **Deal Room** | Model + routes + controller + frontend pages | Medium |
| **AI Agent OS** | AI action logging, bounded agents (normalizer, duplicate detector, risk summarizer) | Medium |
| **Revenue Rights** | Contribution ledger UI, usage ledger UI, royalty eligibility display | Low |
| **Webhook Mgmt** | Webhook CRUD UI in frontend API buyer page | Low |
| **Evidence Review** | Structured evidence review workflow for verifiers + admin | Medium |
| **Trust/Risk UI** | Dedicated trust score / risk flag management | Low |

## Current Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| ✅ Login (SameSite) | Was blocking all pilot testing | Fixed |
| ✅ Hash routing (sign-in button) | Was breaking navigation | Fixed |
| `/tmp/cdn` storage | Blocking real evidence upload in production | Needs R2/S3 migration |
| `onrender.com` PSL issue | SameSite=Lax incompatible; SameSite=None works but needs audit | Fixed with SameSite=None; custom domain later eliminates this |

## Key Metrics

- **Smoke tests:** 11/11 passing
- **Backend API health:** ✅
- **Frontend sign-in:** ✅ (verified SameSite=None)
- **Admin login:** ✅
- **PILOT_RUNBOOK coverage:** 15/15 steps have backend support, 13/15 have UI
- **PILOT_QA_CHECKLIST coverage:** ~90% (128 items)
- **Missing UIs:** Verification package request button, Evidence Review admin, Property Claim Review admin, Supply Review Queue
- **Infra gaps:** /tmp/cdn → R2/S3, custom domain, default passwords
