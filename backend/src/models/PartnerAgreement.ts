import { Schema, model, Types, Document } from 'mongoose'
import { AGREEMENT_TYPES } from '../estateos/constants'

export interface PartnerAgreementDocument extends Document {
  partner_application_id: Types.ObjectId
  account_id?: Types.ObjectId
  agreement_type: string
  version: string
  accepted_by: Types.ObjectId
  accepted_at: Date
  ip_address?: string
  status: 'accepted' | 'rejected' | 'superseded'
}

const partnerAgreementSchema = new Schema<PartnerAgreementDocument>(
  {
    partner_application_id: {
      type: Schema.Types.ObjectId,
      ref: 'PartnerApplication',
      required: [true, "can't be blank"],
      index: true,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      index: true,
    },
    agreement_type: {
      type: String,
      enum: AGREEMENT_TYPES,
      required: [true, "can't be blank"],
    },
    version: {
      type: String,
      required: [true, "can't be blank"],
      default: 'v1',
    },
    accepted_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    accepted_at: { type: Date, default: Date.now },
    ip_address: { type: String },
    status: {
      type: String,
      enum: ['accepted', 'rejected', 'superseded'],
      default: 'accepted',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSPartnerAgreement',
  },
)

partnerAgreementSchema.index({ partner_application_id: 1, agreement_type: 1 })

const PartnerAgreement = model<PartnerAgreementDocument>('PartnerAgreement', partnerAgreementSchema)

export default PartnerAgreement