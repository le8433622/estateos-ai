import { Schema, model, Types, Document } from 'mongoose'

export interface OrganizationDocument extends Document {
  name: string
  organization_type: string
  status: string
  trust_score: number
  metadata?: Record<string, unknown>
  created_by?: Types.ObjectId
  updated_by?: Types.ObjectId
}

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
      index: true,
    },
    organization_type: {
      type: String,
      default: 'agency',
      index: true,
    },
    status: {
      type: String,
      enum: ['applicant', 'active', 'limited', 'suspended', 'revoked'],
      default: 'active',
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
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSOrganization',
  },
)

organizationSchema.index({ organization_type: 1, status: 1 })

const Organization = model<OrganizationDocument>('Organization', organizationSchema)

export default Organization
