import { Schema, model, Document } from 'mongoose'

export interface BillingPlanDocument extends Document {
  name: string
  plan_type: 'verification_package' | 'api_subscription'
  price_amount: number
  currency: string
  billing_interval: 'one_time' | 'monthly' | 'yearly' | 'custom'
  included_usage: {
    api_calls_per_day?: number
    api_calls_per_month?: number
    max_properties?: number
    max_evidence?: number
  }
  allowed_scopes: string[]
  field_visibility: string[]
  rate_limit: {
    requests_per_second?: number
    burst?: number
  }
  description: string
  status: 'active' | 'archived'
  sort_order: number
}

const billingPlanSchema = new Schema<BillingPlanDocument>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
    },
    plan_type: {
      type: String,
      enum: ['verification_package', 'api_subscription'],
      required: [true, "can't be blank"],
      index: true,
    },
    price_amount: {
      type: Number,
      required: [true, "can't be blank"],
    },
    currency: {
      type: String,
      default: 'VND',
    },
    billing_interval: {
      type: String,
      enum: ['one_time', 'monthly', 'yearly', 'custom'],
      default: 'monthly',
    },
    included_usage: {
      type: Schema.Types.Mixed,
      default: {},
    },
    allowed_scopes: {
      type: [String],
      default: [],
    },
    field_visibility: {
      type: [String],
      default: [],
    },
    rate_limit: {
      type: Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSBillingPlan',
  },
)

billingPlanSchema.index({ plan_type: 1, status: 1, sort_order: 1 })

const BillingPlan = model<BillingPlanDocument>('BillingPlan', billingPlanSchema)

export default BillingPlan