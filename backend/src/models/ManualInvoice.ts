import { Schema, model, Types, Document } from 'mongoose'

export interface ManualInvoiceDocument extends Document {
  account_id: Types.ObjectId
  profile_id?: Types.ObjectId
  invoice_number: string
  plan_id?: Types.ObjectId
  property_id?: Types.ObjectId
  verification_package_type?: string
  amount: number
  currency: string
  status: 'draft' | 'issued' | 'pending_payment' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
  description: string
  issued_by: Types.ObjectId
  paid_at?: Date
  notes?: string
}

const manualInvoiceSchema = new Schema<ManualInvoiceDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    profile_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
    },
    invoice_number: {
      type: String,
      required: [true, "can't be blank"],
      unique: true,
    },
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: 'BillingPlan',
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
    },
    verification_package_type: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, "can't be blank"],
    },
    currency: {
      type: String,
      default: 'VND',
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'pending_payment', 'paid', 'overdue', 'cancelled', 'refunded'],
      default: 'draft',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    issued_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    paid_at: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSManualInvoice',
  },
)

manualInvoiceSchema.index({ account_id: 1, status: 1, createdAt: -1 })

const ManualInvoice = model<ManualInvoiceDocument>('ManualInvoice', manualInvoiceSchema)

export default ManualInvoice