import { Schema, model, Types, Document } from 'mongoose'
import { PARTNER_APPLICATION_STATUSES, PARTNER_TYPES } from '../estateos/constants'

export interface PartnerApplicationDocument extends Document {
  user_id: Types.ObjectId
  organization_name: string
  contact_name: string
  email: string
  phone?: string
  partner_type: string
  intended_use_case: string
  requested_data_products: string[]
  requested_locations: string[]
  expected_monthly_usage: number
  current_system_or_app?: string
  privacy_acknowledgement: boolean
  status: string
  review_notes?: string
  approved_plan?: string
  reviewed_by?: Types.ObjectId
  reviewed_at?: Date
}

const partnerApplicationSchema = new Schema<PartnerApplicationDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    organization_name: {
      type: String,
      required: [true, "can't be blank"],
    },
    contact_name: {
      type: String,
      required: [true, "can't be blank"],
    },
    email: {
      type: String,
      required: [true, "can't be blank"],
    },
    phone: { type: String },
    partner_type: {
      type: String,
      enum: PARTNER_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    intended_use_case: {
      type: String,
      required: [true, "can't be blank"],
    },
    requested_data_products: { type: [String], default: [] },
    requested_locations: { type: [String], default: [] },
    expected_monthly_usage: { type: Number, default: 0 },
    current_system_or_app: { type: String },
    privacy_acknowledgement: { type: Boolean, default: false },
    status: {
      type: String,
      enum: PARTNER_APPLICATION_STATUSES,
      default: 'draft',
      index: true,
    },
    review_notes: { type: String },
    approved_plan: { type: String },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: { type: Date },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSPartnerApplication',
  },
)

partnerApplicationSchema.index({ status: 1, createdAt: -1 })
partnerApplicationSchema.index({ partner_type: 1, status: 1 })

const PartnerApplication = model<PartnerApplicationDocument>('PartnerApplication', partnerApplicationSchema)

export default PartnerApplication