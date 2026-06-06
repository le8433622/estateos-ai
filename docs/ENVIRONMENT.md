# EstateOS Environment Configuration

## Required Environment Variables

All variables use the `MI_` prefix (Movin' In legacy). EstateOS-specific checks are defined in `backend/src/estateos/envCheck.ts`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MI_DB_URI` | Yes | `mongodb://127.0.0.1:27017/movinin` | MongoDB connection string |
| `MI_JWT_SECRET` | Yes | `Movinin` | JWT signing secret (must change in production) |
| `MI_COOKIE_SECRET` | Yes | `Movinin` | Cookie signing secret (must change in production) |
| `MI_SMTP_HOST` | Yes | — | SMTP server hostname |
| `MI_SMTP_PORT` | Yes | — | SMTP server port |
| `MI_SMTP_USER` | Yes | — | SMTP username |
| `MI_SMTP_PASS` | Yes | — | SMTP password |
| `MI_SMTP_FROM` | Yes | — | SMTP from address |
| `MI_CDN_USERS` | Yes | — | CDN path for user uploads |
| `MI_CDN_TEMP_USERS` | Yes | — | CDN temp path for users |
| `MI_CDN_PROPERTIES` | Yes | — | CDN path for property images |
| `MI_CDN_TEMP_PROPERTIES` | Yes | — | CDN temp path for properties |
| `MI_CDN_LOCATIONS` | Yes | — | CDN path for location images |
| `MI_CDN_TEMP_LOCATIONS` | Yes | — | CDN temp path for locations |
| `MI_ADMIN_HOST` | Yes | — | Admin panel URL |
| `MI_FRONTEND_HOST` | Yes | — | Frontend public URL |

## EstateOS-Specific Variables

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development` / `production` / `test`) |
| `MI_PORT` | `4004` | Backend API server port |
| `MI_HTTPS` | `false` | Enable HTTPS |
| `MI_DB_SSL` | `false` | Enable MongoDB SSL |
| `MI_DB_DEBUG` | `false` | Enable MongoDB debug logging |
| `MI_STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Stripe API secret |
| `MI_PAYPAL_CLIENT_ID` | `PAYPAL_CLIENT_ID` | PayPal client ID |
| `MI_PAYPAL_CLIENT_SECRET` | `PAYPAL_CLIENT_SECRET` | PayPal client secret |
| `MI_CI` | `false` | CI environment flag |
| `MI_DEFAULT_LANGUAGE` | `en` | Default language (`en` / `fr`) |
| `MI_MINIMUM_AGE` | `21` | Minimum rental age |

## EstateOS Seed Guard

| Variable | Default | Purpose |
|---|---|---|
| `ES_BLOCK_PRODUCTION_SEED` | `true` | Block seed execution in non-development environments |
| `ES_ALLOW_DEMO_SEED` | (unset) | Set to `true` to allow demo seed in production-like environments |

## Enforcing Default Secrets Detection

In production, the following defaults MUST be changed:

- `MI_JWT_SECRET` — change from `Movinin`
- `MI_COOKIE_SECRET` — change from `Movinin`
- Default seed passwords (`EstateOS123`) — change before production

## Validation

The backend runs env validation at startup via `GET /api/v1/estateos/health` and `GET /api/v1/estateos/readiness`.

Validation checks:

- `DB_URI` is not empty
- `JWT_SECRET` is not the default in production
- `COOKIE_SECRET` is not the default in production
- Required CDN paths are configured
- Seed mode is not accidentally enabled in production
- Billing plans are seeded
- Data products are loaded
- Forbidden labels are not present in runtime constants

## File Locations

- Backend env config: `backend/src/config/env.config.ts`
- EstateOS env validation: `backend/src/estateos/envCheck.ts`
- EstateOS constants: `backend/src/estateos/constants.ts`
- Seed entry point: `backend/src/setup/estateosSeed.ts`
