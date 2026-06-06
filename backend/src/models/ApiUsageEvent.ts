import { Schema, model, Types, Document } from 'mongoose'

export interface ApiUsageEventDocument extends Document {
  api_key_id?: Types.ObjectId
  account_id?: Types.ObjectId
  endpoint: string
  method: string
  status_code: number
  scopes_used: string[]
  fields_accessed: string[]
  usage_units: number
  ip_hash?: string
  user_agent_summary?: string
  created_at: Date
}

const apiUsageEventSchema = new Schema<ApiUsageEventDocument>(
  {
    api_key_id: {
      type: Schema.Types.ObjectId,
      ref: 'ApiKey',
      index: true,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      index: true,
    },
    endpoint: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    method: {
      type: String,
      required: [true, "can't be blank"],
    },
    status_code: {
      type: Number,
      required: [true, "can't be blank"],
    },
    scopes_used: {
      type: [String],
      default: [],
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
    ip_hash: {
      type: String,
    },
    user_agent_summary: {
      type: String,
      trim: true,
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
    collection: 'EstateOSApiUsageEvent',
  },
)

apiUsageEventSchema.index({ account_id: 1, created_at: -1 })
apiUsageEventSchema.index({ api_key_id: 1, endpoint: 1, created_at: -1 })

const ApiUsageEvent = model<ApiUsageEventDocument>('ApiUsageEvent', apiUsageEventSchema)

export default ApiUsageEvent
