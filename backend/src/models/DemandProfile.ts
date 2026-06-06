import { Schema, model, Types, Document } from 'mongoose'

export interface DemandProfileDocument extends Document {
  account_id: Types.ObjectId
  demand_type: string
  target_locations: string[]
  budget_min?: number
  budget_max?: number
  currency: string
  qualification_status: string
  trust_score: number
  metadata?: Record<string, unknown>
}

const demandProfileSchema = new Schema<DemandProfileDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    demand_type: {
      type: String,
      default: 'buyer',
      index: true,
    },
    target_locations: {
      type: [String],
      default: [],
    },
    budget_min: {
      type: Number,
    },
    budget_max: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'VND',
    },
    qualification_status: {
      type: String,
      enum: ['demand_applicant', 'contact_verified', 'qualified_demand', 'transaction_ready', 'trusted_demand'],
      default: 'demand_applicant',
      index: true,
    },
    trust_score: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSDemandProfile',
  },
)

demandProfileSchema.index({ qualification_status: 1, trust_score: -1 })

const DemandProfile = model<DemandProfileDocument>('DemandProfile', demandProfileSchema)

export default DemandProfile
