import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { Request } from 'express'
import ApiKey, { ApiKeyDocument } from '../models/ApiKey'
import { API_SCOPES, ApiScopeName } from '../estateos/constants'
import { EstateOSHttpError } from './accountProfileService'

export interface AuthenticatedApiKey {
  apiKey: ApiKeyDocument
  scopes: ApiScopeName[]
}

const BCRYPT_ROUNDS = 10

export const hashApiKey = (secret: string, algo: 'sha256' | 'bcrypt' = 'sha256') => {
  if (algo === 'bcrypt') {
    return bcrypt.hashSync(secret, BCRYPT_ROUNDS)
  }
  return crypto.createHash('sha256').update(secret).digest('hex')
}

export const verifyApiKey = (secret: string, storedHash: string, algo: 'sha256' | 'bcrypt') => {
  if (algo === 'bcrypt') {
    return bcrypt.compareSync(secret, storedHash)
  }
  return crypto.createHash('sha256').update(secret).digest('hex') === storedHash
}

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
    key_hash: hashApiKey(secret, 'bcrypt'),
    key_prefix: secret.slice(0, 12),
    hash_algo: 'bcrypt',
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

  const prefix = secret.slice(0, 12)
  const apiKey = await ApiKey.findOne({ key_prefix: prefix, status: 'active' }).select('+key_hash')

  if (!apiKey) {
    return null
  }

  const algo = apiKey.hash_algo || 'sha256'
  const match = verifyApiKey(secret, apiKey.key_hash, algo)

  if (!match) {
    return null
  }

  // Upgrade-on-use: re-hash with bcrypt if still using SHA-256
  if (algo === 'sha256') {
    apiKey.key_hash = hashApiKey(secret, 'bcrypt')
    apiKey.hash_algo = 'bcrypt'
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
