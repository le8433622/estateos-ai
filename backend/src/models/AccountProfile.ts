import { Schema, model, Types, Document } from 'mongoose'
import {
  ACCOUNT_PROFILE_STATUSES,
  ACCOUNT_PROFILE_TYPES,
  AccountProfileStatus,
  AccountProfileType,
  DEFAULT_PROFILE_ALLOWED_ACTIONS,
  Permission,
} from '../estateos/constants'

export interface AccountProfileDocument extends Document {
  user_id: Types.ObjectId
  organization_id?: Types.ObjectId
  profile_type: AccountProfileType
  verification_level: string
  trust_score: number
  allowed_actions: Permission[]
  status: AccountProfileStatus
  visibility_scopes: string[]
  metadata?: Record<string, unknown>
  created_by?: Types.ObjectId
  updated_by?: Types.ObjectId
}

const accountProfileSchema = new Schema<AccountProfileDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    profile_type: {
      type: String,
      enum: ACCOUNT_PROFILE_TYPES,
      required: [true, "can't be blank"],
      index: true,
    },
    verification_level: {
      type: String,
      required: [true, "can't be blank"],
      default: 'applicant',
    },
    trust_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    allowed_actions: {
      type: [String],
      default(this: AccountProfileDocument) {
        return DEFAULT_PROFILE_ALLOWED_ACTIONS[this.profile_type] || []
      },
    },
    status: {
      type: String,
      enum: ACCOUNT_PROFILE_STATUSES,
      default: 'active',
      index: true,
    },
    visibility_scopes: {
      type: [String],
      default: ['public'],
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
    collection: 'EstateOSAccountProfile',
    discriminatorKey: 'profile_type',
  },
)

accountProfileSchema.index({ user_id: 1, profile_type: 1, organization_id: 1 })
accountProfileSchema.index({ profile_type: 1, status: 1, trust_score: -1 })

const AccountProfile = model<AccountProfileDocument>('AccountProfile', accountProfileSchema)

const emptyProfileSchema = () => new Schema({}, { _id: false })

export const PropertyClaimAccount = AccountProfile.discriminator('PropertyClaimAccount', emptyProfileSchema())
export const PropertyDemandAccount = AccountProfile.discriminator('PropertyDemandAccount', emptyProfileSchema())
export const VerificationOperatorAccount = AccountProfile.discriminator('VerificationOperatorAccount', emptyProfileSchema())
export const ApiDataBuyerAccount = AccountProfile.discriminator('ApiDataBuyerAccount', emptyProfileSchema())
export const AgencyDeveloperAccount = AccountProfile.discriminator('AgencyDeveloperAccount', emptyProfileSchema())
export const PlatformOperatorAccount = AccountProfile.discriminator('PlatformOperatorAccount', emptyProfileSchema())
export const AiAgentAccount = AccountProfile.discriminator('AiAgentAccount', emptyProfileSchema())

export default AccountProfile
