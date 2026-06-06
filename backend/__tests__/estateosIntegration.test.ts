import 'dotenv/config'
import request from 'supertest'
import app from '../src/app'
import * as env from '../src/config/env.config'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import AccountProfile from '../src/models/AccountProfile'
import Property from '../src/models/Property'
import PropertyClaim from '../src/models/PropertyClaim'
import PropertyEvidence from '../src/models/PropertyEvidence'
import VerificationJob from '../src/models/VerificationJob'
import VerificationReport from '../src/models/VerificationReport'
import ApiKey from '../src/models/ApiKey'
import ApiUsageEvent from '../src/models/ApiUsageEvent'
import DataContributionLedger from '../src/models/DataContributionLedger'
import DataUsageLedger from '../src/models/DataUsageLedger'
import RoyaltyEligibility from '../src/models/RoyaltyEligibility'
import AuditLog from '../src/models/AuditLog'

const withFastMongoTimeout = (uri: string) => {
  if (uri.includes('serverSelectionTimeoutMS=')) {
    return uri
  }

  return `${uri}${uri.includes('?') ? '&' : '?'}serverSelectionTimeoutMS=5000`
}

describe('EstateOS operational integration flows', () => {
  let token: string
  let claimProfileId: string
  let verifierProfileId: string
  let apiBuyerProfileId: string
  let propertyId: string
  let verificationJobId: string
  let apiKeyId: string
  let scopedApiKeyId: string
  let apiSecret: string
  let scopedApiSecret: string
  let dbConnected = false

  beforeAll(async () => {
    testHelper.initializeLogger()
    dbConnected = await databaseHelper.connect(withFastMongoTimeout(env.DB_URI), false, false)
    if (!dbConnected) {
      throw new Error('EstateOS integration tests require a reachable MongoDB instance')
    }
    await testHelper.initialize()
    token = await testHelper.signinAsAdmin()

    const adminUserId = testHelper.getAdminUserId()
    const claimProfile = await AccountProfile.create({
      user_id: adminUserId,
      profile_type: 'PropertyClaimAccount',
      verification_level: 'evidence_attached',
      trust_score: 55,
      status: 'active',
      allowed_actions: ['property:create_claim', 'property:update_own', 'property:upload_evidence', 'property:read_public'],
    })
    const verifierProfile = await AccountProfile.create({
      user_id: adminUserId,
      profile_type: 'VerificationOperatorAccount',
      verification_level: 'field_verifier',
      trust_score: 70,
      status: 'active',
      allowed_actions: ['verification:accept_job', 'verification:submit_report', 'property:read_public'],
    })
    const apiBuyerProfile = await AccountProfile.create({
      user_id: adminUserId,
      profile_type: 'ApiDataBuyerAccount',
      verification_level: 'starter',
      trust_score: 60,
      status: 'active',
      allowed_actions: ['api:create_key', 'api:read_usage', 'property:read_public', 'property:read_partner'],
    })

    claimProfileId = claimProfile._id.toString()
    verifierProfileId = verifierProfile._id.toString()
    apiBuyerProfileId = apiBuyerProfile._id.toString()
  })

  afterAll(async () => {
    if (token) {
      await request(app)
        .post('/api/sign-out')
        .set(env.X_ACCESS_TOKEN, token)
    }

    if (!dbConnected) {
      return
    }

    await Property.deleteMany({ _id: propertyId })
    await PropertyClaim.deleteMany({ property_id: propertyId })
    await PropertyEvidence.deleteMany({ property_id: propertyId })
    await VerificationJob.deleteMany({ property_id: propertyId })
    await VerificationReport.deleteMany({ property_id: propertyId })
    await ApiUsageEvent.deleteMany({ api_key_id: { $in: [apiKeyId, scopedApiKeyId].filter(Boolean) } })
    await DataContributionLedger.deleteMany({ property_id: propertyId })
    await DataUsageLedger.deleteMany({ property_id: propertyId })
    await RoyaltyEligibility.deleteMany({ property_id: propertyId })
    await ApiKey.deleteMany({ _id: { $in: [apiKeyId, scopedApiKeyId].filter(Boolean) } })
    await AuditLog.deleteMany({ actor_id: testHelper.getAdminUserId() })
    await AccountProfile.deleteMany({ _id: { $in: [claimProfileId, verifierProfileId, apiBuyerProfileId] } })
    if (testHelper.getAdminUserId()) {
      await testHelper.close()
    }
    await databaseHelper.close()
  })

  it('creates supply property claims with source attribution, trust state, audit, and contribution ledger', async () => {
    const res = await request(app)
      .post('/api/v1/supply/properties')
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', claimProfileId)
      .send({
        title: 'EstateOS integration property in Vinh',
        listing_type: 'sale',
        property_type: 'townhouse',
        price: 2400000000,
        size: 96,
        location_precision: 'district_plus_area',
        location_public: { city: 'Vinh', district: 'Vinh City', display_name: 'Vinh approximate area' },
      })

    expect(res.statusCode).toBe(201)
    propertyId = res.body.property.id
    expect(res.body.property.source.source_account_id).toBe(claimProfileId)
    expect(res.body.trust_state.claim_level).toBe('self_declared')
    expect(res.body.trust_state.legal_status).toBe('legal_not_verified')

    const property = await Property.findById(propertyId)
    expect(property?.source_account_id?.toString()).toBe(claimProfileId)
    expect(await AuditLog.exists({ action: 'property_claim.created', target_id: propertyId })).toBeTruthy()
    expect(await DataContributionLedger.exists({ property_id: propertyId, contribution_type: 'created_property' })).toBeTruthy()
  })

  it('uploads evidence, submits allowed verification labels, and rejects forbidden labels', async () => {
    const evidenceRes = await request(app)
      .post(`/api/v1/supply/properties/${propertyId}/evidence`)
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', claimProfileId)
      .send({
        evidence_type: 'photo',
        file_ref: 'private://integration/photo-1.jpg',
        visibility: 'private',
        redaction_state: 'restricted',
        review_status: 'accepted_limited',
      })

    expect(evidenceRes.statusCode).toBe(201)
    expect(evidenceRes.body.trust_state.labels).toContain('evidence_attached')

    const jobRes = await request(app)
      .post('/api/v1/verification/jobs')
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', claimProfileId)
      .send({ property_id: propertyId, required_checks: ['photo', 'location'] })

    expect(jobRes.statusCode).toBe(201)
    verificationJobId = jobRes.body._id

    const forbiddenRes = await request(app)
      .post(`/api/v1/verification/jobs/${verificationJobId}/submit`)
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', verifierProfileId)
      .send({ allowed_labels: ['legal_clean'] })

    expect(forbiddenRes.statusCode).toBe(400)

    const reportRes = await request(app)
      .post(`/api/v1/verification/jobs/${verificationJobId}/submit`)
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', verifierProfileId)
      .send({
        allowed_labels: ['verified_photo', 'verified_location', 'operator_checked'],
        confidence_level: 70,
        risk_flags: ['legal_document_not_verified'],
      })

    expect(reportRes.statusCode).toBe(201)
    expect(reportRes.body.trust_state.labels).toEqual(expect.arrayContaining(['verified_photo', 'verified_location', 'operator_checked']))
    expect(reportRes.body.trust_state.labels).not.toContain('legal_clean')
    expect(await DataContributionLedger.exists({ property_id: propertyId, contribution_type: 'verified_photo' })).toBeTruthy()
  })

  it('creates API keys, logs usage, enforces scopes, and records usage ledger', async () => {
    const keyRes = await request(app)
      .post('/api/v1/api-keys')
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', apiBuyerProfileId)
      .send({ name: 'Integration public key', scopes: ['properties:read_public'] })

    expect(keyRes.statusCode).toBe(201)
    apiKeyId = keyRes.body.key.id
    apiSecret = keyRes.body.secret
    expect(apiSecret).toMatch(/^eos_/)

    const listRes = await request(app)
      .get('/api/v1/properties')
      .set('x-api-key', apiSecret)

    expect(listRes.statusCode).toBe(200)
    expect(await ApiUsageEvent.exists({ api_key_id: apiKeyId, endpoint: '/api/v1/properties' })).toBeTruthy()

    const deniedTrustRes = await request(app)
      .get(`/api/v1/properties/${propertyId}/trust-state`)
      .set('x-api-key', apiSecret)

    expect(deniedTrustRes.statusCode).toBe(403)

    expect(await DataUsageLedger.exists({ api_key_id: apiKeyId, usage_type: 'api_property_read' })).toBeTruthy()
  })

  it('enforces partner visibility and redacts private fields in shaped responses', async () => {
    await Property.updateOne(
      { _id: propertyId },
      {
        api_visibility: 'partner_trust',
        location_precision: 'exact_private',
        location_public: { city: 'Vinh' },
        location_private: { exact_address: 'private exact location' },
      },
    )

    const publicRes = await request(app).get(`/api/v1/properties/${propertyId}`)
    expect(publicRes.statusCode).toBe(403)

    const scopedKeyRes = await request(app)
      .post('/api/v1/api-keys')
      .set(env.X_ACCESS_TOKEN, token)
      .set('x-estateos-account-profile', apiBuyerProfileId)
      .send({ name: 'Integration partner key', scopes: ['properties:read_partner', 'properties:read_trust_state'] })

    expect(scopedKeyRes.statusCode).toBe(201)
    scopedApiKeyId = scopedKeyRes.body.key.id
    scopedApiSecret = scopedKeyRes.body.secret

    const partnerRes = await request(app)
      .get(`/api/v1/properties/${propertyId}`)
      .set('x-api-key', scopedApiSecret)

    expect(partnerRes.statusCode).toBe(200)
    expect(partnerRes.body.location.display_name).toBe('Private location masked')
    expect(partnerRes.body.location_private).toBeUndefined()
    expect(partnerRes.body.address).toBeUndefined()
    expect(partnerRes.body.sensitive_fields_redacted).toBe(true)
  })

  it('exposes redacted operational console data for admins', async () => {
    const commandCenterRes = await request(app)
      .get('/api/v1/ops/command-center')
      .set(env.X_ACCESS_TOKEN, token)

    expect(commandCenterRes.statusCode).toBe(200)
    expect(commandCenterRes.body.counts.estateProperties).toBeGreaterThan(0)

    const evidenceOpsRes = await request(app)
      .get('/api/v1/ops/property-evidence')
      .set(env.X_ACCESS_TOKEN, token)

    expect(evidenceOpsRes.statusCode).toBe(200)
    const createdEvidence = evidenceOpsRes.body.rows.find((row: any) => row.property_id === propertyId)
    expect(createdEvidence.file_ref).toContain('[redacted')
    expect(await AuditLog.exists({ action: 'ops_console.read', actor_id: testHelper.getAdminUserId() })).toBeTruthy()
  })
})
