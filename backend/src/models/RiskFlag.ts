import { Schema, model, Types, Document } from 'mongoose'
import { RISK_FLAG_TYPES, RiskFlagType } from '../estateos/constants'

export interface RiskFlagDocument extends Document {
  property_id: Types.ObjectId
  flag_type: RiskFlagType
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed'
  note?: string
  created_by_account_id?: Types.ObjectId
  resolved_by_account_id?: Types.ObjectId
  resolved_at?: Date
}

const riskFlagSchema = new Schema<RiskFlagDocument>(
  {
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, "can't be blank"],
      index: true,
    },
    flag_type: {
      type: String,
      enum: RISK_FLAG_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
    created_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
    },
    resolved_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
    },
    resolved_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSRiskFlag',
  },
)

riskFlagSchema.index({ property_id: 1, status: 1, flag_type: 1 })

const RiskFlag = model<RiskFlagDocument>('RiskFlag', riskFlagSchema)

export default RiskFlag
