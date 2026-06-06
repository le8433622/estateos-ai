import mongoose from 'mongoose'
import Property from '../models/Property'
import PropertyEvidence, { PropertyEvidenceDocument } from '../models/PropertyEvidence'
import VerificationReport, { VerificationReportDocument } from '../models/VerificationReport'
import RiskFlag, { RiskFlagDocument } from '../models/RiskFlag'
import {
  EstateOSTrustLabel,
  EstateOSTrustState,
  RiskFlagType,
  containsForbiddenLabel,
  isAllowedTrustLabel,
} from '../estateos/constants'
import { createAuditLog, AuditActorContext } from './auditService'

const scoreCap = (score: number) => Math.max(0, Math.min(100, score))

const latestDate = (dates: (Date | undefined)[]) => dates
  .filter(Boolean)
  .reduce<Date | undefined>((latest, date) => {
    if (!latest || (date as Date).getTime() > latest.getTime()) {
      return date as Date
    }

    return latest
  }, undefined)

const hasEvidenceType = (evidence: PropertyEvidenceDocument[], types: string[]) => evidence.some((item) => types.includes(item.evidence_type))

const hasAcceptedEvidenceType = (evidence: PropertyEvidenceDocument[], types: string[]) => evidence.some((item) => (
  types.includes(item.evidence_type) && ['accepted_limited', 'under_review'].includes(item.review_status)
))

const collectReportLabels = (reports: VerificationReportDocument[]) => {
  const labels = reports.flatMap((report) => report.allowed_labels || [])

  if (containsForbiddenLabel(labels)) {
    throw new Error('Verification report contains forbidden EstateOS label')
  }

  const invalidLabels = labels.filter((label) => !isAllowedTrustLabel(label))
  if (invalidLabels.length > 0) {
    throw new Error(`Verification report contains unsupported labels: ${invalidLabels.join(', ')}`)
  }

  return labels as EstateOSTrustLabel[]
}

const addRiskFlag = (flags: Set<RiskFlagType>, flag: RiskFlagType) => {
  flags.add(flag)
}

export const generateTrustState = (
  property: any,
  evidence: PropertyEvidenceDocument[] = [],
  reports: VerificationReportDocument[] = [],
  riskFlags: RiskFlagDocument[] = [],
): EstateOSTrustState => {
  const reportLabels = collectReportLabels(reports)
  const labels = new Set<EstateOSTrustLabel>()
  const derivedRiskFlags = new Set<RiskFlagType>()
  const hasEvidence = evidence.length > 0

  labels.add(hasEvidence ? 'evidence_attached' : 'self_declared')

  for (const label of reportLabels) {
    labels.add(label)
  }

  const photoVerified = reportLabels.includes('verified_photo') || hasAcceptedEvidenceType(evidence, ['photo', 'video', 'field_check_photo'])
  const locationVerified = reportLabels.includes('verified_location') || hasAcceptedEvidenceType(evidence, ['location_pin', 'field_check_photo'])
  const contactVerified = reportLabels.includes('verified_contact') || hasAcceptedEvidenceType(evidence, ['contact_proof', 'owner_confirmation', 'authorization_message'])
  const availabilityChecked = reportLabels.includes('availability_checked') || hasAcceptedEvidenceType(evidence, ['availability_proof'])
  const operatorChecked = reportLabels.includes('operator_checked')
  const authorizedSource = reportLabels.includes('authorized_source') || hasAcceptedEvidenceType(evidence, ['authorization_message', 'owner_confirmation', 'developer_price_sheet'])
  const trustedDataOwner = reportLabels.includes('trusted_data_owner')

  if (photoVerified) {
    labels.add('verified_photo')
  }

  if (locationVerified) {
    labels.add('verified_location')
  }

  if (contactVerified) {
    labels.add('verified_contact')
  }

  if (availabilityChecked) {
    labels.add('availability_checked')
  }

  if (operatorChecked) {
    labels.add('operator_checked')
  }

  if (authorizedSource) {
    labels.add('authorized_source')
  }

  if (trustedDataOwner) {
    labels.add('trusted_data_owner')
  }

  if (!hasEvidenceType(evidence, ['redacted_legal_doc'])) {
    labels.add('legal_not_verified')
    addRiskFlag(derivedRiskFlags, 'legal_document_not_verified')
  }

  if (!contactVerified) {
    addRiskFlag(derivedRiskFlags, 'contact_unverified')
  }

  if (!locationVerified || ['approximate', 'city'].includes(property.location_precision)) {
    addRiskFlag(derivedRiskFlags, 'location_precision_low')
  }

  if ((property.duplicate_risk_score || 0) >= 60) {
    addRiskFlag(derivedRiskFlags, 'duplicate_listing_risk')
  }

  const lastCheckedAt = latestDate([
    property.last_checked_at,
    ...reports.map((report) => report.submitted_at),
    ...evidence.map((item) => item.updatedAt),
  ]) || new Date()
  const daysSinceChecked = (Date.now() - lastCheckedAt.getTime()) / (1000 * 60 * 60 * 24)

  if (!availabilityChecked || daysSinceChecked > 30) {
    addRiskFlag(derivedRiskFlags, 'availability_stale')
  }

  for (const riskFlag of riskFlags) {
    if (riskFlag.status !== 'resolved' && riskFlag.status !== 'dismissed') {
      addRiskFlag(derivedRiskFlags, riskFlag.flag_type)
    }
  }

  let trustScore = hasEvidence ? 35 : 20
  trustScore += photoVerified ? 10 : 0
  trustScore += locationVerified ? 12 : 0
  trustScore += contactVerified ? 10 : 0
  trustScore += availabilityChecked ? 8 : 0
  trustScore += operatorChecked ? 10 : 0
  trustScore += authorizedSource ? 10 : 0
  trustScore += trustedDataOwner ? 10 : 0
  trustScore -= derivedRiskFlags.size * 4
  trustScore -= Math.round((property.duplicate_risk_score || 0) / 10)
  trustScore = scoreCap(trustScore)

  const riskScore = scoreCap(100 - trustScore + (derivedRiskFlags.size * 3))

  return {
    claim_level: hasEvidence ? 'evidence_attached' : 'self_declared',
    evidence_level: operatorChecked ? 'operator_checked' : hasEvidence ? 'evidence_attached' : 'self_declared',
    location_status: locationVerified ? 'verified_location' : 'not_verified',
    photo_status: photoVerified ? 'verified_photo' : 'not_verified',
    contact_status: contactVerified ? 'verified_contact' : 'not_verified',
    availability_status: availabilityChecked ? 'availability_checked' : 'not_verified',
    legal_status: hasEvidenceType(evidence, ['redacted_legal_doc']) ? 'legal_evidence_attached_redacted' : 'legal_not_verified',
    labels: Array.from(labels),
    trust_score: trustScore,
    risk_score: riskScore,
    risk_flags: Array.from(derivedRiskFlags),
    last_checked_at: lastCheckedAt,
  }
}

export const refreshPropertyTrustState = async (propertyId: string, actor?: AuditActorContext) => {
  if (!mongoose.isValidObjectId(propertyId)) {
    throw new Error('property_id is not valid')
  }

  const property = await Property.findById(propertyId)

  if (!property) {
    throw new Error('Property not found')
  }

  const evidence = await PropertyEvidence.find({ property_id: property._id })
  const reports = await VerificationReport.find({ property_id: property._id }).sort({ submitted_at: -1 })
  const riskFlags = await RiskFlag.find({ property_id: property._id })
  const beforeState = property.trust_state as Record<string, unknown> | undefined
  const trustState = generateTrustState(property, evidence, reports, riskFlags)

  property.trust_state = trustState as unknown as Record<string, unknown>
  property.trust_score = trustState.trust_score
  property.risk_score = trustState.risk_score
  property.last_checked_at = trustState.last_checked_at
  await property.save()

  if (actor) {
    await createAuditLog({
      ...actor,
      action: 'trust_state.generated',
      target_type: 'Property',
      target_id: property._id.toString(),
      before_summary: beforeState,
      after_summary: {
        trust_score: trustState.trust_score,
        risk_score: trustState.risk_score,
        labels: trustState.labels,
        risk_flags: trustState.risk_flags,
      },
    })
  }

  return trustState
}
