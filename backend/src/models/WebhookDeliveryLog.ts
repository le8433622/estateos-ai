import { Schema, model, Types, Document } from 'mongoose'

export interface WebhookDeliveryLogDocument extends Document {
  webhook_id: Types.ObjectId
  event_type: string
  payload_summary: string
  status: 'success' | 'failed' | 'pending'
  status_code?: number
  error_message?: string
  duration_ms?: number
}

const webhookDeliveryLogSchema = new Schema<WebhookDeliveryLogDocument>(
  {
    webhook_id: {
      type: Schema.Types.ObjectId,
      ref: 'WebhookEndpoint',
      required: [true, "can't be blank"],
      index: true,
    },
    event_type: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    payload_summary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    status_code: {
      type: Number,
    },
    error_message: {
      type: String,
    },
    duration_ms: {
      type: Number,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSWebhookDeliveryLog',
  },
)

webhookDeliveryLogSchema.index({ webhook_id: 1, createdAt: -1 })

const WebhookDeliveryLog = model<WebhookDeliveryLogDocument>('WebhookDeliveryLog', webhookDeliveryLogSchema)

export default WebhookDeliveryLog