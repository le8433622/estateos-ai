import { Schema, model, Types, Document } from 'mongoose'

export interface PaymentRecordDocument extends Document {
  account_id: Types.ObjectId
  invoice_id?: Types.ObjectId
  subscription_id?: Types.ObjectId
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  provider: 'manual' | 'bank_transfer' | 'cash'
  provider_ref?: string
  notes?: string
  recorded_by: Types.ObjectId
}

const paymentRecordSchema = new Schema<PaymentRecordDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    invoice_id: {
      type: Schema.Types.ObjectId,
      ref: 'ManualInvoice',
    },
    subscription_id: {
      type: Schema.Types.ObjectId,
      ref: 'BillingSubscription',
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
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: {
      type: String,
      enum: ['manual', 'bank_transfer', 'cash'],
      default: 'manual',
    },
    provider_ref: {
      type: String,
    },
    notes: {
      type: String,
    },
    recorded_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSPaymentRecord',
  },
)

const PaymentRecord = model<PaymentRecordDocument>('PaymentRecord', paymentRecordSchema)

export default PaymentRecord