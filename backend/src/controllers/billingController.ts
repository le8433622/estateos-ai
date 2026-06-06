import mongoose from 'mongoose'
import { Request, Response } from 'express'
import BillingPlan from '../models/BillingPlan'
import BillingSubscription from '../models/BillingSubscription'
import ManualInvoice from '../models/ManualInvoice'
import PaymentRecord from '../models/PaymentRecord'
import Property from '../models/Property'
import VerificationJob from '../models/VerificationJob'
import {
  listActivePlans,
  getPlanById,
  issueInvoice,
  getAccountDailyUsage,
  getAccountMonthlyUsage,
} from '../services/billingService'
import { EstateOSHttpError, findAccountProfileForRequest, requireAccountProfile, toAuditActor } from '../services/accountProfileService'
import { createAuditLog } from '../services/auditService'

const handleBillingError = (res: Response, err: unknown) => {
  if (err instanceof EstateOSHttpError) {
    res.status(err.statusCode).send({ message: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(400).send({ message: err.message })
    return
  }
  res.status(400).send({ message: 'Billing request failed' })
}

export const listPlans = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined
    const plans = await listActivePlans(type)
    res.json({ rows: plans, rowCount: plans.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const getPlan = async (req: Request, res: Response) => {
  try {
    const plan = await getPlanById(req.params.id)
    res.json(plan)
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:create_key')
    const { plan_id } = req.body || {}
    if (!plan_id || !mongoose.isValidObjectId(plan_id)) {
      throw new EstateOSHttpError(400, 'Valid plan_id is required')
    }
    const plan = await BillingPlan.findById(plan_id)
    if (!plan || plan.status !== 'active') {
      throw new EstateOSHttpError(404, 'Plan not found or inactive')
    }
    const existing = await BillingSubscription.findOne({
      account_id: accountProfile._id,
      status: 'active',
    })
    if (existing) {
      await BillingSubscription.updateOne(
        { _id: existing._id },
        { status: 'cancelled', cancelled_at: new Date() },
      )
    }
    const subscription = await BillingSubscription.create({
      account_id: accountProfile._id,
      plan_id: plan._id,
      status: 'active',
      start_date: new Date(),
    })
    await createAuditLog({
      ...toAuditActor(req, accountProfile),
      action: 'billing_subscription.created',
      target_type: 'BillingSubscription',
      target_id: subscription._id.toString(),
      after_summary: { plan_id: plan._id.toString(), plan_name: plan.name },
      metadata: { kernel: 'Revenue Rights Kernel' },
    })
    res.status(201).json(subscription)
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req)
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Account profile required')
    }
    const subs = await BillingSubscription.find({ account_id: accountProfile._id })
      .sort({ createdAt: -1 })
      .lean()
    const planIds = subs.map((s: any) => s.plan_id)
    const plans = planIds.length > 0
      ? await BillingPlan.find({ _id: { $in: planIds } }).lean()
      : []
    const planMap = new Map(plans.map((p: any) => [p._id.toString(), p]))
    const rows = subs.map((s: any) => ({
      id: s._id.toString(),
      plan: planMap.get(s.plan_id.toString()) || null,
      status: s.status,
      start_date: s.start_date,
      end_date: s.end_date,
      cancelled_at: s.cancelled_at,
    }))
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const listInvoices = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req)
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Account profile required')
    }
    const invoices = await ManualInvoice.find({ account_id: accountProfile._id })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ rows: invoices, rowCount: invoices.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const requestVerificationPackage = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'property:create_claim')
    const actor = toAuditActor(req, accountProfile)
    const { property_id, package_type } = req.body || {}
    if (!property_id || !mongoose.isValidObjectId(property_id)) {
      throw new EstateOSHttpError(400, 'Valid property_id is required')
    }
    if (!package_type) {
      throw new EstateOSHttpError(400, 'package_type is required')
    }
    const property = await Property.findById(property_id)
    if (!property) {
      throw new EstateOSHttpError(404, 'Property not found')
    }
    const plan = await BillingPlan.findOne({
      plan_type: 'verification_package',
      status: 'active',
      name: { $regex: new RegExp(package_type.replace(/_/g, ' '), 'i') },
    }).lean()
    if (!plan) {
      throw new EstateOSHttpError(400, `No active billing plan matches package type: ${package_type}`)
    }
    const invoice = await issueInvoice({
      accountId: accountProfile._id.toString(),
      profileId: accountProfile._id.toString(),
      propertyId: property_id,
      verificationPackageType: package_type,
      amount: (plan as any).price_amount,
      currency: (plan as any).currency || 'VND',
      description: `Verification package: ${(plan as any).name} for property ${property_id}`,
      issuedBy: req.user?._id || '',
    })
    await createAuditLog({
      ...actor,
      action: 'verification_package.requested',
      target_type: 'ManualInvoice',
      target_id: invoice._id.toString(),
      after_summary: {
        property_id,
        package_type,
        amount: (plan as any).price_amount,
        invoice_number: invoice.invoice_number,
      },
      metadata: { kernel: 'Revenue Rights Kernel' },
    })
    res.status(201).json({ invoice, plan })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const listVerificationPackageRequests = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req)
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Account profile required')
    }
    const invoices = await ManualInvoice.find({
      account_id: accountProfile._id,
      verification_package_type: { $exists: true },
    }).sort({ createdAt: -1 }).lean()
    res.json({ rows: invoices, rowCount: invoices.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const billingOverview = async (req: Request, res: Response) => {
  try {
    const [planCount, activeSubs, issuedInvoices, paidInvoices, packageRequests] = await Promise.all([
      BillingPlan.countDocuments({ status: 'active' }),
      BillingSubscription.countDocuments({ status: 'active' }),
      ManualInvoice.countDocuments({ status: { $in: ['issued', 'pending_payment'] } }),
      ManualInvoice.countDocuments({ status: 'paid' }),
      ManualInvoice.countDocuments({
        verification_package_type: { $exists: true },
        status: { $in: ['issued', 'pending_payment'] },
      }),
    ])
    res.json({
      counts: { planCount, activeSubs, issuedInvoices, paidInvoices, packageRequests },
    })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminListInvoices = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100)
    const invoices = await ManualInvoice.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    res.json({ rows: invoices, rowCount: invoices.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminIssueInvoice = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PlatformOperatorAccount'], 'admin:moderate')
    const actor = toAuditActor(req, accountProfile)
    const { account_id, plan_id, property_id, amount, currency, description, verification_package_type } = req.body || {}
    if (!account_id || !mongoose.isValidObjectId(account_id)) {
      throw new EstateOSHttpError(400, 'Valid account_id is required')
    }
    if (!amount || amount <= 0) {
      throw new EstateOSHttpError(400, 'Amount must be positive')
    }
    const invoice = await issueInvoice({
      accountId: account_id,
      planId: plan_id,
      propertyId: property_id,
      verificationPackageType: verification_package_type,
      amount,
      currency: currency || 'VND',
      description: description || 'Manual invoice',
      issuedBy: req.user?._id || '',
    })
    await createAuditLog({
      ...actor,
      action: 'admin_invoice.issued',
      target_type: 'ManualInvoice',
      target_id: invoice._id.toString(),
      after_summary: {
        account_id,
        amount,
        currency: currency || 'VND',
        invoice_number: invoice.invoice_number,
      },
      metadata: { kernel: 'Revenue Rights Kernel' },
    })
    res.status(201).json(invoice)
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminUpdateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['PlatformOperatorAccount'], 'admin:moderate')
    const actor = toAuditActor(req, accountProfile)
    const { id } = req.params
    const { status, notes } = req.body || {}
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'Invalid invoice ID')
    }
    const invoice = await ManualInvoice.findById(id)
    if (!invoice) {
      res.sendStatus(404)
      return
    }
    const beforeStatus = invoice.status
    const allowedTransitions: Record<string, string[]> = {
      draft: ['issued', 'cancelled'],
      issued: ['pending_payment', 'paid', 'cancelled', 'overdue'],
      pending_payment: ['paid', 'cancelled', 'overdue', 'refunded'],
      paid: ['refunded'],
      overdue: ['paid', 'cancelled'],
    }
    if (!allowedTransitions[beforeStatus]?.includes(status)) {
      throw new EstateOSHttpError(400, `Cannot transition from ${beforeStatus} to ${status}`)
    }
    invoice.status = status
    if (status === 'paid') {
      invoice.paid_at = new Date()
    }
    if (notes) {
      invoice.notes = notes
    }
    await invoice.save()
    if (status === 'paid' && invoice.verification_package_type && invoice.property_id) {
      const job = await VerificationJob.create({
        property_id: invoice.property_id,
        requested_by_account_id: invoice.account_id,
        assigned_to_account_id: invoice.account_id,
        job_type: invoice.verification_package_type,
        status: 'open',
        required_checks: ['photo', 'location', 'contact', 'availability'],
      })
      await createAuditLog({
        ...actor,
        action: 'verification_job.created_from_package',
        target_type: 'VerificationJob',
        target_id: (job as any)._id.toString(),
        after_summary: { invoice_id: id, property_id: invoice.property_id.toString(), package_type: invoice.verification_package_type },
        metadata: { kernel: 'Verification Kernel' },
      })
    }
    await createAuditLog({
      ...actor,
      action: 'admin_invoice.status_updated',
      target_type: 'ManualInvoice',
      target_id: invoice._id.toString(),
      before_summary: { status: beforeStatus },
      after_summary: { status, paid_at: invoice.paid_at },
      metadata: { kernel: 'Revenue Rights Kernel' },
    })
    res.json(invoice)
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminListSubscriptions = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100)
    const subs = await BillingSubscription.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    res.json({ rows: subs, rowCount: subs.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminAssignSubscription = async (req: Request, res: Response) => {
  try {
    await requireAccountProfile(req, ['PlatformOperatorAccount'], 'admin:moderate')
    const { account_id, plan_id } = req.body || {}
    if (!account_id || !mongoose.isValidObjectId(account_id)) {
      throw new EstateOSHttpError(400, 'Valid account_id is required')
    }
    if (!plan_id || !mongoose.isValidObjectId(plan_id)) {
      throw new EstateOSHttpError(400, 'Valid plan_id is required')
    }
    const plan = await BillingPlan.findById(plan_id)
    if (!plan) {
      throw new EstateOSHttpError(404, 'Plan not found')
    }
    await BillingSubscription.updateMany(
      { account_id, status: 'active' },
      { status: 'cancelled', cancelled_at: new Date() },
    )
    const sub = await BillingSubscription.create({
      account_id,
      plan_id,
      status: 'active',
      start_date: new Date(),
    })
    res.status(201).json(sub)
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const adminListPaymentRecords = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100)
    const records = await PaymentRecord.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    res.json({ rows: records, rowCount: records.length })
  } catch (err) {
    handleBillingError(res, err)
  }
}

export const getUsageForCurrentPlan = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires API-related profile')
    }
    const sub = await BillingSubscription.findOne({
      account_id: accountProfile._id,
      status: 'active',
    }).lean()
    let plan: Record<string, unknown> | null = null
    let usage = { daily: 0, monthly: 0, dailyLimit: 100, monthlyLimit: 3000 }
    if (sub) {
      plan = await BillingPlan.findById(sub.plan_id).lean() as Record<string, unknown> | null
      const [daily, monthly] = await Promise.all([
        getAccountDailyUsage(accountProfile._id.toString()),
        getAccountMonthlyUsage(accountProfile._id.toString()),
      ])
      const limits = (plan as any)?.included_usage || {}
      usage = {
        daily: daily.dailyCount,
        monthly: monthly.monthlyCount,
        dailyLimit: limits.api_calls_per_day || 100,
        monthlyLimit: limits.api_calls_per_month || 3000,
      }
    }
    res.json({ plan, subscription: sub, usage })
  } catch (err) {
    handleBillingError(res, err)
  }
}