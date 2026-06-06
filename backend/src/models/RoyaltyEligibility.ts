import { Schema, model, Types, Document } from 'mongoose'
import { ROYALTY_ELIGIBILITY_STATUSES } from '../estateos/constants'

export interface RoyaltyEligibilityDocument extends Document {
  account_id: Types.ObjectId
  property_id?: Types.ObjectId
  eligibility_reason: string
  status: string
  policy_version: string
  metadata?: Record<string, unknown>
}

const royaltyEligibilitySchema = new Schema<RoyaltyEligibilityDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    eligibility_reason: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    status: {
      type: String,
      enum: ROYALTY_ELIGIBILITY_STATUSES,
      default: 'policy_pending',
      index: true,
    },
    policy_version: {
      type: String,
      default: 'rr-kernel-00',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSRoyaltyEligibility',
  },
)

royaltyEligibilitySchema.index({ account_id: 1, property_id: 1, status: 1 })

const RoyaltyEligibility = model<RoyaltyEligibilityDocument>('RoyaltyEligibility', royaltyEligibilitySchema)

export default RoyaltyEligibility
