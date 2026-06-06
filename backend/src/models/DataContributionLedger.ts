import { Schema, model, Types, Document } from 'mongoose'
import { LEDGER_CONTRIBUTION_TYPES } from '../estateos/constants'

export interface DataContributionLedgerDocument extends Document {
  account_id: Types.ObjectId
  property_id?: Types.ObjectId
  contribution_type: string
  source_event_type: string
  source_event_id?: string
  royalty_eligible_later: boolean
  metadata?: Record<string, unknown>
  created_at: Date
}

const dataContributionLedgerSchema = new Schema<DataContributionLedgerDocument>(
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
    contribution_type: {
      type: String,
      enum: LEDGER_CONTRIBUTION_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    source_event_type: {
      type: String,
      required: [true, "can't be blank"],
    },
    source_event_id: {
      type: String,
      index: true,
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
    collection: 'EstateOSDataContributionLedger',
  },
)

dataContributionLedgerSchema.index({ property_id: 1, contribution_type: 1, created_at: -1 })

const DataContributionLedger = model<DataContributionLedgerDocument>('DataContributionLedger', dataContributionLedgerSchema)

export default DataContributionLedger
