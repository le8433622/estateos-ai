import crypto from 'node:crypto'
import { Request } from 'express'
import ApiKey, { ApiKeyDocument } from '../models/ApiKey'
import { API_SCOPES, ApiScopeName } from '../estateos/constants'
import { EstateOSHttpError } from './accountProfileService'

export interface AuthenticatedApiKey {
  apiKey: ApiKeyDocument
  scopes: ApiScopeName[]
}

export const hashApiKey = (secret: string) => crypto.createHash('sha256').update(secret).digest('hex')

export const generateApiKeySecret = () => `eos_${crypto.randomBytes(32).toString('hex')}`

export const sanitizeApiScopes = (scopes?: unknown): ApiScopeName[] => {
  const requestedScopes = Array.isArray(scopes) ? scopes.map((scope) => String(scope)) : ['properties:read_public']
  const invalidScopes = requestedScopes.filter((scope) => !(API_SCOPES as readonly string[]).includes(scope))

  if (invalidScopes.length > 0) {
    throw new EstateOSHttpError(400, `Unsupported API scopes: ${invalidScopes.join(', ')}`)
  }

  return Array.from(new Set(requestedScopes)) as ApiScopeName[]
}

export const createApiKeyForAccount = async (input: {
  accountId: string
  createdBy: string
  name?: string
  scopes?: unknown
}) => {
  const secret = generateApiKeySecret()
  const apiKey = await ApiKey.create({
    account_id: input.accountId,
    name: input.name || 'EstateOS API key',
    key_hash: hashApiKey(secret),
    key_prefix: secret.slice(0, 12),
    scopes: sanitizeApiScopes(input.scopes),
    created_by: input.createdBy,
  })

  return { secret, apiKey }
}

export const readApiKeySecretFromRequest = (req: Request) => {
  const headerValue = req.headers['x-api-key'] || req.headers.authorization
  const rawValue = Array.isArray(headerValue) ? headerValue[0] : headerValue

  if (!rawValue) {
    return ''
  }

  const value = String(rawValue)
  if (value.toLowerCase().startsWith('bearer ')) {
    return value.slice(7)
  }

  return value
}

export const authenticateApiKey = async (secret: string): Promise<AuthenticatedApiKey | null> => {
  if (!secret) {
    return null
  }

  const apiKey = await ApiKey.findOne({ key_hash: hashApiKey(secret), status: 'active' })

  if (!apiKey) {
    return null
  }

  apiKey.last_used_at = new Date()
  await apiKey.save()

  return {
    apiKey,
    scopes: apiKey.scopes,
  }
}

export const requireApiKeyScope = async (req: Request, requiredScope: ApiScopeName) => {
  const authenticated = await authenticateApiKey(readApiKeySecretFromRequest(req))

  if (!authenticated) {
    throw new EstateOSHttpError(401, 'API key required')
  }

  if (!authenticated.scopes.includes(requiredScope)) {
    throw new EstateOSHttpError(403, `Missing API scope ${requiredScope}`)
  }

  return authenticated
}

export const optionalApiKey = async (req: Request) => authenticateApiKey(readApiKeySecretFromRequest(req))
