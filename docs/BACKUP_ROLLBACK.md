# EstateOS Backup and Rollback Guide

## MongoDB Backup

Before any production deployment or seed operation:

```bash
# Dump entire database
mongodump --uri="$MI_DB_URI" --out="./backups/estateos-$(date +%Y%m%d-%H%M%S)"

# Dump specific collections only (smaller)
mongodump --uri="$MI_DB_URI" \
  --collection=properties \
  --collection=accountprofiles \
  --collection=users \
  --collection=billingplans \
  --collection=billingsubscriptions \
  --collection=manualinvoices \
  --collection=apikeys \
  --collection=apiusageevents \
  --collection=verificationjobs \
  --collection=verificationreports \
  --collection=partnerapplications \
  --collection=partneragreements \
  --collection=webhookendpoints \
  --out="./backups/estateos-selected-$(date +%Y%m%d-%H%M%S)"
```

## Environment Backup

```bash
# Save current .env
cp backend/.env "backend/.env.backup.$(date +%Y%m%d)"
```

## Manual Rollback Steps

### 1. Restore MongoDB from backup

```bash
mongorestore --uri="$MI_DB_URI" --drop "./backups/estateos-20260605-120000"
```

### 2. Restore env configuration

```bash
cp "backend/.env.backup.20260605" backend/.env
```

### 3. Rebuild and restart

```bash
cd backend && npm run build && npm run start
```

### 4. Verify health

```bash
curl http://localhost:4004/health
curl http://localhost:4004/api/v1/estateos/readiness
```

## Emergency Actions

### Disable partner API access

```bash
# Revoke all active API keys
mongosh "$MI_DB_URI" --eval 'db.apikeys.updateMany({status:"active"},{$set:{status:"revoked",revoked_at:new Date()}})'
```

### Revoke a single API key

Via admin: `/estateos/partners` → find partner → revoke keys.
Via API: `DELETE /api/v1/api-keys/:id`

### Hide bad property data

```bash
# Set property to hidden
mongosh "$MI_DB_URI" --eval 'db.properties.updateOne({_id:ObjectId("<property_id>")},{$set:{hidden:true}})'
# Or bulk hide
mongosh "$MI_DB_URI" --eval 'db.properties.updateMany({source_account_id:ObjectId("<account_id>")},{$set:{hidden:true}})'
```

### Suspend partner or source account

```
AccountProfile status: active → suspended
VerificationOperatorAccount status: active → suspended
ApiDataBuyerAccount status: active → suspended
```

Run via admin console or directly:

```bash
mongosh "$MI_DB_URI" --eval 'db.accountprofiles.updateOne({_id:ObjectId("<profile_id>")},{$set:{status:"suspended"}})'
```

### Pause webhook deliveries

Set webhook endpoint status to `paused` (field not yet implemented — use revoke + recreate pattern):

```bash
# Delete all webhook endpoints
mongosh "$MI_DB_URI" --eval 'db.webhookendpoints.deleteMany({})'
```

Or revive with disabled URL: update the endpoint URL to a dead-letter URL and clear secret.

## Rollback Order

1. Stop the server
2. Restore MongoDB from latest good backup
3. Restore `.env` if changed
4. Rebuild backend
5. Restart server
6. Run readiness check
7. Verify key flows (properties list, API keys, pilot metrics)

## Testing Rollback

Before production, test rollback in staging:

```bash
# 1. Backup current state
# 2. Run seed:estateos to add demo data
# 3. Restore from backup
# 4. Verify demo data is gone and system is functional
```
