# EstateOS Pilot Runbook — End-to-End Demo

## Prerequisites

- MongoDB running
- `npm run seed:estateos` completed
- Backend running (`backend> npm run start`)
- Admin running (`admin> npm run start`)
- Frontend running (`frontend> npm run start`)

## Step-by-Step

### 1. Seed the database

```bash
npm run seed:estateos
```

Expected: Kernel seed completed, billing plans seeded.

### 2. Log in as Platform Operator

- URL: http://localhost:3002 (admin)
- Email: `operator@estateos.test`
- Password: `EstateOS123`
- Expected: Admin dashboard loads with EstateOS data in side menu.

### 3. Log in as Source Owner (in another browser/incognito)

- URL: http://localhost:3003 (frontend)
- Email: `claim-source-1@estateos.test`
- Password: `EstateOS123`
- Navigate to **Supply** in side menu.
- Expected: Supply profile active, property list visible.

### 4. Create New Property Claim

- From Supply dashboard, click **New Property Claim**.
- Fill: Title, Listing Type, Property Type, Price, Size.
- Click **Submit Claim**.
- Expected: Property created, redirected to property detail page.

### 5. Attach Evidence

- From property detail, click **Attach Evidence**.
- Select evidence type (e.g., Photo), write summary.
- Click **Attach Evidence**.
- Expected: Evidence appears in evidence table.

### 6. Request Verification Package

- Using API (or future UI), send:
```
POST /api/v1/billing/verification-packages
{ "property_id": "<property_id>", "package_type": "basic_cleanup_100k" }
```
- Expected: Invoice created with status "issued".

### 7. Admin Issues Invoice and Marks Paid

- In admin, go to **Billing** console.
- Find the invoice, click **Mark Paid**.
- Expected: Invoice status changes to "paid". Verification job is auto-created.

### 8. Log in as Verifier

- Email: `verifier-1@estateos.test`
- Password: `EstateOS123`
- Navigate to **Verifier** in side menu.
- Expected: Assigned jobs or reports are visible.

### 9. Refresh Quality

- In admin, go to **Data Quality**, click **Refresh Quality**.
- Expected: All property quality scores updated.

### 10. Check Data Products

- In frontend, go to **Data Products**.
- Expected: 7 data products listed. Authenticated users can preview.

### 11. Partner Application Flow

- In frontend, go to **Partners**.
- Click **Apply Now**, fill form, submit.
- Expected: Application status "submitted".

### 12. Admin Approves Partner

- In admin, go to **Partners**.
- Find application, click **View**, then **Approve Trial**.
- Optional: Add review notes and plan.
- Expected: Status changes to "approved_for_trial".

### 13. Partner Accepts Agreement and Gets Sandbox Key

- In frontend /partners, click **Accept API Terms**, **Accept Data Visibility Terms**.
- Click **Generate Sandbox Key**.
- Expected: Sandbox key secret displayed. Expires in 30 days.

### 14. API Data Product Usage

- Using sandbox key, call:
```
GET /api/v1/data-products/public_listing_feed/preview
Headers: x-api-key: <sandbox_secret>
```
- Expected: Redacted property data returned.

### 15. Admin Reviews Dashboards

- Admin → **EstateOS** — command center overview.
- Admin → **Data Quality** — quality distribution, market signals.
- Admin → **Distribution** — data product analytics, webhook logs.
- Admin → **Pilot** — pilot success metrics.

## Completion Checklist

- [ ] Source owner submitted property
- [ ] Evidence attached
- [ ] Verification package requested
- [ ] Invoice issued and marked paid
- [ ] Verification job auto-created
- [ ] Quality score refreshed
- [ ] Data products visible with preview
- [ ] Partner application submitted and approved
- [ ] Partner accepted agreements
- [ ] Sandbox key generated
- [ ] API call made with sandbox key
- [ ] Admin dashboards show data
- [ ] Forbidden labels never appear