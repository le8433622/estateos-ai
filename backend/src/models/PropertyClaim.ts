import { Schema, model, Types, Document } from 'mongoose'
import { CLAIM_STATES } from '../estateos/constants'

export interface PropertyClaimDocument extends Document {
  property_id: Types.ObjectId
  source_account_id: Types.ObjectId
  claim_state: string
  claim_summary: Record<string, unknown>
  confidence_level: number
  created_by: Types.ObjectId
  updated_by?: Types.ObjectId
}

const propertyClaimSchema = new Schema<PropertyClaimDocument>(
  {
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, "can't be blank"],
      index: true,
    },
    source_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    claim_state: {
      type: String,
      enum: CLAIM_STATES,
      default: 'self_declared',
      index: true,
    },
    claim_summary: {
      type: Schema.Types.Mixed,
      default: {},
    },
    confidence_level: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSPropertyClaim',
  },
)

propertyClaimSchema.index({ source_account_id: 1, claim_state: 1, updatedAt: -1 })

const PropertyClaim = model<PropertyClaimDocument>('PropertyClaim', propertyClaimSchema)

export default PropertyClaim
