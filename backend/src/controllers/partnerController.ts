import mongoose from 'mongoose'
import { Request, Response } from 'express'
import PartnerApplication from '../models/PartnerApplication'
import PartnerAgreement from '../models/PartnerAgreement'
import ApiKey from '../models/ApiKey'
import AccountProfile from '../models/AccountProfile'
import { EstateOSHttpError } from '../services/accountProfileService'
import { createAuditLog } from '../services/auditService'
import { createApiKeyForAccount } from '../services/apiKeyService'

const handlePartnerError = (res: Response, err: unknown) => {
  if (err instanceof EstateOSHttpError) {
 res.status(err.statusCode).send({ message: err.message }); return 
}
  if (err instanceof Error) {
 res.status(400).send({ message: err.message }); return 
}
  res.status(400).send({ message: 'Partner request failed' })
}

export const createApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Authenticated user required')
}

    const {
      organization_name, contact_name, email, phone, partner_type, intended_use_case,
      requested_data_products, requested_locations, expected_monthly_usage, current_system_or_app,
    } = req.body || {}

    if (!organization_name || !contact_name || !email || !partner_type || !intended_use_case) {
      throw new EstateOSHttpError(400, 'Required fields: organization_name, contact_name, email, partner_type, intended_use_case')
    }

    const application = await PartnerApplication.create({
      user_id: userId,
      organization_name, contact_name, email, phone,
      partner_type, intended_use_case,
      requested_data_products: requested_data_products || [],
      requested_locations: requested_locations || [],
      expected_monthly_usage: expected_monthly_usage || 0,
      current_system_or_app,
      privacy_acknowledgement: true,
      status: 'submitted',
    })

    await createAuditLog({
      actor_type: 'user', actor_id: userId.toString(), account_profile: 'ApiDataBuyerAccount',
      action: 'partner_application.created',
      target_type: 'PartnerApplication', target_id: application._id.toString(),
      after_summary: { organization_name, partner_type, status: 'submitted' },
      metadata: { kernel: 'API Kernel' },
    })

    res.status(201).json(application)
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const getMyApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Authenticated user required')
}
    const app = await PartnerApplication.findOne({ user_id: userId }).sort({ createdAt: -1 }).lean()
    if (!app) {
 res.json(null); return 
}
    res.json(app)
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const getMyAgreements = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Authenticated user required')
}
    const app = await PartnerApplication.findOne({ user_id: userId }).sort({ createdAt: -1 }).lean()
    if (!app) {
 res.json({ rows: [], rowCount: 0 }); return 
}
    const agreements = await PartnerAgreement.find({ partner_application_id: app._id }).lean()
    res.json({ rows: agreements, rowCount: agreements.length })
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const acceptAgreement = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Authenticated user required')
}
    const { agreement_type, version } = req.body || {}
    if (!agreement_type) {
throw new EstateOSHttpError(400, 'agreement_type is required')
}

    const app = await PartnerApplication.findOne({ user_id: userId }).sort({ createdAt: -1 })
    if (!app) {
throw new EstateOSHttpError(404, 'No partner application found')
}

    const agreement = await PartnerAgreement.create({
      partner_application_id: app._id,
      agreement_type,
      version: version || 'v1',
      accepted_by: userId,
      accepted_at: new Date(),
      ip_address: req.ip || '',
      status: 'accepted',
    })
    res.status(201).json(agreement)
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const getSandboxCredentials = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Authenticated user required')
}

    const app = await PartnerApplication.findOne({ user_id: userId }).sort({ createdAt: -1 }).lean()
    if (!app || !['approved_for_trial', 'approved_for_production'].includes(app.status)) {
      throw new EstateOSHttpError(403, 'Partner application must be approved for sandbox access')
    }

    let accountProfile = await AccountProfile.findOne({ user_id: userId, profile_type: 'ApiDataBuyerAccount', status: 'active' }).lean()
    if (!accountProfile) {
      accountProfile = await AccountProfile.create({
        user_id: userId, profile_type: 'ApiDataBuyerAccount', verification_level: 'applicant', trust_score: 20, status: 'active',
      })
    }

    const existingSandboxKey = await ApiKey.findOne({ account_id: accountProfile._id, environment: 'sandbox', status: 'active' }).lean()
    if (existingSandboxKey) {
      res.json({ key_prefix: existingSandboxKey.key_prefix, environment: 'sandbox', message: 'Sandbox key already exists' })
      return
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { secret, apiKey } = await createApiKeyForAccount({
      accountId: accountProfile._id.toString(),
      createdBy: userId.toString(),
      name: 'Sandbox API key',
      scopes: ['properties:read_public', 'properties:read_trust_state'],
    })

    await ApiKey.findByIdAndUpdate(apiKey._id, {
      $set: { environment: 'sandbox', sandbox_expires_at: expiresAt },
    })

    res.status(201).json({
      secret, key_prefix: apiKey.key_prefix, environment: 'sandbox', expires_at: expiresAt,
      warning: 'Sandbox data is redacted. Do not use in production.',
    })
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const adminListApplications = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    const query: Record<string, unknown> = {}
    if (status) {
query.status = status
}
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const apps = await PartnerApplication.find(query).sort({ createdAt: -1 }).limit(limit).lean()
    res.json({ rows: apps, rowCount: apps.length })
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const adminGetApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
throw new EstateOSHttpError(400, 'Invalid ID')
}
    const app = await PartnerApplication.findById(id).lean()
    if (!app) {
 res.sendStatus(404); return 
}
    const agreements = await PartnerAgreement.find({ partner_application_id: id }).lean()
    res.json({ application: app, agreements })
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const adminUpdateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
throw new EstateOSHttpError(401, 'Auth required')
}
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
throw new EstateOSHttpError(400, 'Invalid ID')
}
    const { status, review_notes, approved_plan } = req.body || {}
    if (!status) {
throw new EstateOSHttpError(400, 'status is required')
}

    const app = await PartnerApplication.findById(id)
    if (!app) {
 res.sendStatus(404); return 
}

    const allowedTransitions: Record<string, string[]> = {
      submitted: ['under_review', 'rejected'],
      under_review: ['approved_for_trial', 'approved_for_production', 'rejected'],
      approved_for_trial: ['approved_for_production', 'suspended', 'rejected'],
      approved_for_production: ['suspended'],
      rejected: ['submitted'],
      suspended: ['rejected'],
    }

    if (!allowedTransitions[app.status]?.includes(status)) {
      throw new EstateOSHttpError(400, `Cannot transition from ${app.status} to ${status}`)
    }

    const beforeStatus = app.status
    app.status = status as any
    if (review_notes) {
app.review_notes = review_notes
}
    if (approved_plan) {
app.approved_plan = approved_plan
}
    if (['approved_for_trial', 'approved_for_production', 'rejected'].includes(status)) {
      app.reviewed_by = new mongoose.Types.ObjectId(userId.toString())
      app.reviewed_at = new Date()
    }
    await app.save()

    await createAuditLog({
      actor_type: 'user', actor_id: userId.toString(), account_profile: 'PlatformOperatorAccount',
      action: 'partner_application.status_updated',
      target_type: 'PartnerApplication', target_id: id,
      before_summary: { status: beforeStatus },
      after_summary: { status, review_notes, approved_plan },
      metadata: { kernel: 'API Kernel' },
    })

    res.json(app)
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const adminGetSalesPipeline = async (_req: Request, res: Response) => {
  try {
    const total = await PartnerApplication.countDocuments()
    const [submitted, underReview, trial, production, rejected, suspended] = await Promise.all([
      PartnerApplication.countDocuments({ status: 'submitted' }),
      PartnerApplication.countDocuments({ status: 'under_review' }),
      PartnerApplication.countDocuments({ status: 'approved_for_trial' }),
      PartnerApplication.countDocuments({ status: 'approved_for_production' }),
      PartnerApplication.countDocuments({ status: 'rejected' }),
      PartnerApplication.countDocuments({ status: 'suspended' }),
    ])

    const typeDist = await PartnerApplication.aggregate([
      { $group: { _id: '$partner_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const productRequests = await PartnerApplication.aggregate([
      { $unwind: { path: '$requested_data_products', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$requested_data_products', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      counts: { total, submitted, underReview, trial, production, rejected, suspended },
      by_type: typeDist,
      most_requested_products: productRequests,
    })
  } catch (err) {
 handlePartnerError(res, err) 
}
}

export const adminListAgreements = async (_req: Request, res: Response) => {
  try {
    const agreements = await PartnerAgreement.find().sort({ createdAt: -1 }).limit(50).lean()
    res.json({ rows: agreements, rowCount: agreements.length })
  } catch (err) {
 handlePartnerError(res, err) 
}
}