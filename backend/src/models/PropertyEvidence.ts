import { Schema, model, Types, Document } from 'mongoose'
import { EVIDENCE_REVIEW_STATUSES, EVIDENCE_TYPES, EVIDENCE_VISIBILITIES, REDACTION_STATES } from '../estateos/constants'

export interface PropertyEvidenceDocument extends Document {
  property_id: Types.ObjectId
  claim_id?: Types.ObjectId
  uploaded_by_account_id: Types.ObjectId
  evidence_type: string
  file_ref?: string
  visibility: string
  redaction_state: string
  review_status: string
  reviewed_by_account_id?: Types.ObjectId
  summary?: string
  metadata?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

const propertyEvidenceSchema = new Schema<PropertyEvidenceDocument>(
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
    uploaded_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    evidence_type: {
      type: String,
      enum: EVIDENCE_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    file_ref: {
      type: String,
      trim: true,
      select: false,
    },
    visibility: {
      type: String,
      enum: EVIDENCE_VISIBILITIES,
      default: 'private',
      index: true,
    },
    redaction_state: {
      type: String,
      enum: REDACTION_STATES,
      default: 'restricted',
    },
    review_status: {
      type: String,
      enum: EVIDENCE_REVIEW_STATUSES,
      default: 'submitted',
      index: true,
    },
    reviewed_by_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
    },
    summary: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      select: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSPropertyEvidence',
  },
)

propertyEvidenceSchema.index({ property_id: 1, evidence_type: 1, review_status: 1 })
propertyEvidenceSchema.index({ uploaded_by_account_id: 1, createdAt: -1 })

const PropertyEvidence = model<PropertyEvidenceDocument>('PropertyEvidence', propertyEvidenceSchema)

export default PropertyEvidence
