import { Schema, model, Types, Document } from 'mongoose'
import { DATA_USAGE_TYPES } from '../estateos/constants'

export interface DataUsageLedgerDocument extends Document {
  account_id?: Types.ObjectId
  property_id?: Types.ObjectId
  api_key_id?: Types.ObjectId
  usage_type: string
  fields_accessed: string[]
  usage_units: number
  royalty_eligible_later: boolean
  metadata?: Record<string, unknown>
  created_at: Date
}

const dataUsageLedgerSchema = new Schema<DataUsageLedgerDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      index: true,
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    api_key_id: {
      type: Schema.Types.ObjectId,
      ref: 'ApiKey',
      index: true,
    },
    usage_type: {
      type: String,
      enum: DATA_USAGE_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    fields_accessed: {
      type: [String],
      default: [],
    },
    usage_units: {
      type: Number,
      default: 1,
      min: 0,
    },
    royalty_eligible_later: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    versionKey: false,
    strict: true,
    collection: 'EstateOSDataUsageLedger',
  },
)

dataUsageLedgerSchema.index({ account_id: 1, usage_type: 1, created_at: -1 })
dataUsageLedgerSchema.index({ property_id: 1, created_at: -1 })

const DataUsageLedger = model<DataUsageLedgerDocument>('DataUsageLedger', dataUsageLedgerSchema)

export default DataUsageLedger
