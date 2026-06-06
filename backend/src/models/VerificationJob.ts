import { Schema, model, Types, Document } from 'mongoose'
import { VERIFICATION_JOB_STATUSES } from '../estateos/constants'

export interface VerificationJobDocument extends Document {
  property_id: Types.ObjectId
  claim_id?: Types.ObjectId
  requested_by_account_id: Types.ObjectId
  assigned_to_account_id?: Types.ObjectId
  job_type: string
  status: string
  required_checks: string[]
  due_at?: Date
  submitted_at?: Date
  metadata?: Record<string, unknown>
}

const verificationJobSchema = new Schema<VerificationJobDocument>(
  {
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, "can't be blank"],
      index: true,
    },
    claim_id: {
      type: Schema.Types.ObjectId,
      ref: 'PropertyClaim',
      index: true,
    },
    requested_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    assigned_to_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      index: true,
    },
    job_type: {
      type: String,
      default: 'limited_property_verification',
      index: true,
    },
    status: {
      type: String,
      enum: VERIFICATION_JOB_STATUSES,
      default: 'open',
      index: true,
    },
    required_checks: {
      type: [String],
      default: ['photo', 'location', 'contact', 'availability'],
    },
    due_at: {
      type: Date,
    },
    submitted_at: {
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
    collection: 'EstateOSVerificationJob',
  },
)

verificationJobSchema.index({ status: 1, assigned_to_account_id: 1, createdAt: -1 })

const VerificationJob = model<VerificationJobDocument>('VerificationJob', verificationJobSchema)

export default VerificationJob
