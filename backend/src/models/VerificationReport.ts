import { Schema, model, Types, Document } from 'mongoose'
import { TRUST_LABELS, VERIFICATION_REPORT_STATUSES } from '../estateos/constants'

export interface VerificationReportDocument extends Document {
  verification_job_id: Types.ObjectId
  property_id: Types.ObjectId
  submitted_by_account_id: Types.ObjectId
  status: string
  allowed_labels: string[]
  confidence_level: number
  risk_notes?: string
  conflict_disclosed: boolean
  field_results?: Record<string, unknown>
  submitted_at: Date
}

const verificationReportSchema = new Schema<VerificationReportDocument>(
  {
    verification_job_id: {
      type: Schema.Types.ObjectId,
      ref: 'VerificationJob',
      required: [true, "can't be blank"],
      index: true,
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, "can't be blank"],
      index: true,
    },
    submitted_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    status: {
      type: String,
      enum: VERIFICATION_REPORT_STATUSES,
      default: 'submitted',
      index: true,
    },
    allowed_labels: {
      type: [String],
      enum: TRUST_LABELS,
      default: [],
    },
    confidence_level: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    risk_notes: {
      type: String,
      trim: true,
    },
    conflict_disclosed: {
      type: Boolean,
      default: false,
    },
    field_results: {
      type: Schema.Types.Mixed,
      default: {},
    },
    submitted_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSVerificationReport',
  },
)

verificationReportSchema.index({ property_id: 1, submitted_at: -1 })

const VerificationReport = model<VerificationReportDocument>('VerificationReport', verificationReportSchema)

export default VerificationReport
