import mongoose from 'mongoose'
import BillingPlan from '../models/BillingPlan'
import BillingSubscription from '../models/BillingSubscription'
import ManualInvoice from '../models/ManualInvoice'
import PaymentRecord from '../models/PaymentRecord'
import { DEFAULT_API_PLANS, VERIFICATION_PACKAGE_PLANS } from '../estateos/constants'
import { EstateOSHttpError } from './accountProfileService'

export const seedPlans = async () => {
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

  const created = await BillingPlan.insertMany([...apiPlans, ...verPlans])
  return { created: created.length }
}

export const listActivePlans = (planType?: string) => {
  const query: Record<string, unknown> = { status: 'active' }
  if (planType) {
    query.plan_type = planType
  }
  return BillingPlan.find(query).sort({ sort_order: 1 }).lean()
}

export const getPlanById = async (planId: string) => {
  if (!mongoose.isValidObjectId(planId)) {
    throw new EstateOSHttpError(400, 'Invalid plan ID')
  }
  const plan = await BillingPlan.findById(planId).lean()
  if (!plan) {
    throw new EstateOSHttpError(404, 'Plan not found')
  }
  return plan
}

export const getActiveSubscriptionForAccount = async (accountId: string) =>
  BillingSubscription.findOne({
    account_id: new mongoose.Types.ObjectId(accountId),
    status: 'active',
  }).lean()

export const checkApiUsageWithinPlan = async (
  accountId: string,
  planId: string,
  currentUsage: { dailyCount: number; monthlyCount: number },
) => {
  const plan = await getPlanById(planId)
  const limits = plan.included_usage as Record<string, number>
  if (limits.api_calls_per_day && currentUsage.dailyCount >= limits.api_calls_per_day) {
    throw new EstateOSHttpError(429, 'Daily API call limit reached. Upgrade your plan.')
  }
  if (limits.api_calls_per_month && currentUsage.monthlyCount >= limits.api_calls_per_month) {
    throw new EstateOSHttpError(429, 'Monthly API call limit reached. Upgrade your plan.')
  }
}

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await ManualInvoice.countDocuments()
  const next = count + 1
  const ts = Date.now().toString(36).toUpperCase().slice(-6)
  return `INV-${ts}-${String(next).padStart(5, '0')}`
}

export const issueInvoice = async (input: {
  accountId: string
  profileId?: string
  planId?: string
  propertyId?: string
  verificationPackageType?: string
  amount: number
  currency: string
  description: string
  issuedBy: string
}) => {
  const invoiceNumber = await generateInvoiceNumber()
  const invoice = await ManualInvoice.create({
    account_id: new mongoose.Types.ObjectId(input.accountId),
    profile_id: input.profileId ? new mongoose.Types.ObjectId(input.profileId) : undefined,
    invoice_number: invoiceNumber,
    plan_id: input.planId ? new mongoose.Types.ObjectId(input.planId) : undefined,
    property_id: input.propertyId ? new mongoose.Types.ObjectId(input.propertyId) : undefined,
    verification_package_type: input.verificationPackageType,
    amount: input.amount,
    currency: input.currency || 'VND',
    status: 'issued',
    description: input.description,
    issued_by: new mongoose.Types.ObjectId(input.issuedBy),
  })
  return invoice
}

export const createPaymentRecord = async (input: {
  accountId: string
  invoiceId?: string
  subscriptionId?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  provider: 'manual' | 'bank_transfer' | 'cash'
  providerRef?: string
  notes?: string
  recordedBy: string
}) =>
  PaymentRecord.create({
    account_id: new mongoose.Types.ObjectId(input.accountId),
    invoice_id: input.invoiceId ? new mongoose.Types.ObjectId(input.invoiceId) : undefined,
    subscription_id: input.subscriptionId ? new mongoose.Types.ObjectId(input.subscriptionId) : undefined,
    amount: input.amount,
    currency: input.currency || 'VND',
    status: input.status,
    provider: input.provider,
    provider_ref: input.providerRef,
    notes: input.notes,
    recorded_by: new mongoose.Types.ObjectId(input.recordedBy),
  })

export const getAccountDailyUsage = async (accountId: string) => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const ApiUsageEvent = (await import('../models/ApiUsageEvent')).default
  const dailyCount = await ApiUsageEvent.countDocuments({
    account_id: new mongoose.Types.ObjectId(accountId),
    created_at: { $gte: startOfDay },
  })
  return { dailyCount }
}

export const getAccountMonthlyUsage = async (accountId: string) => {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const ApiUsageEvent = (await import('../models/ApiUsageEvent')).default
  const monthlyCount = await ApiUsageEvent.countDocuments({
    account_id: new mongoose.Types.ObjectId(accountId),
    created_at: { $gte: startOfMonth },
  })
  return { monthlyCount }
}

export const isVerificationPackagePlan = (plan: any) => plan.plan_type === 'verification_package'

export const VERIFICATION_PACKAGE_OUTCOMES = [
  'verified_photo',
  'verified_location',
  'verified_contact',
  'availability_checked',
  'evidence_attached',
  'legal_not_verified',
] as const