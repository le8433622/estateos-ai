# EstateOS Pilot Deployment Guide

## Environment Variables

Required variables (see `backend/src/config/env.config.ts` for full list):

```
DB_URI=mongodb://localhost:27017/estateos
DB_SSL=false
DB_DEBUG=false
JWT_SECRET=your-secret-here
```

## Build Commands

```bash
# All packages
npm install                         # Install all dependencies (from root)
npm run build                       # Build backend, admin, frontend

# Individual packages
cd backend && npm run build          # Build backend
cd admin && npm run build            # Build admin
cd frontend && npm run build         # Build frontend
```

## Run Commands

```bash
# Backend
cd backend && npm run start          # Start backend API server

# Admin console
cd admin && npm run start            # Start admin on :3002

# Frontend
cd frontend && npm run start         # Start frontend on :3003
```

## Seed Commands

```bash
npm run seed:estateos               # Seed EstateOS kernel data
```

The seed creates:
- Users (source owners, verifiers, API buyers, operator, AI agent)
- Account profiles for each user
- 20 property records in Ngệ An area
- Evidence, verification jobs, reports, risk flags
- API usage events, data contribution/usage ledgers
- Billing plans (Free, Starter, Pro, Agency, Enterprise)
- Verification package plans (basic_cleanup, verified_photo_contact_location, field_check)

## Default Credentials (dev only)

| Email | Password | Role |
|---|---|---|
| operator@estateos.test | EstateOS123 | Platform Operator |
| claim-source-1@estateos.test | EstateOS123 | Property Claim Source |
| verifier-1@estateos.test | EstateOS123 | Verification Operator |
| api-buyer-1@estateos.test | EstateOS123 | API Data Buyer |
| demand-1@estateos.test | EstateOS123 | Demand User |
| ai-agent@estateos.test | EstateOS123 | AI Agent |

## Security Warnings (Production)

1. **Change all default passwords** before production use
2. **Do not commit secrets** in env files or code
3. **API keys** are hashed at rest — still treat as sensitive
4. **Sensitive evidence** is private by default — verify before exposing
5. **`node_modules`** must never be committed
6. **Package-lock.json** should be committed but reviewed for dependency changes
7. **MongoDB** should use auth and SSL in production

## Architecture

```
frontend:3003  →  backend:4000  →  MongoDB
admin:3002     →  backend:4000  →  MongoDB
```

- Backend runs Express on port 4000
- Admin console on port 3002
- Frontend public site on port 3003
- All use the same backend API