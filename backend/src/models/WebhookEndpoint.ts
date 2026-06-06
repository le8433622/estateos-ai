import { Schema, model, Types, Document } from 'mongoose'
import { WEBHOOK_EVENT_TYPES } from '../estateos/constants'

export interface WebhookEndpointDocument extends Document {
  account_id: Types.ObjectId
  url: string
  secret: string
  events: string[]
  status: 'active' | 'paused' | 'disabled'
  description?: string
  last_triggered_at?: Date
  failure_count: number
}

const webhookEndpointSchema = new Schema<WebhookEndpointDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    url: {
      type: String,
      required: [true, "can't be blank"],
    },
    secret: {
      type: String,
      required: [true, "can't be blank"],
    },
    events: {
      type: [String],
      enum: WEBHOOK_EVENT_TYPES,
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
      index: true,
    },
    description: {
      type: String,
    },
    last_triggered_at: {
      type: Date,
    },
    failure_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSWebhookEndpoint',
  },
)

webhookEndpointSchema.index({ account_id: 1, status: 1 })

const WebhookEndpoint = model<WebhookEndpointDocument>('WebhookEndpoint', webhookEndpointSchema)

export default WebhookEndpoint