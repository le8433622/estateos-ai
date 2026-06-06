import { Request } from 'express'
import mongoose from 'mongoose'
import AccountProfile, { AccountProfileDocument } from '../models/AccountProfile'
import { AccountProfileType, Permission } from '../estateos/constants'
import { AuditActorContext } from './auditService'

export class EstateOSHttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

const readStringValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return String(value[0] || '')
  }

  return value ? String(value) : ''
}

export const getAccountProfileIdFromRequest = (req: Request) => readStringValue(
  req.headers['x-estateos-account-profile'] || req.body?.account_profile_id || req.query?.account_profile_id,
)

export const findAccountProfileForRequest = async (req: Request, profileTypes: AccountProfileType[] = []) => {
  const userId = req.user?._id

  if (!userId) {
    throw new EstateOSHttpError(401, 'Authenticated actor required')
  }

  const requestedProfileId = getAccountProfileIdFromRequest(req)
  const query: Record<string, unknown> = {
    user_id: new mongoose.Types.ObjectId(userId),
    status: { $in: ['active', 'limited'] },
  }

  if (profileTypes.length > 0) {
    query.profile_type = { $in: profileTypes }
  }

  if (requestedProfileId) {
    if (!mongoose.isValidObjectId(requestedProfileId)) {
      throw new EstateOSHttpError(400, 'account_profile_id is not valid')
    }

    query._id = new mongoose.Types.ObjectId(requestedProfileId)
  }

  return AccountProfile.findOne(query)
}

export const requireAccountProfile = async (req: Request, profileTypes: AccountProfileType[], permission: Permission) => {
  const accountProfile = await findAccountProfileForRequest(req, profileTypes)

  if (!accountProfile) {
    throw new EstateOSHttpError(403, `Requires ${profileTypes.join(' or ')} profile`)
  }

  if (!accountProfile.allowed_actions.includes(permission)) {
    throw new EstateOSHttpError(403, `Missing permission ${permission}`)
  }

  return accountProfile
}

export const toAuditActor = (req: Request, accountProfile?: AccountProfileDocument): AuditActorContext => ({
  actor_type: 'user',
  actor_id: req.user?._id || 'unknown',
  account_profile: accountProfile?.profile_type,
  scope: accountProfile?.allowed_actions || [],
})

export const isPlatformOperator = (accountProfile?: AccountProfileDocument) => accountProfile?.profile_type === 'PlatformOperatorAccount'
