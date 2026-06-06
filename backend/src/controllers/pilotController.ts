import { Request, Response } from 'express'
import Property from '../models/Property'
import PropertyEvidence from '../models/PropertyEvidence'
import AccountProfile from '../models/AccountProfile'
import ManualInvoice from '../models/ManualInvoice'
import ApiUsageEvent from '../models/ApiUsageEvent'
import PartnerApplication from '../models/PartnerApplication'
import ApiKey from '../models/ApiKey'
import { PILOT_AREA } from '../estateos/constants'

export const getPilotMetrics = async (_req: Request, res: Response) => {
  const areaQuery = { 'location_public.city': { $in: [...PILOT_AREA] } }
  const [
    propertiesTotal,
    apiGradeProperties,
    verifiedLocationCount,
    freshInventoryCount,
    sourceAccountsCount,
    verificationPackagesRequested,
    invoicesPaid,
    partnerApplicationsCount,
    sandboxPartnersCount,
    apiCallsCount,
    dataProductExportsCount,
    evidenceCount,
  ] = await Promise.all([
    Property.countDocuments({ ...areaQuery, source_account_id: { $exists: true } }),
    Property.countDocuments({ ...areaQuery, quality_level: { $in: ['high', 'api_grade'] } }),
    Property.countDocuments({ ...areaQuery, 'trust_state.location_status': 'verified_location' }),
    Property.countDocuments({ ...areaQuery, freshness_score: { $gte: 50 } }),
    AccountProfile.countDocuments(),
    ManualInvoice.countDocuments({ verification_package_type: { $exists: true } }),
    ManualInvoice.countDocuments({ status: 'paid' }),
    PartnerApplication.countDocuments(),
    ApiKey.countDocuments({ environment: 'sandbox', status: 'active' }),
    ApiUsageEvent.countDocuments(),
    ApiUsageEvent.countDocuments({ endpoint: { $regex: '/export' } }),
    PropertyEvidence.countDocuments(),
  ])

  const qualityImprovementRate = propertiesTotal > 0
    ? Math.round((apiGradeProperties / propertiesTotal) * 100)
    : 0

  res.json({
    properties_total: propertiesTotal,
    api_grade_properties: apiGradeProperties,
    verified_location_count: verifiedLocationCount,
    verified_photo_count: 0,
    fresh_inventory_count: freshInventoryCount,
    source_accounts_count: sourceAccountsCount,
    verification_packages_requested: verificationPackagesRequested,
    verification_packages_paid: invoicesPaid,
    evidence_count: evidenceCount,
    partner_applications_count: partnerApplicationsCount,
    sandbox_partners_count: sandboxPartnersCount,
    api_calls_count: apiCallsCount,
    data_product_exports_count: dataProductExportsCount,
    invoices_paid: invoicesPaid,
    quality_improvement_rate: qualityImprovementRate,
  })
}