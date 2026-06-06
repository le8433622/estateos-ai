import crypto from 'node:crypto'
import { Request } from 'express'
import ApiUsageEvent from '../models/ApiUsageEvent'
import DataUsageLedger from '../models/DataUsageLedger'
import { AuthenticatedApiKey } from './apiKeyService'
import { createAuditLog } from './auditService'

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

const summarizeUserAgent = (userAgent?: string) => {
  if (!userAgent) {
    return ''
  }

  return userAgent.slice(0, 120)
}

export const logApiUsage = async (input: {
  req: Request
  authenticatedApiKey?: AuthenticatedApiKey | null
  endpoint: string
  statusCode: number
  scopesUsed: string[]
  fieldsAccessed: string[]
  usageUnits?: number
  propertyId?: string
  usageType?: 'api_property_read' | 'api_trust_state_read' | 'partner_usage'
}) => {
  const apiKey = input.authenticatedApiKey?.apiKey
  const accountId = apiKey?.account_id
  const usageUnits = input.usageUnits ?? 1
  const ip = input.req.ip || input.req.socket.remoteAddress || ''
  const userAgent = Array.isArray(input.req.headers['user-agent']) ? input.req.headers['user-agent'][0] : input.req.headers['user-agent']
  const event = await ApiUsageEvent.create({
    api_key_id: apiKey?._id,
    account_id: accountId,
    endpoint: input.endpoint,
    method: input.req.method,
    status_code: input.statusCode,
    scopes_used: input.scopesUsed,
    fields_accessed: input.fieldsAccessed,
    usage_units: usageUnits,
    ip_hash: ip ? hashValue(ip) : undefined,
    user_agent_summary: summarizeUserAgent(userAgent),
  })

  await DataUsageLedger.create({
    account_id: accountId,
    property_id: input.propertyId,
    api_key_id: apiKey?._id,
    usage_type: input.usageType || 'partner_usage',
    fields_accessed: input.fieldsAccessed,
    usage_units: usageUnits,
    royalty_eligible_later: true,
    metadata: {
      endpoint: input.endpoint,
      api_usage_event_id: event._id.toString(),
    },
  })

  if (apiKey && accountId) {
    await createAuditLog({
      actor_type: 'organization',
      actor_id: accountId.toString(),
      account_profile: 'ApiDataBuyerAccount',
      action: 'api_usage.logged',
      target_type: 'ApiUsageEvent',
      target_id: event._id.toString(),
      scope: input.scopesUsed,
      after_summary: {
        endpoint: input.endpoint,
        method: input.req.method,
        status_code: input.statusCode,
        fields_accessed: input.fieldsAccessed,
        usage_units: usageUnits,
      },
    })
  }

  return event
}
