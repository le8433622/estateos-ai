import mongoose from 'mongoose'
import Property from '../models/Property'
import PropertyEvidence from '../models/PropertyEvidence'
import PropertyClaim from '../models/PropertyClaim'
import VerificationReport from '../models/VerificationReport'

const MAX_FRESHNESS_DAYS = 90
const STALE_DAYS = 45

export interface QualityResult {
  quality_score: number
  quality_level: 'low' | 'medium' | 'high' | 'api_grade'
  missing_fields: string[]
  recommended_next_actions: string[]
  quality_flags: string[]
  freshness_score: number
}

export const computePropertyQuality = async (propertyId: string): Promise<QualityResult> => {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new Error('Invalid property ID')
  }
  const property = await Property.findById(propertyId).lean()
  if (!property) {
    throw new Error('Property not found')
  }
  const evidenceCount = await PropertyEvidence.countDocuments({ property_id: propertyId })
  await PropertyClaim.findOne({ property_id: propertyId }).lean()
  const reports = await VerificationReport.find({ property_id: propertyId }).lean()

  const fields: Record<string, boolean> = {
    has_title: Boolean(property.name && property.name !== 'Untitled EstateOS property claim'),
    has_description: Boolean(property.description && property.description.length > 20),
    has_price: Boolean(property.price && property.price > 0),
    has_size: Boolean(property.size && property.size > 0),
    has_images: Boolean(property.images && property.images.length > 0),
    has_location: Boolean(property.location_public && Object.keys(property.location_public).length > 0),
    has_lat_lng: typeof property.latitude === 'number' && typeof property.longitude === 'number',
    has_contact: false,
    has_source: Boolean(property.source_account_id),
    has_precise_location: ['district', 'district_plus_area', 'exact_private'].includes(property.location_precision || ''),
    has_evidence: evidenceCount > 0,
    has_verification: reports.length > 0,
    has_photo_evidence: false,
    has_location_verified: false,
    has_contact_verified: false,
    has_availability_checked: false,
    has_reasonable_price_per_m2: false,
    has_freshness: false,
    has_low_duplicate_risk: (property.duplicate_risk_score || 0) < 40,
  }

  for (const rpt of reports) {
    const labels = (rpt as any).allowed_labels || []
    if (labels.includes('verified_photo')) {
fields.has_photo_evidence = true
}
    if (labels.includes('verified_location')) {
fields.has_location_verified = true
}
    if (labels.includes('verified_contact')) {
fields.has_contact_verified = true
}
    if (labels.includes('availability_checked')) {
fields.has_availability_checked = true
}
    fields.has_contact = fields.has_contact || labels.includes('verified_contact')
  }

  const evidenceTypes = await PropertyEvidence.distinct('evidence_type', { property_id: propertyId })
  if (evidenceTypes.includes('contact_proof') || evidenceTypes.includes('owner_confirmation')) {
    fields.has_contact = true
  }

  const pricePerM2 = property.price_per_m2 || (property.size && property.size > 0 ? Math.round((property.price || 0) / property.size) : 0)
  fields.has_reasonable_price_per_m2 = pricePerM2 > 0 && pricePerM2 < 500000000

  const daysSinceUpdate = property.updatedAt
    ? Math.floor((Date.now() - new Date(property.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  fields.has_freshness = daysSinceUpdate < STALE_DAYS

  const fieldWeights: Record<string, number> = {
    has_title: 5,
    has_description: 4,
    has_price: 8,
    has_size: 6,
    has_images: 5,
    has_location: 6,
    has_lat_lng: 3,
    has_contact: 8,
    has_source: 6,
    has_precise_location: 5,
    has_evidence: 10,
    has_verification: 10,
    has_photo_evidence: 5,
    has_location_verified: 5,
    has_contact_verified: 5,
    has_availability_checked: 3,
    has_reasonable_price_per_m2: 3,
    has_freshness: 2,
    has_low_duplicate_risk: 1,
  }

  let totalWeight = 0
  let earnedWeight = 0
  for (const [field, weight] of Object.entries(fieldWeights)) {
    totalWeight += weight
    if (fields[field]) {
      earnedWeight += weight
    }
  }

  const freshnessScore = Math.max(0, Math.min(100, Math.round(100 - (daysSinceUpdate / MAX_FRESHNESS_DAYS) * 100)))
  const qualityScore = Math.min(100, Math.round((earnedWeight / totalWeight) * 100))

  const qualityLevel = qualityScore >= 80 ? 'api_grade'
    : qualityScore >= 60 ? 'high'
    : qualityScore >= 35 ? 'medium'
    : 'low'

  const missingFields: string[] = []
  if (!fields.has_title) {
missingFields.push('title')
}
  if (!fields.has_description) {
missingFields.push('description')
}
  if (!fields.has_price) {
missingFields.push('price')
}
  if (!fields.has_size) {
missingFields.push('size')
}
  if (!fields.has_images) {
missingFields.push('images')
}
  if (!fields.has_location) {
missingFields.push('location')
}
  if (!fields.has_contact) {
missingFields.push('contact_info')
}
  if (!fields.has_evidence) {
missingFields.push('evidence')
}
  if (!fields.has_verification) {
missingFields.push('verification')
}
  if (!fields.has_precise_location) {
missingFields.push('precise_location')
}

  const actions: string[] = []
  if (!fields.has_evidence) {
actions.push('Upload evidence (photo, location, contact)')
}
  if (!fields.has_verification) {
actions.push('Request a verification package')
}
  if (!fields.has_contact) {
actions.push('Add contact proof or owner confirmation')
}
  if (!fields.has_images) {
actions.push('Add property photos')
}
  if (!fields.has_precise_location) {
actions.push('Improve location precision')
}
  if (!fields.has_freshness) {
actions.push('Update property availability')
}
  if (fields.has_low_duplicate_risk === false) {
actions.push('Review duplicate risk flags')
}
  if (qualityLevel !== 'api_grade' && fields.has_evidence && fields.has_verification) {
    actions.push('Consider upgrading API visibility to partner_trust')
  }

  const qualityFlags: string[] = []
  if (daysSinceUpdate > STALE_DAYS) {
qualityFlags.push('stale_listing')
}
  if (!fields.has_evidence) {
qualityFlags.push('missing_evidence')
}
  if (!fields.has_source) {
qualityFlags.push('no_source_attribution')
}
  if ((property.duplicate_risk_score || 0) >= 40) {
qualityFlags.push('duplicate_risk')
}
  if (fields.has_reasonable_price_per_m2 === false && fields.has_price) {
qualityFlags.push('price_sanity_concern')
}
  if (qualityLevel === 'low') {
qualityFlags.push('low_quality')
}
  if (!fields.has_contact) {
qualityFlags.push('contact_unavailable')
}

  await Property.findByIdAndUpdate(propertyId, {
    $set: {
      quality_score: qualityScore,
      quality_level: qualityLevel,
      freshness_score: freshnessScore,
      last_quality_check_at: new Date(),
    },
  })

  return {
    quality_score: qualityScore,
    quality_level: qualityLevel,
    missing_fields: missingFields,
    recommended_next_actions: actions,
    quality_flags: qualityFlags,
    freshness_score: freshnessScore,
  }
}

export interface DuplicateCandidate {
  property_id: string
  matched_property_id: string
  similarity_score: number
  match_reasons: string[]
}

export const findDuplicateCandidates = async (propertyId: string): Promise<DuplicateCandidate[]> => {
  if (!mongoose.isValidObjectId(propertyId)) {
    return []
  }
  const property = await Property.findById(propertyId).lean()
  if (!property) {
return []
}

  const candidates: DuplicateCandidate[] = []
  const price = property.price || 0
  const size = property.size || 0
  const titleWords = (property.name || '').toLowerCase().split(/\s+/).filter(Boolean)
  const locationCity = (property as any).location_public?.city || ''

  const query: Record<string, unknown> = {
    _id: { $ne: property._id },
    hidden: { $ne: true },
  }

  if (titleWords.length > 0) {
    const anyWordPattern = titleWords.map((w) => ({ name: { $regex: w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }))
    query.$or = [
      ...anyWordPattern.slice(0, 3),
    ]
  }

  const potential = await Property.find(query).limit(20).lean()

  for (const other of potential) {
    const reasons: string[] = []
    let score = 0

    const otherTitle = (other.name || '').toLowerCase()
    const titleOverlap = titleWords.filter((w) => otherTitle.includes(w)).length
    if (titleOverlap > 0 && titleOverlap >= titleWords.length * 0.5) {
      score += 30
      reasons.push('title_similar')
    }

    const otherPrice = other.price || 0
    if (price > 0 && otherPrice > 0) {
      const priceDiff = Math.abs(price - otherPrice) / Math.max(price, otherPrice)
      if (priceDiff < 0.15) {
        score += 20
        reasons.push('price_similar')
      }
    }

    const otherSize = other.size || 0
    if (size > 0 && otherSize > 0) {
      const sizeDiff = Math.abs(size - otherSize) / Math.max(size, otherSize)
      if (sizeDiff < 0.15) {
        score += 15
        reasons.push('size_similar')
      }
    }

    const otherCity = (other as any).location_public?.city || ''
    if (locationCity && otherCity && locationCity === otherCity) {
      score += 10
      reasons.push('same_city')
    }

    const sameSource = property.source_account_id && other.source_account_id
      && property.source_account_id.toString() === other.source_account_id.toString()
    if (sameSource) {
      score += 10
      reasons.push('same_source')
    }

    if ((property.latitude && property.longitude && other.latitude && other.longitude)) {
      const latDiff = Math.abs(property.latitude - other.latitude)
      const lngDiff = Math.abs(property.longitude - other.longitude)
      if (latDiff < 0.01 && lngDiff < 0.01) {
        score += 15
        reasons.push('nearby_location')
      }
    }

    if (score >= 30) {
      candidates.push({
        property_id: propertyId,
        matched_property_id: other._id.toString(),
        similarity_score: Math.min(score, 100),
        match_reasons: reasons,
      })
    }
  }

  return candidates
}

export const refreshAllQuality = async () => {
  const propertyIds = await Property.find({ source_account_id: { $exists: true } }).distinct('_id')
  const results: Array<{ property_id: string; quality_score: number; quality_level: string }> = []
  for (const id of propertyIds) {
    const result = await computePropertyQuality(id.toString())
    if (result.quality_score > 0) {
      const duplicates = await findDuplicateCandidates(id.toString())
      if (duplicates.length > 0) {
        await Property.findByIdAndUpdate(id, {
          $set: { duplicate_risk_score: Math.min(100, duplicates.reduce((max, d) => Math.max(max, d.similarity_score), 0)) },
        })
      }
    }
    results.push({ property_id: id.toString(), quality_score: result.quality_score, quality_level: result.quality_level })
  }
  return results
}

export interface MarketSignals {
  total_properties: number
  by_province: Record<string, number>
  quality_distribution: Record<string, number>
  verification_coverage: number
  duplicate_risk_count: number
  api_grade_count: number
  stale_count: number
  freshness_avg: number
  top_property_types: Array<{ type: string; count: number }>
}

export const computeMarketSignals = async (): Promise<MarketSignals> => {
  const totalProperties = await Property.countDocuments({ source_account_id: { $exists: true } })
  const properties = await Property.find({ source_account_id: { $exists: true } }).lean()

  const byProvince: Record<string, number> = {}
  const qualityDist: Record<string, number> = { low: 0, medium: 0, high: 0, api_grade: 0 }
  const typeCount: Record<string, number> = {}
  let verifiedCount = 0
  let duplicateCount = 0
  let apiGradeCount = 0
  let staleCount = 0
  let totalFreshness = 0

  for (const p of properties) {
    const city = (p as any).location_public?.city || 'unknown'
    byProvince[city] = (byProvince[city] || 0) + 1

    const ql = (p as any).quality_level || 'low'
    qualityDist[ql] = (qualityDist[ql] || 0) + 1

    const pType = p.property_type || p.type || 'unknown'
    typeCount[pType] = (typeCount[pType] || 0) + 1

    const ts = (p as any).trust_state || {}
    if (ts.labels?.includes('verified_photo') || ts.labels?.includes('verified_location')) {
      verifiedCount += 1
    }

    if ((p.duplicate_risk_score || 0) >= 40) {
duplicateCount += 1
}
    if (ql === 'api_grade') {
apiGradeCount += 1
}

    const daysSinceUpdate = p.updatedAt
      ? Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    if (daysSinceUpdate > STALE_DAYS) {
staleCount += 1
}
    totalFreshness += Math.max(0, Math.min(100, 100 - (daysSinceUpdate / MAX_FRESHNESS_DAYS) * 100))
  }

  const topTypes = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    total_properties: totalProperties,
    by_province: byProvince,
    quality_distribution: qualityDist,
    verification_coverage: totalProperties > 0 ? Math.round((verifiedCount / totalProperties) * 100) : 0,
    duplicate_risk_count: duplicateCount,
    api_grade_count: apiGradeCount,
    stale_count: staleCount,
    freshness_avg: totalProperties > 0 ? Math.round(totalFreshness / totalProperties) : 0,
    top_property_types: topTypes,
  }
}