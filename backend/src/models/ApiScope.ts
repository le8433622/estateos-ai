import { Schema, model, Document } from 'mongoose'
import { API_SCOPES, ApiScopeName } from '../estateos/constants'

export interface ApiScopeDocument extends Document {
  name: ApiScopeName
  description?: string
  partner_only: boolean
  status: 'active' | 'disabled'
}

const apiScopeSchema = new Schema<ApiScopeDocument>(
  {
    name: {
      type: String,
      enum: API_SCOPES,
      required: [true, "can't be blank"],
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    partner_only: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSApiScope',
  },
)

const ApiScope = model<ApiScopeDocument>('ApiScope', apiScopeSchema)

export default ApiScope
