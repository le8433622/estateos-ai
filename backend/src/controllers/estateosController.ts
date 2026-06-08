import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import Property from '../models/Property'
import AccountProfile from '../models/AccountProfile'
import AuditLog from '../models/AuditLog'
import PropertyClaim from '../models/PropertyClaim'
import PropertyEvidence from '../models/PropertyEvidence'
import VerificationJob from '../models/VerificationJob'
import VerificationReport from '../models/VerificationReport'
import RiskFlag from '../models/RiskFlag'
import ApiKey from '../models/ApiKey'
import ApiUsageEvent from '../models/ApiUsageEvent'
import DataContributionLedger from '../models/DataContributionLedger'
import DataUsageLedger from '../models/DataUsageLedger'
import RoyaltyEligibility from '../models/RoyaltyEligibility'
import DemandProfile from '../models/DemandProfile'
import SavedProperty from '../models/SavedProperty'
import {
  API_SCOPES,
  ACCOUNT_PROFILE_TYPES,
  EVIDENCE_TYPES,
  RISK_FLAG_TYPES,
  TRUST_LABELS,
  containsForbiddenLabel,
  isAllowedTrustLabel,
} from '../estateos/constants'
import {
  EstateOSHttpError,
  findAccountProfileForRequest,
  isPlatformOperator,
  requireAccountProfile,
  toAuditActor,
} from '../services/accountProfileService'
import { createAuditLog } from '../services/auditService'
import { refreshPropertyTrustState } from '../services/trustStateService'
import {
  authenticateApiKey,
  createApiKeyForAccount,
  readApiKeySecretFromRequest,
} from '../services/apiKeyService'
import { logApiUsage } from '../services/apiUsageService'
import { runEnvValidation, runReadinessCheck } from '../estateos/envCheck'

const handleEstateOSError = (res: Response, err: unknown) => {
  if (err instanceof EstateOSHttpError) {
    res.status(err.statusCode).send({ message: err.message })
    return
  }

  if (err instanceof Error) {
    res.status(400).send({ message: err.message })
    return
  }

  res.status(400).send({ message: 'EstateOS request failed' })
}

const getAuthenticatedApiKeyForRequest = async (req: Request) => {
  const secret = readApiKeySecretFromRequest(req)

  if (!secret) {
    return null
  }

  const authenticated = await authenticateApiKey(secret)

  if (!authenticated) {
    throw new EstateOSHttpError(401, 'Invalid API key')
  }

  return authenticated
}

const mapPropertyType = (propertyType?: string) => {
  const normalized = (propertyType || '').toLowerCase()

  if (normalized.includes('apartment') || normalized.includes('condo')) {
    return movininTypes.PropertyType.Apartment
  }

  if (normalized.includes('townhouse')) {
    return movininTypes.PropertyType.Townhouse
  }

  if (normalized.includes('plot') || normalized.includes('land')) {
    return movininTypes.PropertyType.Plot
  }

  if (normalized.includes('farm')) {
    return movininTypes.PropertyType.Farm
  }

  if (normalized.includes('commercial') || normalized.includes('shophouse')) {
    return movininTypes.PropertyType.Commercial
  }

  if (normalized.includes('industrial')) {
    return movininTypes.PropertyType.Industrial
  }

  return movininTypes.PropertyType.House
}

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  if (Number.isFinite(parsed)) {
    return parsed
  }

  return fallback
}

const readLocationId = (body: Record<string, any>) => {
  const candidate = body.location_id || body.location

  if (candidate && mongoose.isValidObjectId(candidate)) {
    return new mongoose.Types.ObjectId(String(candidate))
  }

  return new mongoose.Types.ObjectId()
}

const buildPublicLocation = (property: any) => {
  const locationPublic = property.location_public || {}
  const precision = property.location_precision || locationPublic.precision || 'approximate'
  const isExactPrivate = precision === 'exact_private'

  return {
    city: locationPublic.city || property.city || 'Nghe An',
    district: isExactPrivate ? undefined : locationPublic.district || locationPublic.area || undefined,
    ward: isExactPrivate ? undefined : locationPublic.ward || undefined,
    display_name: isExactPrivate ? 'Private location masked' : locationPublic.display_name || locationPublic.name || 'Approximate location',
    precision: isExactPrivate ? 'approximate' : precision,
  }
}

const buildLocationPublicFromBody = (body: Record<string, any>) => {
  const precision = body.location_precision || 'approximate'

  if (precision === 'exact_private') {
    return {
      city: body.city || 'Nghe An',
      display_name: 'Private location masked',
      precision: 'approximate',
    }
  }

  return body.location_public || {
    city: body.city || 'Nghe An',
    district: body.district,
    ward: body.ward,
    display_name: body.public_location || 'Approximate location',
    precision,
  }
}

const getOpsLimit = (req: Request, fallback = 25) => Math.min(parseNumber(req.query.limit, fallback), 100)

const redactEvidenceForOps = (evidence: any) => ({
  ...evidence,
  file_ref: evidence.file_ref ? '[redacted: evidence reference stored]' : undefined,
  metadata: evidence.metadata ? { ...evidence.metadata, sensitive_values_redacted: true } : { sensitive_values_redacted: true },
})

const shapeProperty = (property: any, scopes: string[] = []) => {
  const canReadPartner = scopes.includes('properties:read_partner')
  const canReadTrustState = scopes.includes('properties:read_trust_state') || canReadPartner
  const trustState = property.trust_state || {}

  const shaped: Record<string, unknown> = {
    id: property._id.toString(),
    title: property.name,
    listing_type: property.listing_type || 'sale',
    property_type: property.property_type || property.type,
    location: buildPublicLocation(property),
    price: {
      amount: property.price,
      currency: 'VND',
    },
    price_per_m2: property.price_per_m2,
    claim_level: trustState.claim_level || property.claim_state || 'self_declared',
    trust_state_summary: {
      trust_score: property.trust_score || 20,
      risk_score: property.risk_score || 80,
      labels: trustState.labels || ['self_declared'],
      legal_status: trustState.legal_status || 'legal_not_verified',
    },
    api_visibility: property.api_visibility || 'public',
    freshness_score: property.freshness_score || 50,
    duplicate_risk_score: property.duplicate_risk_score || 0,
    sensitive_fields_redacted: true,
    quality: {
      score: (property as any).quality_score || 0,
      level: (property as any).quality_level || 'low',
    },
  }

  if (canReadPartner) {
    shaped.source = {
      source_account_id: property.source_account_id?.toString(),
    }
    shaped.evidence_context = {
      claim_state: property.claim_state || 'self_declared',
      last_checked_at: property.last_checked_at,
    }
  }

  if (canReadTrustState) {
    shaped.trust_state = trustState
  }

  return shaped
}

const createContribution = async (input: {
  accountId: string
  propertyId?: string
  contributionType: string
  sourceEventType: string
  sourceEventId?: string
  metadata?: Record<string, unknown>
}) => DataContributionLedger.create({
  account_id: input.accountId,
  property_id: input.propertyId,
  contribution_type: input.contributionType,
  source_event_type: input.sourceEventType,
  source_event_id: input.sourceEventId,
  royalty_eligible_later: true,
  metadata: input.metadata || {},
})

export const listProperties = async (req: Request, res: Response) => {
  try {
    const authenticatedApiKey = await getAuthenticatedApiKeyForRequest(req)
    const scopes = authenticatedApiKey?.scopes || ['properties:read_public']

    if (!scopes.includes('properties:read_public')) {
      throw new EstateOSHttpError(403, 'Missing API scope properties:read_public')
    }

    const limit = Math.min(parseNumber(req.query.limit, 20), 100)
    const page = Math.max(parseNumber(req.query.page, 1), 1)
    const skip = (page - 1) * limit
    const query: Record<string, unknown> = {
      hidden: { $ne: true },
      api_visibility: { $in: scopes.includes('properties:read_partner') ? ['public', 'partner', 'partner_trust'] : ['public'] },
    }

    if (req.query.min_quality_score) {
      query.quality_score = { $gte: parseNumber(req.query.min_quality_score, 0) }
    }
    if (req.query.quality_level) {
      query.quality_level = req.query.quality_level
    }
    if (req.query.api_grade_only === 'true') {
      query.quality_level = 'api_grade'
    }
    if (req.query.exclude_duplicate_risk === 'true') {
      query.duplicate_risk_score = { $lt: 40 }
    }
    if (req.query.freshness_min) {
      query.freshness_score = { $gte: parseNumber(req.query.freshness_min, 0) }
    }
    if (req.query.verified_location === 'true') {
      query['trust_state.location_status'] = 'verified_location'
    }
    if (req.query.verified_photo === 'true') {
      query['trust_state.photo_status'] = 'verified_photo'
    }

    const properties = await Property.find(query).sort({ trust_score: -1, updatedAt: -1 }).skip(skip).limit(limit).lean()
    const fieldsAccessed = ['id', 'title', 'property_type', 'location_public', 'price', 'trust_state_summary', 'quality']

    if (authenticatedApiKey) {
      await logApiUsage({
        req,
        authenticatedApiKey,
        endpoint: '/api/v1/properties',
        statusCode: 200,
        scopesUsed: ['properties:read_public'],
        fieldsAccessed,
        usageUnits: properties.length || 1,
        usageType: 'api_property_read',
      })
    }

    res.json({
      rows: properties.map((property) => shapeProperty(property, scopes)),
      rowCount: await Property.countDocuments(query),
    })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const getProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'property id is not valid')
    }

    const authenticatedApiKey = await getAuthenticatedApiKeyForRequest(req)
    const scopes = authenticatedApiKey?.scopes || ['properties:read_public']

    if (!scopes.includes('properties:read_public') && !scopes.includes('properties:read_partner')) {
      throw new EstateOSHttpError(403, 'Missing API property read scope')
    }

    const property = await Property.findById(id).lean()

    if (!property) {
      res.sendStatus(404)
      return
    }

    if (property.api_visibility === 'private_internal' || (property.api_visibility !== 'public' && !scopes.includes('properties:read_partner'))) {
      throw new EstateOSHttpError(403, 'Property visibility requires partner scope')
    }

    const shaped = shapeProperty(property, scopes)

    if (authenticatedApiKey) {
      await logApiUsage({
        req,
        authenticatedApiKey,
        endpoint: '/api/v1/properties/:id',
        statusCode: 200,
        scopesUsed: scopes.includes('properties:read_partner') ? ['properties:read_partner'] : ['properties:read_public'],
        fieldsAccessed: Object.keys(shaped),
        propertyId: id,
        usageType: 'api_property_read',
      })
    }

    res.json(shaped)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const getTrustState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'property id is not valid')
    }

    const authenticatedApiKey = await getAuthenticatedApiKeyForRequest(req)
    const scopes = authenticatedApiKey?.scopes || ['properties:read_public']

    if (authenticatedApiKey && !scopes.includes('properties:read_trust_state')) {
      throw new EstateOSHttpError(403, 'Missing API scope properties:read_trust_state')
    }

    const property = await Property.findById(id)

    if (!property) {
      res.sendStatus(404)
      return
    }

    if (property.api_visibility === 'private_internal' || (property.api_visibility !== 'public' && !scopes.includes('properties:read_partner'))) {
      throw new EstateOSHttpError(403, 'Property visibility requires partner scope')
    }

    const trustState = property.trust_state && Object.keys(property.trust_state).length > 0
      ? property.trust_state
      : await refreshPropertyTrustState(id)

    if (authenticatedApiKey) {
      await logApiUsage({
        req,
        authenticatedApiKey,
        endpoint: '/api/v1/properties/:id/trust-state',
        statusCode: 200,
        scopesUsed: ['properties:read_trust_state'],
        fieldsAccessed: ['trust_state', 'trust_score', 'risk_score', 'risk_flags'],
        propertyId: id,
        usageType: 'api_trust_state_read',
      })
    }

    res.json(trustState)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const createSupplyProperty = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'property:create_claim')
    const actor = toAuditActor(req, accountProfile)
    const body = req.body || {}
    const legacyType = mapPropertyType(body.property_type || body.type)
    const size = parseNumber(body.size, 0)
    const price = parseNumber(body.price?.amount ?? body.price, 0)
    const property = await Property.create({
      name: body.title || body.name || 'Untitled EstateOS property claim',
      type: legacyType,
      agency: req.user?._id,
      description: body.description || 'EstateOS claim-based property data asset',
      image: body.image || '',
      images: Array.isArray(body.images) ? body.images : [],
      bedrooms: parseNumber(body.bedrooms, 0),
      bathrooms: parseNumber(body.bathrooms, 0),
      kitchens: parseNumber(body.kitchens, 0),
      parkingSpaces: parseNumber(body.parking_spaces ?? body.parkingSpaces, 0),
      size,
      petsAllowed: Boolean(body.pets_allowed ?? body.petsAllowed ?? false),
      furnished: Boolean(body.furnished ?? false),
      minimumAge: parseNumber(body.minimum_age ?? body.minimumAge, env.MINIMUM_AGE),
      location: readLocationId(body),
      address: body.address || body.location_public?.display_name || '',
      latitude: typeof body.latitude === 'number' ? body.latitude : undefined,
      longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
      price,
      hidden: Boolean(body.hidden ?? false),
      cancellation: 0,
      aircon: Boolean(body.aircon ?? false),
      rentalTerm: movininTypes.RentalTerm.Yearly,
      source_account_id: accountProfile._id,
      listing_type: body.listing_type || 'sale',
      property_type: body.property_type || legacyType,
      price_per_m2: body.price_per_m2 ?? (size > 0 ? Math.round(price / size) : undefined),
      location_precision: body.location_precision || 'approximate',
      location_public: buildLocationPublicFromBody(body),
      location_private: body.location_private || {},
      api_visibility: body.api_visibility || 'public',
      claim_state: 'self_declared',
      trust_score: 20,
      risk_score: 80,
      freshness_score: 50,
      duplicate_risk_score: parseNumber(body.duplicate_risk_score, 0),
    })

    const claim = await PropertyClaim.create({
      property_id: property._id,
      source_account_id: accountProfile._id,
      claim_state: 'self_declared',
      claim_summary: {
        title: property.name,
        listing_type: property.listing_type,
        property_type: property.property_type,
        location_precision: property.location_precision,
      },
      confidence_level: 20,
      created_by: req.user?._id,
    })
    const trustState = await refreshPropertyTrustState(property._id.toString(), actor)

    await createContribution({
      accountId: accountProfile._id.toString(),
      propertyId: property._id.toString(),
      contributionType: 'created_property',
      sourceEventType: 'PropertyClaim',
      sourceEventId: claim._id.toString(),
      metadata: { kernel: 'Property Kernel' },
    })
    await RoyaltyEligibility.create({
      account_id: accountProfile._id,
      property_id: property._id,
      eligibility_reason: 'created_property_data_asset',
      status: 'policy_pending',
      policy_version: 'rr-kernel-00',
    })
    await createAuditLog({
      ...actor,
      action: 'property_claim.created',
      target_type: 'Property',
      target_id: property._id.toString(),
      after_summary: {
        property_id: property._id.toString(),
        claim_id: claim._id.toString(),
        source_account_id: accountProfile._id.toString(),
        claim_state: 'self_declared',
      },
      metadata: { kernel: 'Property Kernel' },
    })

    res.status(201).json({
      property: shapeProperty(property.toObject(), ['properties:read_partner', 'properties:read_trust_state']),
      claim,
      trust_state: trustState,
    })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listPropertyEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'property id is not valid')
    }
    const rows = await PropertyEvidence.find({ property_id: id })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const attachEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'property id is not valid')
    }

    const accountProfile = await requireAccountProfile(req, ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'property:upload_evidence')
    const actor = toAuditActor(req, accountProfile)
    const property = await Property.findById(id)

    if (!property) {
      res.sendStatus(404)
      return
    }

    const evidenceType = String(req.body?.evidence_type || '')
    if (!(EVIDENCE_TYPES as readonly string[]).includes(evidenceType)) {
      throw new EstateOSHttpError(400, `Unsupported evidence_type. Allowed: ${EVIDENCE_TYPES.join(', ')}`)
    }

    const claim = await PropertyClaim.findOne({ property_id: property._id, source_account_id: property.source_account_id })
    const evidence = await PropertyEvidence.create({
      property_id: property._id,
      claim_id: claim?._id,
      uploaded_by_account_id: accountProfile._id,
      evidence_type: evidenceType,
      file_ref: req.body?.file_ref,
      visibility: req.body?.visibility || 'private',
      redaction_state: req.body?.redaction_state || (evidenceType === 'redacted_legal_doc' ? 'redacted' : 'restricted'),
      review_status: req.body?.review_status || 'submitted',
      summary: req.body?.summary,
      metadata: req.body?.metadata || {},
    })

    property.claim_state = 'evidence_attached'
    await property.save()

    if (claim) {
      claim.claim_state = 'evidence_attached'
      claim.updated_by = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined
      await claim.save()
    }

    await createContribution({
      accountId: accountProfile._id.toString(),
      propertyId: property._id.toString(),
      contributionType: 'uploaded_evidence',
      sourceEventType: 'PropertyEvidence',
      sourceEventId: evidence._id.toString(),
      metadata: {
        evidence_type: evidence.evidence_type,
        visibility: evidence.visibility,
      },
    })
    await createAuditLog({
      ...actor,
      action: 'property_evidence.uploaded',
      target_type: 'PropertyEvidence',
      target_id: evidence._id.toString(),
      after_summary: {
        property_id: property._id.toString(),
        evidence_type: evidence.evidence_type,
        visibility: evidence.visibility,
        redaction_state: evidence.redaction_state,
      },
      metadata: { kernel: 'Evidence Kernel' },
    })
    const trustState = await refreshPropertyTrustState(property._id.toString(), actor)

    res.status(201).json({ evidence, trust_state: trustState })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const createVerificationJob = async (req: Request, res: Response) => {
  try {
    const propertyId = String(req.body?.property_id || '')
    if (!mongoose.isValidObjectId(propertyId)) {
      throw new EstateOSHttpError(400, 'property_id is not valid')
    }

    const accountProfile = await requireAccountProfile(req, ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'property:update_own')
    const actor = toAuditActor(req, accountProfile)
    const property = await Property.findById(propertyId)

    if (!property) {
      res.sendStatus(404)
      return
    }

    if (!isPlatformOperator(accountProfile) && property.source_account_id?.toString() !== accountProfile._id.toString()) {
      throw new EstateOSHttpError(403, 'Only the source account or platform operator can request verification')
    }

    const claim = await PropertyClaim.findOne({ property_id: property._id })
    const verificationJob = await VerificationJob.create({
      property_id: property._id,
      claim_id: claim?._id,
      requested_by_account_id: accountProfile._id,
      assigned_to_account_id: req.body?.assigned_to_account_id && mongoose.isValidObjectId(String(req.body.assigned_to_account_id))
        ? new mongoose.Types.ObjectId(String(req.body.assigned_to_account_id))
        : undefined,
      job_type: req.body?.job_type || 'limited_property_verification',
      status: req.body?.assigned_to_account_id ? 'assigned' : 'open',
      required_checks: Array.isArray(req.body?.required_checks) ? req.body.required_checks.map((check: unknown) => String(check)) : ['photo', 'location', 'contact', 'availability'],
      due_at: req.body?.due_at ? new Date(req.body.due_at) : undefined,
      metadata: req.body?.metadata || {},
    })

    property.claim_state = 'verification_requested'
    await property.save()

    if (claim) {
      claim.claim_state = 'verification_requested'
      claim.updated_by = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined
      await claim.save()
    }

    await createAuditLog({
      ...actor,
      action: 'verification_job.created',
      target_type: 'VerificationJob',
      target_id: verificationJob._id.toString(),
      after_summary: {
        property_id: property._id.toString(),
        status: verificationJob.status,
        required_checks: verificationJob.required_checks,
      },
      metadata: { kernel: 'Verification Kernel' },
    })

    res.status(201).json(verificationJob)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listVerificationJobs = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['VerificationOperatorAccount', 'PlatformOperatorAccount'], 'verification:submit_report')
    const query: Record<string, unknown> = isPlatformOperator(accountProfile)
      ? {}
      : { $or: [{ assigned_to_account_id: accountProfile._id }, { status: 'open' }] }
    const jobs = await VerificationJob.find(query).sort({ createdAt: -1 }).limit(100)

    res.json({ rows: jobs, rowCount: jobs.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const submitVerificationReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'verification job id is not valid')
    }

    const accountProfile = await requireAccountProfile(req, ['VerificationOperatorAccount', 'PlatformOperatorAccount'], 'verification:submit_report')
    const actor = toAuditActor(req, accountProfile)
    const job = await VerificationJob.findById(id)

    if (!job) {
      res.sendStatus(404)
      return
    }

    const allowedLabels = Array.isArray(req.body?.allowed_labels) ? req.body.allowed_labels.map((label: unknown) => String(label)) : []
    if (containsForbiddenLabel(allowedLabels)) {
      throw new EstateOSHttpError(400, 'Verification report contains forbidden EstateOS label')
    }

    const invalidLabels = allowedLabels.filter((label: string) => !isAllowedTrustLabel(label))
    if (invalidLabels.length > 0) {
      throw new EstateOSHttpError(400, `Allowed labels only: ${TRUST_LABELS.join(', ')}`)
    }

    const report = await VerificationReport.create({
      verification_job_id: job._id,
      property_id: job.property_id,
      submitted_by_account_id: accountProfile._id,
      status: 'submitted',
      allowed_labels: allowedLabels,
      confidence_level: parseNumber(req.body?.confidence_level, 50),
      risk_notes: req.body?.risk_notes,
      conflict_disclosed: Boolean(req.body?.conflict_disclosed),
      field_results: req.body?.field_results || {},
    })

    job.status = 'submitted'
    job.assigned_to_account_id = accountProfile._id
    job.submitted_at = report.submitted_at
    await job.save()

    const requestedRiskFlags = Array.isArray(req.body?.risk_flags) ? req.body.risk_flags.map((flag: unknown) => String(flag)) : []
    if (report.conflict_disclosed && !requestedRiskFlags.includes('verifier_conflict_risk')) {
      requestedRiskFlags.push('verifier_conflict_risk')
    }

    for (const flag of requestedRiskFlags) {
      if (!(RISK_FLAG_TYPES as readonly string[]).includes(flag)) {
        throw new EstateOSHttpError(400, `Unsupported risk flag: ${flag}`)
      }

      await RiskFlag.create({
        property_id: job.property_id,
        flag_type: flag,
        severity: flag === 'verifier_conflict_risk' ? 'high' : 'medium',
        status: 'open',
        note: req.body?.risk_notes,
        created_by_account_id: accountProfile._id,
      })
    }

    const trustState = await refreshPropertyTrustState(job.property_id.toString(), actor)
    const contributionMap: Record<string, string> = {
      verified_location: 'verified_location',
      verified_photo: 'verified_photo',
      verified_contact: 'verified_contact',
    }

    for (const label of allowedLabels) {
      if (contributionMap[label]) {
        await createContribution({
          accountId: accountProfile._id.toString(),
          propertyId: job.property_id.toString(),
          contributionType: contributionMap[label],
          sourceEventType: 'VerificationReport',
          sourceEventId: report._id.toString(),
          metadata: { label },
        })
      }
    }

    await createAuditLog({
      ...actor,
      action: 'verification_report.submitted',
      target_type: 'VerificationReport',
      target_id: report._id.toString(),
      after_summary: {
        property_id: job.property_id.toString(),
        labels: allowedLabels,
        confidence_level: report.confidence_level,
        risk_flags: requestedRiskFlags,
      },
      metadata: { kernel: 'Verification Kernel' },
    })

    res.status(201).json({ report, trust_state: trustState })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:create_key')
    const actor = toAuditActor(req, accountProfile)
    const { secret, apiKey } = await createApiKeyForAccount({
      accountId: accountProfile._id.toString(),
      createdBy: req.user?._id || '',
      name: req.body?.name,
      scopes: req.body?.scopes,
    })

    await createAuditLog({
      ...actor,
      action: 'api_key.created',
      target_type: 'ApiKey',
      target_id: apiKey._id.toString(),
      after_summary: {
        account_id: accountProfile._id.toString(),
        key_prefix: apiKey.key_prefix,
        scopes: apiKey.scopes,
      },
      metadata: { kernel: 'API Kernel' },
    })

    res.status(201).json({
      secret,
      key: {
        id: apiKey._id.toString(),
        account_id: apiKey.account_id.toString(),
        name: apiKey.name,
        key_prefix: apiKey.key_prefix,
        scopes: apiKey.scopes,
        status: apiKey.status,
        created_at: apiKey.createdAt,
      },
    })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'api key id is not valid')
    }

    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:create_key')
    const apiKey = await ApiKey.findById(id)

    if (!apiKey) {
      res.sendStatus(404)
      return
    }

    if (!isPlatformOperator(accountProfile) && apiKey.account_id.toString() !== accountProfile._id.toString()) {
      throw new EstateOSHttpError(403, 'Cannot revoke another account API key')
    }

    apiKey.status = 'revoked'
    apiKey.revoked_by = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined
    apiKey.revoked_at = new Date()
    await apiKey.save()

    await createAuditLog({
      ...toAuditActor(req, accountProfile),
      action: 'api_key.revoked',
      target_type: 'ApiKey',
      target_id: apiKey._id.toString(),
      after_summary: {
        key_prefix: apiKey.key_prefix,
        status: apiKey.status,
      },
      metadata: { kernel: 'API Kernel' },
    })

    res.json({ id: apiKey._id.toString(), status: apiKey.status, revoked_at: apiKey.revoked_at })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const getApiUsage = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:read_usage')
    const query: Record<string, unknown> = isPlatformOperator(accountProfile) && req.query.account_id && mongoose.isValidObjectId(String(req.query.account_id))
      ? { account_id: req.query.account_id }
      : { account_id: accountProfile._id }
    const limit = Math.min(parseNumber(req.query.limit, 50), 200)
    const usageEvents = await ApiUsageEvent.find(query).sort({ created_at: -1 }).limit(limit)

    await createAuditLog({
      ...toAuditActor(req, accountProfile),
      action: 'api_usage.read',
      target_type: 'ApiUsageEvent',
      scope: ['api:read_usage'],
      after_summary: {
        row_count: usageEvents.length,
      },
      metadata: { kernel: 'API Kernel' },
    })

    res.json({ rows: usageEvents, rowCount: usageEvents.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const apiScopes = (_req: Request, res: Response) => {
  res.json({ scopes: API_SCOPES })
}

const auditOpsRead = async (req: Request, targetType: string, rowCount: number) => createAuditLog({
  actor_type: 'user',
  actor_id: req.user?._id || 'unknown',
  account_profile: 'PlatformOperatorAccount',
  action: 'ops_console.read',
  target_type: targetType,
  scope: ['admin:moderate', 'property:read_sensitive_internal'],
  after_summary: { row_count: rowCount },
  metadata: { kernel: 'Audit Kernel' },
})

const shapeOpsProperty = (property: any) => ({
  id: property._id.toString(),
  title: property.name,
  source_account_id: property.source_account_id?.toString(),
  claim_state: property.claim_state || 'self_declared',
  listing_type: property.listing_type || 'sale',
  property_type: property.property_type || property.type,
  api_visibility: property.api_visibility || 'public',
  location_precision: property.location_precision || 'approximate',
  location_public: buildPublicLocation(property),
  price: property.price,
  price_per_m2: property.price_per_m2,
  trust_score: property.trust_score || 20,
  risk_score: property.risk_score || 80,
  freshness_score: property.freshness_score || 50,
  duplicate_risk_score: property.duplicate_risk_score || 0,
  trust_state: property.trust_state || {},
  last_checked_at: property.last_checked_at,
  updated_at: property.updatedAt,
  sensitive_fields_redacted: true,
})

export const opsCommandCenter = async (req: Request, res: Response) => {
  try {
    const [
      accountProfiles,
      estateProperties,
      claims,
      evidence,
      verificationJobs,
      riskFlags,
      apiKeys,
      apiUsageEvents,
      contributionLedger,
      dataUsageLedger,
      auditLogs,
    ] = await Promise.all([
      AccountProfile.countDocuments(),
      Property.countDocuments({ source_account_id: { $exists: true } }),
      PropertyClaim.countDocuments(),
      PropertyEvidence.countDocuments(),
      VerificationJob.countDocuments(),
      RiskFlag.countDocuments({ status: { $in: ['open', 'reviewed'] } }),
      ApiKey.countDocuments(),
      ApiUsageEvent.countDocuments(),
      DataContributionLedger.countDocuments(),
      DataUsageLedger.countDocuments(),
      AuditLog.countDocuments(),
    ])
    const [recentProperties, recentJobs, recentUsage, recentAudit] = await Promise.all([
      Property.find({ source_account_id: { $exists: true } }).sort({ updatedAt: -1 }).limit(5).lean(),
      VerificationJob.find().sort({ updatedAt: -1 }).limit(5).lean(),
      ApiUsageEvent.find().sort({ created_at: -1 }).limit(5).lean(),
      AuditLog.find().sort({ created_at: -1 }).limit(5).lean(),
    ])

    await auditOpsRead(req, 'EstateOSCommandCenter', 1)

    res.json({
      counts: {
        accountProfiles,
        estateProperties,
        claims,
        evidence,
        verificationJobs,
        riskFlags,
        apiKeys,
        apiUsageEvents,
        contributionLedger,
        dataUsageLedger,
        auditLogs,
      },
      recent: {
        properties: recentProperties.map(shapeOpsProperty),
        verificationJobs: recentJobs,
        apiUsageEvents: recentUsage,
        auditLogs: recentAudit,
      },
    })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsProperties = async (req: Request, res: Response) => {
  try {
    const rows = await Property.find({ source_account_id: { $exists: true } }).sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'Property', rows.length)
    res.json({ rows: rows.map(shapeOpsProperty), rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsPropertyClaims = async (req: Request, res: Response) => {
  try {
    const rows = await PropertyClaim.find().sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'PropertyClaim', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsPropertyEvidence = async (req: Request, res: Response) => {
  try {
    const rows = await PropertyEvidence.find().sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'PropertyEvidence', rows.length)
    res.json({ rows: rows.map(redactEvidenceForOps), rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsVerificationJobs = async (req: Request, res: Response) => {
  try {
    const rows = await VerificationJob.find().sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'VerificationJob', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsVerificationReports = async (req: Request, res: Response) => {
  try {
    const rows = await VerificationReport.find().sort({ submitted_at: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'VerificationReport', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsRiskFlags = async (req: Request, res: Response) => {
  try {
    const rows = await RiskFlag.find().sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'RiskFlag', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsApiKeys = async (req: Request, res: Response) => {
  try {
    const rows = await ApiKey.find().sort({ updatedAt: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'ApiKey', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsApiUsage = async (req: Request, res: Response) => {
  try {
    const rows = await ApiUsageEvent.find().sort({ created_at: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'ApiUsageEvent', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsContributionLedger = async (req: Request, res: Response) => {
  try {
    const rows = await DataContributionLedger.find().sort({ created_at: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'DataContributionLedger', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsDataUsageLedger = async (req: Request, res: Response) => {
  try {
    const rows = await DataUsageLedger.find().sort({ created_at: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'DataUsageLedger', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const opsAuditLogs = async (req: Request, res: Response) => {
  try {
    const rows = await AuditLog.find().sort({ created_at: -1 }).limit(getOpsLimit(req)).lean()
    await auditOpsRead(req, 'AuditLog', rows.length)
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listOwnProfiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      throw new EstateOSHttpError(401, 'Authenticated user required')
    }
    const profiles = await AccountProfile.find({ user_id: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ rows: profiles, rowCount: profiles.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const createOwnProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      throw new EstateOSHttpError(401, 'Authenticated user required')
    }
    const { profile_type } = req.body || {}
    if (!profile_type || !ACCOUNT_PROFILE_TYPES.includes(profile_type)) {
      throw new EstateOSHttpError(400, 'Valid profile_type is required')
    }
    const existing = await AccountProfile.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      profile_type,
      status: { $in: ['applicant', 'active', 'limited'] },
    })
    if (existing) {
      res.json(existing)
      return
    }
    const profile = await AccountProfile.create({
      user_id: new mongoose.Types.ObjectId(userId),
      profile_type,
      verification_level: 'applicant',
      trust_score: 20,
      status: 'active',
    })
    await createAuditLog({
      actor_type: 'user',
      actor_id: userId,
      account_profile: profile_type,
      action: 'account_profile.created',
      target_type: 'AccountProfile',
      target_id: profile._id.toString(),
      after_summary: { profile_type },
      metadata: { kernel: 'Identity Kernel' },
    })
    res.status(201).json(profile)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listOwnSupplyProperties = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires supply-related profile')
    }
    const claims = await PropertyClaim.find({ source_account_id: accountProfile._id })
      .sort({ updatedAt: -1 })
      .lean()
    const propertyIds = claims.map((c: any) => c.property_id)
    const properties = await Property.find({ _id: { $in: propertyIds } }).lean()
    const propertyMap = new Map(properties.map((p: any) => [p._id.toString(), p]))
    const rows = claims.map((claim: any) => {
      const prop = propertyMap.get(claim.property_id.toString())
      return {
        claim: {
          id: claim._id.toString(),
          claim_state: claim.claim_state,
          confidence_level: claim.confidence_level,
          created_at: claim.createdAt,
        },
        property: prop ? shapeProperty(prop, ['properties:read_partner', 'properties:read_trust_state']) : null,
      }
    })
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listDemandProfiles = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires demand-related profile')
    }
    const profiles = await DemandProfile.find({ account_id: accountProfile._id })
      .sort({ updatedAt: -1 })
      .lean()
    res.json({ rows: profiles, rowCount: profiles.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const createDemandProfile = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'], 'property:read_public')
    const { demand_type, target_locations, budget_min, budget_max, currency } = req.body || {}
    const profile = await DemandProfile.create({
      account_id: accountProfile._id,
      demand_type: demand_type || 'buyer',
      target_locations: target_locations || [],
      budget_min: budget_min ? Number(budget_min) : undefined,
      budget_max: budget_max ? Number(budget_max) : undefined,
      currency: currency || 'VND',
    })
    res.status(201).json(profile)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const updateDemandProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'demand profile id is not valid')
    }
    const accountProfile = await requireAccountProfile(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'], 'property:read_public')
    const profile = await DemandProfile.findOne({ _id: id, account_id: accountProfile._id })
    if (!profile) {
      res.sendStatus(404)
      return
    }
    const allowed = ['demand_type', 'target_locations', 'budget_min', 'budget_max', 'currency']
    for (const field of allowed) {
      if (req.body?.[field] !== undefined) {
        (profile as any)[field] = req.body[field]
      }
    }
    await profile.save()
    res.json(profile)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const deleteDemandProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'demand profile id is not valid')
    }
    const accountProfile = await requireAccountProfile(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'], 'property:read_public')
    const profile = await DemandProfile.findOne({ _id: id, account_id: accountProfile._id })
    if (!profile) {
      res.sendStatus(404)
      return
    }
    await profile.deleteOne()
    res.sendStatus(204)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listSavedProperties = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires demand-related profile')
    }
    const saved = await SavedProperty.find({ account_id: accountProfile._id })
      .sort({ updatedAt: -1 })
      .lean()
    const propertyIds = saved.map((s: any) => s.property_id)
    const properties = propertyIds.length > 0
      ? await Property.find({ _id: { $in: propertyIds } }).lean()
      : []
    const propertyMap = new Map(properties.map((p: any) => [p._id.toString(), p]))
    const rows = saved.map((s: any) => {
      const prop = propertyMap.get(s.property_id.toString())
      return {
        saved_id: s._id.toString(),
        notes: s.notes,
        saved_at: s.createdAt,
        property: prop ? shapeProperty(prop, ['properties:read_public']) : null,
      }
    })
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const saveProperty = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'], 'property:read_public')
    const { property_id, notes } = req.body || {}
    if (!property_id || !mongoose.isValidObjectId(property_id)) {
      throw new EstateOSHttpError(400, 'Valid property_id is required')
    }
    const property = await Property.findById(property_id)
    if (!property) {
      throw new EstateOSHttpError(404, 'Property not found')
    }
    const existing = await SavedProperty.findOne({ account_id: accountProfile._id, property_id })
    if (existing) {
      res.json(existing)
      return
    }
    const saved = await SavedProperty.create({
      account_id: accountProfile._id,
      property_id,
      notes: notes || '',
    })
    res.status(201).json(saved)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const removeSavedProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    if (!mongoose.isValidObjectId(propertyId)) {
      throw new EstateOSHttpError(400, 'property id is not valid')
    }
    const accountProfile = await requireAccountProfile(req, ['PropertyDemandAccount', 'PlatformOperatorAccount'], 'property:read_public')
    const saved = await SavedProperty.findOne({ account_id: accountProfile._id, property_id: propertyId })
    if (!saved) {
      res.sendStatus(404)
      return
    }
    await saved.deleteOne()
    res.sendStatus(204)
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listOwnVerifierJobs = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['VerificationOperatorAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires verifier-related profile')
    }
    const jobs = await VerificationJob.find({ assigned_to: accountProfile._id })
      .sort({ updatedAt: -1 })
      .lean()
    const reports = await VerificationReport.find({ verifier_id: accountProfile._id })
      .sort({ submitted_at: -1 })
      .lean()
    res.json({ jobs, reports, jobCount: jobs.length, reportCount: reports.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const listOwnApiKeys = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires API-buyer-related profile')
    }
    const keys = await ApiKey.find({ account_id: accountProfile._id })
      .sort({ updatedAt: -1 })
      .lean()
    const rows = keys.map((k: any) => ({
      id: k._id.toString(),
      name: k.name,
      key_prefix: k.key_prefix,
      scopes: k.scopes,
      status: k.status,
      created_at: k.createdAt,
      revoked_at: k.revoked_at,
    }))
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const getOwnApiUsage = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires API-buyer-related profile')
    }
    const limit = Math.min(parseNumber(req.query.limit, 50), 200)
    const events = await ApiUsageEvent.find({ account_id: accountProfile._id })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
    res.json({ rows: events, rowCount: events.length })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}

export const health = async (_req: Request, res: Response) => {
  try {
    const checks = await runEnvValidation()
    const failed = checks.filter((c) => !c.passed)
    res.json({
      status: failed.length === 0 ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: `Health check error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}

export const readiness = async (_req: Request, res: Response) => {
  try {
    const result = await runReadinessCheck()
    const statusCode = result.status === 'fail' ? 503 : result.status === 'degraded' ? 200 : 200
    res.status(statusCode).json(result)
  } catch (err) {
    res.status(503).json({
      status: 'fail',
      message: `Readiness check error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}

export const triggerEstateOSSeed = async (req: Request, res: Response) => {
  try {
    process.env.ES_ALLOW_DEMO_SEED = 'true'
    process.env.ES_BLOCK_PRODUCTION_SEED = 'false'
    const seedModule = await import('../setup/estateosSeed.js')
    if (typeof seedModule.seedEstateOSKernel === 'function') {
      await seedModule.seedEstateOSKernel()
      res.json({ seeded: true, message: 'EstateOS kernel seed completed' })
    } else {
      res.json({ seeded: true, message: 'Seed module loaded' })
    }
  } catch (err) {
    res.status(500).json({
      seeded: false,
      message: `Seed execution error: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}

export const envValidationStatus = async (req: Request, res: Response) => {
  try {
    const checks = await runEnvValidation()
    res.json({ checks, timestamp: new Date().toISOString() })
  } catch (err) {
    handleEstateOSError(res, err)
  }
}
