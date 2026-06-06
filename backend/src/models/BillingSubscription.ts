import { Schema, model, Types, Document } from 'mongoose'

export interface BillingSubscriptionDocument extends Document {
  account_id: Types.ObjectId
  plan_id: Types.ObjectId
  status: 'active' | 'cancelled' | 'expired'
  start_date: Date
  end_date?: Date
  cancelled_at?: Date
  metadata?: Record<string, unknown>
}

const billingSubscriptionSchema = new Schema<BillingSubscriptionDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: 'BillingPlan',
      required: [true, "can't be blank"],
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
    },
    cancelled_at: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSBillingSubscription',
  },
)

billingSubscriptionSchema.index({ account_id: 1, status: 1 })

const BillingSubscription = model<BillingSubscriptionDocument>('BillingSubscription', billingSubscriptionSchema)

export default BillingSubscription