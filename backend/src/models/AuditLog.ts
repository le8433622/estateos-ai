import { Schema, model, Document } from 'mongoose'
import { ACTOR_TYPES, ActorType } from '../estateos/constants'

export interface AuditLogDocument extends Document {
  actor_type: ActorType
  actor_id: string
  account_profile?: string
  action: string
  target_type: string
  target_id?: string
  scope: string[]
  before_summary?: Record<string, unknown>
  after_summary?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: Date
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actor_type: {
      type: String,
      enum: ACTOR_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    actor_id: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    account_profile: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    target_type: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    target_id: {
      type: String,
      index: true,
    },
    scope: {
      type: [String],
      default: [],
    },
    before_summary: {
      type: Schema.Types.Mixed,
      default: {},
    },
    after_summary: {
      type: Schema.Types.Mixed,
      default: {},
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
    collection: 'EstateOSAuditLog',
  },
)

auditLogSchema.index({ target_type: 1, target_id: 1, created_at: -1 })
auditLogSchema.index({ actor_type: 1, actor_id: 1, created_at: -1 })

const AuditLog = model<AuditLogDocument>('AuditLog', auditLogSchema)

export default AuditLog
