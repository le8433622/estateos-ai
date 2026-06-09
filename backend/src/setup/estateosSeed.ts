import 'dotenv/config'
import process from 'node:process'
import mongoose from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as authHelper from '../utils/authHelper'
import * as logger from '../utils/logger'

const NODE_ENV = process.env.NODE_ENV || 'development'
const BLOCK_PRODUCTION_SEED = process.env.ES_BLOCK_PRODUCTION_SEED !== 'false'
const ALLOW_DEMO_SEED = process.env.ES_ALLOW_DEMO_SEED === 'true'

if (BLOCK_PRODUCTION_SEED && NODE_ENV !== 'development' && !ALLOW_DEMO_SEED) {
  logger.error(
    'Seed is blocked in non-development environment. '
    + `NODE_ENV=${NODE_ENV}, ES_BLOCK_PRODUCTION_SEED=true. `
    + 'Set ES_ALLOW_DEMO_SEED=true to override for demo/staging.'
  )
  process.exit(1)
}
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Property from '../models/Property'
import AccountProfile from '../models/AccountProfile'
import PropertyClaim from '../models/PropertyClaim'
import PropertyEvidence from '../models/PropertyEvidence'
import VerificationJob from '../models/VerificationJob'
import VerificationReport from '../models/VerificationReport'
import RiskFlag from '../models/RiskFlag'
import ApiScope from '../models/ApiScope'
import ApiUsageEvent from '../models/ApiUsageEvent'
import DataContributionLedger from '../models/DataContributionLedger'
import DataUsageLedger from '../models/DataUsageLedger'
import RoyaltyEligibility from '../models/RoyaltyEligibility'
import DemandProfile from '../models/DemandProfile'
import { ACCOUNT_PROFILE_TYPES, API_SCOPES, DEFAULT_API_PLANS, VERIFICATION_PACKAGE_PLANS, AccountProfileType } from '../estateos/constants'
import { createApiKeyForAccount } from '../services/apiKeyService'
import { refreshPropertyTrustState } from '../services/trustStateService'
import { computePropertyQuality } from '../services/qualityService'
import BillingPlan from '../models/BillingPlan'

const SEED_TAG = 'estateos-kernel-00'
const PASSWORD = 'EstateOS123'

const ensureUser = async (email: string, fullName: string, type: movininTypes.UserType) => {
  const existing = await User.findOne({ email })

  if (existing) {
    return existing
  }

  return User.create({
    email,
    fullName,
    language: env.DEFAULT_LANGUAGE,
    password: await authHelper.hashPassword(PASSWORD),
    type,
    active: true,
    verified: true,
  })
}

const ensureLocationValue = async (language: string, value: string) => {
  const existing = await LocationValue.findOne({ language, value })

  if (existing) {
    return existing
  }

  return LocationValue.create({ language, value })
}

const ensureLocation = async (name: string, countryId: mongoose.Types.ObjectId, longitude: number, latitude: number) => {
  const value = await ensureLocationValue('en', name)
  const existing = await Location.findOne({ values: value._id })

  if (existing) {
    return existing
  }

  const location = await Location.create({
    country: countryId,
    values: [value._id],
    longitude,
    latitude,
  })

  return location
}

const ensureVietnamLocations = async () => {
  const countryValue = await ensureLocationValue('en', 'Vietnam')
  let country = await Country.findOne({ values: countryValue._id })

  if (!country) {
    country = await Country.create({ values: [countryValue._id] })
  }

  const vinh = await ensureLocation('Vinh', country._id, 105.6813, 18.6796)
  const cuaLo = await ensureLocation('Cua Lo', country._id, 105.721, 18.8167)
  const ngheAn = await ensureLocation('Nghe An', country._id, 104.9200, 19.2342)

  return { vinh, cuaLo, ngheAn }
}

const verificationLevelForProfile = (profileType: AccountProfileType) => {
  if (profileType === 'PropertyClaimAccount') {
    return 'evidence_attached'
  }

  if (profileType === 'PropertyDemandAccount') {
    return 'contact_verified'
  }

  if (profileType === 'VerificationOperatorAccount') {
    return 'field_verifier'
  }

  if (profileType === 'ApiDataBuyerAccount') {
    return 'starter'
  }

  if (profileType === 'PlatformOperatorAccount') {
    return 'platform_admin'
  }

  return 'applicant'
}

const ensureProfile = async (userId: mongoose.Types.ObjectId, profileType: AccountProfileType, trustScore = 35) => {
  const existing = await AccountProfile.findOne({ user_id: userId, profile_type: profileType })

  if (existing) {
    return existing
  }

  return AccountProfile.create({
    user_id: userId,
    profile_type: profileType,
    verification_level: verificationLevelForProfile(profileType),
    trust_score: trustScore,
    status: 'active',
    visibility_scopes: profileType === 'ApiDataBuyerAccount' ? ['public', 'partner'] : ['public'],
    metadata: { seed: SEED_TAG },
  })
}

const ensureApiScopes = async () => {
  for (const scope of API_SCOPES) {
    await ApiScope.updateOne(
      { name: scope },
      {
        $setOnInsert: {
          name: scope,
          description: `EstateOS API scope ${scope}`,
          partner_only: scope.includes('partner') || scope.includes('billing') || scope.includes('write'),
          status: 'active',
        },
      },
      { upsert: true },
    )
  }
}

const createSeedAccounts = async () => {
  const claimProfiles: any[] = []
  const demandProfiles: any[] = []
  const verifierProfiles: any[] = []
  const apiBuyerProfiles: any[] = []

  for (let i = 1; i <= 5; i += 1) {
    const user = await ensureUser(`claim-source-${i}@estateos.test`, `EstateOS Claim Source ${i}`, movininTypes.UserType.Agency)
    claimProfiles.push(await ensureProfile(user._id, 'PropertyClaimAccount', 35 + i * 5))
  }

  for (let i = 1; i <= 5; i += 1) {
    const user = await ensureUser(`demand-${i}@estateos.test`, `EstateOS Demand ${i}`, movininTypes.UserType.User)
    const profile = await ensureProfile(user._id, 'PropertyDemandAccount', 25 + i * 4)
    demandProfiles.push(profile)
    await DemandProfile.updateOne(
      { account_id: profile._id },
      {
        $setOnInsert: {
          account_id: profile._id,
          demand_type: i % 2 === 0 ? 'investor' : 'buyer',
          target_locations: ['Vinh', 'Cua Lo', 'Nghe An'],
          budget_min: 1000000000 * i,
          budget_max: 2500000000 * i,
          currency: 'VND',
          qualification_status: i >= 3 ? 'qualified_demand' : 'contact_verified',
          trust_score: 30 + i * 5,
          metadata: { seed: SEED_TAG },
        },
      },
      { upsert: true },
    )
  }

  for (let i = 1; i <= 3; i += 1) {
    const user = await ensureUser(`verifier-${i}@estateos.test`, `EstateOS Verifier ${i}`, movininTypes.UserType.Admin)
    verifierProfiles.push(await ensureProfile(user._id, 'VerificationOperatorAccount', 45 + i * 10))
  }

  for (let i = 1; i <= 2; i += 1) {
    const user = await ensureUser(`api-buyer-${i}@estateos.test`, `EstateOS API Buyer ${i}`, movininTypes.UserType.User)
    apiBuyerProfiles.push(await ensureProfile(user._id, 'ApiDataBuyerAccount', 40 + i * 10))
  }

  const operatorUser = await ensureUser('operator@estateos.test', 'EstateOS Platform Operator', movininTypes.UserType.Admin)
  const platformOperator = await ensureProfile(operatorUser._id, 'PlatformOperatorAccount', 75)
  const aiUser = await ensureUser('ai-agent@estateos.test', 'EstateOS AI Agent', movininTypes.UserType.Admin)
  await ensureProfile(aiUser._id, 'AiAgentAccount', 50)

  for (const profileType of ACCOUNT_PROFILE_TYPES) {
    logger.info(`EstateOS profile ready: ${profileType}`)
  }

  return { claimProfiles, demandProfiles, verifierProfiles, apiBuyerProfiles, platformOperator }
}

const createSeedProperties = async (claimProfiles: any[], locations: Awaited<ReturnType<typeof ensureVietnamLocations>>) => {
  const existingCount = await Property.countDocuments({ 'location_public.seed': SEED_TAG })

  if (existingCount >= 20) {
    return Property.find({ 'location_public.seed': SEED_TAG }).sort({ createdAt: 1 }).limit(20)
  }

  const locationList = [
    { model: locations.vinh, city: 'Vinh', district: 'Vinh City', precision: 'district_plus_area' },
    { model: locations.cuaLo, city: 'Cua Lo', district: 'Cua Lo', precision: 'district' },
    { model: locations.ngheAn, city: 'Nghe An', district: 'Nghe An', precision: 'city' },
  ]
  const properties: any[] = []

  for (let i = existingCount; i < 20; i += 1) {
    const sourceProfile = claimProfiles[i % claimProfiles.length]
    const location = locationList[i % locationList.length]
    const size = 70 + i * 12
    const price = 900000000 + i * 175000000
    const property = await Property.create({
      name: `EstateOS Nghe An data asset ${i + 1}`,
      type: i % 3 === 0 ? movininTypes.PropertyType.Apartment : movininTypes.PropertyType.House,
      agency: sourceProfile.user_id,
      description: 'Seeded EstateOS claim-based property record for kernel validation.',
      image: '',
      images: [],
      bedrooms: 2 + (i % 4),
      bathrooms: 1 + (i % 3),
      kitchens: 1,
      parkingSpaces: i % 2,
      size,
      petsAllowed: false,
      furnished: i % 2 === 0,
      minimumAge: env.MINIMUM_AGE,
      location: location.model._id,
      address: `${location.city} masked address ${i + 1}`,
      price,
      hidden: false,
      cancellation: 0,
      aircon: i % 2 === 0,
      rentalTerm: movininTypes.RentalTerm.Yearly,
      source_account_id: sourceProfile._id,
      listing_type: i % 4 === 0 ? 'investment' : 'sale',
      property_type: i % 3 === 0 ? 'apartment' : 'house',
      price_per_m2: Math.round(price / size),
      location_precision: location.precision,
      location_public: {
        city: location.city,
        district: location.district,
        display_name: `${location.city} approximate area`,
        precision: location.precision,
        seed: SEED_TAG,
      },
      location_private: {},
      api_visibility: i % 5 === 0 ? 'partner_trust' : 'public',
      claim_state: 'self_declared',
      trust_score: 20,
      risk_score: 80,
      freshness_score: 60,
      duplicate_risk_score: i % 6 === 0 ? 65 : 10 + i,
    })

    await PropertyClaim.create({
      property_id: property._id,
      source_account_id: sourceProfile._id,
      claim_state: 'self_declared',
      claim_summary: {
        title: property.name,
        seed: SEED_TAG,
      },
      confidence_level: 25,
      created_by: sourceProfile.user_id,
    })
    await DataContributionLedger.create({
      account_id: sourceProfile._id,
      property_id: property._id,
      contribution_type: 'created_property',
      source_event_type: 'Property',
      source_event_id: property._id.toString(),
      royalty_eligible_later: true,
      metadata: { seed: SEED_TAG },
    })
    await RoyaltyEligibility.create({
      account_id: sourceProfile._id,
      property_id: property._id,
      eligibility_reason: 'seeded_data_contribution',
      status: 'policy_pending',
      policy_version: 'rr-kernel-00',
      metadata: { seed: SEED_TAG },
    })
    properties.push(property)
  }

  return properties
}

const createSeedEvidence = async (properties: any[], claimProfiles: any[]) => {
  const evidenceTypes = ['photo', 'location_pin', 'contact_proof', 'availability_proof', 'redacted_legal_doc', 'field_check_photo', 'owner_confirmation', 'authorization_message', 'developer_price_sheet', 'video']
  const existingCount = await PropertyEvidence.countDocuments({ 'metadata.seed': SEED_TAG })

  if (existingCount >= 10) {
    return
  }

  for (let i = existingCount; i < 10; i += 1) {
    const property = properties[i % properties.length]
    const sourceProfile = claimProfiles[i % claimProfiles.length]
    const claim = await PropertyClaim.findOne({ property_id: property._id })

    await PropertyEvidence.create({
      property_id: property._id,
      claim_id: claim?._id,
      uploaded_by_account_id: sourceProfile._id,
      evidence_type: evidenceTypes[i],
      file_ref: `seed://${SEED_TAG}/evidence-${i + 1}`,
      visibility: 'private',
      redaction_state: evidenceTypes[i] === 'redacted_legal_doc' ? 'redacted' : 'restricted',
      review_status: i < 6 ? 'accepted_limited' : 'submitted',
      summary: 'Seeded private/redacted evidence status only.',
      metadata: { seed: SEED_TAG },
    })

    property.claim_state = 'evidence_attached'
    await property.save()

    if (claim) {
      claim.claim_state = 'evidence_attached'
      await claim.save()
    }
  }
}

const createSeedVerification = async (properties: any[], claimProfiles: any[], verifierProfiles: any[]) => {
  const existingCount = await VerificationJob.countDocuments({ 'metadata.seed': SEED_TAG })

  if (existingCount >= 5) {
    return
  }

  for (let i = existingCount; i < 5; i += 1) {
    const property = properties[i]
    const sourceProfile = claimProfiles[i % claimProfiles.length]
    const verifierProfile = verifierProfiles[i % verifierProfiles.length]
    const claim = await PropertyClaim.findOne({ property_id: property._id })
    const job = await VerificationJob.create({
      property_id: property._id,
      claim_id: claim?._id,
      requested_by_account_id: sourceProfile._id,
      assigned_to_account_id: verifierProfile._id,
      job_type: 'limited_property_verification',
      status: i < 3 ? 'submitted' : 'open',
      required_checks: ['photo', 'location', 'contact', 'availability'],
      submitted_at: i < 3 ? new Date() : undefined,
      metadata: { seed: SEED_TAG },
    })

    if (i < 3) {
      const labels = i === 0
        ? ['verified_photo', 'verified_location', 'verified_contact', 'availability_checked', 'operator_checked']
        : ['verified_photo', 'verified_location', 'operator_checked']
      await VerificationReport.create({
        verification_job_id: job._id,
        property_id: property._id,
        submitted_by_account_id: verifierProfile._id,
        status: 'submitted',
        allowed_labels: labels,
        confidence_level: 65 + i * 5,
        risk_notes: 'Seeded limited verification report; no legal guarantee.',
        conflict_disclosed: false,
        field_results: { seed: SEED_TAG },
      })
    }
  }

  await RiskFlag.create({
    property_id: properties[0]._id,
    flag_type: 'legal_document_not_verified',
    severity: 'medium',
    status: 'open',
    note: 'Seeded risk: legal status remains not verified.',
    created_by_account_id: verifierProfiles[0]._id,
  })
}

const seedBillingPlans = async () => {
  const existingCount = await BillingPlan.countDocuments()
  if (existingCount > 0) {
    return { created: 0 }
  }
  const apiPlans = DEFAULT_API_PLANS.map((p) => ({
    ...p,
    plan_type: 'api_subscription' as const,
    currency: 'VND',
    field_visibility: [],
    status: 'active' as const,
  }))
  const verPlans = VERIFICATION_PACKAGE_PLANS.map((p) => ({
    name: p.name,
    plan_type: 'verification_package' as const,
    price_amount: p.price_amount,
    currency: 'VND',
    billing_interval: 'one_time' as const,
    included_usage: {},
    allowed_scopes: [],
    field_visibility: [],
    rate_limit: {},
    description: p.description,
    status: 'active' as const,
    sort_order: 10,
  }))
  await BillingPlan.insertMany([...apiPlans, ...verPlans])
  logger.info(`Seeded ${apiPlans.length + verPlans.length} billing plans`)
  return { created: apiPlans.length + verPlans.length }
}

const createSeedApiUsage = async (properties: any[], apiBuyerProfiles: any[]) => {
  for (const profile of apiBuyerProfiles) {
    const existingKey = await ApiUsageEvent.findOne({ account_id: profile._id, endpoint: '/api/v1/properties' })

    if (!existingKey) {
      const { apiKey } = await createApiKeyForAccount({
        accountId: profile._id.toString(),
        createdBy: profile.user_id.toString(),
        name: 'Seed API buyer key',
        scopes: ['properties:read_public', 'properties:read_trust_state', 'billing:read'],
      })

      for (let i = 0; i < 3; i += 1) {
        const property = properties[(i + apiBuyerProfiles.indexOf(profile)) % properties.length]
        const event = await ApiUsageEvent.create({
          api_key_id: apiKey._id,
          account_id: profile._id,
          endpoint: i === 0 ? '/api/v1/properties' : '/api/v1/properties/:id/trust-state',
          method: 'GET',
          status_code: 200,
          scopes_used: i === 0 ? ['properties:read_public'] : ['properties:read_trust_state'],
          fields_accessed: i === 0 ? ['title', 'location_public', 'price'] : ['trust_state', 'risk_flags'],
          usage_units: 1,
          ip_hash: 'seeded',
          user_agent_summary: SEED_TAG,
        })
        await DataUsageLedger.create({
          account_id: profile._id,
          property_id: property._id,
          api_key_id: apiKey._id,
          usage_type: i === 0 ? 'api_property_read' : 'api_trust_state_read',
          fields_accessed: event.fields_accessed,
          usage_units: 1,
          royalty_eligible_later: true,
          metadata: { seed: SEED_TAG, api_usage_event_id: event._id.toString() },
        })
      }
    }
  }
}

export const seedEstateOSKernel = async () => {
  await ensureApiScopes()
  await seedBillingPlans()
  const locations = await ensureVietnamLocations()
  const accounts = await createSeedAccounts()
  const properties = await createSeedProperties(accounts.claimProfiles, locations)
  await createSeedEvidence(properties, accounts.claimProfiles)
  await createSeedVerification(properties, accounts.claimProfiles, accounts.verifierProfiles)
  await createSeedApiUsage(properties, accounts.apiBuyerProfiles)

  for (const property of properties) {
    await refreshPropertyTrustState(property._id.toString())
  }

  for (const property of properties) {
    await computePropertyQuality(property._id.toString())
  }

  logger.info('EstateOS kernel seed completed')
}

const runAsCli = process.argv[1]?.endsWith('estateosSeed.js') || process.argv[1]?.endsWith('estateosSeed.ts')

if (runAsCli) {
  try {
    const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

    if (!connected) {
      logger.error('Failed to connect to the database')
      process.exit(1)
    }

    await seedEstateOSKernel()
    await databaseHelper.close()
    process.exit(0)
  } catch (err) {
    logger.error('Error during EstateOS seed:', err)
    process.exit(1)
  }
}
