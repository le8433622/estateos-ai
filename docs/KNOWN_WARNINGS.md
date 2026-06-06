# EstateOS Known Warnings

## Non-Blocking Warnings

### 1. useEffect dependency warning in admin `App.tsx`

**File:** `admin/src/App.tsx`
**Line:** `58` (approx.)

```
React Hook useEffect has a missing dependency: 'location.pathname'. 
Either include it or remove the dependency array. (react-hooks/exhaustive-deps)
```

**Classification:** `non_blocking`
**Reason:** The `refreshKey` pattern intentionally triggers on every pathname change. Adding `location.pathname` as a dependency would be functionally equivalent but quiet the linter. The `// eslint-disable-line` comment has been added. This is a pre-existing pattern from the original Movin' In codebase.

### 2. Movin' In naming in package metadata

**File:** `package.json` (root), `backend/package.json`, etc.
**Lines:** Various

```
"name": "movinin"
"description": "Rental Property Booking System"
```

**Classification:** `non_blocking`
**Reason:** The package names still reference the original Movin' In rental platform. These should eventually be renamed to `estateos` but this is cosmetic and does not affect functionality or security.

### 3. Default secrets in dev configuration

**File:** `backend/src/config/env.config.ts`
**Lines:** `51`, `144`, `193`

```
MI_JWT_SECRET defaults to 'Movinin'
MI_COOKIE_SECRET defaults to 'Movinin'
```

**Classification:** `non_blocking` (development only)
**Reason:** These defaults are acceptable for local development only. Production deployments MUST override via environment variables. The readiness endpoint `GET /api/v1/estateos/readiness` checks for default secrets when `NODE_ENV=production`.

## Blocking Warnings

None currently identified.

## Needs Follow-Up

None currently identified.

## Tracking

| Warning ID | Classification | Resolved | Notes |
|---|---|---|---|
| WARN-001 | `non_blocking` | No | useEffect dep in admin App.tsx |
| WARN-002 | `non_blocking` | No | Movin' In package naming |
| WARN-003 | `non_blocking` | No | Default dev secrets (acceptable) |
