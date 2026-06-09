import { Schema, model, Types, Document } from 'mongoose'
import { API_KEY_ALGOS, API_KEY_ENVIRONMENTS, API_KEY_STATUSES, API_SCOPES, ApiScopeName } from '../estateos/constants'

export interface ApiKeyDocument extends Document {
  account_id: Types.ObjectId
  name: string
  key_hash: string
  key_prefix: string
  hash_algo: 'sha256' | 'bcrypt'
  scopes: ApiScopeName[]
  status: 'active' | 'revoked'
  environment: 'sandbox' | 'production'
  last_used_at?: Date
  created_by: Types.ObjectId
  revoked_by?: Types.ObjectId
  revoked_at?: Date
  sandbox_expires_at?: Date
  createdAt?: Date
  updatedAt?: Date
}

const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    key_hash: {
      type: String,
      required: [true, "can't be blank"],
      select: false,
    },
    key_prefix: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    hash_algo: {
      type: String,
      enum: API_KEY_ALGOS,
      default: 'sha256',
    },
    scopes: {
      type: [String],
      enum: API_SCOPES,
      default: ['properties:read_public'],
    },
    status: {
      type: String,
      enum: API_KEY_STATUSES,
      default: 'active',
      index: true,
    },
    environment: {
      type: String,
      enum: API_KEY_ENVIRONMENTS,
      default: 'production',
      index: true,
    },
    last_used_at: {
      type: Date,
    },
    sandbox_expires_at: {
      type: Date,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    revoked_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revoked_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSApiKey',
  },
)

apiKeySchema.index({ account_id: 1, status: 1, createdAt: -1 })

const ApiKey = model<ApiKeyDocument>('ApiKey', apiKeySchema)

export default ApiKey
